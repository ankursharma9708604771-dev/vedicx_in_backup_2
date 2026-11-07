-- ============================================================================
-- VEDICX: Supabase Appointments Table Creation Script
-- Run this in your Supabase Dashboard SQL Editor (project: tuxxcwbwleqnrnmxuhkj)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  target_class TEXT NOT NULL DEFAULT 'Class 10',
  subject TEXT NOT NULL DEFAULT 'Mathematics',
  counselling_type TEXT NOT NULL DEFAULT '1-on-1 Doubt Clearing',
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(student_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON public.appointments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. Allow any student/visitor to insert a booking record
DROP POLICY IF EXISTS "Public can book appointments" ON public.appointments;
CREATE POLICY "Public can book appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- 2. Allow reading appointments (frontend & backend)
DROP POLICY IF EXISTS "Allow select appointments" ON public.appointments;
CREATE POLICY "Allow select appointments" ON public.appointments
  FOR SELECT USING (true);

-- 3. Allow update / status modification
DROP POLICY IF EXISTS "Allow update appointments" ON public.appointments;
CREATE POLICY "Allow update appointments" ON public.appointments
  FOR UPDATE USING (true);

-- 4. Allow delete appointments
DROP POLICY IF EXISTS "Allow delete appointments" ON public.appointments;
CREATE POLICY "Allow delete appointments" ON public.appointments
  FOR DELETE USING (true);
