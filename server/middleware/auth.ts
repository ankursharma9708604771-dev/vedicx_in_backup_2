import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import { supabaseServerClient, verifySupabaseToken, isSupabaseConfigured } from '../supabase.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'vedicx_production_secret_key_class10_2026';

/**
 * Creates an HMAC-signed session token for local authentication sessions
 */
export function createSignedSessionToken(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Validates cryptographic HMAC signature of local session tokens
 */
export function verifySignedSessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, tsStr, sig] = parts;
    const timestamp = Number(tsStr);
    // Token expires after 7 days
    if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`${userId}:${timestamp}`).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return userId;
    }
    return null;
  } catch {
    return null;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'student' | 'admin';
  full_name: string;
  membership_tier: 'free' | 'premium';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication extraction middleware
 * 1. Validates Supabase JWT Bearer token if configured;
 * 2. Validates cryptographically signed local HMAC tokens;
 * NEVER trusts raw user IDs, emails, or unsigned bearer strings.
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return next();
  }

  // 1. Authenticate with Supabase Auth cryptographic JWT verification (JWTs start with ey)
  if (token.startsWith('ey') && isSupabaseConfigured() && supabaseServerClient) {
    try {
      const supabaseUser = await verifySupabaseToken(token);
      if (supabaseUser) {
        // Query verified profile from Supabase
        const { data: profile } = await supabaseServerClient
          .from('profiles')
          .select('*')
          .or(`id.eq.${supabaseUser.id},auth_user_id.eq.${supabaseUser.id},email.eq.${supabaseUser.email}`)
          .maybeSingle();

        if (profile && profile.is_active) {
          req.user = {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            membership_tier: profile.membership_tier
          };
          return next();
        }
      }
    } catch (sbErr) {
      // Supabase verification error
    }
  }

  // 2. Authenticate with verified HMAC-signed session token
  const verifiedUserId = verifySignedSessionToken(token);
  if (verifiedUserId) {
    if (isSupabaseConfigured() && supabaseServerClient) {
      try {
        const { data: profile, error: pErr } = await supabaseServerClient
          .from('profiles')
          .select('id, email, full_name, role, membership_tier, is_active')
          .eq('id', verifiedUserId)
          .maybeSingle();

        if (pErr) console.warn('[AUTH MIDDLEWARE] Supabase profile error:', pErr.message);

        if (profile && profile.is_active) {
          req.user = {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            membership_tier: profile.membership_tier
          };
          return next();
        }
      } catch (sbErr: any) {
        console.warn('[AUTH MIDDLEWARE] Supabase exception:', sbErr.message);
      }
    }
  }

  next();
}

/**
 * Middleware: Strictly requires authenticated user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to your VEDICX account to access this resource.'
    });
  }
  next();
}

/**
 * Middleware: Strictly requires verified ADMIN role on server
 * Prevents privilege escalation and user ID spoofing
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges are required for this action.'
    });
  }

  next();
}
