-- ============================================================================
-- VEDICX SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- File: supabase/migrations/20261106_vedicx_schema.sql
-- 100% IDEMPOTENT & STRICT TOPOLOGICAL EXECUTION ORDER
-- ============================================================================

-- 0. EXTENSIONS & SCHEMAS
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE DEFINITIONS (Created FIRST in topological order; profiles is Table 1)
-- ============================================================================

-- 1.1 PROFILES (Users & Admin accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'teacher')),
  free_test_used INTEGER NOT NULL DEFAULT 0,
  membership_tier TEXT NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium')),
  password_hash TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 1.3 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 1.4 CHAPTERS
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5 QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  class TEXT NOT NULL DEFAULT '10',
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'multiple_select', 'true_false')),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  marks NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  negative_marks NUMERIC(4,2) NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  source TEXT NOT NULL DEFAULT 'NCERT',
  source_year INTEGER,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.6 MOCK TESTS
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  test_number INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  passing_marks NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  access_type TEXT NOT NULL DEFAULT 'premium' CHECK (access_type IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.7 MOCK TEST QUESTIONS
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id TEXT PRIMARY KEY,
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_mock_test_question UNIQUE (mock_test_id, question_id)
);

-- 1.8 SAMPLE PAPERS
CREATE TABLE IF NOT EXISTS public.sample_papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  year_set TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL DEFAULT '1.2 MB',
  access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  download_count INTEGER NOT NULL DEFAULT 0,
  paper_type TEXT NOT NULL DEFAULT 'pdf',
  sections_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.sample_papers ADD COLUMN IF NOT EXISTS paper_type TEXT NOT NULL DEFAULT 'pdf';
ALTER TABLE public.sample_papers ADD COLUMN IF NOT EXISTS sections_json TEXT;

-- 1.9 PYQ QUESTIONS
CREATE TABLE IF NOT EXISTS public.pyq_questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  chapter_id TEXT REFERENCES public.chapters(id) ON DELETE SET NULL,
  topic TEXT,
  question_type TEXT NOT NULL DEFAULT 'Subjective/Short',
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 3,
  solution_text TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT
);
ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS option_a TEXT;
ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS option_b TEXT;
ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS option_c TEXT;
ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS option_d TEXT;
ALTER TABLE public.pyq_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- 1.10 PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  amount NUMERIC(8,2) NOT NULL DEFAULT 49.0,
  currency TEXT NOT NULL DEFAULT 'INR',
  gateway TEXT NOT NULL DEFAULT 'Razorpay',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
  payment_signature TEXT,
  payment_method TEXT DEFAULT 'UPI / Card',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.11 MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.memberships (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'premium',
  payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.12 TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ,
  time_taken_seconds INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  unanswered_questions INTEGER DEFAULT 0,
  marks_obtained NUMERIC(5,2) DEFAULT 0.0,
  maximum_marks NUMERIC(5,2) DEFAULT 0.0,
  percentage NUMERIC(5,2) DEFAULT 0.0,
  passed BOOLEAN DEFAULT false
);

-- 1.13 STUDENT ANSWERS
CREATE TABLE IF NOT EXISTS public.student_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  marks_awarded NUMERIC(4,2) DEFAULT 0.0,
  CONSTRAINT uq_student_attempt_question UNIQUE (attempt_id, question_id)
);

-- 1.14 APPOINTMENTS
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

-- 1.15 SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.16 AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.17 BACKUP RECORDS
CREATE TABLE IF NOT EXISTS public.backup_records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'completed',
  tables_included TEXT NOT NULL,
  record_counts TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 2. SECURITY DEFINER HELPER FUNCTIONS & AUTH TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text)
        AND role = 'admin'
        AND is_active = true
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profile_id
        AND (auth_user_id = auth.uid() OR id = auth.uid()::text)
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, auth_user_id, email, full_name, role, membership_tier)
  VALUES (
    NEW.id::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'free'
  )
  ON CONFLICT (email) DO UPDATE
  SET auth_user_id = EXCLUDED.auth_user_id,
      updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') AND
     EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'auth' AND c.relname = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================================================
