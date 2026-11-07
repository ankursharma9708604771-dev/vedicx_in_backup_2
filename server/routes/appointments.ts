import { Router } from 'express';
import { supabaseServerClient, isSupabaseConfigured } from '../supabase.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { logAuditEvent } from '../supabaseDb.ts';

export const appointmentsRouter = Router();

appointmentsRouter.use(authenticateUser);

/**
 * POST /api/appointments
 * Submit new appointment booking (Accessible to authenticated users/students)
 * Persists into Supabase table 'appointments'
 */
appointmentsRouter.post('/', async (req, res) => {
  const {
    student_name,
    student_email,
    student_phone,
    target_class = 'Class 10',
    subject = 'Mathematics',
    counselling_type = '1-on-1 Doubt Clearing',
    appointment_date,
    appointment_time,
    notes = ''
  } = req.body;

  if (!student_name || !student_email || !student_phone || !appointment_date || !appointment_time) {
    return res.status(400).json({
      error: 'Please fill all required fields: Name, Email, Phone/WhatsApp, Date, and Time Slot.'
    });
  }

  const appointmentId = `apt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb
      .from('appointments')
      .insert([
        {
          id: appointmentId,
          student_name: student_name.trim(),
          student_email: student_email.trim().toLowerCase(),
          student_phone: student_phone.trim(),
          target_class,
          subject,
          counselling_type,
          appointment_date,
          appointment_time,
          notes: (notes || '').trim(),
          status: 'pending',
          created_at: now
        }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent(
      'BOOK_APPOINTMENT',
      'APPOINTMENT',
      appointmentId,
      `Booked ${counselling_type} session on ${appointment_date} at ${appointment_time}.`
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! Our academic mentor will contact you on WhatsApp / Email to confirm the session.',
      appointment: {
        id: appointmentId,
        student_name,
        student_email,
        student_phone,
        target_class,
        subject,
        counselling_type,
        appointment_date,
        appointment_time,
        notes,
        status: 'pending',
        created_at: now
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/appointments
 * List appointments (for Admin review or Student's own bookings)
 */
appointmentsRouter.get('/', async (req, res) => {
  const { status, search, email } = req.query;

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required to view appointment bookings.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const isUserAdmin = req.user.role === 'admin';
  const filterEmail = isUserAdmin ? (email as string) : req.user.email;

  try {
    let q = sb.from('appointments').select('*');

    if (status) {
      q = q.eq('status', status);
    }

    if (!isUserAdmin) {
      q = q.eq('student_email', filterEmail.toLowerCase());
    } else if (filterEmail) {
      q = q.eq('student_email', filterEmail.toLowerCase());
    }

    if (search) {
      q = q.or(`student_name.ilike.%${search}%,student_email.ilike.%${search}%,student_phone.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data: sbAppointments, error: sbErr } = await q.order('appointment_date', { ascending: false });

    if (sbErr) {
      return res.status(500).json({ error: sbErr.message });
    }

    res.json({ appointments: sbAppointments || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/appointments/:id/status
 * Admin updates appointment status (confirmed | completed | cancelled)
 */
appointmentsRouter.put('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed: pending, confirmed, completed, cancelled' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('UPDATE_APPOINTMENT_STATUS', 'APPOINTMENT', id, `Updated appointment status to ${status}`);

    res.json({ success: true, message: `Appointment status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/appointments/:id
 * Admin deletes appointment
 */
appointmentsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('DELETE_APPOINTMENT', 'APPOINTMENT', id, 'Deleted appointment booking');

    res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
