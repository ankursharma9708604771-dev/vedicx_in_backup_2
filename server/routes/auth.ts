import { Router } from 'express';
import type { Request } from 'express';
import crypto from 'crypto';
import { supabaseServerClient, isSupabaseConfigured, verifySupabaseToken } from '../supabase.ts';
import { authenticateUser, requireAdmin, createSignedSessionToken } from '../middleware/auth.ts';
import {
  getProfileByEmail,
  getProfileById,
  getAllProfiles,
  updateProfile,
  logAuditEvent
} from '../supabaseDb.ts';

export const authRouter = Router();

// In-memory rate limiters
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const adminLoginAttempts = new Map<string, RateLimitEntry>();
const studentLoginAttempts = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(
  map: Map<string, RateLimitEntry>,
  ip: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSec?: number } {
  if (ip.includes('127.0.0.1') || ip === '::1' || ip === 'localhost') {
    return { allowed: true };
  }
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

function recordFailedAttempt(map: Map<string, RateLimitEntry>, ip: string, windowMs: number) {
  if (ip.includes('127.0.0.1') || ip === '::1' || ip === 'localhost') {
    return;
  }
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
  }
}

function clearRateLimit(map: Map<string, RateLimitEntry>, ip: string) {
  map.delete(ip);
}

// Password hashing & verification
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
    } catch {
      return false;
    }
  }
  // Fallback for pre-existing seed data (e.g., 'admin123', 'student123')
  return password === storedHash;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.use(authenticateUser);

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
authRouter.get('/me', async (req, res) => {
  res.json({ user: req.user || null });
});

/**
 * GET /api/auth/users
 * Lists user accounts from Supabase (Admin only for security)
 */
authRouter.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await getAllProfiles();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/admin-login
 * Dedicated administrative authentication portal
 * Rate-limited, strict role enforcement, audit logging
 */