-- 3. QUERY PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_categories_subject ON public.categories(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_category ON public.chapters(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject ON public.mock_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_chapter ON public.mock_tests(chapter_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_test ON public.mock_test_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_question ON public.mock_test_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_sample_papers_subject ON public.sample_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyqs_subject ON public.pyq_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyqs_chapter ON public.pyq_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_memberships_student ON public.memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON public.test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON public.test_attempts(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON public.student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question ON public.student_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(student_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
DROP POLICY IF EXISTS "Users Read Own Profile" ON public.profiles;
CREATE POLICY "Users Read Own Profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (auth_user_id = auth.uid() OR id = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users Insert Own Student Profile" ON public.profiles;
CREATE POLICY "Users Insert Own Student Profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (
        (auth_user_id = auth.uid() OR id = auth.uid()::text)
        AND role = 'student'
        AND membership_tier = 'free'
        AND free_test_used = 0
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users Update Own Profile Without Privilege Escalation" ON public.profiles;
CREATE POLICY "Users Update Own Profile Without Privilege Escalation" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND (auth_user_id = auth.uid() OR id = auth.uid()::text OR public.is_admin())
  ) WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND (auth_user_id = auth.uid() OR id = auth.uid()::text)
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = profiles.id)
      AND role = 'student'
      AND membership_tier = (SELECT p.membership_tier FROM public.profiles p WHERE p.id = profiles.id)
      AND free_test_used >= (SELECT p.free_test_used FROM public.profiles p WHERE p.id = profiles.id)
    )
  );

DROP POLICY IF EXISTS "Admin Delete Profiles" ON public.profiles;
CREATE POLICY "Admin Delete Profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- 4.2 Content Policies
DROP POLICY IF EXISTS "Public Read Subjects" ON public.subjects;
CREATE POLICY "Public Read Subjects" ON public.subjects FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Subjects" ON public.subjects;
CREATE POLICY "Admin Manage Subjects" ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = categories.subject_id AND (s.is_active = true OR public.is_admin()))
);

DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;
CREATE POLICY "Admin Manage Categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public Read Chapters" ON public.chapters;
CREATE POLICY "Public Read Chapters" ON public.chapters FOR SELECT USING (
  (is_active = true AND EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = chapters.subject_id AND s.is_active = true))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin Manage Chapters" ON public.chapters;
CREATE POLICY "Admin Manage Chapters" ON public.chapters FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Questions: Protected
DROP POLICY IF EXISTS "Admin Read Questions" ON public.questions;
CREATE POLICY "Admin Read Questions" ON public.questions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Questions" ON public.questions;
CREATE POLICY "Admin Manage Questions" ON public.questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Mock Tests
DROP POLICY IF EXISTS "Public Read Published Mock Tests" ON public.mock_tests;
CREATE POLICY "Public Read Published Mock Tests" ON public.mock_tests FOR SELECT USING (
  (status = 'published' AND EXISTS (SELECT 1 FROM public.chapters c JOIN public.subjects s ON c.subject_id = s.id WHERE c.id = mock_tests.chapter_id AND c.is_active = true AND s.is_active = true))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin Manage Mock Tests" ON public.mock_tests;
CREATE POLICY "Admin Manage Mock Tests" ON public.mock_tests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public Read Mock Test Questions" ON public.mock_test_questions;
CREATE POLICY "Public Read Mock Test Questions" ON public.mock_test_questions FOR SELECT USING (
  public.is_admin() OR (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.mock_tests mt WHERE mt.id = mock_test_questions.mock_test_id AND mt.status = 'published'))
);

DROP POLICY IF EXISTS "Admin Manage Mock Test Questions" ON public.mock_test_questions;
CREATE POLICY "Admin Manage Mock Test Questions" ON public.mock_test_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Sample Papers
DROP POLICY IF EXISTS "Public Read Sample Papers" ON public.sample_papers;
CREATE POLICY "Public Read Sample Papers" ON public.sample_papers FOR SELECT USING (
  (status = 'published' AND access_type = 'free')
  OR public.is_admin()
  OR (status = 'published' AND access_type = 'premium' AND auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid()::text) AND (p.membership_tier = 'premium' OR p.role = 'admin') AND p.is_active = true))
);

DROP POLICY IF EXISTS "Admin Manage Sample Papers" ON public.sample_papers;
CREATE POLICY "Admin Manage Sample Papers" ON public.sample_papers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PYQs
DROP POLICY IF EXISTS "Public Read PYQs" ON public.pyq_questions;
CREATE POLICY "Public Read PYQs" ON public.pyq_questions FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage PYQs" ON public.pyq_questions;
CREATE POLICY "Admin Manage PYQs" ON public.pyq_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
CREATE POLICY "Public Read Site Settings" ON public.site_settings FOR SELECT USING (
  key IN ('hero_heading', 'hero_subheading', 'brand_tagline', 'premium_price', 'contact_email', 'announcement_banner') OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin Manage Site Settings" ON public.site_settings;
CREATE POLICY "Admin Manage Site Settings" ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Test Attempts
DROP POLICY IF EXISTS "Students Read Own Attempts" ON public.test_attempts;
CREATE POLICY "Students Read Own Attempts" ON public.test_attempts FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_profile_owner(student_id) OR public.is_admin()));

