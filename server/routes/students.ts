import { Router } from 'express';
import { supabaseServerClient } from '../supabase.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { logAuditEvent, getProfileById } from '../supabaseDb.ts';

export const studentsRouter = Router();

studentsRouter.use(authenticateUser);

// GET all students with stats (Admin only)
studentsRouter.get('/', requireAdmin, async (req, res) => {
  const { membership_tier, search, status } = req.query;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    let q = sb
      .from('profiles')
      .select('id, email, full_name, role, free_test_used, membership_tier, is_active, created_at')
      .eq('role', 'student');

    if (membership_tier) q = q.eq('membership_tier', membership_tier);
    if (status !== undefined && status !== '') q = q.eq('is_active', status === 'active');
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: profiles, error } = await q.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const enriched = await Promise.all((profiles || []).map(async p => {
      const { count: attemptsCount } = await sb.from('test_attempts').select('*', { count: 'exact', head: true }).eq('student_id', p.id).eq('status', 'submitted');
      const { count: paymentsCount } = await sb.from('payments').select('*', { count: 'exact', head: true }).eq('student_id', p.id).eq('status', 'success');
      return {
        ...p,
        total_attempts: attemptsCount || 0,
        total_payments: paymentsCount || 0
      };
    }));

    res.json({ students: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student details including test history & payments (Admin or student themselves)
studentsRouter.get('/:id/details', async (req, res) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Access denied. You can only view your own student records.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const student = await getProfileById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { data: attempts, error: attErr } = await sb
      .from('test_attempts')
      .select('*, mock_tests(title, subjects(name))')
      .eq('student_id', id)
      .order('started_at', { ascending: false });

    if (attErr) {
      return res.status(500).json({ error: attErr.message });
    }

    const formattedAttempts = (attempts || []).map((ta: any) => ({
      ...ta,
      test_title: ta.mock_tests?.title || '',
      subject_name: (ta.mock_tests?.subjects as any)?.name || ''
    }));

    const { data: payments, error: payErr } = await sb
      .from('payments')
      .select('*')
      .eq('student_id', id)
      .order('created_at', { ascending: false });

    if (payErr) {
      return res.status(500).json({ error: payErr.message });
    }

    res.json({
      student,
      attempts: formattedAttempts,
      payments: payments || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle student active status (Admin only)
studentsRouter.put('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb.from('profiles').update({ is_active: Boolean(is_active) }).eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('UPDATE_STUDENT_STATUS', 'PROFILE', id, `Changed student active status to ${is_active ? 'Active' : 'Deactivated'}`);
    res.json({ success: true, is_active: Boolean(is_active) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin manual membership upgrade (Admin only)
studentsRouter.put('/:id/membership', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { tier } = req.body;

  if (!['free', 'premium'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const memId = `mem-admin-${Date.now()}`;

  try {
    const { error: profErr } = await sb.from('profiles').update({ membership_tier: tier }).eq('id', id);
    if (profErr) {
      return res.status(500).json({ error: profErr.message });
    }

    if (tier === 'premium') {
      const { error: memErr } = await sb.from('memberships').insert([{
        id: memId,
        student_id: id,
        tier: 'premium',
        payment_id: null,
        is_active: true,
        activated_at: new Date().toISOString()
      }]);
      if (memErr) {
        console.warn('[STUDENTS] Supabase membership insert warning:', memErr.message);
      }
    }

    await logAuditEvent('UPDATE_STUDENT_MEMBERSHIP', 'PROFILE', id, `Admin updated membership tier to ${tier}`);
    res.json({ success: true, membership_tier: tier });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