authRouter.post('/admin-login', async (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(adminLoginAttempts, ip, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many failed admin login attempts. Account temporarily locked for security. Please try again in ${Math.ceil((rateCheck.retryAfterSec || 60) / 60)} minutes.`
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Administrator email and password are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Query Supabase profiles table
  const profile = await getProfileByEmail(trimmedEmail);

  if (!profile || profile.role !== 'admin') {
    recordFailedAttempt(adminLoginAttempts, ip, 15 * 60 * 1000);
    await logAuditEvent(
      'ADMIN_LOGIN_FAILURE',
      'AUTH',
      null,
      `Failed admin login attempt from IP: ${ip} (unauthorized/non-admin)`,
      null,
      trimmedEmail
    );
    return res.status(403).json({ error: 'Access denied. Only authorized administrators may log in through the Admin Portal.' });
  }

  if (!profile.is_active) {
    return res.status(403).json({ error: 'This administrator account has been deactivated.' });
  }

  const isPasswordValid = verifyPassword(password, profile.password_hash);
  if (!isPasswordValid) {
    recordFailedAttempt(adminLoginAttempts, ip, 15 * 60 * 1000);
    await logAuditEvent(
      'ADMIN_LOGIN_FAILURE',
      'AUTH',
      profile.id,
      `Invalid password attempt for admin from IP: ${ip}`,
      profile.id,
      trimmedEmail
    );
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  // Clear rate limiter on success
  clearRateLimit(adminLoginAttempts, ip);

  // Upgrade legacy plaintext password to PBKDF2 hash if needed
  if (!profile.password_hash.startsWith('pbkdf2:')) {
    const upgradedHash = hashPassword(password);
    await updateProfile(profile.id, { password_hash: upgradedHash });
  }

  // Record audit log
  await logAuditEvent(
    'ADMIN_LOGIN_SUCCESS',
    'AUTH',
    profile.id,
    `Admin login successful from IP: ${ip}`,
    profile.id,
    trimmedEmail
  );

  const { password_hash, ...safeUser } = profile;
  res.json({
    success: true,
    user: safeUser,
    token: createSignedSessionToken(profile.id)
  });
});

/**
 * POST /api/auth/login
 * Student login with email & password
 * Rejects administrator accounts (redirects to footer Admin Portal)
 * Requires verified email address
 */
authRouter.post('/login', async (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(studentLoginAttempts, ip, 10, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Please wait ${Math.ceil((rateCheck.retryAfterSec || 60) / 60)} minutes before trying again.`
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1. Supabase Auth if configured
  if (isSupabaseConfigured() && supabaseServerClient) {
    try {
      const { data, error } = await supabaseServerClient.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        const errMsg = (error.message || '').toLowerCase();
        if (errMsg.includes('email not confirmed') || errMsg.includes('unconfirmed')) {
          return res.status(403).json({
            error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
            requires_email_confirmation: true
          });
        }
      }

      if (data?.user && !error) {
        // Strict requirement: Student email verification required
        if (!data.user.email_confirmed_at && data.user.email?.toLowerCase() !== 'admin@vedicx.in') {
          return res.status(403).json({
            error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
            requires_email_confirmation: true
          });
        }

        const remoteProfile = await getProfileByEmail(trimmedEmail);

        if (remoteProfile?.role === 'admin') {
          return res.status(403).json({
            error: 'Administrative accounts must sign in via the dedicated Admin Portal in the website footer.'
          });
        }

        const userObj = remoteProfile || {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
          role: 'student',
          membership_tier: 'free',
          free_test_used: 0,
          is_active: true
        };

        clearRateLimit(studentLoginAttempts, ip);
        await logAuditEvent('STUDENT_LOGIN_SUCCESS', 'AUTH', userObj.id, `Student logged in via Supabase Auth from IP: ${ip}`, userObj.id, trimmedEmail);

        return res.json({
          success: true,
          user: userObj,
          token: data.session?.access_token || createSignedSessionToken(userObj.id),
          session: data.session
        });
      }
    } catch (err) {
      console.warn('[AUTH] Supabase signInWithPassword fallback:', err);
    }
  }

  // 2. Supabase profiles check
  const profile = await getProfileByEmail(trimmedEmail);
  if (!profile) {
    recordFailedAttempt(studentLoginAttempts, ip, 15 * 60 * 1000);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Administrators cannot use the student login form
  if (profile.role === 'admin') {
    return res.status(403).json({
      error: 'Administrative accounts must sign in via the dedicated Admin Portal in the website footer.'
    });
  }

  if (!profile.is_active) {
    return res.status(403).json({ error: 'Account has been deactivated. Please contact support at supportvedicx@gmail.com.' });
  }

  const isPasswordValid = verifyPassword(password, profile.password_hash);
  if (!isPasswordValid) {
    recordFailedAttempt(studentLoginAttempts, ip, 15 * 60 * 1000);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Enforce email verification check from Supabase Auth
  if (isSupabaseConfigured() && supabaseServerClient && profile.auth_user_id) {
    try {
      const { data: authUser } = await supabaseServerClient.auth.admin.getUserById(profile.auth_user_id);
      if (authUser?.user && !authUser.user.email_confirmed_at && profile.role !== 'admin') {
        return res.status(403).json({
          error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          requires_email_confirmation: true
        });
      }
    } catch (e) {}
  }

  // Clear rate limiter
  clearRateLimit(studentLoginAttempts, ip);

  // Upgrade legacy plaintext password to PBKDF2 hash if needed
  if (!profile.password_hash.startsWith('pbkdf2:')) {
    const upgradedHash = hashPassword(password);
    await updateProfile(profile.id, { password_hash: upgradedHash });
  }

  // Audit log
  await logAuditEvent('STUDENT_LOGIN_SUCCESS', 'AUTH', profile.id, `Student logged in from IP: ${ip}`, profile.id, trimmedEmail);

  const { password_hash, ...safeUser } = profile;
  res.json({
    success: true,
    user: safeUser,
    token: createSignedSessionToken(profile.id)
  });
});

/**
 * POST /api/auth/register
 * Student account registration with email validation and password strength validation
 * Strict role enforcement: Always creates 'student' role
 * Requires email verification
 */
authRouter.post('/register', async (req, res) => {
  const { email, full_name, password, confirm_password } = req.body;

  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Full name, email address, and password are required.' });
  }

  const trimmedName = full_name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters long.' });
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Password strength validation: min 8 characters, at least 1 letter, at least 1 number
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters in length.' });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
  }

  if (confirm_password && password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // Check duplicate in Supabase profiles
  const existingProfile = await getProfileByEmail(trimmedEmail);
  if (existingProfile) {
    return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
  }

  let supabaseUserId: string | null = null;
  const hashedPassword = hashPassword(password);

  // Supabase Auth registration
  if (isSupabaseConfigured() && supabaseServerClient) {
    try {
      const { data, error } = await supabaseServerClient.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: false, // Strict requirement: Require email verification
        user_metadata: {
          full_name: trimmedName,
          role: 'student'
        }
      });

      if (error) {
        console.warn('[AUTH REGISTRATION] Supabase admin create user notice:', error.message);
      } else if (data?.user) {
        supabaseUserId = data.user.id;
      }
    } catch (err: any) {
      console.warn('[AUTH REGISTRATION] Supabase creation error:', err.message);
    }
  }

  const newId = supabaseUserId || `usr-${Date.now()}`;
  const newProfile = {
    id: newId,
    auth_user_id: supabaseUserId || null,
    email: trimmedEmail,
    full_name: trimmedName,
    role: 'student',
    free_test_used: 0,
    membership_tier: 'free',
    password_hash: hashedPassword,
    is_active: true
  };

  if (isSupabaseConfigured() && supabaseServerClient) {
    try {
      await supabaseServerClient.from('profiles').upsert(newProfile);
    } catch (e) {
      console.warn('[AUTH REGISTRATION] Supabase profile upsert error:', e);
    }
  }

  // Audit log
  await logAuditEvent('STUDENT_REGISTRATION', 'PROFILE', newId, 'Student registered on VEDICX.', newId, trimmedEmail);

  const { password_hash, ...safeUser } = newProfile;
  res.status(201).json({
    success: true,
    user: safeUser,
    requires_email_confirmation: true,
    message: 'Account registered successfully. Please verify your email before signing in.'
  });
});

