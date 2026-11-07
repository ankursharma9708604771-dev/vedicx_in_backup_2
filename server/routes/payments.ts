import { Router } from 'express';
import crypto from 'crypto';
import { supabaseServerClient } from '../supabase.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';

export const paymentsRouter = Router();

paymentsRouter.use(authenticateUser);

// Create Razorpay order (₹49 one-time) - Gracefully paused as per instructions
paymentsRouter.post('/create-order', (_req, res) => {
  return res.status(503).json({
    error: 'Online payment processing is currently paused while payment gateway credentials are being configured. Free mock tests, CBSE sample papers and PYQs remain fully accessible. Please contact support at supportvedicx@gmail.com for assistance.'
  });
});

// Verify payment endpoint - Gracefully paused as per instructions
paymentsRouter.post('/verify', (_req, res) => {
  return res.status(503).json({
    error: 'Online payment processing is currently paused while payment gateway credentials are being configured. Free mock tests, CBSE sample papers and PYQs remain fully accessible. Please contact support at supportvedicx@gmail.com for assistance.'
  });
});

// Student view their own payment history
paymentsRouter.get('/my-history', async (req, res) => {
  const studentId = req.user?.id;
  if (!studentId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { data, error } = await sb
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ payments: data || [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Webhook handler
paymentsRouter.post('/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  // Handle payment.captured event
  const event = req.body?.event;
  if (event === 'payment.captured') {
    const paymentEntity = req.body?.payload?.payment?.entity;
    console.log('[PAYMENT WEBHOOK] Received payment.captured:', paymentEntity?.id);
  }

  res.json({ status: 'ok' });
});

// Admin List Payments with filters and search (Authorized for admin)
paymentsRouter.get('/', requireAdmin, async (req, res) => {
  const { status, search } = req.query;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    let q = sb
      .from('payments')
      .select('*, profiles(full_name, email, membership_tier)');

    if (status) q = q.eq('status', status);
    if (search) {
      q = q.or(`transaction_id.ilike.%${search}%,order_id.ilike.%${search}%`);
    }

    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = (data || []).map((p: any) => ({
      ...p,
      student_name: p.profiles?.full_name || '',
      student_email: p.profiles?.email || '',
      membership_tier: p.profiles?.membership_tier || ''
    }));

    res.json({ payments: formatted });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