DROP POLICY IF EXISTS "Students Insert Own Attempts" ON public.test_attempts;
CREATE POLICY "Students Insert Own Attempts" ON public.test_attempts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND ((public.is_profile_owner(student_id) AND status = 'in_progress' AND marks_obtained = 0.0 AND passed = false) OR public.is_admin())
);

DROP POLICY IF EXISTS "Students Update Own In-Progress Attempts" ON public.test_attempts;
CREATE POLICY "Students Update Own In-Progress Attempts" ON public.test_attempts FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (public.is_profile_owner(student_id) OR public.is_admin())
) WITH CHECK (
  public.is_admin() OR (public.is_profile_owner(student_id) AND (SELECT ta.status FROM public.test_attempts ta WHERE ta.id = test_attempts.id) = 'in_progress' AND marks_obtained = (SELECT ta.marks_obtained FROM public.test_attempts ta WHERE ta.id = test_attempts.id) AND passed = (SELECT ta.passed FROM public.test_attempts ta WHERE ta.id = test_attempts.id))
);

DROP POLICY IF EXISTS "Admin Delete Attempts" ON public.test_attempts;
CREATE POLICY "Admin Delete Attempts" ON public.test_attempts FOR DELETE USING (public.is_admin());

-- Student Answers
DROP POLICY IF EXISTS "Students Read Own Answers" ON public.student_answers;
CREATE POLICY "Students Read Own Answers" ON public.student_answers FOR SELECT USING (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.test_attempts ta WHERE ta.id = student_answers.attempt_id AND (public.is_profile_owner(ta.student_id) OR public.is_admin()))
);

DROP POLICY IF EXISTS "Students Insert Own Answers" ON public.student_answers;
CREATE POLICY "Students Insert Own Answers" ON public.student_answers FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (public.is_admin() OR EXISTS (SELECT 1 FROM public.test_attempts ta WHERE ta.id = student_answers.attempt_id AND public.is_profile_owner(ta.student_id) AND ta.status = 'in_progress'))
);

DROP POLICY IF EXISTS "Students Update Own Answers" ON public.student_answers;
CREATE POLICY "Students Update Own Answers" ON public.student_answers FOR UPDATE USING (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.test_attempts ta WHERE ta.id = student_answers.attempt_id AND (public.is_profile_owner(ta.student_id) OR public.is_admin()))
) WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.test_attempts ta WHERE ta.id = student_answers.attempt_id AND public.is_profile_owner(ta.student_id) AND ta.status = 'in_progress')
);

DROP POLICY IF EXISTS "Admin Delete Answers" ON public.student_answers;
CREATE POLICY "Admin Delete Answers" ON public.student_answers FOR DELETE USING (public.is_admin());

-- Appointments
DROP POLICY IF EXISTS "Public Book Appointment" ON public.appointments;
CREATE POLICY "Public Book Appointment" ON public.appointments FOR INSERT WITH CHECK (
  status = 'pending' AND length(trim(student_name)) > 0 AND length(trim(student_email)) > 3 AND length(trim(student_phone)) > 5
);

DROP POLICY IF EXISTS "Students Read Own Appointments By Email" ON public.appointments;
CREATE POLICY "Students Read Own Appointments By Email" ON public.appointments FOR SELECT USING (
  public.is_admin() OR (auth.uid() IS NOT NULL AND ((auth.jwt() ->> 'email') = appointments.student_email OR EXISTS (SELECT 1 FROM public.profiles p WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid()::text) AND p.email = appointments.student_email)))
);

DROP POLICY IF EXISTS "Admin Manage Appointments" ON public.appointments;
CREATE POLICY "Admin Manage Appointments" ON public.appointments FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;
CREATE POLICY "Admin Delete Appointments" ON public.appointments FOR DELETE USING (public.is_admin());

-- Payments & Memberships
DROP POLICY IF EXISTS "Students Read Own Payments" ON public.payments;
CREATE POLICY "Students Read Own Payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_profile_owner(student_id) OR public.is_admin()));

DROP POLICY IF EXISTS "Admin Manage Payments" ON public.payments;
CREATE POLICY "Admin Manage Payments" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students Read Own Memberships" ON public.memberships;
CREATE POLICY "Students Read Own Memberships" ON public.memberships FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_profile_owner(student_id) OR public.is_admin()));

DROP POLICY IF EXISTS "Admin Manage Memberships" ON public.memberships;
CREATE POLICY "Admin Manage Memberships" ON public.memberships FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Audit & Backup
DROP POLICY IF EXISTS "Admins Read Audit Logs" ON public.audit_logs;
CREATE POLICY "Admins Read Audit Logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow Insert Audit Logs" ON public.audit_logs;
CREATE POLICY "Allow Insert Audit Logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Backup Records" ON public.backup_records;
CREATE POLICY "Admin Manage Backup Records" ON public.backup_records FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