/**
 * POST /api/auth/sync-profile
 * Synchronizes frontend Supabase Auth user session with backend profile
 */
authRouter.post('/sync-profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const supabaseUser = await verifySupabaseToken(token);
  if (!supabaseUser) {
    return res.status(401).json({ error: 'Invalid or expired Supabase authentication token.' });
  }

  const email = supabaseUser.email!.toLowerCase();
  const fullName = supabaseUser.user_metadata?.full_name || email.split('@')[0];

  // Strict Security: Prevent student privilege escalation.
  // Never assign 'admin' role from client user_metadata.
  // Only existing pre-authorized administrative profiles retain admin privileges.
  let profile = await getProfileByEmail(email);

  if (!profile) {
    const newProfile = {
      id: supabaseUser.id,
      auth_user_id: supabaseUser.id,
      email,
      full_name: fullName,
      role: 'student',
      free_test_used: 0,
      membership_tier: 'free',
      password_hash: 'supabase_managed',
      is_active: true
    };

    if (supabaseServerClient) {
      await supabaseServerClient.from('profiles').upsert(newProfile);
    }

    profile = newProfile;
  }

  const assignedRole = profile.role === 'admin' ? 'admin' : 'student';

  if (supabaseServerClient) {
    await supabaseServerClient.from('profiles').upsert({
      id: supabaseUser.id,
      auth_user_id: supabaseUser.id,
      email,
      full_name: fullName,
      role: assignedRole,
      membership_tier: profile.membership_tier || 'free',
      is_active: true
    });
  }

  res.json({
    success: true,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: assignedRole,
      membership_tier: profile.membership_tier,
      free_test_used: profile.free_test_used
    }
  });
});

/**
 * POST /api/auth/forgot-password
 * Password recovery request
 */
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured() && supabaseServerClient) {
    try {
      const { error } = await supabaseServerClient.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${process.env.APP_URL || ''}/#reset-password`
      });
      if (error) {
        console.warn('[AUTH] Supabase reset password notice:', error.message);
      }
    } catch (e) {
      console.warn('[AUTH] Error sending password reset email via Supabase:', e);
    }
  }

  await logAuditEvent('PASSWORD_RECOVERY_REQUEST', 'AUTH', null, 'Password recovery instructions requested.', null, trimmedEmail);

  res.json({
    success: true,
    message: 'If an account exists with this email address, password recovery instructions have been sent to your inbox.'
  });
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});
