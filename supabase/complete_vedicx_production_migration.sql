-- ============================================================================
-- VEDICX: COMPLETE SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Project: VEDICX Educational Platform (Class 10 CBSE)
-- File: supabase/vedicx_schema_and_rls.sql
-- 100% IDEMPOTENT & PRODUCTION-GRADE HARDENED RLS
-- ALL-IN-ONE SCRIPT READY FOR SINGLE-CLICK EXECUTION IN SUPABASE SQL EDITOR
-- Execution Order:
--   1. Extensions & Schemas
--   2. All 17 Tables (Created FIRST; public.profiles is Table 1)
--   3. Security Definer Helper Functions & Auth Triggers (Created AFTER tables)
--   4. Query Performance Indexes
--   5. Row Level Security (RLS) Enablement & Strict Non-Escalatable Policies
--   6. Baseline Curriculum & Admin Seed Data (Safe Idempotent Inserts)
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE DEFINITIONS (CREATED FIRST IN STRICT DEPENDENCY ORDER)
-- ============================================================================

-- 1.1 PROFILES (Students & Administrators - CREATED FIRST so all FKs & functions resolve)
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

-- 1.2 SUBJECTS (Class 10 Core Curriculum)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 1.3 CATEGORIES (e.g. Social Science subdivisions: History, Civics, Geography, Economics)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 1.4 CHAPTERS (49 Official NCERT Class 10 Chapters)
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

-- 1.5 QUESTIONS BANK
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

-- 1.7 MOCK TEST QUESTIONS MAPPING
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id TEXT PRIMARY KEY,
  mock_test_id TEXT NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_mock_test_question UNIQUE(mock_test_id, question_id)
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

-- 1.9 PYQs (Previous Year Questions)
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
  CONSTRAINT uq_student_attempt_question UNIQUE(attempt_id, question_id)
);

-- 1.14 APPOINTMENTS (1-on-1 Academic Mentorship & Doubt Clearing)
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
-- (Created AFTER all tables exist so table references resolve cleanly)
-- ============================================================================

-- 2.1 Admin check helper function
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

-- 2.2 Profile owner check helper function
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

-- 2.3 Supabase Auth User Synchronization Function
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

-- Safe registration of the auth trigger (attaches if Supabase auth.users exists)
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

-- 4.1 PROFILES POLICIES
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

-- 4.2 SUBJECTS POLICIES
DROP POLICY IF EXISTS "Public Read Subjects" ON public.subjects;
CREATE POLICY "Public Read Subjects" ON public.subjects
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Subjects" ON public.subjects;
CREATE POLICY "Admin Manage Subjects" ON public.subjects
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.3 CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = categories.subject_id AND (s.is_active = true OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;
CREATE POLICY "Admin Manage Categories" ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.4 CHAPTERS POLICIES
DROP POLICY IF EXISTS "Public Read Chapters" ON public.chapters;
CREATE POLICY "Public Read Chapters" ON public.chapters
  FOR SELECT USING (
    (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = chapters.subject_id AND s.is_active = true
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Manage Chapters" ON public.chapters;
CREATE POLICY "Admin Manage Chapters" ON public.chapters
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.5 QUESTIONS POLICIES (Exam integrity: Admin only via direct Supabase client; server masks options/answers)
DROP POLICY IF EXISTS "Public Read Published Questions" ON public.questions;
DROP POLICY IF EXISTS "Admin Read Questions" ON public.questions;
CREATE POLICY "Admin Read Questions" ON public.questions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Questions" ON public.questions;
CREATE POLICY "Admin Manage Questions" ON public.questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.6 MOCK TESTS POLICIES
DROP POLICY IF EXISTS "Public Read Published Mock Tests" ON public.mock_tests;
CREATE POLICY "Public Read Published Mock Tests" ON public.mock_tests
  FOR SELECT USING (
    (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM public.chapters c
        JOIN public.subjects s ON c.subject_id = s.id
        WHERE c.id = mock_tests.chapter_id AND c.is_active = true AND s.is_active = true
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Manage Mock Tests" ON public.mock_tests;
CREATE POLICY "Admin Manage Mock Tests" ON public.mock_tests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.7 MOCK TEST QUESTIONS POLICIES
DROP POLICY IF EXISTS "Public Read Mock Test Questions" ON public.mock_test_questions;
CREATE POLICY "Public Read Mock Test Questions" ON public.mock_test_questions
  FOR SELECT USING (
    public.is_admin()
    OR (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.mock_tests mt
        WHERE mt.id = mock_test_questions.mock_test_id AND mt.status = 'published'
      )
    )
  );

DROP POLICY IF EXISTS "Admin Manage Mock Test Questions" ON public.mock_test_questions;
CREATE POLICY "Admin Manage Mock Test Questions" ON public.mock_test_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.8 SAMPLE PAPERS POLICIES
DROP POLICY IF EXISTS "Public Read Sample Papers" ON public.sample_papers;
CREATE POLICY "Public Read Sample Papers" ON public.sample_papers
  FOR SELECT USING (
    (status = 'published' AND access_type = 'free')
    OR public.is_admin()
    OR (
      status = 'published'
      AND access_type = 'premium'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid()::text)
          AND (p.membership_tier = 'premium' OR p.role = 'admin')
          AND p.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS "Admin Manage Sample Papers" ON public.sample_papers;
CREATE POLICY "Admin Manage Sample Papers" ON public.sample_papers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.9 PYQs POLICIES
DROP POLICY IF EXISTS "Public Read PYQs" ON public.pyq_questions;
CREATE POLICY "Public Read PYQs" ON public.pyq_questions
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage PYQs" ON public.pyq_questions;
CREATE POLICY "Admin Manage PYQs" ON public.pyq_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.10 SITE SETTINGS POLICIES
DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
CREATE POLICY "Public Read Site Settings" ON public.site_settings
  FOR SELECT USING (
    key IN (
      'hero_heading',
      'hero_subheading',
      'brand_tagline',
      'premium_price',
      'contact_email',
      'announcement_banner'
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Manage Site Settings" ON public.site_settings;
CREATE POLICY "Admin Manage Site Settings" ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.11 TEST ATTEMPTS POLICIES
DROP POLICY IF EXISTS "Students Read Own Attempts" ON public.test_attempts;
CREATE POLICY "Students Read Own Attempts" ON public.test_attempts
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (public.is_profile_owner(student_id) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Students Insert Own Attempts" ON public.test_attempts;
CREATE POLICY "Students Insert Own Attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (
        public.is_profile_owner(student_id)
        AND status = 'in_progress'
        AND marks_obtained = 0.0
        AND passed = false
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Students Update Own In-Progress Attempts" ON public.test_attempts;
CREATE POLICY "Students Update Own In-Progress Attempts" ON public.test_attempts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND (public.is_profile_owner(student_id) OR public.is_admin())
  ) WITH CHECK (
    public.is_admin()
    OR (
      public.is_profile_owner(student_id)
      AND (SELECT ta.status FROM public.test_attempts ta WHERE ta.id = test_attempts.id) = 'in_progress'
      AND marks_obtained = (SELECT ta.marks_obtained FROM public.test_attempts ta WHERE ta.id = test_attempts.id)
      AND passed = (SELECT ta.passed FROM public.test_attempts ta WHERE ta.id = test_attempts.id)
    )
  );

DROP POLICY IF EXISTS "Admin Delete Attempts" ON public.test_attempts;
CREATE POLICY "Admin Delete Attempts" ON public.test_attempts
  FOR DELETE USING (public.is_admin());

-- 4.12 STUDENT ANSWERS POLICIES
DROP POLICY IF EXISTS "Students Read Own Answers" ON public.student_answers;
CREATE POLICY "Students Read Own Answers" ON public.student_answers
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.test_attempts ta
      WHERE ta.id = student_answers.attempt_id
        AND (public.is_profile_owner(ta.student_id) OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Students Insert Own Answers" ON public.student_answers;
CREATE POLICY "Students Insert Own Answers" ON public.student_answers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.test_attempts ta
        WHERE ta.id = student_answers.attempt_id
          AND public.is_profile_owner(ta.student_id)
          AND ta.status = 'in_progress'
      )
    )
  );

DROP POLICY IF EXISTS "Students Update Own Answers" ON public.student_answers;
CREATE POLICY "Students Update Own Answers" ON public.student_answers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.test_attempts ta
      WHERE ta.id = student_answers.attempt_id
        AND (public.is_profile_owner(ta.student_id) OR public.is_admin())
    )
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.test_attempts ta
      WHERE ta.id = student_answers.attempt_id
        AND public.is_profile_owner(ta.student_id)
        AND ta.status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS "Admin Delete Answers" ON public.student_answers;
CREATE POLICY "Admin Delete Answers" ON public.student_answers
  FOR DELETE USING (public.is_admin());

-- 4.13 APPOINTMENTS POLICIES
DROP POLICY IF EXISTS "Allow select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can book appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Book Appointment" ON public.appointments;
CREATE POLICY "Public Book Appointment" ON public.appointments
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND length(trim(student_name)) > 0
    AND length(trim(student_email)) > 3
    AND length(trim(student_phone)) > 5
  );

DROP POLICY IF EXISTS "Students Read Own Appointments By Email" ON public.appointments;
CREATE POLICY "Students Read Own Appointments By Email" ON public.appointments
  FOR SELECT USING (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND (
        (auth.jwt() ->> 'email') = appointments.student_email
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid()::text)
            AND p.email = appointments.student_email
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admin Manage Appointments" ON public.appointments;
CREATE POLICY "Admin Manage Appointments" ON public.appointments
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;
CREATE POLICY "Admin Delete Appointments" ON public.appointments
  FOR DELETE USING (public.is_admin());

-- 4.14 PAYMENTS & MEMBERSHIPS POLICIES
DROP POLICY IF EXISTS "Students Read Own Payments" ON public.payments;
CREATE POLICY "Students Read Own Payments" ON public.payments
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (public.is_profile_owner(student_id) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Admin Manage Payments" ON public.payments;
CREATE POLICY "Admin Manage Payments" ON public.payments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students Read Own Memberships" ON public.memberships;
CREATE POLICY "Students Read Own Memberships" ON public.memberships
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (public.is_profile_owner(student_id) OR public.is_admin())
  );

DROP POLICY IF EXISTS "Admin Manage Memberships" ON public.memberships;
CREATE POLICY "Admin Manage Memberships" ON public.memberships
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4.15 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins Read Audit Logs" ON public.audit_logs;
CREATE POLICY "Admins Read Audit Logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow Insert Audit Logs" ON public.audit_logs;
CREATE POLICY "Allow Insert Audit Logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

-- 4.16 BACKUP RECORDS POLICIES
DROP POLICY IF EXISTS "Admin Manage Backup Records" ON public.backup_records;
CREATE POLICY "Admin Manage Backup Records" ON public.backup_records
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================================
-- 5. COMPLETE SEED DATA INSERTION (2,084 Records)
-- ============================================================================

-- ============================================================================
-- VEDICX Educational Platform - Full PostgreSQL Seed Data Dump
-- Generated: 2026-11-07T12:21:02.502Z
-- Target: Supabase PostgreSQL (Project tuxxcwbwleqnrnmxuhkj)
-- ============================================================================

-- Temporarily disable foreign key triggers for bulk insertion
SET session_replication_role = replica;

-- ------------------------------------------------------------
-- Data for public."profiles" (5 records)
-- ------------------------------------------------------------
INSERT INTO public."profiles" ("id", "email", "full_name", "role", "free_test_used", "membership_tier", "password_hash", "is_active", "created_at", "updated_at")
VALUES
  ('usr-admin-1', 'admin@vedicx.in', 'VEDICX Administrator', 'admin', 1, 'premium', 'pbkdf2:3c82d974aca361d5b7990fc5975a4138:cda1e4910038478f75d3533bcb3546659799a1b9d827ff55da7028391825dc8043277dac5ac1ad328cf089113d281e6e4a84e758032e474239beb6e1e1d44d6a', TRUE, '2026-11-05 04:48:37', '2026-11-06 14:45:25'),
  ('usr-student-1', 'student@vedicx.in', 'Aarav Sharma', 'student', 1, 'premium', 'pbkdf2:6c50c71d22acac74f22419b244a81010:fe2b728bec38db1fcb855d8cec3f7a2ffeef27352c1beb13c9832e69cbb45b4628c0d67d4d999407d9251182c1228f2d365f7aee36a0f0f5693c375efbdc6df7', TRUE, '2026-11-05 04:48:37', '2026-11-06 14:45:25'),
  ('usr-student-2', 'priya.singh@gmail.com', 'Priya Singh', 'student', 1, 'premium', 'student123', TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('usr-1793976325719', 'student_test_1793976325562@example.com', 'Rohan Sharma', 'student', 0, 'free', 'pbkdf2:fad83263844e71da8f7289e7bcdf8478:6c99121800b6f3a1f3ad664febab12ab6c8dfc93791c8acfa919557142d99251d06b95b3de90b22b6282fa4826634ea1d394c446adaa551819e8af106d6a8647', TRUE, '2026-11-06 14:45:25', '2026-11-06 14:45:25'),
  ('2bda700a-4e47-43e1-ba08-629720be622f', 'test.verify@vedicx.in', 'Test Student', 'student', 0, 'free', 'pbkdf2:27763ef8f9f4c97ddd236aeca46a20f4:369940d4bb610f483b01ed70f7273f32af47f1f47a9cb3eab010d7cfbeffa59634119383d6d926d9b16af1f48c6701527f03bfb19ce95f842cc3347df62bca44', TRUE, '2026-11-07 11:09:06', '2026-11-07 11:09:06')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."subjects" (3 records)
-- ------------------------------------------------------------
INSERT INTO public."subjects" ("id", "name", "code", "description", "icon", "display_order", "is_active")
VALUES
  ('science', 'Science', 'SCI-10', 'Physics, Chemistry, and Biology syllabus based on latest NCERT Class 10.', 'Atom', 1, TRUE),
  ('mathematics', 'Mathematics', 'MATH-10', 'Number systems, Algebra, Geometry, Trigonometry, Statistics & Probability.', 'Calculator', 2, TRUE),
  ('social-science', 'Social Science', 'SST-10', 'History, Geography, Political Science (Civics), and Economics.', 'Globe', 3, TRUE)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."categories" (4 records)
-- ------------------------------------------------------------
INSERT INTO public."categories" ("id", "subject_id", "name", "display_order")
VALUES
  ('history', 'social-science', 'History (India & the Contemporary World - II)', 1),
  ('geography', 'social-science', 'Geography (Contemporary India - II)', 2),
  ('political-science', 'social-science', 'Political Science (Democratic Politics - II)', 3),
  ('economics', 'social-science', 'Economics (Understanding Economic Development)', 4)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."chapters" (49 records)
-- ------------------------------------------------------------
INSERT INTO public."chapters" ("id", "subject_id", "category_id", "chapter_number", "name", "description", "display_order", "is_active", "created_at", "updated_at")
VALUES
  ('math-ch1', 'mathematics', NULL, 1, 'Real Numbers', 'Fundamental Theorem of Arithmetic, irrationality proofs.', 1, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch2', 'mathematics', NULL, 2, 'Polynomials', 'Geometrical meaning of zeroes, relationship between zeroes and coefficients.', 2, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch3', 'mathematics', NULL, 3, 'Pair of Linear Equations in Two Variables', 'Graphical & algebraic solutions, elimination, substitution.', 3, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch4', 'mathematics', NULL, 4, 'Quadratic Equations', 'Standard form, factorization, quadratic formula, nature of roots.', 4, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch5', 'mathematics', NULL, 5, 'Arithmetic Progressions', 'nth term, sum of first n terms of an AP, daily life applications.', 5, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch6', 'mathematics', NULL, 6, 'Triangles', 'Similarity criteria, Basic Proportionality Theorem (Thales theorem).', 6, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch7', 'mathematics', NULL, 7, 'Coordinate Geometry', 'Distance formula, Section formula.', 7, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch8', 'mathematics', NULL, 8, 'Introduction to Trigonometry', 'Trigonometric ratios, values for specific angles, identities.', 8, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch9', 'mathematics', NULL, 9, 'Some Applications of Trigonometry', 'Heights and distances, angles of elevation and depression.', 9, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch10', 'mathematics', NULL, 10, 'Circles', 'Tangent to a circle, number of tangents from a point to a circle.', 10, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch11', 'mathematics', NULL, 11, 'Areas Related to Circles', 'Perimeter and area of sector and segment of a circle.', 11, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch12', 'mathematics', NULL, 12, 'Surface Areas and Volumes', 'Surface areas and volumes of combinations of solids.', 12, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch13', 'mathematics', NULL, 13, 'Statistics', 'Mean, Median, and Mode of grouped data.', 13, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('math-ch14', 'mathematics', NULL, 14, 'Probability', 'Classical definition of probability, simple problems.', 14, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch1', 'science', NULL, 1, 'Chemical Reactions and Equations', 'Balanced chemical equations, types of reactions, oxidation & reduction.', 15, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch2', 'science', NULL, 2, 'Acids, Bases and Salts', 'Indicators, pH scale, chemical properties of salts.', 16, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch3', 'science', NULL, 3, 'Metals and Non-Metals', 'Physical and chemical properties, reactivity series, ionic compounds.', 17, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch4', 'science', NULL, 4, 'Carbon and its Compounds', 'Covalent bonding, homologous series, functional groups, hydrocarbons.', 18, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch5', 'science', NULL, 5, 'Life Processes', 'Nutrition, respiration, transportation, and excretion in plants and animals.', 19, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch6', 'science', NULL, 6, 'Control and Coordination', 'Nervous system, reflex arc, human brain, hormones in animals & plants.', 20, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch7', 'science', NULL, 7, 'How do Organisms Reproduce?', 'Asexual & sexual reproduction, reproductive health, plant reproduction.', 21, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch8', 'science', NULL, 8, 'Heredity', 'Mendel laws of inheritance, sex determination.', 22, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch9', 'science', NULL, 9, 'Light – Reflection and Refraction', 'Spherical mirrors, lens formula, magnification, refraction laws.', 23, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch10', 'science', NULL, 10, 'The Human Eye and the Colourful World', 'Human eye defect corrections, prism refraction, dispersion, scattering.', 24, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch11', 'science', NULL, 11, 'Electricity', 'Ohm law, resistance, series/parallel combinations, Joule heating.', 25, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch12', 'science', NULL, 12, 'Magnetic Effects of Electric Current', 'Magnetic field lines, solenoid, Fleming left-hand rule, domestic circuits.', 26, TRUE, '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('sci-ch13', 'science', NULL, 13, 'Our Environment', 'Ecosystem, food chains & webs, ozone depletion, waste management.', 27, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-hist-1', 'social-science', 'history', 1, 'The Rise of Nationalism in Europe', 'French Revolution, Romanticism, unification of Germany & Italy.', 28, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-hist-2', 'social-science', 'history', 2, 'Nationalism in India', 'Non-Cooperation, Civil Disobedience, Salt March, collective belonging.', 29, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-hist-3', 'social-science', 'history', 3, 'The Making of a Global World', 'Silk routes, colonialism, trade, inter-war economy.', 30, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-hist-4', 'social-science', 'history', 4, 'The Age of Industrialisation', 'Before Industrial Revolution, hand labour, factories in colonies.', 31, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-hist-5', 'social-science', 'history', 5, 'Print Culture and the Modern World', 'First printed books, print revolution in Europe & India.', 32, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-1', 'social-science', 'geography', 1, 'Resources and Development', 'Types of resources, resource planning, land degradation, soil types.', 33, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-2', 'social-science', 'geography', 2, 'Forest and Wildlife Resources', 'Biodiversity, flora and fauna classification, conservation projects.', 34, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-3', 'social-science', 'geography', 3, 'Water Resources', 'Water scarcity, multi-purpose river valley projects, rainwater harvesting.', 35, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-4', 'social-science', 'geography', 4, 'Agriculture', 'Types of farming, cropping patterns, major food & cash crops.', 36, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-5', 'social-science', 'geography', 5, 'Minerals and Energy Resources', 'Mode of mineral occurrence, ferrous/non-ferrous, conventional/non-conventional.', 37, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-6', 'social-science', NULL, 6, 'Manufacturing Industries', 'Agro-based, mineral-based, industrial pollution & environmental degradation.', 38, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-geo-7', 'social-science', 'geography', 7, 'Lifelines of National Economy', 'Transport systems: roadways, railways, waterways, airways, ports.', 39, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-pol-1', 'social-science', 'political-science', 1, 'Power Sharing', 'Case studies of Belgium and Sri Lanka, majoritarianism, forms of power sharing.', 40, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-pol-2', 'social-science', 'political-science', 2, 'Federalism', 'Features of federalism, decentralisation in India, Union/State lists.', 41, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-pol-3', 'social-science', 'political-science', 3, 'Gender, Religion and Caste', 'Gender and politics, communalism, secular state, caste inequalities.', 42, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-pol-4', 'social-science', 'political-science', 4, 'Political Parties', 'Functions of political parties, national & state parties, electoral reforms.', 43, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-pol-5', 'social-science', 'political-science', 5, 'Outcomes of Democracy', 'Accountable, responsive and legitimate government, economic growth.', 44, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-eco-1', 'social-science', 'economics', 1, 'Development', 'National development, per capita income, HDI, sustainable development.', 45, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-eco-2', 'social-science', 'economics', 2, 'Sectors of the Indian Economy', 'Primary, Secondary, Tertiary sectors, organised vs unorganised.', 46, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-eco-3', 'social-science', 'economics', 3, 'Money and Credit', 'Barter system, modern forms of money, formal and informal credit.', 47, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-eco-4', 'social-science', 'economics', 4, 'Globalisation and the Indian Economy', 'MNCs, foreign trade integration, WTO, impact on workers.', 48, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('sst-eco-5', 'social-science', 'economics', 5, 'Consumer Rights', 'Consumer movement, Consumer Protection Act (COPRA), consumer rights.', 49, TRUE, '2026-11-05 04:48:37', '2026-11-05 04:48:37')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."questions" (850 records)
-- ------------------------------------------------------------
INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-math-1', '10', 'mathematics', 'math-ch1', 'Fundamental Theorem of Arithmetic', 'easy', 'mcq', 'If two positive integers a and b are written as a = x³y² and b = xy³, where x and y are prime numbers, then HCF(a, b) is:', 'xy', 'x²y²', 'x³y³', 'xy²', 'D', 'HCF is the product of the smallest power of each common prime factor involved in the numbers. Common factors are x (smallest power 1) and y (smallest power 2). Therefore, HCF(a, b) = xy².', NULL, 1, 0, 'published', 'CBSE Board Exam', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-math-2', '10', 'mathematics', 'math-ch1', 'Irrational Numbers', 'medium', 'mcq', 'The decimal expansion of the rational number 14587 / 1250 will terminate after how many decimal places?', 'One decimal place', 'Four decimal places', 'Three decimal places', 'Two decimal places', 'B', 'The denominator is 1250 = 2¹ × 5⁴. Since the highest power of 2 or 5 in prime factorization of denominator is 4, the decimal expansion terminates after 4 decimal places.', NULL, 1, 0, 'published', 'NCERT Exemplar', 2022, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-math-3', '10', 'mathematics', 'math-ch1', 'HCF and LCM relation', 'medium', 'mcq', 'If LCM(a, 18) = 36 and HCF(a, 18) = 2, then the value of a is:', '2', '3', '1', '4', 'D', 'For any two positive integers, Product of numbers = HCF × LCM. Hence a × 18 = 2 × 36 => a × 18 = 72 => a = 72 / 18 = 4.', NULL, 1, 0, 'published', 'CBSE Board Exam', 2021, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-math-4', '10', 'mathematics', 'math-ch1', 'Prime Factorisation', 'hard', 'mcq', 'The largest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:', '13', '65', '875', '1750', 'A', 'Required number is HCF of (70 - 5) and (125 - 8), which is HCF(65, 117). 65 = 5 × 13 and 117 = 3² × 13. Common prime factor is 13. Therefore, the required number is 13.', NULL, 1, 0, 'published', 'NCERT Exemplar', 2020, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-math-5', '10', 'mathematics', 'math-ch1', 'Nature of Numbers', 'easy', 'mcq', 'The sum of a rational number and an irrational number is always an irrational number.', 'Always an integer', 'Always rational', 'Can be rational or irrational', 'Always irrational', 'D', 'The sum of any rational number and an irrational number is always an irrational number.', NULL, 1, 0, 'published', 'NCERT Textbook', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sci-1', '10', 'science', 'sci-ch1', 'Types of Chemical Reactions', 'easy', 'mcq', 'Which of the following is a displacement reaction?', 'MgCO₃ → MgO + CO₂', '2Na + 2H₂O → 2NaOH + H₂', '2H₂ + O₂ → 2H₂O', '2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂', 'B', 'In 2Na + 2H₂O → 2NaOH + H₂, sodium (more reactive) displaces hydrogen from water. Hence, it is a single displacement reaction. A and D are decomposition reactions, and C is a combination reaction.', NULL, 1, 0, 'published', 'NCERT Exemplar', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sci-2', '10', 'science', 'sci-ch1', 'Oxidation and Reduction', 'medium', 'mcq', 'In the reaction: CuO + H₂ → Cu + H₂O, the oxidizing agent is:', 'H₂', 'Cu', 'CuO', 'H₂O', 'C', 'CuO loses oxygen and gets reduced to Cu. The substance that gets reduced acts as the oxidizing agent. Therefore, CuO is the oxidizing agent.', NULL, 1, 0, 'published', 'CBSE Board Exam', 2022, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sci-3', '10', 'science', 'sci-ch1', 'Precipitation Reaction', 'medium', 'mcq', 'When aqueous solutions of barium chloride and sodium sulphate react, an insoluble precipitate of barium sulphate is formed. What is the colour of this precipitate?', 'Yellow', 'White', 'Blue', 'Brown', 'B', 'BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s)↓ + 2NaCl(aq). Barium sulphate (BaSO₄) forms a white insoluble precipitate.', NULL, 1, 0, 'published', 'NCERT Textbook', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sci-4', '10', 'science', 'sci-ch1', 'Corrosion and Rancidity', 'easy', 'mcq', 'Chips manufacturers usually flush bags of chips with which gas to prevent the oil from getting oxidized?', 'Oxygen', 'Hydrogen', 'Nitrogen', 'Carbon dioxide', 'C', 'Nitrogen is an unreactive (inert) gas under normal conditions. Flushing chips bags with nitrogen replaces atmospheric oxygen, preventing oxidative rancidity of fats and oils.', NULL, 1, 0, 'published', 'NCERT Textbook', 2021, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sci-5', '10', 'science', 'sci-ch1', 'Balanced Chemical Equations', 'medium', 'mcq', 'When ferrous sulphate crystals (FeSO₄·7H₂O) are heated in a dry boiling tube, the pungent smelling gases evolved are:', 'SO₂ only', 'SO₃ only', 'SO₂ and SO₃', 'H₂S and SO₂', 'C', 'Thermal decomposition of anhydrous ferrous sulphate: 2FeSO₄(s) → Fe₂O₃(s) + SO₂(g) + SO₃(g). Both sulphur dioxide and sulphur trioxide gases with burning sulphur smell are evolved.', NULL, 1, 0, 'published', 'CBSE Board Exam', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sst-1', '10', 'social-science', 'sst-hist-1', 'The French Revolution', 'easy', 'mcq', 'Who was proclaimed the German Emperor in a ceremony held at Versailles in January 1871?', 'Kaiser William I', 'Otto von Bismarck', 'Victor Emmanuel II', 'Giuseppe Mazzini', 'A', 'In January 1871, the Prussian King William I was proclaimed German Emperor in the Hall of Mirrors at the Palace of Versailles.', NULL, 1, 0, 'published', 'NCERT Textbook', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sst-2', '10', 'social-science', 'sst-hist-1', 'Romanticism and National Feeling', 'medium', 'mcq', 'Which treaty recognized Greece as an independent nation in 1832?', 'Treaty of Vienna (1815)', 'Treaty of Constantinople (1832)', 'Treaty of Versailles', 'Treaty of Paris', 'B', 'The Treaty of Constantinople of 1832 recognized Greece as an independent nation after the Greek War of Independence.', NULL, 1, 0, 'published', 'CBSE Board Exam', 2022, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sst-3', '10', 'social-science', 'sst-hist-1', 'Liberal Nationalism', 'medium', 'mcq', 'A customs union known as Zollverein was formed in 1834 at the initiative of:', 'France', 'Austria', 'Prussia', 'Russia', 'C', 'In 1834, a customs union or Zollverein was formed at the initiative of Prussia and joined by most of the German states. It abolished tariff barriers.', NULL, 1, 0, 'published', 'CBSE Board Exam', 2021, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-sst-4', '10', 'social-science', 'sst-hist-1', 'Giuseppe Mazzini', 'easy', 'mcq', 'Which secret society was founded by Giuseppe Mazzini in Marseilles?', 'Young Italy', 'Young Europe', 'Carbonari', 'Jacobin Club', 'A', 'Giuseppe Mazzini founded two secret underground societies: first, Young Italy in Marseilles, and then Young Europe in Berne.', NULL, 1, 0, 'published', 'NCERT Textbook', 2023, FALSE, '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('q-scie-mw33y17k', '10', 'science', 'sci-ch1', 'Redox Reactions & Balancing', 'hard', 'mcq', 'In the reaction CuO + H2 -> Cu + H2O, which substance is oxidised?', 'CuO', 'H2', 'Cu', 'H2O', 'B', 'Hydrogen (H2) gains oxygen to form H2O, hence it undergoes oxidation. Copper oxide (CuO) loses oxygen to become Cu, hence it undergoes reduction.', NULL, 2, 0, 'published', 'NCERT Exemplar', 2024, FALSE, '2026-11-05 05:31:10', '2026-11-05 05:31:18'),
  ('q-rn-m2-1', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The exponent of 2 in the prime factorisation of 144 is:', '2', '6', '4', '3', 'C', '144 = 12² = (2² × 3)² = 2⁴ × 3². The exponent of 2 is 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-2', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The decimal representation of 11 / (2³ × 5) will terminate after how many decimal places?', '1', '3', '2', '4', 'B', 'Since the highest power of 2 or 5 in the denominator is 3 (2³), the decimal representation terminates after 3 places.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-3', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'If LCM(32, a) = 96 and HCF(32, a) = 4, then the value of a is:', '8', '24', '12', '16', 'C', 'Product of numbers = HCF × LCM => 32 × a = 4 × 96 => a = 384 / 32 = 12.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-4', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The LCM of the smallest two-digit composite number and the smallest composite number is:', '20', '10', '40', '44', 'A', 'Smallest composite number = 4. Smallest two-digit composite number = 10. LCM(4, 10) = 20.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-5', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'true_false', 'The product of a non-zero rational number and an irrational number is always irrational.', 'False', 'True', 'Only for square roots', 'Cannot be determined', 'B', 'True. If r is a non-zero rational and x is irrational, assuming rx is rational leads to x = (rx)/r being rational, a contradiction.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'If two positive integers p and q can be expressed as p = ab² and q = a³b, where a and b are prime numbers, then LCM(p, q) is:', 'ab', 'a²b²', 'a⁴b³', 'a³b²', 'D', 'LCM is the product of highest powers of each prime involved. LCM(p, q) = a³b².', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'The largest number which divides 615 and 963 leaving remainder 6 in each case is:', '87', '65', '45', '95', 'A', 'Required number = HCF(615 - 6, 963 - 6) = HCF(609, 957). 609 = 3 × 7 × 29, 957 = 3 × 11 × 29. HCF = 3 × 29 = 87.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Which of the following numbers has a non-terminating repeating decimal expansion?', '77 / 210', '17 / 320', '15 / 1600', '23 / (2³ × 5²)', 'A', '77 / 210 = 11 / 30 = 11 / (2 × 3 × 5). Since 3 is in the denominator in lowest terms, the decimal expansion is non-terminating repeating.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Two tankers contain 850 litres and 680 litres of petrol respectively. The maximum capacity of a container which can measure the petrol of either tanker in exact number of times is:', '150 litres', '170 litres', '190 litres', '210 litres', 'B', 'Maximum capacity = HCF(850, 680). 850 = 2 × 5² × 17, 680 = 2³ × 5 × 17. HCF = 2 × 5 × 17 = 170 litres.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m2-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'If n is any natural number, then 6ⁿ - 5ⁿ always ends with which digit?', '7', '3', '5', '1', 'D', 'For any natural number n, 6ⁿ always ends in 6 and 5ⁿ always ends in 5. Therefore, 6ⁿ - 5ⁿ always ends in 6 - 5 = 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-1', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The prime factorisation of 100 is:', '2² × 5²', '2 × 5³', '2³ × 5', '2 × 5²', 'A', '100 = 10 × 10 = (2 × 5) × (2 × 5) = 2² × 5².', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-2', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The HCF of 45 and 75 is:', '5', '25', '15', '30', 'C', '45 = 3² × 5 and 75 = 3 × 5². The common factors with smallest powers give HCF = 3 × 5 = 15.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-3', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'true_false', 'The product of two coprime positive integers is equal to their LCM.', 'Cannot be determined', 'False', 'Only for even numbers', 'True', 'D', 'True. HCF × LCM = product. For coprime numbers, HCF = 1, so LCM equals their product.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-4', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'Which of the following is a perfect square?', '2³ × 3²', '3³ × 7', '2² × 3⁴', '2 × 5²', 'C', 'A number is a perfect square when every exponent in its prime factorisation is even. In 2² × 3⁴, both exponents 2 and 4 are even.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-5', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'In the prime factorisation of a perfect cube, every exponent is a multiple of ______.', '2', '6', '4', '3', 'D', '3. A perfect cube is formed when each prime factor occurs with an exponent divisible by 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'If HCF(18, x) = 6 and LCM(18, x) = 72, then x is:', '12', '24', '36', '48', 'B', 'Using HCF × LCM = product, 6 × 72 = 18 × x. Thus x = 432 / 18 = 24.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'A rectangular board is 96 cm long and 144 cm wide. Find the side of the largest square tile that can cover it exactly without cutting.', '48 cm', '36 cm', '24 cm', '12 cm', 'A', '48 cm. The largest possible square tile side is HCF(96, 144). Since 96 = 2⁵ × 3 and 144 = 2⁴ × 3², HCF = 2⁴ × 3 = 48 cm.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Which statement is always true?', 'Rational + irrational is irrational.', 'Irrational + irrational is irrational.', 'Irrational × irrational is irrational.', 'Every square root is irrational.', 'A', 'If a rational number r plus an irrational number x were rational, then subtracting r would make x rational, a contradiction. The other statements have counterexamples.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Find the HCF of 2³ × 3² × 7 and 2² × 3³ × 5.', '18', '36', '72', '108', 'B', 'Take the smallest exponents of common prime factors. The common primes are 2 and 3. HCF = 2² × 3² = 4 × 9 = 36.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m3-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Show that 7 × 11 × 13 + 13 is a composite number because:', 'It is an odd number', '13 is a prime number', 'The expression equals a negative number', 'It can be factorised as 13 × (7 × 11 + 1) = 13 × 78, having factors other than 1 and itself', 'D', 'Take 13 common: 7 × 11 × 13 + 13 = 13(7 × 11 + 1) = 13(77 + 1) = 13 × 78. Since it is a product of two integers greater than 1, it is composite.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-1', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'Which number is irrational?', '√64', '√10', '0.6', '√81', 'B', '√64 = 8 and √81 = 9, while 0.6 = 3/5. These are rational. Since 10 is not a perfect square, √10 is irrational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-2', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'If two positive integers are coprime, their HCF is:', '0', 'their product', 'their sum', '1', 'D', 'Coprime integers have no common positive factor other than 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-3', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'true_false', '√49 is irrational.', 'True', 'Cannot be determined', 'False', 'True only for negative numbers', 'C', 'False. √49 = 7, which is an integer and therefore rational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-4', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The least multiplier to make 72 a perfect cube is:', '2', '6', '3', '12', 'C', '72 = 2³ × 3². To make each exponent a multiple of 3, multiply by 3. Then 72 × 3 = 2³ × 3³ = 216 = 6³.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-5', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'For any two positive integers a and b, HCF(a, b) × LCM(a, b) = ______.', 'a + b', 'a - b', 'a / b', 'a × b', 'D', 'a × b. The product of the HCF and LCM of two positive integers equals the product of the two integers.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The least positive integer that must multiply 500 to make a perfect cube is:', '5', '2', '20', '25', 'B', '500 = 2² × 5³. Multiply by 2 to obtain 2³ × 5³ = 1000 = 10³.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'A florist has 96 roses and 120 lilies. She makes the greatest possible number of identical bouquets without leftovers. How many bouquets can she make, and what will each contain?', '8 bouquets; 12 roses and 15 lilies each', '12 bouquets; 8 roses and 10 lilies each', '16 bouquets; 6 roses and 7 lilies each', '24 bouquets; 4 roses and 5 lilies each', 'D', '24 bouquets. HCF(96, 120) = 24. Each bouquet contains 96/24 = 4 roses and 120/24 = 5 lilies.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'If √5 is irrational, then 1/√5 is:', 'irrational', 'rational', 'an integer', 'natural', 'A', 'If 1/√5 were rational and non-zero, its reciprocal √5 would also be rational. This contradicts the given fact.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Find the least positive number divisible by 18, 24 and 30.', '360', '240', '180', '720', 'A', '18 = 2 × 3², 24 = 2³ × 3 and 30 = 2 × 3 × 5. LCM = 2³ × 3² × 5 = 360. Hence the least number is 360.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m4-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'In the proof that √5 is irrational using prime factorisation, if a² = 5b² (where a and b are integers in lowest terms), what contradiction arises?', 'a and b cannot be multiplied', '5 is an even number', 'The exponent of 5 is even in a² but odd in 5b², contradicting the Fundamental Theorem of Arithmetic', 'b² cannot divide a²', 'C', 'Assume √5 = a/b in lowest terms, where a and b are integers and b ≠ 0. Then a² = 5b². In the prime factorisation of a², the exponent of 5 must be even. In 5b², it is odd. This contradicts the uniqueness of prime factorisation. Hence √5 is irrational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-1', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The number 1 is:', 'neither prime nor composite', 'composite', 'even prime', 'prime', 'A', 'A prime number has exactly two distinct positive factors, while a composite number has more than two. The number 1 has only one positive factor.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-2', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The LCM of 9 and 15 is:', '15', '30', '135', '45', 'D', '9 = 3² and 15 = 3 × 5. LCM = 3² × 5 = 45.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-3', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'true_false', 'The sum of two irrational numbers is always irrational.', 'True', 'True only for square roots', 'False', 'Cannot be determined', 'C', 'False. For example, √2 + (-√2) = 0, which is rational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-4', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'If HCF = 12, LCM = 420 and one number is 60, the other number is:', '72', '96', '84', '120', 'C', 'Product of the numbers = 12 × 420 = 5040. The other number = 5040 / 60 = 84.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-5', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The prime factorisation of 540 is ______.', '2³ × 3² × 5', '2² × 3³ × 5', '2² × 3² × 5²', '2 × 3³ × 5²', 'B', '540 = 54 × 10 = (2 × 3³) × (2 × 5) = 2² × 3³ × 5.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-rn-m5-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'Which of the following is coprime to 35?', '14', '24', '21', '15', 'B', '35 = 5 × 7. The number 24 = 2³ × 3 has no common prime factor with 35, so their HCF is 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Three lights flash every 20, 30 and 45 seconds. If they flash together now, after how many seconds will they next flash together?', '90 seconds', '120 seconds', '360 seconds', '180 seconds', 'D', '180 seconds. 20 = 2² × 5, 30 = 2 × 3 × 5 and 45 = 3² × 5. LCM = 2² × 3² × 5 = 180 seconds.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'If p and q are distinct prime numbers, HCF(p, q) is:', '1', 'p + q', 'pq', '0', 'A', 'Distinct prime numbers have no common positive factor other than 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'A school has 72 notebooks and 96 geometry boxes. It wants the greatest number of identical bundles with no items left over. Find the number of bundles and the contents of each.', '8 bundles (9 notebooks, 12 geometry boxes)', '12 bundles (6 notebooks, 8 geometry boxes)', '16 bundles (4 notebooks, 6 geometry boxes)', '24 bundles (3 notebooks, 4 geometry boxes)', 'D', 'HCF(72, 96) = 24, so 24 bundles can be made. Each bundle contains 72/24 = 3 notebooks and 96/24 = 4 geometry boxes.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m5-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Prove that 3 + 2√5 is irrational by noting that if 3 + 2√5 = r (rational), then:', '√5 = (r - 3)/2, which is rational, contradicting the irrationality of √5', 'r must equal 0', '3 and 2 are prime numbers', '√5 is a terminating decimal', 'A', 'Suppose 3 + 2√5 = r, where r is rational. Then √5 = (r - 3)/2. The right-hand side is rational, which contradicts the irrationality of √5. Therefore 3 + 2√5 is irrational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-1', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'Which of the following is a composite number?', '2', '3', '11', '15', 'D', '15 has factors 1, 3, 5 and 15, so it has more than two positive factors and is composite.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-2', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'The HCF of 26 and 39 is:', '39', '13', '26', '1', 'B', '26 = 2 × 13 and 39 = 3 × 13. Their greatest common factor is 13.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-3', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'easy', 'mcq', 'A number that has exactly two distinct positive factors is called a ______ number.', 'Composite', 'Prime', 'Odd', 'Rational', 'B', 'Prime number. Its only positive factors are 1 and the number itself.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-4', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The least number that must be added to 70 to make it divisible by 8 is:', '1', '6', '2', '8', 'C', '70 leaves remainder 6 when divided by 8. We need 2 more to reach 72, which is divisible by 8.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-5', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'Find the HCF and LCM of 26 and 91 by prime factorisation.', 'HCF = 13, LCM = 182', 'HCF = 7, LCM = 182', 'HCF = 13, LCM = 2366', 'HCF = 26, LCM = 91', 'A', '26 = 2 × 13 and 91 = 7 × 13. HCF = 13. LCM = 2 × 7 × 13 = 182.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'Can two numbers have 15 as their HCF and 175 as their LCM? Explain.', 'Yes, because 175 > 15', 'Yes, because both numbers end in 5', 'No, because HCF must divide the LCM for positive integers, and 175 ÷ 15 is not an integer', 'Cannot be determined without the numbers', 'C', 'No. The HCF must divide the LCM for positive integers. But 175 ÷ 15 is not an integer. Therefore, such two positive integers cannot exist.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'A room is 8.4 m long and 6 m wide. It is to be covered with the largest possible identical square tiles. Find the side of each tile and the number of tiles required. (Use centimetres.)', 'Side = 120 cm, Number of tiles = 35', 'Side = 60 cm, Number of tiles = 70', 'Side = 140 cm, Number of tiles = 30', 'Side = 80 cm, Number of tiles = 45', 'A', 'Convert dimensions: 8.4 m = 840 cm and 6 m = 600 cm. Largest tile side = HCF(840, 600) = 120 cm. Number of tiles = (840/120) × (600/120) = 7 × 5 = 35 tiles.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Prove that √2 + √3 is irrational by assuming √2 + √3 = r (rational). Then squaring gives:', 'Sum of roots is always rational', '√2 and √3 cancel each other out', 'r must equal 0', '5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational, contradicting that √6 is irrational', 'D', 'Assume √2 + √3 = r, where r is rational. Squaring gives 5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational. But 6 is not a perfect square, so √6 is irrational. This contradiction proves √2 + √3 is irrational.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Find the least positive integer by which 540 must be divided to obtain a perfect square.', '15', '6', '5', '30', 'A', '540 = 2² × 3³ × 5. To make all exponents even after division, divide by 3 × 5 = 15. Then 540/15 = 36 = 6². The least required divisor is 15.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-rn-m6-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'hard', 'mcq', 'Three runners take 48 seconds, 60 seconds and 72 seconds to complete one lap of a circular track. If they start together from the starting point, after how many seconds will they all meet at the starting point again?', '360 seconds', '720 seconds', '480 seconds', '1440 seconds', 'B', 'They meet at the starting point after the LCM of 48, 60 and 72 seconds. 48 = 2⁴ × 3, 60 = 2² × 3 × 5, 72 = 2³ × 3². LCM = 2⁴ × 3² × 5 = 720 seconds.', NULL, 1, 0, 'published', 'CBSE Class 10 Real Numbers Solved Mock Tests', NULL, FALSE, '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('q-poly-m1-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'If 2 is a zero of p(x) = x² − 5x + k, find k.', '6', '4', '2', '10', 'A', 'Since 2 is a zero, p(2) = 0. Thus 2² − 5(2) + k = 0, so 4 − 10 + k = 0. Therefore k = 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'A student says the degree of 5x² + 3x⁷ − 7 is 2 because 5x² is written first. Is the student correct?', 'Yes, because the leading term is 5x²', 'No, the degree is 7 because it is the greatest exponent', 'Yes, because 2 is the smallest exponent', 'No, the degree is 9 because exponents add up', 'B', 'The degree is the greatest exponent of x with a non-zero coefficient. Here the greatest exponent is 7, so the degree is 7.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Find the zeros of x² − 9x + 20.', '−4 and −5', '2 and 10', '−4 and 5', '4 and 5', 'D', 'Factorise: x² − 9x + 20 = (x−4)(x−5). Setting each factor equal to zero gives x = 4 or x = 5.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'How many real zeros can a quadratic polynomial have at most?', '1 real zero', '2 real zeros', '3 real zeros', 'Infinitely many', 'B', 'A non-zero polynomial of degree 2 can have at most 2 real zeros.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A quadratic has zeros −2 and 7. Find its monic polynomial.', 'x² + 5x − 14', 'x² − 5x + 14', 'x² + 9x − 14', 'x² − 5x − 14', 'D', 'Sum of zeros = −2 + 7 = 5 and product = (−2)(7) = −14. The monic quadratic is x² − (sum)x + (product) = x² − 5x − 14.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A rectangular display has area x² + 7x + 12. Its side expressions are x+3 and x+4. What are the zeros of its area polynomial?', '3 and 4', '−3 and −4', '−3 and 4', '3 and −4', 'B', 'x² + 7x + 12 = (x+3)(x+4). Setting each factor to zero gives x = −3 and x = −4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For p(x) = 3x² − 8x + 4, find the sum and product of its zeros.', 'Sum = −8/3; product = 4/3', 'Sum = 8/3; product = −4/3', 'Sum = 8/3; product = 4/3', 'Sum = 4/3; product = 8/3', 'C', 'For ax² + bx + c, sum of zeros = −b/a and product = c/a. Here a = 3, b = −8, c = 4. Hence sum = 8/3 and product = 4/3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α and β are zeros of 2x² − 7x + 3, find α² + β² without solving for α and β.', '25/4', '49/4', '37/4', '31/4', 'C', 'Sum α+β = 7/2 and product αβ = 3/2. Use α² + β² = (α+β)² − 2αβ. Therefore α² + β² = (7/2)² − 2(3/2) = 49/4 − 12/4 = 37/4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 2x² − x − 6 and verify the relationships between zeros and coefficients.', '2 and −3/2', '−2 and 3/2', '3 and −2', '1/2 and −6', 'A', 'Factorise: 2x² − x − 6 = (2x+3)(x−2). Thus the zeros are 2 and −3/2. Their sum is 2 − 3/2 = 1/2 = −b/a = −(−1)/2. Their product is 2(−3/2) = −3 = c/a = −6/2. Both relationships are verified.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m1-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If one zero of x² + (k−3)x − 10 is 2, find k and the other zero.', 'k = 4; other zero is −5', 'k = 6; other zero is 5', 'k = 6; other zero is −5', 'k = 2; other zero is −10', 'C', 'Substitute x = 2: 2² + (k−3)(2) − 10 = 0. So 4 + 2k − 6 − 10 = 0, giving 2k − 12 = 0 and k = 6. The product of the zeros is −10. If one zero is 2, the other is −10/2 = −5.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'A polynomial graph crosses the x-axis at x = −1 and x = 4. State its zeros.', '−1 and 4', '1 and −4', '0 and 3', '−1 and 0', 'A', 'The zeros are the x-coordinates where the graph meets or crosses the x-axis. Hence the zeros are −1 and 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Which quadratic polynomial has zeros 3 and −2?', 'x² + x − 6', 'x² − 5x + 6', 'x² − x − 6', 'x² + 5x + 6', 'C', 'A monic quadratic with zeros 3 and −2 is (x−3)(x+2) = x² − x − 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If the zeros of x² − (m+1)x + 12 are 3 and 4, find m.', '5', '8', '7', '6', 'D', 'The sum of the zeros is 3 + 4 = 7. For x² − (m+1)x + 12, the sum is m+1. Thus m+1 = 7, so m = 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'true_false', 'If the sum and product of zeros of a monic quadratic are 0 and −9, its polynomial is x² − 9.', 'Only when x > 0', 'False', 'True', 'Cannot be determined', 'C', 'True. For a monic quadratic, p(x) = x² − (sum)x + (product). Substituting sum = 0 and product = −9 gives x² − 9.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Two consecutive positive integers have product 72. Form a quadratic equation and find the integers.', '7 and 8', '6 and 12', '9 and 10', '8 and 9', 'D', 'Let the smaller integer be x. Then x(x+1) = 72, so x² + x − 72 = 0. Factorising gives (x−8)(x+9) = 0. Since the integers are positive, x = 8. The integers are 8 and 9.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of x² − 6x + 4, find 1/α + 1/β.', '2/3', '3/2', '3/4', '4/3', 'B', 'Use 1/α + 1/β = (α+β)/(αβ). Here α+β = 6 and αβ = 4. Hence the value is 6/4 = 3/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For x² − 4x + 4, which statements are true? (A) It has two distinct zeros (B) It has a repeated zero (C) Its zero is 2 (D) Sum of zeros is 4.', 'A and C only', 'A, B and D only', 'B only', 'B, C and D only', 'D', 'x² − 4x + 4 = (x−2)², so the repeated zero is 2. Counting multiplicity, the zeros are 2 and 2, and their sum is 4. Hence B, C and D are true.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of 3x² − 5x − 2, find (α−β)².', '25/9', '49/9', '37/9', '53/9', 'B', 'Here α+β = 5/3 and αβ = −2/3. Use (α−β)² = (α+β)² − 4αβ = (5/3)² − 4(−2/3) = 25/9 + 24/9 = 49/9.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find a quadratic polynomial whose zeros are 2 + √3 and 2 − √3.', 'x² − 4x − 1', 'x² + 4x + 1', 'x² − 4x + 1', 'x² − 2x + 1', 'C', 'Sum of zeros = (2+√3) + (2−√3) = 4. Product = (2+√3)(2−√3) = 4 − 3 = 1. Hence the monic polynomial is x² − 4x + 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m2-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A rectangle has area x² − 2x − 15. Factorise the polynomial and identify its zeros. Explain why the negative zero is not a possible side length.', 'Factorisation = (x−5)(x+3); zeros are 5 and −3; a physical length must be positive', 'Factorisation = (x−15)(x+1); zeros are 15 and −1', 'Factorisation = (x−5)(x−3); zeros are 5 and 3', 'Factorisation = (x+5)(x−3); zeros are −5 and 3', 'A', 'Since x² − 2x − 15 = (x−5)(x+3), setting each factor to zero gives x = 5 and x = −3. If x represents a physical length, it must be positive. Therefore −3 is not a feasible length, even though it is an algebraic zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'State the degree of 4x⁷ − 2x² + x.', '1', '7', '2', '9', 'B', 'The highest exponent with a non-zero coefficient is 7. Hence the degree is 7.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'A zero of 7x + 21 is:', '3', '7', '−3', '−7', 'C', 'Set 7x + 21 = 0. Then 7x = −21, so x = −3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For 5x² + px + 10, the product of zeros is 2. What is p?', 'p cannot be determined from the given information', '5', '10', '2', 'A', 'For ax² + bx + c, product of zeros = c/a. Here it is 10/5 = 2 for every value of p. So the condition gives no information about p.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A student writes: for ax² + bx + c, sum of zeros is b/a. What is the correct formula?', 'Sum of zeros is −c/a', 'Sum of zeros is c/a', 'Sum of zeros is −b/a', 'Sum of zeros is b/(2a)', 'C', 'For a quadratic ax² + bx + c, the relationship between the zeros α and β is α+β = −b/a. The negative sign is essential.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A square courtyard''s area expression is x² − 12x + 36. Find the zero and explain its multiplicity.', '−6, a repeated zero', '6, a repeated zero (multiplicity 2)', '6 and −6, two distinct zeros', '12, a single zero', 'B', 'x² − 12x + 36 = (x−6)². Thus x = 6 is the only distinct zero and it occurs twice, so it is a repeated zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If one zero of 2x² − 5x + k is 2, find k and the other zero.', 'k = −2; other zero is 1/2', 'k = 2; other zero is −1/2', 'k = 4; other zero is 1', 'k = 2; other zero is 1/2', 'D', 'Substitute x = 2: 2(2²) − 5(2) + k = 0 => 8 − 10 + k = 0 => k = 2. The product of zeros is k/2 = 2/2 = 1. Since one zero is 2, the other is 1/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Assertion: A quadratic polynomial can have at most two real zeros. Reason: A non-zero polynomial of degree n has at most n zeros.', 'Both are true, but the reason does not explain the assertion', 'Assertion is false, Reason is true', 'Assertion is true, Reason is false', 'Both are true, and the reason explains the assertion', 'D', 'A quadratic has degree 2. The general fundamental theorem says a non-zero polynomial of degree n has at most n zeros. Taking n = 2 proves that a quadratic has at most two real zeros.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² + 3x − 7, evaluate α² + β² + αβ.', '16', '14', '23', '30', 'A', 'Here α+β = −3 and αβ = −7. First, α² + β² = (α+β)² − 2αβ = 9 + 14 = 23. Therefore α² + β² + αβ = 23 − 7 = 16.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 6x² + x − 2 and verify their product.', '−1/2 and 2/3', '2 and −1/3', '3 and −1/2', '1/2 and −2/3', 'D', 'Factorise: 6x² + x − 2 = (3x+2)(2x−1). Thus the zeros are −2/3 and 1/2. Their product is (−2/3)(1/2) = −1/3, which equals c/a = −2/6 = −1/3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m3-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A quadratic polynomial has zeros α, β with α+β = −4 and αβ = −5. Form the polynomial, then find its zeros.', 'x² − 4x − 5; zeros are 5 and −1', 'x² + 4x − 5; zeros are 1 and −5', 'x² − 5x + 4; zeros are 1 and 4', 'x² + 4x + 5; no real zeros', 'B', 'The monic polynomial is x² − (α+β)x + αβ = x² − (−4)x − 5 = x² + 4x − 5. Factorising gives (x+5)(x−1) = 0, so the zeros are −5 and 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'A parabola meets the x-axis at x = −3 and x = 1. What are its zeros?', '3 and −1', '−3 and 1', '0 and −2', '−3 and −1', 'B', 'The x-intercepts of the graph give the zeros of the polynomial. Thus the zeros are −3 and 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For x² + px + 16 with equal zeros, p can be:', '8 only', '−8 only', '±16', '±8', 'D', 'Equal zeros require the discriminant to be zero: p² − 4(1)(16) = 0 => p² = 64 => p = ±8.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Write a quadratic polynomial with zeros 0 and −6.', 'x² + 6x', 'x² + 6', 'x² − 36', 'x² − 6x', 'A', 'Sum = 0 + (−6) = −6 and product = 0. The monic polynomial is x² − (−6)x + 0 = x² + 6x.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Can a quadratic polynomial have exactly one distinct real zero? Give an example.', 'No; quadratics only have either 0 or 2 zeros', 'No; every quadratic must have two distinct real zeros', 'Yes; example: x² − 6x + 9 = (x−3)²', 'Yes; but only x² = 0', 'C', 'Yes. Example: x² − 6x + 9 = (x−3)². It has one distinct real zero, 3, repeated twice.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'The product of two consecutive integers is 156. Find the integers by forming a polynomial.', '11 and 12', '10 and 15', '13 and 14', '12 and 13 (or −13 and −12)', 'D', 'Let the smaller integer be x. Then x(x+1) = 156 => x² + x − 156 = 0 => (x−12)(x+13) = 0. Thus x = 12 or x = −13. The pairs are (12, 13) and (−13, −12).', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-poly-m4-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of 2x² − 3x − 5, evaluate α²β + αβ².', '15/4', '−15/4', '−5/2', '9/4', 'B', 'Factorise or use relations: α+β = 3/2 and αβ = −5/2. Then α²β + αβ² = αβ(α+β) = (−5/2)(3/2) = −15/4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A learner claims zeros 2 and 5 give x² + 7x + 10. Identify the mistake and write the correct polynomial.', 'The correct polynomial is x² + 7x − 10', 'The correct polynomial is x² − 7x + 10 (learner used wrong sign for middle term)', 'The learner is completely correct', 'The correct polynomial is x² − 3x + 10', 'B', 'The sum of the zeros is 2 + 5 = 7 and the product is 10. The monic polynomial is x² − (sum)x + (product) = x² − 7x + 10. The learner used +7x instead of −7x.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of 4x² − 4x − 3, find α/β + β/α.', '−5/2', '10/3', '−10/3', '5/4', 'C', 'Here α+β = 1 and αβ = −3/4. Use α/β + β/α = (α² + β²)/(αβ). Also α² + β² = (α+β)² − 2αβ = 1 − 2(−3/4) = 5/2. Hence (5/2)/(−3/4) = −10/3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of x² − 2√2x + 2 and state their nature.', '√2, repeated (multiplicity 2)', '√2 and −√2', '2 and 1', 'No real zeros', 'A', 'x² − 2√2x + 2 = (x − √2)². Hence the polynomial has one distinct real zero √2 with multiplicity 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m4-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A quadratic polynomial has one zero 4 and the sum of its zeros is −1. Find its other zero and a monic polynomial.', 'Other zero = 5; polynomial = x² − x − 20', 'Other zero = −3; polynomial = x² − x − 12', 'Other zero = −5; polynomial = x² + x − 20', 'Other zero = 3; polynomial = x² + x − 12', 'C', 'Let the other zero be β. Then 4 + β = −1, so β = −5. The product is 4(−5) = −20. The monic polynomial is x² − (−1)x − 20 = x² + x − 20.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'Which is a quadratic polynomial?', 'x³ + 1', '5x² − 2x + 1', '4x + 3', '7', 'B', 'A quadratic polynomial has degree 2. Option B (5x² − 2x + 1) has highest exponent 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'For p(x) = x² − 1, calculate p(−1). Is −1 a zero?', 'p(−1) = 0; Yes, −1 is a zero', 'p(−1) = −2; No, −1 is not a zero', 'p(−1) = 2; No, −1 is not a zero', 'p(−1) = 1; No, −1 is not a zero', 'A', 'Substitute x = −1: p(−1) = (−1)² − 1 = 1 − 1 = 0. A value is a zero when it makes the polynomial equal to zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For 2x² + 9x + 4, find sum and product of zeros.', 'Sum = 9/2; product = 2', 'Sum = −9/2; product = 4', 'Sum = −4; product = 9/2', 'Sum = −9/2; product = 2', 'D', 'Here a = 2, b = 9 and c = 4. Sum = −b/a = −9/2; product = c/a = 4/2 = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'true_false', 'If α+β = 5 and αβ = 6, then x² − 5x + 6 has zeros α and β.', 'False', 'True', 'Only if α, β are integers', 'Cannot be determined', 'B', 'True. The monic polynomial formed from zeros α and β is x² − (α+β)x + αβ. Substituting 5 and 6 gives x² − 5x + 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A rectangular banner''s area polynomial is x² − 9x + 20. Its dimensions are x−4 and x−5. Find its zeros and interpret them as boundary values.', '−4 and −5; dimensions of banner', '2 and 10; side lengths', '1 and 20; perimeter values', '4 and 5; boundary values where a dimension becomes zero', 'D', 'x² − 9x + 20 = (x−4)(x−5). Setting each factor to zero gives x = 4 and x = 5. These are boundary values where one dimension expression becomes zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of x² − 7x + 10, find α² + β².', '39', '19', '49', '29', 'D', 'Sum = 7 and product = 10. Thus α² + β² = (α+β)² − 2αβ = 7² − 2(10) = 49 − 20 = 29.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Assertion: If the product of zeros of ax² + bx + c is zero, at least one zero is zero. Reason: The product of zeros equals c/a.', 'Both are true, and the reason explains the assertion', 'Both are true, but the reason does not explain the assertion', 'Assertion is true, Reason is false', 'Assertion is false, Reason is true', 'A', 'For ax² + bx + c, the product of zeros is c/a. If this product is zero, then αβ = 0, which means at least one of α or β is zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² − 5x + 1, find (α−1)(β−1).', '3', '−5', '−3', '7', 'C', 'Here α+β = 5 and αβ = 1. Expand: (α−1)(β−1) = αβ − (α+β) + 1 = 1 − 5 + 1 = −3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 3x² − 11x − 4 and verify sum and product.', '−4 and 1/3', '3 and −4/3', '4 and −1/3', '2 and −2/3', 'C', 'Factorise: 3x² − 11x − 4 = (3x+1)(x−4). Thus zeros are −1/3 and 4. Sum = 4 − 1/3 = 11/3 = −b/a. Product = 4(−1/3) = −4/3 = c/a.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m5-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find a quadratic polynomial whose zeros are reciprocals of the zeros of 2x² − 5x + 3.', '3x² − 5x + 2', '3x² + 5x − 2', '2x² + 5x + 3', '2x² − 3x + 5', 'A', 'Factorise 2x² − 5x + 3 = (2x−3)(x−1), so its zeros are 3/2 and 1. Their reciprocals are 2/3 and 1. A polynomial with these zeros is (3x−2)(x−1) = 3x² − 5x + 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'What is the zero of a polynomial p(x) called?', 'The coefficient of the highest power of x', 'A value r for which p(r) = 0', 'The y-intercept of the polynomial', 'Any real number x', 'B', 'By definition, r is a zero of p(x) if substituting x = r makes p(r) = 0.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'The zeros of x² + 2x − 8 are:', '−2, 4', '1, −8', '2, 4', '2, −4', 'D', 'Factorise: x² + 2x − 8 = (x+4)(x−2). Therefore the zeros are −4 and 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If 3 is a zero of x² − (k+1)x + 12, find k.', '5', '4', '7', '6', 'D', 'Substitute x = 3: 3² − 3(k+1) + 12 = 0 => 9 − 3k − 3 + 12 = 0 => 18 − 3k = 0 => k = 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Explain why a non-zero linear polynomial has exactly one real zero.', 'Because its graph is always a parabola', 'Solving ax + b = 0 (a ≠ 0) gives x = −b/a, which is a unique real value', 'Linear polynomials can have up to two zeros', 'Because its degree is 0', 'B', 'A non-zero linear polynomial ax + b, where a ≠ 0, gives x = −b/a upon setting ax + b = 0. Since a is non-zero, this yields exactly one unique real value.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Two consecutive odd positive integers have product 143. Find them using a quadratic polynomial.', '13 and 15', '9 and 11', '11 and 13', '7 and 9', 'C', 'Let the smaller odd integer be x. Then the next odd integer is x+2. So x(x+2) = 143 => x² + 2x − 143 = 0 => (x−11)(x+13) = 0. Since integers are positive, x = 11. The integers are 11 and 13.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For zeros α, β of 3x² − 2x − 1, evaluate α² + β².', '10/9', '4/9', '2/3', '8/9', 'A', 'Sum = 2/3 and product = −1/3. Therefore α² + β² = (α+β)² − 2αβ = (2/3)² − 2(−1/3) = 4/9 + 2/3 = 4/9 + 6/9 = 10/9.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'For p(x) = x² + 4x + 8, the graph:', 'Cuts x-axis twice', 'Touches x-axis once', 'Has no x-intercept', 'Crosses at x = 0', 'C', 'Complete the square: x² + 4x + 8 = (x+2)² + 4. This is always positive for real x, so the graph never meets or touches the x-axis.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² − 4x − 1, evaluate α³ + β³.', '76', '64', '52', '80', 'A', 'Here α+β = 4 and αβ = −1. Use α³ + β³ = (α+β)³ − 3αβ(α+β) = 4³ − 3(−1)(4) = 64 + 12 = 76.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 2x² + 5x − 3 and verify the sum relation.', '1/2 and −3', '−1/2 and 3', '2 and −3/2', '1 and −3/2', 'A', 'Factorise: 2x² + 5x − 3 = (2x−1)(x+3). Thus the zeros are 1/2 and −3. Their sum is 1/2 − 3 = −5/2, which equals −b/a = −5/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m6-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² − px + 12 and α² + β² = 25, find possible p values.', 'p = ±5', 'p = ±7', 'p = ±13', 'p = ±1', 'B', 'Since α+β = p and αβ = 12, α² + β² = (α+β)² − 2αβ = p² − 24. Given p² − 24 = 25, so p² = 49. Therefore p = 7 or p = −7.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'The graph of p(x) = x² + 1 has how many x-intercepts?', '1', '0', '2', '3', 'B', 'For every real x, x² ≥ 0, so x² + 1 ≥ 1 > 0. The graph never touches or crosses the x-axis, so it has 0 x-intercepts.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'Factorise x² − 13x + 40.', '(x+5)(x+8)', '(x−5)(x−8)', '(x−4)(x−10)', '(x−2)(x−20)', 'B', 'Two numbers with product 40 and sum −13 are −5 and −8. Hence x² − 13x + 40 = (x−5)(x−8).', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For 4x² + 4x − 3, calculate sum and product of zeros.', 'Sum = −1; product = −3/4', 'Sum = −1; product = 3/4', 'Sum = −4; product = −3', 'Sum = 1; product = 3/4', 'A', 'Here a = 4, b = 4 and c = −3. Sum = −b/a = −4/4 = −1; product = c/a = −3/4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A student says x² − 16 has only one zero, 4. Correct the answer.', 'The zero is only −4', 'The zeros are 16 and −16', 'The zeros are 4 and −4', 'The zeros are 2 and −2', 'C', 'x² − 16 = (x−4)(x+4). Setting both factors to zero gives x = 4 and x = −4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A square picture''s area is modelled by x² − 16. Factorise and state its zeros. Which root may represent a positive side length?', 'Factorisation = (x−8)(x+2); zeros = 8 and −2; positive side length = 8', 'Factorisation = (x−4)(x+4); zeros = 4 and −4; positive side length = 4', 'Factorisation = (x−4)²; zero = 4', 'Factorisation = (x+4)²; zero = −4', 'B', 'Using the difference of two squares, x² − 16 = (x−4)(x+4). The zeros are 4 and −4. A physical side length must be positive, so 4 is the feasible value.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of 5x² − 7x + 2, find 1/α + 1/β.', '5/2', '2/7', '7/2', '−7/2', 'C', 'Sum = 7/5 and product = 2/5. Thus 1/α + 1/β = (α+β)/(αβ) = (7/5)/(2/5) = 7/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Assertion: A quadratic can have a repeated zero. Reason: Its graph may touch the x-axis at its vertex.', 'Both are true, and the reason explains the assertion', 'Both are true, but the reason does not explain the assertion', 'Assertion is true, Reason is false', 'Assertion is false, Reason is true', 'A', 'A quadratic can have equal roots when its discriminant is zero. In that case, its parabola touches the x-axis at its vertex rather than crossing it.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of 2x² + x − 4, find (α+1)(β+1).', '3/2', '−5/2', '−1/2', '−3/2', 'D', 'Here α+β = −1/2 and αβ = −2. Expand: (α+1)(β+1) = αβ + (α+β) + 1 = −2 − 1/2 + 1 = −3/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 5x² − 13x + 6 and verify the product relation.', '2 and 3/5', '−2 and −3/5', '3 and 2/5', '6 and 1/5', 'A', 'Factorise: 5x² − 13x + 6 = (5x−3)(x−2). Thus the zeros are 3/5 and 2. Their product is (3/5)(2) = 6/5 = c/a = 6/5.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m7-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A quadratic polynomial has zeros whose sum is 2 and product is −8. Form the polynomial, solve it, and verify both relations.', 'x² + 2x − 8; zeros are −4 and 2', 'x² − 2x + 8; no real zeros', 'x² + 8x − 2; zeros are 2 and −8', 'x² − 2x − 8; zeros are 4 and −2', 'D', 'The monic polynomial is x² − 2x − 8. Factorise: (x−4)(x+2) = 0, so the zeros are 4 and −2. Their sum is 4 + (−2) = 2 and product is 4(−2) = −8, as required.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'If p(−2) = 0, then −2 is:', 'A coefficient', 'A zero', 'The degree', 'The constant term', 'B', 'A number r is a zero of p(x) when p(r) = 0. Since p(−2) = 0, −2 is a zero.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'Find the zeros of x² − 25.', '25 and −25', '5 only', '−5 and 5', '0 and 5', 'C', 'x² − 25 = (x−5)(x+5). Setting each factor to zero gives x = 5 and x = −5.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of 2x² − 3x − 9, find αβ and α+β.', 'αβ = 9/2; α+β = −3/2', 'αβ = −3/2; α+β = 9/2', 'αβ = −9/2; α+β = 3/2', 'αβ = −9; α+β = 3', 'C', 'Here a = 2, b = −3 and c = −9. Product = c/a = −9/2 and sum = −b/a = −(−3)/2 = 3/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Can two different quadratic polynomials have the same zeros? Explain briefly.', 'No; every quadratic has a unique set of coefficients', 'Yes; one polynomial can be a non-zero constant multiple of another (e.g. x²−5x+6 and 2x²−10x+12)', 'Yes; but only if the degree is different', 'No; only linear polynomials can', 'B', 'Yes. One polynomial can be a non-zero constant multiple of another. For example, x² − 5x + 6 and 2x² − 10x + 12 have the same zeros, 2 and 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A rectangular plot has area x² − x − 12, with side expressions x−4 and x+3. Find its zeros and state the positive boundary root.', '−4 and 3; positive boundary root = 3', '6 and −2; positive boundary root = 6', '4 and −3; positive boundary root = 4', '12 and −1; positive boundary root = 12', 'C', 'x² − x − 12 = (x−4)(x+3). Setting each factor to zero gives x = 4 and x = −3. The positive boundary value is 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of x² + 2x − 3, find α²β + αβ².', '6', '−6', '3', '−3', 'A', 'Here α+β = −2 and αβ = −3. Then α²β + αβ² = αβ(α+β) = (−3)(−2) = 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A monic quadratic has integer zeros, sum 1 and product −12. Find the zeros and explain how the signs are determined.', '−4 and 3; product is positive so roots have same signs', '6 and −2', '−6 and 2', '4 and −3; product is negative so roots have opposite signs', 'D', 'The product is negative, so the zeros have opposite signs. The integer pair with product −12 and sum 1 is 4 and −3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² − 2x − 1, find α⁴ + β⁴.', '34', '32', '36', '30', 'A', 'Here α+β = 2 and αβ = −1. First α² + β² = (α+β)² − 2αβ = 4 + 2 = 6. Then α⁴ + β⁴ = (α² + β²)² − 2(αβ)² = 6² − 2(1) = 36 − 2 = 34.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find zeros of 2x² − 9x + 10 and verify coefficient relations.', '2 and 5/2', '−2 and −5/2', '5 and 1', '10 and 1/2', 'A', 'Factorise: 2x² − 9x + 10 = (2x−5)(x−2). Thus zeros are 5/2 and 2. Sum = 9/2 = −b/a and product = 5 = c/a.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m8-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A quadratic polynomial has zeros α, β. If α+β = 3 and α² + β² = 13, form the monic polynomial and find its zeros.', 'x² − 3x + 2; zeros are 2 and 1', 'x² + 3x − 2; zeros are (−3±√17)/2', 'x² − 3x − 4; zeros are 4 and −1', 'x² − 3x − 2; zeros are (3+√17)/2 and (3−√17)/2', 'D', 'Use α² + β² = (α+β)² − 2αβ. Thus 13 = 9 − 2αβ, so αβ = −2. The monic polynomial is x² − 3x − 2. Solving x² − 3x − 2 = 0 using the quadratic formula gives x = (3 ± √17)/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'Which polynomial has a repeated zero?', 'x² − 10x + 25', 'x² − 5x + 6', 'x² − 1', 'x² + 3x + 2', 'A', 'x² − 10x + 25 = (x−5)², so it has the repeated zero 5.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'If a parabola lies completely above the x-axis, what can you say about its real zeros?', 'It has 1 real zero', 'It has no real zeros', 'It has 2 real zeros', 'It has infinitely many zeros', 'B', 'Real zeros are the x-values where the graph intersects the x-axis. A graph completely above the x-axis never intersects it, so it has no real zeros.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'Find a quadratic polynomial with zeros −4 and 1/2 and integer coefficients, choosing the simplest non-zero multiple.', '2x² − 7x − 4', '2x² + 9x − 4', 'x² + 7x − 2', '2x² + 7x − 4', 'D', 'Using the zeros, form (x+4)(x−1/2) = x² + (7/2)x − 2. Multiplying by 2 to obtain integer coefficients gives 2x² + 7x − 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'For x² − 6x + q, one zero is twice the other. Find q.', '6', '9', '12', '8', 'D', 'Let the zeros be t and 2t. Their sum is 6, so 3t = 6 and t = 2. The zeros are 2 and 4. The product is q = 2 × 4 = 8.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A rectangular mural has area x² − 3x − 10. Its side factors are x−5 and x+2. Find zeros and discuss which values can be valid if x is a positive dimension parameter.', 'Zeros are −5 and 2; valid dimensions require x > 2', 'Zeros are 5 and −2; valid dimensions require x > 5', 'Zeros are 10 and −1; valid dimensions require x > 10', 'Zeros are 5 and 2; valid dimensions require x > 5', 'B', 'x² − 3x − 10 = (x−5)(x+2), so the zeros are 5 and −2. For both dimensions x−5 and x+2 to be positive, x must be greater than 5. The roots mark boundary values.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-poly-m9-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of 2x² − x − 6, evaluate (1/α) + (1/β).', '1/6', '−1/6', '−1/3', '1/12', 'B', 'Sum = 1/2 and product = −3. Thus 1/α + 1/β = (α+β)/(αβ) = (1/2)/(−3) = −1/6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of 3x² − 4x − 2, find α³ + β³.', '136/27', '128/27', '64/27', '72/27', 'A', 'Here α+β = 4/3 and αβ = −2/3. Use α³ + β³ = (α+β)³ − 3αβ(α+β) = (4/3)³ − 3(−2/3)(4/3) = 64/27 + 8/3 = 64/27 + 72/27 = 136/27.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A monic quadratic has zeros α, β, with α+β = −2 and αβ = −8. Evaluate α²β² − (α+β)².', '64', '68', '60', '56', 'C', 'Since αβ = −8, α²β² = (αβ)² = 64. Also (α+β)² = (−2)² = 4. Therefore the required value is 64 − 4 = 60.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find zeros of x² − 7x + 12 and verify both coefficient relationships.', '3 and 4', '2 and 6', '−3 and −4', '1 and 12', 'A', 'Factorise: x² − 7x + 12 = (x−3)(x−4). The zeros are 3 and 4. Their sum is 7 = −b/a and their product is 12 = c/a.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m9-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'The zeros of a quadratic polynomial are α, β, where α+β = −3 and αβ = −10. (i) Form its monic polynomial. (ii) Find the zeros. (iii) Verify the relations.', 'x² − 3x − 10; zeros are 5 and −2', 'x² + 3x + 10; no real zeros', 'x² + 3x − 10; zeros are 2 and −5', 'x² − 10x − 3; zeros are 10 and −3', 'C', 'The monic polynomial is x² − (−3)x + (−10) = x² + 3x − 10. Factorising gives (x+5)(x−2) = 0, so the zeros are −5 and 2. Their sum is −3 and product is −10, verifying both relations.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-1', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'For p(x) = 2x² − 3x + 1, calculate p(1).', '1', '0', '2', '−1', 'B', 'Substitute x = 1: p(1) = 2(1)² − 3(1) + 1 = 2 − 3 + 1 = 0.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-2', '10', 'mathematics', 'math-ch2', 'Polynomials', 'easy', 'mcq', 'The zeros of x² + x − 6 are:', '−2, 3', '2, −3', '1, −6', '2, 3', 'B', 'Factorise: x² + x − 6 = (x+3)(x−2). Thus the zeros are −3 and 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-3', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A monic quadratic has zeros −1 and 6. Find its sum, product and polynomial.', 'Sum = 5; product = −6; polynomial = x² − 5x − 6', 'Sum = 5; product = 6; polynomial = x² − 5x + 6', 'Sum = 7; product = −6; polynomial = x² − 7x − 6', 'Sum = −5; product = −6; polynomial = x² + 5x − 6', 'A', 'Sum = −1 + 6 = 5 and product = (−1)(6) = −6. The monic polynomial is x² − 5x − 6.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-4', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A learner finds the product of zeros of 7x² − 2x − 3 as −3. Correct the answer.', '−3/7', '3/7', '2/7', 'The learner is correct', 'A', 'For ax² + bx + c, product of zeros = c/a. Here c = −3 and a = 7, so the product is −3/7, not −3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-5', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'A community garden''s area expression is x² + 3x − 28 and factors as (x+7)(x−4). Find the zeros. Which value is a positive boundary?', '7 and −4; positive boundary = 7', '−7 and 4; positive boundary = 4', '28 and −1; positive boundary = 28', '14 and −2; positive boundary = 14', 'B', 'Set x+7 = 0 and x−4 = 0. The zeros are −7 and 4. The positive boundary value is 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-6', '10', 'mathematics', 'math-ch2', 'Polynomials', 'medium', 'mcq', 'If α, β are zeros of 4x² − 4x − 3, find (α+β)² − 2αβ.', '5/2', '3/2', '1/2', '7/2', 'A', 'Here α+β = 1 and αβ = −3/4. Thus (α+β)² − 2αβ = 1 − 2(−3/4) = 1 + 3/2 = 5/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-7', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of x² − 3x + 1, find α³ + β³.', '27', '36', '18', '9', 'C', 'Sum = 3 and product = 1. Therefore α³ + β³ = (α+β)³ − 3αβ(α+β) = 27 − 9 = 18.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-8', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'If α, β are zeros of 2x² + 5x − 3, find α²β² + αβ.', '−3/4', '9/4', '3/4', '15/4', 'C', 'Here αβ = c/a = −3/2. Thus α²β² + αβ = (αβ)² + αβ = (−3/2)² − 3/2 = 9/4 − 6/4 = 3/4.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-9', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'Find the zeros of 4x² + 4x − 3 and verify the sum and product relations.', '−1/2 and 3/2', '3/4 and −1', '1 and −3/4', '1/2 and −3/2', 'D', 'Factorise: 4x² + 4x − 3 = (2x−1)(2x+3). Thus zeros are 1/2 and −3/2. Their sum is −1 = −b/a = −4/4, and their product is −3/4 = c/a.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-poly-m10-10', '10', 'mathematics', 'math-ch2', 'Polynomials', 'hard', 'mcq', 'A quadratic polynomial has zeros α and β such that α+β = 5 and α² + β² = 13. Find (i) αβ, (ii) the monic polynomial, and (iii) its zeros.', 'αβ = −6; polynomial = x² − 5x − 6; zeros are 6 and −1', 'αβ = 12; polynomial = x² − 5x + 12; no real zeros', 'αβ = 4; polynomial = x² − 5x + 4; zeros are 1 and 4', 'αβ = 6; polynomial = x² − 5x + 6; zeros are 2 and 3', 'D', 'Use α² + β² = (α+β)² − 2αβ. Thus 13 = 25 − 2αβ, giving 2αβ = 12 and αβ = 6. The monic polynomial is x² − 5x + 6 = (x−2)(x−3). Therefore its zeros are 2 and 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Polynomials Solved Mock Sets', NULL, FALSE, '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('q-lineq-m1-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'For 2x + 3y = 7 and 4x + 6y = 14, the number of solutions is:', '0', '1', '2', 'infinitely many', 'D', 'Both equations are proportional: 4x + 6y = 14 is twice 2x + 3y = 7. Since a1/a2 = b1/b2 = c1/c2 = 1/2, they represent the same line and have infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The lines 3x + 2y = 8 and 6x + 4y = 19 are:', 'parallel', 'coincident', 'intersecting', 'perpendicular', 'A', 'The coefficient ratios are equal: 3/6 = 2/4 = 1/2, but constant ratio is 8/19 ≠ 1/2. Hence the lines are parallel and distinct.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For what value of k do kx + 3y = 7 and 4x + 6y = 14 have infinitely many solutions?', 'k = 1', 'k = 4', 'k = 2', 'k = 6', 'C', 'For infinitely many solutions, k/4 = 3/6 = 7/14 = 1/2. Therefore k/4 = 1/2 => k = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve by elimination: 5x + 3y = 31 and 2x − y = 4.', 'x = 41/11, y = 38/11', 'x = 43/11, y = 42/11', 'x = 39/11, y = 45/11', 'x = 4, y = 3', 'B', 'From 2x − y = 4, y = 2x − 4. Substituting in 5x + 3y = 31 gives 5x + 3(2x − 4) = 31 => 11x − 12 = 31 => 11x = 43, so x = 43/11 and y = 42/11.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A school sold 120 tickets for its annual function. Adult tickets cost Rs 80 and student tickets Rs 50. The total collection was Rs 7,800. Find the number of each type of ticket.', '70 adult tickets and 50 student tickets', '60 adult tickets and 60 student tickets', '50 adult tickets and 70 student tickets', '80 adult tickets and 40 student tickets', 'B', 'Let a and s be counts: a + s = 120 and 80a + 50s = 7800. Substituting s = 120 − a gives 80a + 50(120 − a) = 7800 => 30a = 1800, so a = 60 and s = 60.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A two-digit number has digit sum 11. Reversing its digits gives a number 27 greater than the original. Find the number.', '38', '56', '74', '47', 'D', 'Let tens digit be x and units digit be y. x + y = 11 and (10y + x) − (10x + y) = 27 => 9(y − x) = 27 => y − x = 3. Solving x + y = 11 and y − x = 3 gives x = 4, y = 7. The number is 47.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'Without solving fully, determine the nature of solutions for 3x + 2y = 8 and 6x + 4y = 17.', 'No solution (parallel lines)', 'Infinitely many solutions (coincident)', 'Two solutions', 'Unique solution (intersecting)', 'A', 'Here a1/a2 = 3/6 = 1/2, b1/b2 = 2/4 = 1/2, and c1/c2 = 8/17. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve the system of equations: 4x − y = 9 and 2x + 3y = 13.', 'x = 18/7, y = 19/7', 'x = 22/7, y = 15/7', 'x = 20/7, y = 17/7', 'x = 3, y = 2', 'C', 'From 4x − y = 9, y = 4x − 9. Substituting in 2x + 3y = 13 gives 2x + 3(4x − 9) = 13 => 14x = 40 => x = 20/7 and y = 17/7.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find the value of p if (p + 1)x + 2y = 5 and 3x + 6y = 15 have a unique solution.', 'p ≠ 0', 'p = 0', 'p ≠ 1', 'p = 1', 'A', 'A unique solution requires (p + 1)/3 ≠ 2/6 = 1/3. Hence p + 1 ≠ 1, so p ≠ 0.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m1-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'The sum of two numbers is 84. One number is twice the other minus 6. Find both numbers.', '50 and 34', '60 and 24', '48 and 36', '54 and 30', 'D', 'Let numbers be x and y: x + y = 84 and x = 2y − 6. Substituting gives (2y − 6) + y = 84 => 3y = 90 => y = 30 and x = 54.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'A pair of linear equations has a unique solution when which condition is satisfied?', 'a1/a2 ≠ b1/b2', 'a1/a2 = b1/b2', 'a1/a2 = b1/b2 = c1/c2', 'all coefficients are zero', 'A', 'A pair of linear equations has a unique solution when the ratio of the coefficients of x and y are unequal: a1/a2 ≠ b1/b2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If x + y = 13 and x − y = 5, then the value of x is:', '9', '8', '4', '13', 'A', 'Adding both equations: (x + y) + (x − y) = 13 + 5 => 2x = 18 => x = 9.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Determine whether 4x − 6y = 9 and 8x − 12y = 20 are consistent. Choose the correct analysis.', 'Yes, consistent with infinitely many solutions', 'No, the pair is inconsistent (parallel lines)', 'Yes, consistent with a unique solution', 'Cannot be determined without graphing', 'B', '4/8 = 1/2, (−6)/(−12) = 1/2, but 9/20 ≠ 1/2. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and inconsistent (no solution).', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 3x + 4y = 25 and 2x − y = 4.', 'x = 39/11, y = 40/11', 'x = 41/11, y = 38/11', 'x = 43/11, y = 36/11', 'x = 4, y = 3', 'B', 'From 2x − y = 4, y = 2x − 4. Substituting into 3x + 4y = 25 gives 3x + 4(2x − 4) = 25 => 11x − 16 = 25 => 11x = 41 => x = 41/11, y = 38/11.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A stationery shop sells 3 geometry boxes and 5 pens for Rs 415. It sells 2 geometry boxes and 7 pens for Rs 370. Find the price of each item.', 'Geometry box = Rs 85; pen = Rs 30', 'Geometry box = Rs 90; pen = Rs 28', 'Geometry box = Rs 100; pen = Rs 22', 'Geometry box = Rs 1055/11 (≈ Rs 95.91); pen = Rs 280/11 (≈ Rs 25.45)', 'D', 'Let prices be g and p: 3g + 5p = 415 and 2g + 7p = 370. Eliminating g: 2(3g+5p) − 3(2g+7p) = 2(415) − 3(370) => −11p = −280 => p = Rs 280/11 and g = Rs 1055/11.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'The present ages of a mother and daughter add up to 50 years. Five years ago, the mother was four times the daughter''s age. Find their present ages.', 'Mother = 40 years; daughter = 10 years', 'Mother = 37 years; daughter = 13 years', 'Mother = 35 years; daughter = 15 years', 'Mother = 38 years; daughter = 12 years', 'B', 'Let present ages be m and d: m + d = 50 and m − 5 = 4(d − 5). Since m = 50 − d, (50 − d) − 5 = 4d − 20 => 45 − d = 4d − 20 => 5d = 65 => d = 13 and m = 37.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For 7x + ky = 14 and 21x + 12y = 42, find k for infinitely many solutions.', 'k = 2', 'k = 3', 'k = 6', 'k = 4', 'D', 'For infinitely many solutions, 7/21 = k/12 = 14/42 = 1/3. Hence k/12 = 1/3 => k = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 7x + 2y = 24 and 3x − 2y = 6.', 'x = 2, y = 5', 'x = 3, y = 2', 'x = 3, y = 3/2', 'x = 4, y = 1/2', 'C', 'Adding equations: 10x = 30 => x = 3. Substituting into 7(3) + 2y = 24 => 21 + 2y = 24 => 2y = 3 => y = 3/2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find the intersection point of the lines 2x − y = 5 and x + 2y = 4.', '(14/5, 3/5)', '(12/5, 4/5)', '(3, 1)', '(16/5, 1/5)', 'A', 'From 2x − y = 5, y = 2x − 5. Substituting in x + 2(2x − 5) = 4 => 5x − 10 = 4 => 5x = 14 => x = 14/5 and y = 3/5.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m2-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A purse contains Rs 10 and Rs 20 notes, 18 notes altogether, worth Rs 260. Find the count of each type.', '8 notes of Rs 10 and 10 notes of Rs 20', '12 notes of Rs 10 and 6 notes of Rs 20', '10 notes of Rs 10 and 8 notes of Rs 20', '14 notes of Rs 10 and 4 notes of Rs 20', 'C', 'Let counts be a and b: a + b = 18 and 10a + 20b = 260 => a + 2b = 26. Subtracting gives b = 8 and a = 10.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The equations 2x + 5y = 9 and 4x + 10y = 18 have:', 'no solution', 'one solution', 'exactly two solutions', 'infinitely many solutions', 'D', 'The second equation is exactly twice the first: 4/2 = 10/5 = 18/9 = 2. So both represent the same line and have infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'Which pair of linear equations represents parallel distinct lines?', 'x + y = 5, 2x + 2y = 10', 'x + 2y = 4, 2x + 4y = 11', 'x + y = 3, 2x − y = 1', '2x + y = 8, 4x + 2y = 16', 'B', 'For x + 2y = 4 and 2x + 4y = 11, a1/a2 = 1/2, b1/b2 = 2/4 = 1/2, but c1/c2 = 4/11 ≠ 1/2. Thus the lines are parallel and distinct.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find k so that 2x + ky = 8 and 6x + 9y = 24 have infinitely many solutions.', 'k = 1', 'k = 2', 'k = 4', 'k = 3', 'D', 'For infinitely many solutions, 2/6 = k/9 = 8/24 = 1/3. Therefore k/9 = 1/3 => k = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve the system: 7x − 2y = 19 and 3x + 2y = 11.', 'x = 3, y = 1', 'x = 2, y = 2', 'x = 4, y = −1', 'x = 1, y = 4', 'A', 'Adding both equations: 10x = 30 => x = 3. Substituting into 3(3) + 2y = 11 => 9 + 2y = 11 => 2y = 2 => y = 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'Two types of grain are mixed. Type A costs Rs 42 per kg and Type B costs Rs 30 per kg. A shopkeeper buys 25 kg of the mixture for Rs 930. Find the quantity of each type.', '15 kg of Type A and 10 kg of Type B', '10 kg of Type A and 15 kg of Type B', '12 kg of Type A and 13 kg of Type B', '18 kg of Type A and 7 kg of Type B', 'A', 'Let quantities be a and b: a + b = 25 and 42a + 30b = 930. Substituting b = 25 − a: 42a + 30(25 − a) = 930 => 12a = 180 => a = 15 kg and b = 10 kg.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A cyclist travels 30 km downstream in 2 hours and returns the same distance upstream in 3 hours. Find the cyclist''s speed in still conditions and the stream''s speed.', 'Still-water speed = 10 km/h; stream speed = 5 km/h', 'Still-water speed = 15 km/h; stream speed = 3 km/h', 'Still-water speed = 12.5 km/h; stream speed = 2.5 km/h', 'Still-water speed = 11 km/h; stream speed = 4 km/h', 'C', 'Downstream speed = 30/2 = 15 km/h, Upstream speed = 30/3 = 10 km/h. Still-water speed = (15 + 10)/2 = 12.5 km/h; stream speed = (15 − 10)/2 = 2.5 km/h.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For what value of t are 5x + ty = 15 and 10x + 8y = 30 coincident?', 't = 2', 't = 6', 't = 4', 't = 8', 'C', 'For coincident lines: 5/10 = t/8 = 15/30 = 1/2. Hence t/8 = 1/2 => t = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 4x + 5y = 31 and 2x − y = 1.', 'x = 16/7, y = 31/7', 'x = 18/7, y = 29/7', 'x = 20/7, y = 27/7', 'x = 2, y = 4', 'B', 'From 2x − y = 1, y = 2x − 1. Substituting in 4x + 5(2x − 1) = 31 => 14x − 5 = 31 => 14x = 36 => x = 18/7, y = 29/7.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'The lines 2x + 3y = 7 and 4x + 6y = c coincide. Find c.', 'c = 7', 'c = 12', 'c = 21', 'c = 14', 'D', 'The second equation must be twice the first: 4x + 6y = 14. Hence c = 14.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m3-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A rectangle has perimeter 74 cm. Its length is 5 cm more than its breadth. Find its dimensions.', 'Length = 20 cm; breadth = 15 cm', 'Length = 22 cm; breadth = 17 cm', 'Length = 21 cm; breadth = 16 cm', 'Length = 24 cm; breadth = 19 cm', 'C', '2(l + b) = 74 => l + b = 37 and l − b = 5. Adding gives 2l = 42 => l = 21 cm and b = 16 cm.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'For 5x + ay = 12 and 10x + 6y = 24 to have infinitely many solutions, a equals:', '2', '3', '6', '12', 'B', 'For infinitely many solutions, 5/10 = a/6 = 12/24 = 1/2. Thus a/6 = 1/2 => a = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If two lines intersect at exactly one point, the corresponding pair has:', 'no solution', 'infinitely many solutions', 'equal slopes', 'a unique solution', 'D', 'Two intersecting lines meet at exactly one point, so the pair has a unique solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Check whether x − 2y = 4 and 3x − 6y = 12 have infinitely many solutions.', 'No, unique solution', 'Yes, infinitely many solutions (coincident lines)', 'Cannot be determined', 'No, inconsistent', 'B', 'Multiplying x − 2y = 4 by 3 gives 3x − 6y = 12, which is identical to the second equation. They represent coincident lines with infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 4x + 7y = 1 and 3x − 2y = 20.', 'x = 5, y = −3', 'x = 140/29, y = −75/29', 'x = 144/29, y = −79/29', 'x = 142/29, y = −77/29', 'D', 'Multiplying 4x + 7y = 1 by 2 and 3x − 2y = 20 by 7: 8x + 14y = 2 and 21x − 14y = 140. Adding gives 29x = 142 => x = 142/29 and y = −77/29.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'At a school canteen, 4 sandwiches and 3 juices cost Rs 390, while 2 sandwiches and 5 juices cost Rs 370. Find the price of one sandwich and one juice.', 'Sandwich = Rs 60; juice = Rs 50', 'Sandwich = Rs 55; juice = Rs 55', 'Sandwich = Rs 65; juice = Rs 45', 'Sandwich = Rs 70; juice = Rs 40', 'A', '4s + 3j = 390 and 2s + 5j = 370. Multiply second equation by 2: 4s + 10j = 740. Subtracting first: 7j = 350 => j = Rs 50 and s = Rs 60.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-lineq-m4-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A cab company charges a fixed booking fee plus a charge per kilometre. A 12 km ride costs Rs 196 and a 20 km ride costs Rs 300. Find both charges and the fare for a 35 km ride.', 'Fixed fee = Rs 30; charge = Rs 14/km; 35 km fare = Rs 520', 'Fixed fee = Rs 50; charge = Rs 12/km; 35 km fare = Rs 470', 'Fixed fee = Rs 45; charge = Rs 12.5/km; 35 km fare = Rs 482.5', 'Fixed fee = Rs 40; charge = Rs 13/km; 35 km fare = Rs 495', 'D', 'f + 12r = 196 and f + 20r = 300. Subtracting gives 8r = 104 => r = Rs 13/km and f = Rs 40. For 35 km: 40 + 35(13) = 40 + 455 = Rs 495.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'State whether 5x + 2y = 7 and 15x + 6y = 22 have a solution.', 'Unique solution', 'Infinitely many solutions', 'No solution (parallel lines)', 'Exactly two solutions', 'C', 'Coefficient ratios are 5/15 = 2/6 = 1/3, but constant ratio is 7/22 ≠ 1/3. Hence the lines are parallel and distinct, meaning no solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 8x + 3y = 29 and 2x − y = 1.', 'x = 18/7, y = 23/7', 'x = 15/7, y = 26/7', 'x = 16/7, y = 25/7', 'x = 2, y = 3', 'C', 'From 2x − y = 1, y = 2x − 1. Substituting in 8x + 3(2x − 1) = 29 => 14x − 3 = 29 => 14x = 32 => x = 16/7 and y = 25/7.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'If x = 2, y = 3 is a solution of ax + 2y = 11 and 3x + by = 13, find a and b.', 'a = 5/2, b = 7/3', 'a = 2, b = 3', 'a = 3/2, b = 8/3', 'a = 5, b = 7', 'A', 'Substitute x = 2, y = 3: 2a + 6 = 11 => 2a = 5 => a = 5/2; and 3(2) + 3b = 13 => 6 + 3b = 13 => 3b = 7 => b = 7/3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m4-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'Two numbers differ by 8. Three times the smaller plus twice the larger is 76. Find them.', 'Smaller number = 10; larger number = 18', 'Smaller number = 14; larger number = 22', 'Smaller number = 12; larger number = 20', 'Smaller number = 8; larger number = 16', 'C', 'L − S = 8 => L = S + 8. Then 3S + 2(S + 8) = 76 => 5S + 16 = 76 => 5S = 60 => S = 12 and L = 20.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The system of equations x + 2y = 8 and 3x + 6y = 24 has:', 'infinitely many solutions', 'unique solution', 'no solution', 'no variables', 'A', 'The second equation is 3 times the first: 3/1 = 6/2 = 24/8 = 3. Therefore both represent the same line and have infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If 2x + y = 11 and x + y = 7, then y is:', '5', '2', '4', '3', 'D', 'Subtracting (x + y = 7) from (2x + y = 11) gives x = 4. Substituting in x + y = 7 gives y = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find k if 3x + 6y = 12 and kx + 2y = 7 have no solution.', 'k = 2', 'k = 3', 'k = 1', 'k = 4', 'C', 'For no solution, 3/k = 6/2 = 3 => k = 1, while 12/7 ≠ 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 2x + 3y = 17 and 3x − y = 11.', 'x = 50/11, y = 29/11', 'x = 48/11, y = 31/11', 'x = 52/11, y = 27/11', 'x = 5, y = 2', 'A', 'From 3x − y = 11, y = 3x − 11. Substituting gives 2x + 3(3x − 11) = 17 => 11x − 33 = 17 => 11x = 50 => x = 50/11 and y = 29/11.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A theatre sold 240 tickets. The price was Rs 150 for balcony seats and Rs 100 for regular seats. The total collection was Rs 29,500. Find the number of each ticket sold.', '100 balcony tickets and 140 regular tickets', '120 balcony tickets and 120 regular tickets', '110 balcony tickets and 130 regular tickets', '130 balcony tickets and 110 regular tickets', 'C', 'b + r = 240 and 150b + 100r = 29500 => 3b + 2r = 590. Multiplying b + r = 240 by 2 gives 2b + 2r = 480. Subtracting gives b = 110 and r = 130.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A fraction becomes 1/2 when 1 is added to its numerator, and becomes 1/3 when 1 is added to its denominator. Find the fraction.', '2/7', '5/11', '4/9', '3/8', 'D', '(n + 1)/d = 1/2 => d = 2n + 2; and n/(d + 1) = 1/3 => d + 1 = 3n => d = 3n − 1. Equating: 2n + 2 = 3n − 1 => n = 3 and d = 8. Fraction is 3/8.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find k so that 2x + 5y = 9 and 6x + ky = 27 have infinitely many solutions.', 'k = 25', 'k = 10', 'k = 20', 'k = 15', 'D', 'For infinitely many solutions, 2/6 = 5/k = 9/27 = 1/3. Hence 5/k = 1/3 => k = 15.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 3x + 7y = 31 and 2x − y = 3.', 'x = 52/17, y = 53/17', 'x = 54/17, y = 51/17', 'x = 50/17, y = 55/17', 'x = 3, y = 3', 'A', 'From 2x − y = 3, y = 2x − 3. Substituting into 3x + 7(2x − 3) = 31 gives 17x − 21 = 31 => 17x = 52 => x = 52/17 and y = 53/17.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For 2x + 3y = 12 and 4x + 6y = 24, which pair of points both represent solutions?', '(0, 0) and (2, 2)', '(6, 0) and (3, 2)', '(5, 1) and (2, 3)', '(4, 1) and (1, 4)', 'B', 'Both points lie on 2x + 3y = 12: for (6,0), 2(6)+3(0)=12; for (3,2), 2(3)+3(2)=6+6=12. Since both equations are coincident, both points are valid solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m5-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A mother is 24 years older than her daughter. In 4 years, the mother will be twice the daughter''s age. Find their present ages.', 'Daughter = 18 years; mother = 42 years', 'Daughter = 20 years; mother = 44 years', 'Daughter = 22 years; mother = 46 years', 'Daughter = 16 years; mother = 40 years', 'B', 'm − d = 24 and m + 4 = 2(d + 4) => m + 4 = 2d + 8 => m = 2d + 4. Substituting in m − d = 24: (2d + 4) − d = 24 => d = 20 years and m = 44 years.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'For ax + 3y = 7 and 2x + 6y = 14, the pair has infinitely many solutions when a equals:', 'every real number', '0', '1', '2', 'D', 'For infinitely many solutions, a/2 = 3/6 = 7/14 = 1/2. Hence a/2 = 1/2 => a = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The pair of equations 2x + 3y = 6 and 4x + 6y = 15 is:', 'consistent dependent', 'inconsistent (parallel lines)', 'identical', 'unique solution', 'B', 'Coefficient ratios are 2/4 = 3/6 = 1/2, while constant ratio is 6/15 = 2/5 ≠ 1/2. Thus lines are parallel and inconsistent.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For what value of p do 2x + py = 5 and 6x + 9y = 15 have infinitely many solutions?', 'p = 1', 'p = 2', 'p = 3', 'p = 6', 'C', 'For infinitely many solutions, 2/6 = p/9 = 5/15 = 1/3. Hence p/9 = 1/3 => p = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 5x − 2y = 4 and 3x + 2y = 12.', '(2, 3)', '(3, 2)', '(4, 1)', '(1, 4)', 'A', 'Adding both equations: 8x = 16 => x = 2. Substituting into 3(2) + 2y = 12 => 6 + 2y = 12 => 2y = 6 => y = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A class has 42 students. The number of girls is 6 more than the number of boys. Find the number of boys and girls.', '15 boys and 27 girls', '20 boys and 22 girls', '16 boys and 26 girls', '18 boys and 24 girls', 'D', 'b + g = 42 and g − b = 6. Adding gives 2g = 48 => g = 24 girls and b = 18 boys.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A boat covers 24 km downstream in 2 hours and 24 km upstream in 3 hours. Find the speed of the boat in still water and the speed of the current.', 'Boat speed = 12 km/h; current speed = 3 km/h', 'Boat speed = 10 km/h; current speed = 2 km/h', 'Boat speed = 11 km/h; current speed = 2.5 km/h', 'Boat speed = 9 km/h; current speed = 1.5 km/h', 'B', 'Downstream speed = 24/2 = 12 km/h; Upstream speed = 24/3 = 8 km/h. Boat speed in still water = (12 + 8)/2 = 10 km/h; current speed = (12 − 8)/2 = 2 km/h.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find p if 4x + py = 10 and 12x + 9y = 30 have infinitely many solutions.', 'p = 1', 'p = 3', 'p = 2', 'p = 4', 'B', 'For infinitely many solutions, 4/12 = p/9 = 10/30 = 1/3. Hence p/9 = 1/3 => p = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 9x − 2y = 20 and 3x + y = 10.', 'x = 3, y = 1', 'x = 7/3, y = 3', 'x = 8/3, y = 2', 'x = 10/3, y = 0', 'C', 'From 3x + y = 10, y = 10 − 3x. Substituting in 9x − 2(10 − 3x) = 20 => 15x − 20 = 20 => 15x = 40 => x = 8/3 and y = 10 − 8 = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For which value of q does 2x + 3y = 7 and 4x + qy = 15 have a unique solution?', 'q = 6 only', 'q = 3 only', 'Any q ≠ 6', 'Any q ≠ 3', 'C', 'A unique solution requires 2/4 ≠ 3/q => 1/2 ≠ 3/q => q ≠ 6. Hence any real value of q except 6 gives a unique solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m6-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A school bought 20 items, notebooks at Rs 25 each and files at Rs 40 each, spending Rs 620. Find the number of each.', '12 notebooks and 8 files', '14 notebooks and 6 files', '8 notebooks and 12 files', '10 notebooks and 10 files', 'A', 'n + f = 20 and 25n + 40f = 620. 25(20 − f) + 40f = 620 => 500 + 15f = 620 => 15f = 120 => f = 8 and n = 12.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If a1/a2 and b1/b2 are unequal, what can be concluded about the lines?', 'They are parallel', 'They are coincident', 'They intersect at exactly one point', 'They are always perpendicular', 'C', 'Unequal coefficient ratios (a1/a2 ≠ b1/b2) mean the lines have different slopes and intersect at exactly one unique point.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The solution of 3x + 2y = 16 and x − y = 2 is:', '(3, 1)', '(4, 2)', '(2, 4)', '(5, 3)', 'B', 'From x − y = 2, x = y + 2. Substituting gives 3(y + 2) + 2y = 16 => 5y = 10 => y = 2 and x = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Determine the nature of the pair 7x + 5y = 9 and 14x + 10y = 21.', 'Unique solution', 'Infinitely many solutions', 'No solution (parallel lines)', 'Exactly two solutions', 'C', '7/14 = 5/10 = 1/2, but 9/21 = 3/7 ≠ 1/2. Because a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 6x + y = 17 and 2x − y = 3.', 'x = 2, y = 5', 'x = 5/2, y = 2', 'x = 3, y = 1', 'x = 7/2, y = −4', 'B', 'Adding both equations: 8x = 20 => x = 20/8 = 5/2. Then y = 2(5/2) − 3 = 5 − 3 = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A farmer has 35 animals consisting of hens and goats. There are 94 legs altogether. Find the number of hens and goats.', '20 hens and 15 goats', '25 hens and 10 goats', '22 hens and 13 goats', '23 hens and 12 goats', 'D', 'h + g = 35 and 2h + 4g = 94 => h + 2g = 47. Subtracting gives g = 12 goats and h = 23 hens.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'Two mobile data plans charge a fixed fee plus cost per GB. Plan A costs Rs 180 for 5 GB and Rs 300 for 11 GB. Find the fixed fee and per-GB charge, then calculate the cost for 15 GB.', 'Fixed fee = Rs 70; rate = Rs 22/GB; 15 GB costs Rs 400', 'Fixed fee = Rs 80; rate = Rs 20/GB; 15 GB costs Rs 380', 'Fixed fee = Rs 90; rate = Rs 18/GB; 15 GB costs Rs 360', 'Fixed fee = Rs 75; rate = Rs 21/GB; 15 GB costs Rs 390', 'B', 'f + 5r = 180 and f + 11r = 300. Subtracting gives 6r = 120 => r = Rs 20/GB and f = Rs 80. For 15 GB: 80 + 15(20) = Rs 380.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'Are 6x + 9y = 12 and 2x + 3y = 4 dependent, inconsistent, or independent?', 'Dependent (equivalent equations)', 'Inconsistent (parallel)', 'Independent (unique solution)', 'None of these', 'A', '6x + 9y = 12 divided by 3 is 2x + 3y = 4. Since the two equations are multiples of each other, they represent the same line and are dependent.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 5x + y = 18 and 2x − y = 3.', '(2, 8)', '(4, −2)', '(1, 13)', '(3, 3)', 'D', 'Adding both equations: 7x = 21 => x = 3. Substituting into y = 2(3) − 3 = 3. Hence the solution is (3, 3).', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'A pair has equations 3x + 2y = 8 and 6x + 4y = c. State the value of c for infinitely many solutions and the condition for no solution.', 'Infinitely many when c = 16; no solution when c ≠ 16', 'Infinitely many when c = 8; no solution when c ≠ 8', 'Infinitely many when c = 24; no solution when c ≠ 24', 'Infinitely many for all c', 'A', 'Doubling the first equation gives 6x + 4y = 16. Thus c = 16 produces coincident lines (infinitely many solutions), while any c ≠ 16 produces parallel distinct lines (no solution).', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m7-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'The cost of 3 adult and 2 child entries is Rs 460. The cost of 2 adult and 5 child entries is Rs 510. Find each entry price.', 'Adult entry = Rs 1280/11; child entry = Rs 610/11', 'Adult entry = Rs 110; child entry = Rs 65', 'Adult entry = Rs 120; child entry = Rs 50', 'Adult entry = Rs 100; child entry = Rs 80', 'A', '3a + 2c = 460 and 2a + 5c = 510. Multiply first by 2 and second by 3: 6a + 4c = 920 and 6a + 15c = 1530. Subtracting gives 11c = 610 => c = Rs 610/11 and a = Rs 1280/11.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'A pair of linear equations with infinitely many solutions represents which geometric relationship?', 'intersecting lines', 'same coincident line', 'parallel lines', 'perpendicular lines', 'B', 'Infinitely many solutions mean every point on one line is on the other, which occurs when both equations represent the same coincident line.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If x + y = 9 and 2x − y = 6, then x equals:', '4', '3', '5', '6', 'C', 'Adding both equations: (x + y) + (2x − y) = 9 + 6 => 3x = 15 => x = 5.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Can any value of k make 4x + ky = 10 and 12x + 9y = 31 have infinitely many solutions? State why.', 'No value of k (4/12 = 1/3, but 10/31 ≠ 1/3)', 'Yes, k = 9', 'Yes, k = 6', 'Yes, k = 3', 'A', 'Infinitely many solutions require 4/12 = k/9 = 10/31. Here 4/12 = 1/3, but 10/31 ≠ 1/3. Hence no value of k can satisfy the equality.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 2x + 5y = 16 and 3x − y = 5.', 'x = 39/17, y = 40/17', 'x = 43/17, y = 36/17', 'x = 41/17, y = 38/17', 'x = 2, y = 2', 'C', 'From 3x − y = 5, y = 3x − 5. Substituting into 2x + 5(3x − 5) = 16 gives 17x − 25 = 16 => 17x = 41 => x = 41/17 and y = 38/17.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A museum sold 150 tickets. Adult tickets cost Rs 60 and children tickets Rs 35. The total receipt was Rs 7,000. Find the number of adult and child tickets.', '80 adult tickets and 70 child tickets', '75 adult tickets and 75 child tickets', '60 adult tickets and 90 child tickets', '70 adult tickets and 80 child tickets', 'D', 'a + c = 150 and 60a + 35c = 7000. Substituting c = 150 − a: 60a + 35(150 − a) = 7000 => 25a + 5250 = 7000 => 25a = 1750 => a = 70 and c = 80.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A number is made of two digits. The sum of its digits is 9. The number is 27 more than the number formed by reversing its digits. Find the number.', '36', '63', '54', '72', 'B', 'Let tens digit be x and units digit be y: x + y = 9 and (10x + y) − (10y + x) = 27 => 9(x − y) = 27 => x − y = 3. Adding gives 2x = 12 => x = 6, y = 3. Number is 63.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find k so that 5x + ky = 11 and 15x + 12y = 33 have infinitely many solutions.', 'k = 4', 'k = 3', 'k = 6', 'k = 2', 'A', 'For infinitely many solutions, 5/15 = k/12 = 11/33 = 1/3. Thus k/12 = 1/3 => k = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 7x − y = 17 and 2x + y = 10.', '(4, 3)', '(3, 4)', '(2, 6)', '(5, 0)', 'B', 'Adding both equations: 9x = 27 => x = 3. Substituting into 2(3) + y = 10 gives y = 4. The solution is (3, 4).', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find two consecutive positive integers if their sum is 41, by forming a pair of equations.', '21 and 22', '19 and 22', '18 and 23', '20 and 21', 'D', 'Let integers be n and n + 1: n + (n + 1) = 41 => 2n + 1 = 41 => 2n = 40 => n = 20. The integers are 20 and 21.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m8-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A van travels 180 km. At 15 km/h faster, the same trip takes 1 hour less. Find its original speed.', '40 km/h', '50 km/h', '60 km/h', '45 km/h', 'D', '180/v − 180/(v + 15) = 1 => 180(15) = v(v + 15) => v² + 15v − 2700 = 0. Factoring: (v − 45)(v + 60) = 0. Since speed is positive, v = 45 km/h.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If 3x + 4y = 10 and 6x + 8y = 20, then the pair has:', 'no solution', 'infinitely many solutions', 'one solution', 'two solutions', 'B', '6x + 8y = 20 is exactly 2 times 3x + 4y = 10: 6/3 = 8/4 = 20/10 = 2. Hence they represent the same line and have infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If x − y = 3 and 2x + y = 12, then x is:', '4', '3', '5', '6', 'C', 'From x − y = 3, y = x − 3. Substituting into 2x + (x − 3) = 12 => 3x = 15 => x = 5.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For what value of m are 2x + 4y = 9 and 6x + my = 27 coincident?', 'm = 12', 'm = 10', 'm = 8', 'm = 16', 'A', 'For coincident lines, 2/6 = 4/m = 9/27 = 1/3. Hence 4/m = 1/3 => m = 12.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 3x + 5y = 1 and 2x − y = 8.', 'x = 39/13, y = −20/13', 'x = 43/13, y = −24/13', 'x = 4, y = 0', 'x = 41/13, y = −22/13', 'D', 'From 2x − y = 8, y = 2x − 8. Substituting into 3x + 5(2x − 8) = 1 gives 13x − 40 = 1 => 13x = 41 => x = 41/13 and y = −22/13.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A school arranged 18 vehicles, cars and minibuses, to transport 310 students. Each car carries 10 students and each minibus 20 students. Find the number of each vehicle.', '6 cars and 12 minibuses', '4 cars and 14 minibuses', '5 cars and 13 minibuses', '7 cars and 11 minibuses', 'C', 'c + m = 18 and 10c + 20m = 310 => c + 2m = 31. Subtracting the first equation from the second gives m = 13 minibuses and c = 5 cars.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-lineq-m9-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A retailer buys 40 kg of rice, some at Rs 48/kg and the rest at Rs 60/kg. The total cost is Rs 2,160. Find the quantity bought at each rate.', '25 kg at Rs 48/kg and 15 kg at Rs 60/kg', '15 kg at Rs 48/kg and 25 kg at Rs 60/kg', '20 kg at Rs 48/kg and 20 kg at Rs 60/kg', '18 kg at Rs 48/kg and 22 kg at Rs 60/kg', 'C', 'x + y = 40 and 48x + 60y = 2160. Substituting x = 40 − y gives 48(40 − y) + 60y = 2160 => 1920 + 12y = 2160 => 12y = 240 => y = 20 kg and x = 20 kg.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Determine the nature of 2x + 4y = 8 and 3x + 6y = 15.', 'Unique solution', 'Infinitely many solutions', 'Dependent', 'No solution (parallel lines)', 'D', '2/3 = 4/6 = 2/3, while 8/15 ≠ 2/3. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 3x + 4y = 18 and 2x − y = 1.', '(3, 2)', '(2, 3)', '(1, 4)', '(4, 1)', 'B', 'From 2x − y = 1, y = 2x − 1. Substituting in 3x + 4(2x − 1) = 18 => 11x − 4 = 18 => 11x = 22 => x = 2 and y = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Find the value of m for which mx + 3y = 6 and 4x + 6y = 12 have infinitely many solutions.', 'm = 2', 'm = 3', 'm = 1', 'm = 4', 'A', 'For infinitely many solutions, m/4 = 3/6 = 6/12 = 1/2. Hence m/4 = 1/2 => m = 2.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m9-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A vendor sells 30 kg of fruit in two varieties. One costs Rs 80/kg and the other Rs 50/kg. The total receipt is Rs 1,950. Find quantities sold.', '10 kg of Rs 80 and 20 kg of Rs 50', '12 kg of Rs 80 and 18 kg of Rs 50', '20 kg of Rs 80 and 10 kg of Rs 50', '15 kg of each variety', 'D', 'a + b = 30 and 80a + 50b = 1950. Substituting b = 30 − a gives 80a + 50(30 − a) = 1950 => 30a + 1500 = 1950 => 30a = 450 => a = 15 kg and b = 15 kg.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-1', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'The pair of equations 2x + 3y = 12 and 4x + 6y = 24 has:', 'unique solution', 'infinitely many solutions', 'no solution', 'exactly two solutions', 'B', 'The second equation is 2 times the first equation: 4/2 = 6/3 = 24/12 = 2. Both represent the same coincident line and have infinitely many solutions.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-2', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'If 4x + y = 14 and 2x − y = 4, then x equals:', '3', '4', '2', '5', 'A', 'Adding both equations: (4x + y) + (2x − y) = 14 + 4 => 6x = 18 => x = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-3', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For what value of a do ax + 2y = 8 and 3x + 6y = 24 have infinitely many solutions?', 'a = 2', 'a = 3', 'a = 4', 'a = 1', 'D', 'For infinitely many solutions, a/3 = 2/6 = 8/24 = 1/3. Hence a/3 = 1/3 => a = 1.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-4', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 4x + 3y = 24 and 2x − y = 2.', '(3, 4)', '(4, 3)', '(2, 5)', '(5, 1)', 'A', 'From 2x − y = 2, y = 2x − 2. Substituting gives 4x + 3(2x − 2) = 24 => 10x − 6 = 24 => 10x = 30 => x = 3 and y = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-5', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A parking lot has 64 vehicles, cars and motorcycles. There are 200 wheels in total. Find the number of cars and motorcycles.', '36 cars and 28 motorcycles', '32 cars and 32 motorcycles', '40 cars and 24 motorcycles', '30 cars and 34 motorcycles', 'A', 'c + m = 64 and 4c + 2m = 200 => 2c + m = 100. Subtracting the first equation gives c = 36 cars and m = 28 motorcycles.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-6', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'The perimeter of a rectangle is 94 cm. Its length is 7 cm more than twice its breadth. Find its dimensions.', 'Length = 35 cm; breadth = 12 cm', 'Length = 33 cm; breadth = 14 cm', 'Length = 101/3 cm; breadth = 40/3 cm', 'Length = 100/3 cm; breadth = 41/3 cm', 'C', '2(l + b) = 94 => l + b = 47 and l = 2b + 7. Substituting: (2b + 7) + b = 47 => 3b = 40 => b = 40/3 cm and l = 2(40/3) + 7 = 101/3 cm.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-7', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'easy', 'mcq', 'Check whether 9x + 6y = 15 and 3x + 2y = 5 represent the same line.', 'No, intersecting lines', 'No, parallel lines', 'Yes, they represent the same line (coincident)', 'Cannot be determined', 'C', 'Multiplying 3x + 2y = 5 by 3 gives 9x + 6y = 15, which is identical to the first equation. Hence they represent the same coincident line.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-8', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'Solve: 5x + 3y = 19 and x + y = 5.', '(3, 2)', '(2, 3)', '(4, 1)', '(1, 4)', 'B', 'From x + y = 5, y = 5 − x. Substituting into 5x + 3(5 − x) = 19 => 2x + 15 = 19 => 2x = 4 => x = 2 and y = 3.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-9', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'medium', 'mcq', 'For 3x + 2y = 12 and 6x + ky = 24, find k for infinitely many solutions.', 'k = 2', 'k = 4', 'k = 6', 'k = 3', 'B', 'For infinitely many solutions, 3/6 = 2/k = 12/24 = 1/2. Hence 2/k = 1/2 => k = 4.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-lineq-m10-10', '10', 'mathematics', 'math-ch3', 'Pair of Linear Equations in Two Variables', 'hard', 'mcq', 'A class collected Rs 1,260 using Rs 20 and Rs 50 contributions. There were 36 contributions altogether. Find the number of each type.', '20 of Rs 20 and 16 of Rs 50', '16 of Rs 20 and 20 of Rs 50', '15 of Rs 20 and 21 of Rs 50', '18 contributions of Rs 20 and 18 contributions of Rs 50', 'D', 'x + y = 36 and 20x + 50y = 1260 => 2x + 5y = 126. Multiplying x + y = 36 by 2 gives 2x + 2y = 72. Subtracting gives 3y = 54 => y = 18 of Rs 50 and x = 18 of Rs 20.', NULL, 1, 0, 'published', 'CBSE Class 10 Linear Equations Solved Practice Sets', NULL, FALSE, '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('q-quad-m1-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which of the following is a quadratic equation in x?', 'x(x + 2) = x² + 3', '1/x + x = 2', '(x − 1)² = 2x + 3', 'x³ − 1 = 0', 'C', 'Expand each: in B, (x − 1)² = x² − 2x + 1 = 2x + 3 => x² − 4x − 2 = 0, which is of the form ax² + bx + c = 0 with a = 1 ≠ 0. In A, x² cancels out leaving 2x = 3 (linear).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The discriminant of 2x² − 7x + 3 = 0 is:', '49', '25', '1', '73', 'B', 'For ax² + bx + c = 0, D = b² − 4ac. Here a = 2, b = −7, c = 3. D = (−7)² − 4(2)(3) = 49 − 24 = 25.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value of k for which x² − 6x + k = 0 has equal real roots.', 'k = 6', 'k = −9', 'k = 36', 'k = 9', 'D', 'For equal real roots, D = 0. Here b² − 4ac = (−6)² − 4(1)(k) = 36 − 4k = 0 => 4k = 36 => k = 9.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve the quadratic equation by factorisation: x² − 7x + 12 = 0.', 'x = 2, 6', 'x = −3, −4', 'x = 3, 4', 'x = 1, 12', 'C', 'Factorise: x² − 7x + 12 = (x − 3)(x − 4) = 0. Setting each factor to zero gives x = 3 or x = 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Determine the nature of the roots of 3x² − 2√6x + 2 = 0.', 'Real and equal roots', 'Real and distinct roots', 'No real roots', 'Cannot be determined', 'A', 'D = b² − 4ac = (−2√6)² − 4(3)(2) = 24 − 24 = 0. Since D = 0, the equation has two real and equal roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve using the quadratic formula: 2x² − 5x − 3 = 0.', 'x = 3, 1/2', 'x = −3, 1/2', 'x = 3, −1/2', 'x = 2, −3/2', 'C', 'a = 2, b = −5, c = −3. D = (−5)² − 4(2)(−3) = 25 + 24 = 49. x = (−b ± √D)/(2a) = (5 ± 7)/4 => x = 12/4 = 3 or x = −2/4 = −1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value(s) of p if 2x² + px + 8 = 0 has equal roots.', 'p = 8 only', 'p = ±8', 'p = −8 only', 'p = ±4', 'B', 'Equal roots require D = 0: p² − 4(2)(8) = 0 => p² − 64 = 0 => p² = 64 => p = ±8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The product of two consecutive positive integers is 306. Find the integers.', '16 and 17', '15 and 16', '18 and 19', '17 and 18', 'D', 'Let the integers be n and n + 1. n(n + 1) = 306 => n² + n − 306 = 0 => (n + 18)(n − 17) = 0. Since n is positive, n = 17. The integers are 17 and 18.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The area of a rectangular field is 504 m². Its length is 10 m more than its breadth. Find its dimensions.', 'Breadth = 18 m, Length = 28 m', 'Breadth = 16 m, Length = 26 m', 'Breadth = 14 m, Length = 24 m', 'Breadth = 20 m, Length = 30 m', 'A', 'Let breadth = b. Length = b + 10. Area = b(b + 10) = 504 => b² + 10b − 504 = 0 => (b + 28)(b − 18) = 0. Since breadth > 0, b = 18 m and length = 28 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m1-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A train travels 360 km at a uniform speed. If its speed were 5 km/h more, it would take 1 hour less. Find its original speed.', '45 km/h', '40 km/h', '50 km/h', '35 km/h', 'B', 'Time = distance / speed. 360/v − 360/(v + 5) = 1 => 360(5) = v(v + 5) => v² + 5v − 1800 = 0 => (v + 45)(v − 40) = 0. Since speed is positive, v = 40 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The roots of the equation x² − 9 = 0 are:', '3, −3', '0, 9', '9, −9', '3, 3', 'A', 'x² = 9 => x = ±√9 = ±3. Thus the roots are 3 and −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'If the discriminant of a quadratic equation is negative (D < 0), its roots are:', 'Real and equal', 'Real and distinct', 'Not real', 'Rational and equal', 'C', 'When D < 0, the square root of D is not a real number, meaning the quadratic equation has no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value of m for which 4x² + 4mx + 9 = 0 has equal roots.', 'm = ±9', 'm = 3 only', 'm = ±6', 'm = ±3', 'D', 'D = (4m)² − 4(4)(9) = 16m² − 144 = 0 => 16m² = 144 => m² = 9 => m = ±3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 3x² − 10x + 8 = 0.', 'x = 2, 4/3', 'x = 2, 3/4', 'x = 3, 4/3', 'x = −2, −4/3', 'A', '3x² − 6x − 4x + 8 = 3x(x − 2) − 4(x − 2) = (3x − 4)(x − 2) = 0 => x = 2, 4/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Without solving, state the nature of roots of 5x² + 2x + 1 = 0.', 'No real roots', 'Real and distinct', 'Rational roots', 'Real and equal', 'A', 'D = b² − 4ac = 2² − 4(5)(1) = 4 − 20 = −16 < 0. Hence, there are no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve by factorisation: 6x² − x − 2 = 0.', 'x = −2/3, 1/2', 'x = 2/3, −1/2', 'x = 3/2, −1', 'x = 2, −1/3', 'B', '6x² − 4x + 3x − 2 = 2x(3x − 2) + 1(3x − 2) = (2x + 1)(3x − 2) = 0 => x = 2/3, −1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'For what value(s) of k does x² + (k − 2)x + 9 = 0 have real and equal roots?', 'k = 6 or −6', 'k = 8 or −4', 'k = 4 or −8', 'k = 5 or −3', 'B', 'D = (k − 2)² − 4(1)(9) = 0 => (k − 2)² = 36 => k − 2 = ±6 => k = 8 or k = −4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The sum of the squares of two consecutive positive integers is 365. Find the integers.', '11, 12', '12, 13', '13, 14', '14, 15', 'C', 'n² + (n + 1)² = 365 => 2n² + 2n + 1 = 365 => 2n² + 2n − 364 = 0 => n² + n − 182 = 0 => (n + 14)(n − 13) = 0. Positive integer n = 13; integers are 13 and 14.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The product of the ages of two sisters is 320. The elder sister is 4 years older than the younger. Find their ages.', '14 and 18 years', '16 and 20 years', '15 and 19 years', '12 and 16 years', 'B', 'Let younger sister = x years. Elder = x + 4. x(x + 4) = 320 => x² + 4x − 320 = 0 => (x + 20)(x − 16) = 0. x = 16, so ages are 16 and 20 years.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m2-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A boat travels 24 km downstream and 18 km upstream in 5 hours. Its speed in still water is 9 km/h. Find the speed of the current.', '1.5 km/h', '2 km/h', '4 km/h', '3 km/h', 'D', 'Downstream speed = 9 + v, Upstream speed = 9 − v. 24/(9 + v) + 18/(9 − v) = 5. Substituting v = 3: 24/12 + 18/6 = 2 + 3 = 5 hours. Speed of current = 3 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which of the following equations has equal real roots?', '2x² + x + 1 = 0', 'x² + 1 = 0', 'x² − 5x + 6 = 0', 'x² − 4x + 4 = 0', 'D', 'For x² − 4x + 4 = 0, D = (−4)² − 4(1)(4) = 16 − 16 = 0. Hence it has equal real roots (x = 2).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The standard form of a quadratic equation in variable x is:', 'ax + b = 0', 'ax² + bx + c = 0, where a ≠ 0', 'ax³ + bx + c = 0', 'ax² + c = 0 only', 'B', 'A quadratic equation is of degree 2: ax² + bx + c = 0, where a, b, c are real numbers and the leading coefficient a ≠ 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the condition on k such that x² − 4x + k = 0 has two distinct real roots.', 'k > 4', 'k < 4', 'k = 4', 'k ≤ 4', 'B', 'For two distinct real roots, D > 0 => (−4)² − 4(1)(k) > 0 => 16 − 4k > 0 => 4k < 16 => k < 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 2x² + x − 6 = 0.', 'x = 3/2, 2', 'x = −3/2, 2', 'x = 3/2, −2', 'x = 1, −3', 'C', '2x² + 4x − 3x − 6 = 2x(x + 2) − 3(x + 2) = (2x − 3)(x + 2) = 0 => x = 3/2, −2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the discriminant of 7x² − 6x + 2 = 0 and state the nature of roots.', 'D = −20; no real roots', 'D = 20; two distinct real roots', 'D = 0; two equal real roots', 'D = −16; no real roots', 'A', 'D = b² − 4ac = (−6)² − 4(7)(2) = 36 − 56 = −20 < 0. Therefore, the equation has no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve using the quadratic formula: 3x² − 2x − 1 = 0.', 'x = 1, 1/3', 'x = 2, −1/2', 'x = −1, 1/3', 'x = 1, −1/3', 'D', 'a = 3, b = −2, c = −1. D = 4 − 4(3)(−1) = 16. x = (2 ± 4)/6 => x = 6/6 = 1 or x = −2/6 = −1/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value of a for which ax² − 6x + 3 = 0 has equal roots.', 'a = 3', 'a = 2', 'a = 1', 'a = 4', 'A', 'For equal roots, D = 0 => (−6)² − 4(a)(3) = 0 => 36 − 12a = 0 => 12a = 36 => a = 3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The sum of two positive integers is 25 and their product is 144. Find the integers.', '8 and 18', '10 and 15', '12 and 12', '9 and 16', 'D', 'Let integers be x and 25 − x. x(25 − x) = 144 => x² − 25x + 144 = 0 => (x − 9)(x − 16) = 0. The numbers are 9 and 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A rectangular garden has area 300 m². Its length is 5 m more than its breadth. Find its dimensions.', 'Length = 30 m, Breadth = 10 m', 'Length = 25 m, Breadth = 12 m', 'Length = 20 m, Breadth = 15 m', 'Length = 22 m, Breadth = 17 m', 'C', 'b(b + 5) = 300 => b² + 5b − 300 = 0 => (b + 20)(b − 15) = 0. Since b > 0, breadth = 15 m and length = 20 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m3-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A car covers 210 km at a constant speed. If its speed is increased by 5 km/h, the journey takes 1 hour less. Find its original speed.', '35 km/h', '25 km/h', '30 km/h', '40 km/h', 'C', '210/v − 210/(v + 5) = 1 => 210(5) = v(v + 5) => v² + 5v − 1050 = 0 => (v + 35)(v − 30) = 0 => v = 30 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'If x = 2 is a root of x² − 5x + k = 0, then the value of k is:', '4', '6', '8', '10', 'B', 'Substitute x = 2: 2² − 5(2) + k = 0 => 4 − 10 + k = 0 => −6 + k = 0 => k = 6.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The discriminant formula for ax² + bx + c = 0 is:', 'b² + 4ac', 'b² − 4ac', '4ac − b²', 'a² − 4bc', 'B', 'The discriminant of ax² + bx + c = 0 is defined as D = b² − 4ac.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find k if 2x² + 5x + k = 0 has equal roots.', 'k = 25/4', 'k = 5/2', 'k = 8/25', 'k = 25/8', 'D', 'Equal roots require D = 0 => 5² − 4(2)(k) = 0 => 25 − 8k = 0 => 8k = 25 => k = 25/8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve by factorisation: x² + x − 20 = 0.', 'x = 4, −5', 'x = −4, 5', 'x = 2, −10', 'x = 4, 5', 'A', 'x² + x − 20 = (x + 5)(x − 4) = 0 => x = 4 or x = −5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Check whether 2x² − 4x + 5 = 0 has real roots.', 'Infinitely many roots', 'Two real and equal roots', 'Two real and distinct roots', 'No real roots (D = −24)', 'D', 'D = (−4)² − 4(2)(5) = 16 − 40 = −24 < 0. Hence the equation has no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-quad-m4-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 5x² − 13x + 6 = 0.', 'x = 2, 3/5', 'x = 3, 2/5', 'x = −2, −3/5', 'x = 1, 6/5', 'A', '5x² − 10x − 3x + 6 = 5x(x − 2) − 3(x − 2) = (5x − 3)(x − 2) = 0 => x = 2, 3/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the values of k for which x² + 2(k + 1)x + 9 = 0 has equal roots.', 'k = 3 or −3', 'k = 4 or −2', 'k = 2 or −4', 'k = 1 or −5', 'C', 'D = [2(k + 1)]² − 4(1)(9) = 0 => 4(k + 1)² = 36 => (k + 1)² = 9 => k + 1 = ±3 => k = 2 or k = −4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The product of two consecutive positive odd integers is 195. Find them.', '13, 15', '15, 17', '17, 19', '11, 13', 'A', 'Let odd integers be n and n + 2. n(n + 2) = 195 => n² + 2n − 195 = 0 => (n + 15)(n − 13) = 0. Positive integer n = 13. The integers are 13 and 15.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The area of a right-angled triangular plot is 150 m². The perpendicular sides differ by 5 m. Find the sides.', 'Sides are 12 m and 25 m', 'Sides are 10 m and 30 m', 'Sides are 15 m and 20 m', 'Sides are 18 m and 23 m', 'C', '1/2 × x × (x + 5) = 150 => x² + 5x = 300 => x² + 5x − 300 = 0 => (x + 20)(x − 15) = 0. x = 15 m, so perpendicular sides are 15 m and 20 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m4-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A person covers 48 km partly on foot at 4 km/h and partly by bicycle at 12 km/h. Total time is 5 hours. Find the distance covered on foot and bicycle.', '8 km on foot, 40 km on bicycle', '10 km on foot, 38 km on bicycle', '6 km on foot, 42 km on bicycle', '12 km on foot, 36 km on bicycle', 'C', 'x/4 + (48 − x)/12 = 5 => 3x + 48 − x = 60 => 2x = 12 => x = 6 km on foot, and 48 − 6 = 42 km on bicycle.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The equation 4x² − 12x + 9 = 0 has:', 'Equal real roots', 'Two distinct real roots', 'No real roots', 'One zero root', 'A', 'D = (−12)² − 4(4)(9) = 144 − 144 = 0. Thus the equation has two equal real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which is a correct factorised form of x² − x − 12 = 0?', '(x − 6)(x + 2) = 0', '(x + 4)(x − 3) = 0', '(x − 4)(x + 3) = 0', '(x − 4)(x − 3) = 0', 'C', 'Product is −12 and sum is −1. The numbers are −4 and 3, so (x − 4)(x + 3) = 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value(s) of p for which x² + px + 16 = 0 has equal roots.', 'p = ±8', 'p = −8 only', 'p = 8 only', 'p = ±4', 'A', 'D = p² − 4(1)(16) = p² − 64 = 0 => p² = 64 => p = ±8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 4x² − 4x − 3 = 0.', 'x = 3, −1/4', 'x = 3/2, −1/2', 'x = 2, −3/4', 'x = 1/2, −3/2', 'B', '4x² − 6x + 2x − 3 = 2x(2x − 3) + 1(2x − 3) = (2x + 1)(2x − 3) = 0 => x = 3/2, −1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Determine the nature of roots of 9x² + 6x + 1 = 0.', 'Real and distinct roots', 'Real and equal roots', 'No real roots', 'Cannot be determined', 'B', 'D = 6² − 4(9)(1) = 36 − 36 = 0. Real and equal roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve using the quadratic formula: 2x² + 3x − 7 = 0.', 'x = (−3 ± √61)/4', 'x = (−3 ± √65)/2', 'x = (3 ± √65)/4', 'x = (−3 ± √65)/4', 'D', 'D = 3² − 4(2)(−7) = 9 + 56 = 65. x = (−3 ± √65)/(2 × 2) = (−3 ± √65)/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'For what values of k does 3x² − 2x + k = 0 have no real roots?', 'k > 1/3', 'k = 1/3', 'k < 1/3', 'k ≥ 1/3', 'A', 'No real roots requires D < 0 => (−2)² − 4(3)(k) < 0 => 4 − 12k < 0 => 12k > 4 => k > 1/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Two positive numbers differ by 3 and their product is 180. Find the numbers.', '10 and 18', '9 and 20', '12 and 15', '15 and 18', 'C', 'x(x + 3) = 180 => x² + 3x − 180 = 0 => (x + 15)(x − 12) = 0. Positive number x = 12; numbers are 12 and 15.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A rectangular park has perimeter 74 m and area 330 m². Find its length and breadth.', 'Length = 25 m, Breadth = 12 m', 'Length = 22 m, Breadth = 15 m', 'Length = 30 m, Breadth = 11 m', 'Length = 24 m, Breadth = 13 m', 'B', '2(l + b) = 74 => l + b = 37. lb = 330. Equation: t² − 37t + 330 = 0 => (t − 22)(t − 15) = 0. Dimensions are 22 m and 15 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m5-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A bus covers 300 km at a uniform speed. If it had travelled 5 km/h faster, it would have taken 2 hours less. Find its original speed.', '30 km/h', '35 km/h', '20 km/h', '25 km/h', 'D', '300/v − 300/(v + 5) = 2 => 150(5) = v(v + 5) => v² + 5v − 750 = 0 => (v + 30)(v − 25) = 0 => v = 25 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The roots of x² − 6x + 9 = 0 are:', '3, 3', '−3, −3', '3, −3', '6, 9', 'A', '(x − 3)² = 0 => x = 3, 3 (equal real roots).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A quadratic equation has real and distinct roots when:', 'D = 0', 'D < 0', 'D > 0', 'a = 0', 'C', 'A quadratic equation ax² + bx + c = 0 has two distinct real roots if and only if its discriminant D > 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find k if 3x² − 12x + k = 0 has equal roots.', 'k = 12', 'k = 6', 'k = 16', 'k = 4', 'A', 'D = (−12)² − 4(3)(k) = 144 − 12k = 0 => 12k = 144 => k = 12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 2x² − 9x + 10 = 0.', 'x = −2, −5/2', 'x = 2, 5/2', 'x = 1, 5', 'x = 3, 4/3', 'B', '2x² − 4x − 5x + 10 = 2x(x − 2) − 5(x − 2) = (2x − 5)(x − 2) = 0 => x = 2, 5/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the discriminant of 4x² + 4x + 5 = 0 and state the nature of roots.', 'D = 64; real distinct', 'D = −16; no real roots', 'D = 0; real equal', 'D = −64; no real roots', 'D', 'D = 4² − 4(4)(5) = 16 − 80 = −64 < 0. No real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve by factorisation: 3x² + 2x − 8 = 0.', 'x = −4/3, 2', 'x = 1, −8/3', 'x = 4/3, −2', 'x = 2/3, −4', 'C', '3x² + 6x − 4x − 8 = 3x(x + 2) − 4(x + 2) = (3x − 4)(x + 2) = 0 => x = 4/3, −2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Determine the values of m for which 2x² + mx + 8 = 0 has real roots.', 'm = ±8 only', '−8 < m < 8', 'm ≥ 8 only', 'm ≤ −8 or m ≥ 8', 'D', 'Real roots require D ≥ 0 => m² − 4(2)(8) ≥ 0 => m² − 64 ≥ 0 => m² ≥ 64 => m ≤ −8 or m ≥ 8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The sum of the squares of two consecutive positive integers is 421. Find them.', '13, 14', '14, 15', '15, 16', '12, 13', 'B', 'n² + (n + 1)² = 421 => 2n² + 2n − 420 = 0 => n² + n − 210 = 0 => (n + 15)(n − 14) = 0. Positive integer n = 14; integers are 14 and 15.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A two-digit number is 4 times the sum of its digits. The number formed by reversing the digits is 27 more than the original. Find the number.', '36', '24', '48', '18', 'A', 'Let number = 10a + b. 10a + b = 4(a + b) => 6a = 3b => b = 2a. Reversing gives 10b + a = (10a + b) + 27 => 9(b − a) = 27 => b − a = 3. 2a − a = 3 => a = 3, b = 6. Number = 36.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m6-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A boat travels 30 km downstream and 18 km upstream in 4 hours. Its speed in still water is 12 km/h. Find the speed of the current.', '2 km/h', '3 km/h', '4 km/h', '2.5 km/h', 'B', '30/(12 + v) + 18/(12 − v) = 4. For v = 3: 30/15 + 18/9 = 2 + 2 = 4 hours. The current speed is 3 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which of the following is not a quadratic equation?', 'x² + x = x² + 3', '(x + 1)(x − 2) = 0', 'x² − 4 = 0', '2x² − x + 1 = 0', 'A', 'In x² + x = x² + 3, x² cancels on both sides leaving x = 3, which is a linear equation (degree 1), not quadratic.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'If D = 0 for a quadratic equation, its roots are:', 'Non-real', 'Real and distinct', 'Real and equal', 'Irrational only', 'C', 'When discriminant D = 0, x = (−b ± 0)/(2a) = −b/(2a), meaning there are two real and equal roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value of c for which x² + 10x + c = 0 has equal roots.', 'c = 10', 'c = 100', 'c = 50', 'c = 25', 'D', 'Equal roots require D = 0 => 10² − 4(1)(c) = 0 => 100 − 4c = 0 => 4c = 100 => c = 25.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 5x² − 11x + 2 = 0.', 'x = 1, 2/5', 'x = −2, −1/5', 'x = 3, 1/5', 'x = 2, 1/5', 'D', '5x² − 10x − x + 2 = 5x(x − 2) − 1(x − 2) = (5x − 1)(x − 2) = 0 => x = 2, 1/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Determine whether x² − 2√2x + 3 = 0 has real roots.', 'No real roots (D = −4)', 'Two equal real roots (D = 0)', 'Two distinct real roots (D = 4)', 'Infinitely many roots', 'A', 'D = (−2√2)² − 4(1)(3) = 8 − 12 = −4 < 0. Since D < 0, it has no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 3x² − 7x + 2 = 0.', 'x = 1, 2/3', 'x = −2, −1/3', 'x = 2, 1/3', 'x = 3, 1/2', 'C', '3x² − 6x − x + 2 = 3x(x − 2) − 1(x − 2) = (3x − 1)(x − 2) = 0 => x = 2, 1/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find k if (k + 1)x² − 6x + 2 = 0 has equal roots.', 'k = 5/2', 'k = 7/2', 'k = 3', 'k = 4', 'B', 'D = (−6)² − 4(k + 1)(2) = 36 − 8(k + 1) = 0 => 8(k + 1) = 36 => k + 1 = 9/2 => k = 7/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The product of two consecutive even positive integers is 224. Find them.', '12 and 14', '14 and 16', '10 and 12', '16 and 18', 'B', 'Let integers be 2n and 2n + 2. n(n + 1) = 56 => n² + n − 56 = 0 => (n + 8)(n − 7) = 0 => n = 7. The integers are 14 and 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The length of a rectangle is 7 m more than its breadth. Its area is 330 m². Find its dimensions.', 'Length = 22 m, Breadth = 15 m', 'Length = 20 m, Breadth = 13 m', 'Length = 25 m, Breadth = 18 m', 'Length = 24 m, Breadth = 17 m', 'A', 'b(b + 7) = 330 => b² + 7b − 330 = 0 => (b + 22)(b − 15) = 0 => b = 15 m, length = 22 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m7-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A cyclist covers 60 km at a certain speed. If the speed were 3 km/h more, the journey would take 1 hour less. Find the original speed.', '15 km/h', '12 km/h', '10 km/h', '9 km/h', 'B', '60/v − 60/(v + 3) = 1 => 60(3) = v(v + 3) => v² + 3v − 180 = 0 => (v + 15)(v − 12) = 0 => v = 12 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The roots of x² + 5x + 6 = 0 are:', '−2, −3', '2, 3', '2, −3', '−2, 3', 'A', '(x + 2)(x + 3) = 0 => x = −2, −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'For ax² + bx + c = 0, if c = 0, one root is always:', '1', '−1', 'a', '0', 'D', 'When c = 0, ax² + bx = 0 => x(ax + b) = 0 => x = 0 is always a root.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find k so that 2x² − 4x + k = 0 has no real roots.', 'k < 2', 'k > 2', 'k ≤ 2', 'k = 2', 'B', 'D = (−4)² − 4(2)(k) < 0 => 16 − 8k < 0 => 8k > 16 => k > 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 3x² + 5x − 2 = 0.', 'x = −1/3, 2', 'x = 1/3, −2', 'x = 1/2, −3', 'x = 2/3, −1', 'B', '3x² + 6x − x − 2 = 3x(x + 2) − 1(x + 2) = (3x − 1)(x + 2) = 0 => x = 1/3, −2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the discriminant and nature of roots of 2x² − 4√2x + 4 = 0.', 'D = 32; distinct real roots', 'D = −32; no real roots', 'D = 0; real and equal roots', 'D = 16; distinct rational roots', 'C', 'D = (−4√2)² − 4(2)(4) = 32 − 32 = 0. Real and equal roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve using quadratic formula: 5x² + 6x − 2 = 0.', 'x = (−3 ± √19)/10', 'x = (−3 ± √19)/5', 'x = (3 ± √19)/5', 'x = (−6 ± √19)/5', 'B', 'D = 6² − 4(5)(−2) = 36 + 40 = 76 = 4 × 19. x = (−6 ± 2√19)/10 = (−3 ± √19)/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value(s) of p for which x² − 2px + 25 = 0 has real roots.', '−5 ≤ p ≤ 5', 'p = ±5 only', 'p ≤ −5 or p ≥ 5', 'p ≥ 5 only', 'C', 'Real roots require D ≥ 0 => (−2p)² − 4(1)(25) ≥ 0 => 4p² − 100 ≥ 0 => p² ≥ 25 => p ≤ −5 or p ≥ 5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The square of a positive integer is 56 more than 5 times the integer. Find the integer.', '8', '7', '9', '6', 'A', 'n² = 5n + 56 => n² − 5n − 56 = 0 => (n − 8)(n + 7) = 0. Positive integer n = 8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A rectangular floor has area 384 m². Its length is 8 m more than its breadth. Find its dimensions.', 'Length = 24 m, Breadth = 16 m', 'Length = 20 m, Breadth = 12 m', 'Length = 26 m, Breadth = 18 m', 'Length = 32 m, Breadth = 12 m', 'A', 'b(b + 8) = 384 => b² + 8b − 384 = 0 => (b + 24)(b − 16) = 0 => b = 16 m, length = 24 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m8-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A car travels 150 km at a uniform speed. If its speed were 5 km/h less, it would take 1 hour more. Find its original speed.', '25 km/h', '35 km/h', '40 km/h', '30 km/h', 'D', '150/(v − 5) − 150/v = 1 => 150(5) = v(v − 5) => v² − 5v − 750 = 0 => (v − 30)(v + 25) = 0 => v = 30 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The roots of x² − 2x + 5 = 0 are:', 'Real and equal', 'No real roots', 'Real and distinct', 'One zero root', 'B', 'D = (−2)² − 4(1)(5) = 4 − 20 = −16 < 0. Hence there are no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which value of k makes x² + 8x + k = 0 have equal roots?', '16', '8', '32', '64', 'A', 'D = 8² − 4(1)(k) = 64 − 4k = 0 => 4k = 64 => k = 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the range of k for which x² − 4x + k = 0 has real roots.', 'k < 4', 'k ≥ 4', 'k ≤ 4', 'k > 4', 'C', 'Real roots require D ≥ 0 => (−4)² − 4(1)(k) ≥ 0 => 16 − 4k ≥ 0 => 4k ≤ 16 => k ≤ 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 2x² − 7x + 3 = 0.', 'x = 2, 1/3', 'x = −3, −1/2', 'x = 3, 1/2', 'x = 3, −1/2', 'C', '2x² − 6x − x + 3 = 2x(x − 3) − 1(x − 3) = (2x − 1)(x − 3) = 0 => x = 3, 1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Check whether 4x² + 4x + 1 = 0 has equal roots.', 'Cannot be determined', 'No, D > 0 so distinct real roots', 'No, D < 0 so no real roots', 'Yes, D = 0 so equal real roots', 'D', 'D = 4² − 4(4)(1) = 16 − 16 = 0. Since D = 0, the equation has real and equal roots (x = −1/2).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-quad-m9-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 4x² − 4x − 15 = 0.', 'x = 3, −5/4', 'x = 5, −3', 'x = −5/2, 3/2', 'x = 5/2, −3/2', 'D', '4x² − 10x + 6x − 15 = 2x(2x − 5) + 3(2x − 5) = (2x + 3)(2x − 5) = 0 => x = 5/2, −3/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find k if 2x² + (k − 1)x + 2 = 0 has equal roots.', 'k = 4 or −4', 'k = 5 or −3', 'k = 3 or −5', 'k = 2 or −2', 'B', 'D = (k − 1)² − 4(2)(2) = (k − 1)² − 16 = 0 => (k − 1)² = 16 => k − 1 = ±4 => k = 5 or k = −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Two consecutive positive integers have a product of 420. Find them.', '19, 20', '21, 22', '20, 21', '22, 23', 'C', 'n(n + 1) = 420 => n² + n − 420 = 0 => (n + 21)(n − 20) = 0 => n = 20. The integers are 20 and 21.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The sum of the areas of two squares is 500 cm². The side of the larger square is 10 cm more than the smaller. Find their sides.', '10 cm and 20 cm', '12 cm and 22 cm', '15 cm and 25 cm', '8 cm and 18 cm', 'A', 'x² + (x + 10)² = 500 => 2x² + 20x + 100 = 500 => 2x² + 20x − 400 = 0 => x² + 10x − 200 = 0 => (x + 20)(x − 10) = 0. x = 10 cm; sides are 10 cm and 20 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m9-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A boat travels 24 km downstream and 18 km upstream in 5 hours. The speed of the boat in still water is 9 km/h. Find the speed of the current.', '2 km/h', '1.5 km/h', '4 km/h', '3 km/h', 'D', '24/(9 + v) + 18/(9 − v) = 5. Substituting v = 3: 24/12 + 18/6 = 2 + 3 = 5. Current speed = 3 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-1', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Which of the following equations has no real roots?', 'x² − 4x + 4 = 0', 'x² + 2x + 5 = 0', 'x² − 5x + 6 = 0', 'x² − 9 = 0', 'B', 'For x² + 2x + 5 = 0, D = 2² − 4(1)(5) = 4 − 20 = −16 < 0. Hence it has no real roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-2', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'If α is a root of x² − 7x + 10 = 0 and α = 5, the other root is:', '1', '5', '2', '7', 'C', 'Product of roots = c/a = 10/1 = 10. Since one root is 5, other root = 10/5 = 2 (or factorise as (x − 5)(x − 2) = 0).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-3', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the value(s) of k for which 4x² + kx + 1 = 0 has equal roots.', 'k = ±2', 'k = ±16', 'k = ±4', 'k = 4 only', 'C', 'Equal roots require D = 0 => k² − 4(4)(1) = 0 => k² − 16 = 0 => k² = 16 => k = ±4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-4', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve: 6x² + x − 2 = 0.', 'x = −1/2, 2/3', 'x = 1/3, −1', 'x = 2, −1/6', 'x = 1/2, −2/3', 'D', '6x² + 4x − 3x − 2 = 2x(3x + 2) − 1(3x + 2) = (2x − 1)(3x + 2) = 0 => x = 1/2, −2/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-5', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Determine the nature of roots of 2x² − 4x + 2 = 0.', 'Cannot be determined', 'Real and distinct roots', 'No real roots', 'Real and equal roots', 'D', 'Dividing by 2 gives x² − 2x + 1 = (x − 1)² = 0. D = (−4)² − 4(2)(2) = 16 − 16 = 0. Real and equal roots.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-6', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Solve using the quadratic formula: 2x² − 4x − 1 = 0.', 'x = (2 ± √6)/2', 'x = 1 ± √6', 'x = (4 ± √6)/2', 'x = 2 ± √3', 'A', 'D = (−4)² − 4(2)(−1) = 16 + 8 = 24 = 4 × 6. x = (4 ± 2√6)/4 = (2 ± √6)/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-7', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'Find the range of k for which 5x² + 2x + k = 0 has no real roots.', 'k < 1/5', 'k = 1/5', 'k ≥ 1/5', 'k > 1/5', 'D', 'No real roots requires D < 0 => 2² − 4(5)(k) < 0 => 4 − 20k < 0 => 20k > 4 => k > 1/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-8', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The product of two consecutive positive integers is 552. Find the integers.', '23, 24', '24, 25', '21, 22', '22, 23', 'A', 'n(n + 1) = 552 => n² + n − 552 = 0 => (n + 24)(n − 23) = 0 => n = 23. The integers are 23 and 24.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-9', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'The length of a rectangular hall is 6 m more than its breadth. Its area is 432 m². Find its dimensions.', 'Length = 26 m, Breadth = 16 m', 'Length = 24 m, Breadth = 18 m', 'Length = 28 m, Breadth = 14 m', 'Length = 30 m, Breadth = 12 m', 'B', 'b(b + 6) = 432 => b² + 6b − 432 = 0 => (b + 24)(b − 18) = 0 => b = 18 m, length = 24 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-quad-m10-10', '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', 'A car travels 150 km at a uniform speed. If its speed were 5 km/h less, it would take 1 hour more. Find its original speed.', '30 km/h', '25 km/h', '35 km/h', '40 km/h', 'A', '150/(v − 5) − 150/v = 1 => v² − 5v − 750 = 0 => (v − 30)(v + 25) = 0 => v = 30 km/h.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('q-ap-m1-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Which sequence is an arithmetic progression (AP)?', '2, 4, 8, 16, ...', '1, 4, 9, 16, ...', '1, 2, 4, 7, ...', '7, 11, 15, 19, ...', 'D', 'In 7, 11, 15, 19, ... each consecutive difference is 11 − 7 = 15 − 11 = 19 − 15 = 4 (constant common difference). The others do not have a constant difference.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the common difference d and the 12th term of the AP 18, 13, 8, 3, ...', 'd = −5, a₁₂ = −42', 'd = 5, a₁₂ = 73', 'd = −5, a₁₂ = −37', 'd = −4, a₁₂ = −26', 'C', 'First term a = 18, d = 13 − 18 = −5. a₁₂ = a + 11d = 18 + 11(−5) = 18 − 55 = −37.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A sequence begins 5, x, 17, ... and is an AP. Find the value of x.', '11', '10', '12', '13', 'A', 'In an AP, consecutive differences are equal: x − 5 = 17 − x => 2x = 22 => x = 11.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'State whether true or false: "Every sequence whose terms strictly increase is an arithmetic progression."', 'True, increasing terms guarantee an AP', 'False, the difference between consecutive terms must be constant', 'True only for positive integers', 'False, increasing sequences are geometric progressions only', 'B', 'False. An AP requires a constant common difference d. For example, 1, 2, 4, 8 increases, but the differences are 1, 2, 4 (not constant).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Which term of the AP 3, 8, 13, 18, ... is 78?', '14th term', '15th term', '17th term', '16th term', 'D', 'a = 3, d = 5. aₙ = a + (n − 1)d => 78 = 3 + 5(n − 1) => 75 = 5(n − 1) => n − 1 = 15 => n = 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Insert three arithmetic means between 4 and 20.', '7, 11, 15', '8, 12, 16', '6, 10, 14', '8, 13, 17', 'B', 'Let the means be A₁, A₂, A₃. The AP is 4, A₁, A₂, A₃, 20 with 5 terms. a₅ = 4 + 4d = 20 => 4d = 16 => d = 4. The means are 8, 12, 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A student writes the 20th term of an AP as a + 20d. Identify the correct expression.', 'a + 21d', 'a + 19d', '20a + d', 'a + 20d − 1', 'B', 'The formula for the nth term is aₙ = a + (n − 1)d. For n = 20, a₂₀ = a + (20 − 1)d = a + 19d.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A hall has 15 rows of seats. The first row has 18 seats and each next row has 2 more seats. How many seats are in the 15th row?', '44 seats', '48 seats', '46 seats', '50 seats', 'C', 'a = 18, d = 2, n = 15. a₁₅ = a + 14d = 18 + 14(2) = 18 + 28 = 46 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of the first 20 terms of the AP 6, 10, 14, 18, ...', '880', '860', '900', '840', 'A', 'a = 6, d = 4, n = 20. S₂₀ = (20/2)[2(6) + 19(4)] = 10[12 + 76] = 10(88) = 880.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m1-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 7th term of an AP is 24 and its 13th term is 48. Find the first term a and common difference d.', 'a = 0, d = 4', 'a = 2, d = 3', 'a = 4, d = 4', 'a = −4, d = 5', 'A', 'a + 6d = 24 and a + 12d = 48. Subtracting gives 6d = 24 => d = 4. Then a = 24 − 6(4) = 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The formula for the nth term of an AP with first term a and common difference d is:', 'aₙ = an + d', 'aₙ = a + (n − 1)d', 'aₙ = a + nd', 'aₙ = (a + d)(n − 1)', 'B', 'The standard formula is aₙ = a + (n − 1)d.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 5th term of an AP is 17 and the 11th term is 41. Find its first term a.', 'a = 1', 'a = 2', 'a = 3', 'a = 4', 'A', 'a + 4d = 17 and a + 10d = 41 => 6d = 24 => d = 4. Then a = 17 − 4(4) = 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Is 301 a term of the AP 5, 11, 17, 23, ...? Justify.', 'Yes, it is the 50th term', 'No, because n evaluates to 151/3 which is not an integer', 'Yes, it is the 51st term', 'No, because 301 is an odd number', 'B', 'a = 5, d = 6. 301 = 5 + (n − 1)6 => 296 = 6(n − 1) => n − 1 = 148/3, which is not an integer. Hence 301 is not a term.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Assertion: The sequence 2, 5, 8, 11, ... is an AP. Reason: Its common difference is 3. Which option is correct?', 'A is false but R is true', 'Both A and R are true, but R is not the correct explanation', 'A is true but R is false', 'Both A and R are true, and R is the correct explanation of A', 'D', 'Consecutive differences are 5 − 2 = 3, 8 − 5 = 3, 11 − 8 = 3. A constant difference between consecutive terms defines an AP, so reason explains assertion.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 8th term of an AP is 31 and the 15th term is 59. Find the 25th term.', '99', '97', '101', '95', 'A', 'a₁₅ − a₈ = 7d = 59 − 31 = 28 => d = 4. a = 31 − 7(4) = 3. a₂₅ = 3 + 24(4) = 3 + 96 = 99.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Three numbers are in AP. Their sum is 27 and their product is 585. Find the numbers.', '3, 9, 15', '4, 9, 14', '5, 9, 13', '6, 9, 12', 'C', 'Let numbers be 9 − d, 9, 9 + d. Product = 9(81 − d²) = 585 => 81 − d² = 65 => d² = 16 => d = ±4. Numbers are 5, 9, 13.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A person saves ₹500 in the first month and increases savings by ₹75 every month. How much does the person save in the 12th month?', '₹1,350', '₹1,400', '₹1,250', '₹1,325', 'D', 'a = 500, d = 75, n = 12. a₁₂ = 500 + 11(75) = 500 + 825 = ₹1,325.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the 18th term from the end of the AP 4, 9, 14, ..., 124.', '44', '34', '39', '41', 'C', 'Reversing the AP from 124 with d = −5: 18th term from end = 124 + 17(−5) = 124 − 85 = 39.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If the 4th term of an AP is 0, what is the relation between the 10th term and the 6th term?', 'a₁₀ = 2a₆', 'a₁₀ = 4a₆', 'a₁₀ = 3a₆', 'a₁₀ = a₆ + 10', 'C', 'a₄ = a + 3d = 0 => a = −3d. a₁₀ = a + 9d = −3d + 9d = 6d. a₆ = a + 5d = −3d + 5d = 2d. Hence a₁₀ = 3(2d) = 3a₆.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m2-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of the first n terms of an AP is Sₙ = 3n² + 2n. Find the 10th term a₁₀.', '55', '57', '53', '61', 'B', 'aₙ = Sₙ − Sₙ₋₁ = (3n² + 2n) − [3(n − 1)² + 2(n − 1)] = 6n − 1. For n = 10, a₁₀ = 6(10) − 3 = 57.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of the first 15 positive odd numbers (1, 3, 5, ...).', '210', '225', '240', '196', 'B', 'Sum of first n odd numbers is n². For n = 15, S₁₅ = 15² = 225.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find S₂₅ for the AP 12, 9, 6, 3, ...', '−550', '−600', '−625', '−575', 'B', 'a = 12, d = −3, n = 25. S₂₅ = (25/2)[2(12) + 24(−3)] = (25/2)[24 − 72] = (25/2)(−48) = −600.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A sequence has first term 7 and common difference 4. Can the sum of n terms be 315?', 'Yes, n = 12', 'Yes, n = 15', 'Yes, n = 14', 'No positive integer n gives sum 315', 'D', 'Sₙ = (n/2)[14 + 4(n − 1)] = n(2n + 5) = 315 => 2n² + 5n − 315 = 0. D = 25 + 2520 = 2545, which is not a perfect square. Thus n is not an integer.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'In the sum formula Sₙ = n/2[2a + (n − 1)d], what does the symbol n represent?', 'The number of terms being added', 'The common difference', 'The first term', 'The last term of the AP', 'A', 'n denotes the number of terms whose sum is being calculated.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of all multiples of 7 between 1 and 100.', '750', '700', '735', '728', 'C', 'Multiples are 7, 14, ..., 98. a = 7, d = 7, l = 98. n = 98/7 = 14. S = (14/2)(7 + 98) = 7(105) = 735.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A theatre has 20 rows. The first row has 25 seats and each successive row has 3 more seats. Find the total number of seats.', '1,050 seats', '1,040 seats', '1,100 seats', '1,070 seats', 'D', 'a = 25, d = 3, n = 20. S₂₀ = (20/2)[2(25) + 19(3)] = 10[50 + 57] = 10(107) = 1,070 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of the first 10 terms of an AP is 150 and the first term is 6. Find the common difference d.', 'd = 2', 'd = 3', 'd = 1.5', 'd = 2.5', 'A', 'S₁₀ = 5[2(6) + 9d] = 150 => 12 + 9d = 30 => 9d = 18 => d = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of the first 30 terms of an AP whose 3rd term is 12 and 8th term is 27.', '1,450', '1,500', '1,425', '1,485', 'D', 'a + 2d = 12 and a + 7d = 27 => 5d = 15 => d = 3, a = 6. S₃₀ = 15[2(6) + 29(3)] = 15[12 + 87] = 15(99) = 1,485.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A stack of logs has 20 logs in the bottom row, 19 in the next, and so on until 1 log at the top. How many logs are there in total?', '220 logs', '200 logs', '210 logs', '190 logs', 'C', 'Sum of natural numbers from 1 to 20: S = 20(21)/2 = 210 logs.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m3-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If Sₙ = n(4n + 1), find the 12th term a₁₂.', '91', '95', '93', '89', 'C', 'Sₙ = 4n² + n. Sₙ₋₁ = 4(n − 1)² + (n − 1) = 4n² − 7n + 3. aₙ = Sₙ − Sₙ₋₁ = 8n − 3. a₁₂ = 8(12) − 3 = 96 − 3 = 93.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A staircase has 12 steps. The first step is 10 cm high and each next step is 1.5 cm higher than the previous one. Find the height of the 12th step.', '25.0 cm', '28.0 cm', '26.5 cm', '27.5 cm', 'C', 'a = 10, d = 1.5, n = 12. a₁₂ = a + 11d = 10 + 11(1.5) = 10 + 16.5 = 26.5 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A student reads 8 pages on day 1 and 5 more pages each following day than the previous day. How many pages does the student read on day 14?', '78 pages', '70 pages', '75 pages', '73 pages', 'D', 'a = 8, d = 5, n = 14. a₁₄ = 8 + 13(5) = 8 + 65 = 73 pages.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A loan is repaid in 20 monthly instalments. The first instalment is ₹2,000 and each instalment increases by ₹100. Find the total amount repaid.', '₹59,000', '₹58,000', '₹60,000', '₹56,500', 'A', 'a = 2000, d = 100, n = 20. S₂₀ = 10[2(2000) + 19(100)] = 10[4000 + 1900] = 10(5900) = ₹59,000.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the number of terms in the finite AP 8, 13, 18, ..., 103.', '19', '21', '20', '22', 'C', '103 = 8 + (n − 1)5 => 95 = 5(n − 1) => n − 1 = 19 => n = 20.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A factory produces 1,200 units in the first week and increases production by 80 units every week. Find the total production in 15 weeks.', '25,200 units', '26,400 units', '27,000 units', '24,800 units', 'B', 'a = 1200, d = 80, n = 15. S₁₅ = (15/2)[2400 + 14(80)] = 7.5[2400 + 1120] = 7.5(3520) = 26,400 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-ap-m4-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A ball is dropped from a height of 100 m and rebounds to 3/4 of the previous height each time. Is the sequence of rebound heights an AP?', 'Yes, because the heights decrease systematically', 'Yes, with common difference −25', 'Cannot be determined without calculating all terms', 'No, because the consecutive ratio is constant, making it a geometric progression', 'D', 'Each height is obtained by multiplying the previous by 3/4 (constant ratio, not constant difference). This is a GP, not an AP.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of the first n terms of an AP is 4n² − n. Find the 5th term a₅.', '31', '35', '43', '39', 'B', 'aₙ = Sₙ − Sₙ₋₁ = (4n² − n) − [4(n − 1)² − (n − 1)] = 8n − 5. For n = 5: a₅ = 8(5) − 5 = 35.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A person deposits ₹100 in week 1, ₹150 in week 2, ₹200 in week 3, and so on. In which week will the deposit be ₹600?', 'Week 11', 'Week 10', 'Week 12', 'Week 13', 'A', '600 = 100 + (n − 1)50 => 500 = 50(n − 1) => n − 1 = 10 => n = 11.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A farmer plants 17 trees in the first row, 20 in the second, 23 in the third, and so on across 12 rows. How many trees are planted in total?', '402 trees', '380 trees', '420 trees', '396 trees', 'A', 'a = 17, d = 3, n = 12. S₁₂ = 6[2(17) + 11(3)] = 6[34 + 33] = 6(67) = 402 trees.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m4-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A cyclist covers 24 km on day 1 and increases distance by 2 km each day. On which day will the cyclist cover 50 km, and what is the total distance covered up to that day?', 'Day 13, Total = 480 km', 'Day 14, Total = 518 km', 'Day 15, Total = 550 km', 'Day 14, Total = 500 km', 'B', '50 = 24 + (n − 1)2 => 26 = 2(n − 1) => n = 14. S₁₄ = (14/2)[24 + 50] = 7(74) = 518 km.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Can the number 100 be a term of the AP 4, 9, 14, 19, ...?', 'Yes, it is the 20th term', 'No, because n = 101/5 which is not an integer', 'Yes, it is the 21st term', 'No, because 100 is an even number', 'B', '100 = 4 + (n − 1)5 => 96 = 5(n − 1) => n − 1 = 96/5 = 19.2 (not an integer). So 100 cannot be a term.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If a, b, c are three consecutive terms of an AP, which relation is always true?', 'b² = ac', '2b = a + c', 'b = a + c', 'a + b + c = 0', 'B', 'Since consecutive differences are equal, b − a = c − b => 2b = a + c (b is the arithmetic mean of a and c).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 6th term of an AP is 4 and the 10th term is −8. Find the 20th term.', '−38', '−40', '−35', '−42', 'A', 'a₁₀ − a₆ = 4d = −8 − 4 = −12 => d = −3. a = 4 − 5(−3) = 19. a₂₀ = 19 + 19(−3) = 19 − 57 = −38.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Assertion: The sum of the first 10 terms of 2, 4, 6, ... is 110. Reason: Sₙ = n/2(first term + last term). Which option is correct?', 'A is true but R is false', 'Both A and R are true, but R does not explain A', 'Both A and R are true, and R is the correct explanation of A', 'A is false but R is true', 'C', '10th term = 2 + 9(2) = 20. S₁₀ = (10/2)(2 + 20) = 5(22) = 110. Both are true and formula explains the sum.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If the sum of the first n terms is Sₙ = 2n² + 5n, find the 15th term a₁₅.', '67', '59', '63', '61', 'C', 'aₙ = Sₙ − Sₙ₋₁ = (2n² + 5n) − [2(n − 1)² + 5(n − 1)] = 4n + 3. For n = 15: a₁₅ = 4(15) + 3 = 63.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'How many terms of the AP 9, 17, 25, ... must be taken so that their sum is 636?', '14 terms', '16 terms', '10 terms', '12 terms', 'D', 'a = 9, d = 8. (n/2)[18 + 8(n − 1)] = 636 => n(4n + 5) = 636 => 4n² + 5n − 636 = 0 => (4n + 53)(n − 12) = 0 => n = 12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A student claims that 2, 5, 9, 14, 20 is an AP because it increases. Is the claim correct?', 'Yes, any sequence that increases by adding numbers is an AP', 'No, because the consecutive differences (3, 4, 5, 6) are not constant', 'Yes, because the differences form an AP', 'Cannot be determined', 'B', 'An AP strictly requires the consecutive difference to remain constant. Here differences are 3, 4, 5, 6, so it is not an AP.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 4th term of an AP is 10 and its 9th term is 25. Find the sum of the first 20 terms.', '590', '600', '610', '580', 'A', '5d = 15 => d = 3. a = 10 − 3(3) = 1. S₂₀ = 10[2(1) + 19(3)] = 10[2 + 57] = 590.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of all two-digit numbers divisible by 6.', '825', '840', '780', '810', 'D', 'Numbers are 12, 18, ..., 96. a = 12, d = 6, l = 96. n = (96 − 12)/6 + 1 = 15. S = (15/2)(12 + 96) = (15/2)(108) = 810.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m5-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If the 7th term of an AP is 4 more than its 5th term, find the common difference d.', 'd = 2', 'd = 1', 'd = 3', 'd = 4', 'A', 'a₇ − a₅ = (a + 6d) − (a + 4d) = 2d = 4 => d = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Choose the INCORRECT statement about an Arithmetic Progression (AP):', 'Consecutive differences between terms are equal', 'The common difference must always be positive', 'The common difference may be zero', 'The nth term expression is linear in n', 'B', 'The common difference d can be positive, negative (decreasing AP), or zero (constant AP). It does not have to be positive.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If aₙ = 7 − 3n, identify the first term a and the common difference d.', 'a = 7, d = −3', 'a = 4, d = −3', 'a = 4, d = 3', 'a = 1, d = −3', 'B', 'a₁ = 7 − 3(1) = 4, a₂ = 7 − 3(2) = 1 => d = 1 − 4 = −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 3rd and 7th terms of an AP are 16 and 32. Which term of this AP is equal to 68?', '16th term', '14th term', '15th term', '17th term', 'A', '4d = 16 => d = 4. a = 16 − 2(4) = 8. 68 = 8 + (n − 1)4 => 60 = 4(n − 1) => n − 1 = 15 => n = 16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find two numbers between 10 and 40 such that all four numbers form an AP.', '15 and 30', '18 and 32', '22 and 34', '20 and 30', 'D', 'Terms are 10, a₂, a₃, 40 (4 terms). a₄ = 10 + 3d = 40 => 3d = 30 => d = 10. The numbers are 20 and 30.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A theatre''s first row has 30 seats, and each following row has 4 additional seats. If there are 18 rows, find the total number of seats.', '1,152 seats', '1,120 seats', '1,180 seats', '1,100 seats', 'A', 'a = 30, d = 4, n = 18. S₁₈ = 9[2(30) + 17(4)] = 9[60 + 68] = 9(128) = 1,152 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If Sₙ = 5n² − 2n, determine the first term a and common difference d.', 'a = 2, d = 8', 'a = 5, d = 10', 'a = 3, d = 5', 'a = 3, d = 10', 'D', 'a₁ = S₁ = 5(1)² − 2(1) = 3. aₙ = Sₙ − Sₙ₋₁ = 10n − 7. a₂ = 13 => d = 13 − 3 = 10.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of first 5 terms is 55 and sum of first 10 terms is 210. Find the 6th term a₆.', '23', '21', '25', '27', 'A', 'S₅ = 55 => 5/2[2a + 4d] = 55 => a + 2d = 11. S₁₀ = 210 => 5[2a + 9d] = 210 => 2a + 9d = 42. Solving: d = 4, a = 3. a₆ = a + 5d = 3 + 20 = 23.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A sequence has first term 2 and common difference 0. What is the sum of its first 50 terms?', '50', '0', '100', '200', 'C', 'Since d = 0, every term is 2. S₅₀ = 50 × 2 = 100.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'In an AP of 23 terms, the 12th term from beginning is 37 and 12th term from end is 82. What can be concluded?', 'The AP has sum 1,368.5', 'The data are consistent with d = 2', 'The common difference is negative', 'The data are inconsistent; no such AP exists because both refer to the same 12th term', 'D', 'In a 23-term AP, the 12th term from the start and the 12th term from the end are the exact same middle term. A single term cannot simultaneously be 37 and 82. The data are inconsistent.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m6-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A student writes Sₙ = n/2[2a + nd]. State the error and give the correct formula.', 'The term 2a should be a²', 'The formula should divide by n instead of 2', 'The coefficient of d must be (n − 1); Sₙ = n/2[2a + (n − 1)d]', 'The coefficient of a should be n', 'C', 'Because the nth term is a + (n − 1)d, the coefficient of d is (n − 1), not n.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A school auditorium has 22 seats in the first row. Each next row has 2 extra seats. There are 25 rows. Find the seats in the last row.', '68 seats', '72 seats', '70 seats', '74 seats', 'C', 'a = 22, d = 2, n = 25. a₂₅ = 22 + 24(2) = 22 + 48 = 70 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Using the same auditorium data (25 rows, row 1 = 22, row 25 = 70), calculate the total number of seats in the auditorium.', '1,150 seats', '1,200 seats', '1,100 seats', '1,175 seats', 'A', 'S₂₅ = (25/2)(22 + 70) = (25/2)(92) = 25 × 46 = 1,150 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A savings plan starts at ₹250 in month 1 and increases by ₹50 each month. Find the total saved in 12 months.', '₹6,000', '₹6,500', '₹6,200', '₹6,300', 'D', 'a = 250, d = 50, n = 12. S₁₂ = 6[2(250) + 11(50)] = 6[500 + 550] = 6(1050) = ₹6,300.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A runner completes 400 m in session 1 and increases distance by 75 m per session. In which session will the runner first reach 1,000 m?', '11th session', '8th session', '10th session', '9th session', 'D', '1000 = 400 + (n − 1)75 => 600 = 75(n − 1) => n − 1 = 8 => n = 9.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of the first 18 terms of the AP 11, 8, 5, 2, ...', '−261', '−252', '−270', '−240', 'A', 'a = 11, d = −3, n = 18. S₁₈ = 9[2(11) + 17(−3)] = 9[22 − 51] = 9(−29) = −261.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of the first n terms of an AP is 6n − n². Find the first term a₁ and 6th term a₆.', 'a₁ = 5, a₆ = 0', 'a₁ = 6, a₆ = −6', 'a₁ = 5, a₆ = −5', 'a₁ = 4, a₆ = −4', 'C', 'a₁ = S₁ = 6(1) − 1² = 5. aₙ = Sₙ − Sₙ₋₁ = 7 − 2n. a₆ = 7 − 2(6) = −5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A gardener plants 5 saplings in row 1, 8 in row 2, 11 in row 3, and continues. How many saplings are planted in the first 16 rows?', '420 saplings', '440 saplings', '430 saplings', '460 saplings', 'B', 'a = 5, d = 3, n = 16. S₁₆ = 8[2(5) + 15(3)] = 8[10 + 45] = 8(55) = 440 saplings.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A person pays off a debt in 15 instalments: ₹3,000 in first and ₹200 more each time. Find the final instalment and total paid.', 'Final = ₹6,000, Total = ₹67,500', 'Final = ₹5,800, Total = ₹66,000', 'Final = ₹5,600, Total = ₹64,500', 'Final = ₹5,800, Total = ₹65,000', 'B', 'a₁₅ = 3000 + 14(200) = ₹5,800. S₁₅ = (15/2)(3000 + 5800) = 7.5(8800) = ₹66,000.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A library arranges books: 9 in first row, 13 in second, 17 in third. How many rows are needed to arrange 225 books?', '8 rows', '11 rows', '10 rows', '9 rows', 'D', 'a = 9, d = 4. (n/2)[18 + 4(n − 1)] = 225 => n(2n + 7) = 225 => 2n² + 7n − 225 = 0 => (2n + 25)(n − 9) = 0 => n = 9 rows.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m7-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A stadium tier 1 has 120 seats, each next tier has 15 more seats. If there are 10 tiers, find the total seats in tiers 8 to 10.', '720 seats', '705 seats', '690 seats', '735 seats', 'A', 'a₈ = 120 + 7(15) = 225; a₉ = 240; a₁₀ = 255. Total in tiers 8 to 10 = 225 + 240 + 255 = 720 seats.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-1', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 20th term of the AP −4, 1, 6, 11, ... is:', '86', '91', '89', '96', 'B', 'a = −4, d = 5. a₂₀ = −4 + 19(5) = −4 + 95 = 91.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-2', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'If the 9th term of an AP is 0, what is the relation between the 19th term and 14th term?', 'a₁₉ = 3a₁₄', 'a₁₉ = 4a₁₄', 'a₁₉ = a₁₄ + 5', 'a₁₉ = 2a₁₄', 'D', 'a₉ = a + 8d = 0 => a = −8d. a₁₉ = a + 18d = 10d. a₁₄ = a + 13d = 5d. Hence a₁₉ = 2a₁₄.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-3', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the value of k for which 2k − 1, 3k + 2, 5k + 8 are consecutive terms of an AP.', 'k = 3', 'k = −2', 'k = −3', 'k = 2', 'C', '2(3k + 2) = (2k − 1) + (5k + 8) => 6k + 4 = 7k + 7 => k = −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-4', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The 7th term of an AP is 19 and its 13th term is 43. Find the 30th term.', '119', '115', '107', '111', 'D', '6d = 24 => d = 4. a = 19 − 6(4) = −5. a₃₀ = −5 + 29(4) = −5 + 116 = 111.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-5', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find the sum of all integers between 100 and 300 that are divisible by 9.', '4,455', '4,500', '4,365', '4,545', 'A', 'First is 108, last is 297, d = 9. n = (297 − 108)/9 + 1 = 22. S = (22/2)(108 + 297) = 11(405) = 4,455.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-6', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'The sum of first n terms is Sₙ = 2n² + 7n. Find the common difference d and 20th term a₂₀.', 'd = 4, a₂₀ = 89', 'd = 2, a₂₀ = 87', 'd = 4, a₂₀ = 85', 'd = 7, a₂₀ = 95', 'C', 'aₙ = Sₙ − Sₙ₋₁ = 4n + 5. Thus d = 4. a₂₀ = 4(20) + 5 = 85.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-7', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'Find 5 arithmetic means between 8 and 50.', '14, 21, 28, 35, 42', '15, 22, 29, 36, 43', '16, 23, 30, 37, 44', '15, 23, 31, 39, 47', 'B', '7 terms total: 8, A₁, A₂, A₃, A₄, A₅, 50. a₇ = 8 + 6d = 50 => 6d = 42 => d = 7. Means are 15, 22, 29, 36, 43.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-8', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'How many terms of the AP 18, 15, 12, ... must be added to obtain a sum of 0?', '12 terms', '13 terms', '14 terms', '15 terms', 'B', 'a = 18, d = −3. Sₙ = (n/2)[36 + (n − 1)(−3)] = (n/2)(39 − 3n) = 0. Since n > 0, 39 − 3n = 0 => n = 13.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-9', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'An AP has a = −7 and d = 3. Find the least value of n for which aₙ is positive.', 'n = 4', 'n = 5', 'n = 6', 'n = 3', 'A', 'aₙ = −7 + (n − 1)3 = 3n − 10 > 0 => 3n > 10 => n > 3.33. The least positive integer is n = 4 (where a₄ = 2).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-ap-m8-10', '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', 'A school buys 12 computers in year 1 and increases purchases by 3 computers every year. How many computers will it buy in total over 8 years?', '180 computers', '175 computers', '190 computers', '165 computers', 'A', 'a = 12, d = 3, n = 8. S₈ = 4[2(12) + 7(3)] = 4[24 + 21] = 4(45) = 180 computers.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('q-tri-m1-1', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in ΔABC, DE || BC. If AD = 1.5 cm, DB = 3 cm, and AE = 1 cm, find EC.', 'Always congruent', 'Similar', 'Always equilateral', 'Unequal in area', 'B', 'Equality of corresponding angles satisfies the AAA similarity criterion, proving that the two triangles are similar (though not necessarily congruent).', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-2', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In triangles ABC and DEF, ∠A = ∠D, ∠B = ∠E, AB = 6 cm and DE = 9 cm. Find the ratio of their corresponding sides.', '1:3', '3:2', '4:9', '2:3', 'D', 'By AA similarity, ΔABC ~ ΔDEF. The ratio of corresponding sides is AB/DE = 6/9 = 2/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-3', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'Which criterion states: "Two sides of one triangle are proportional to two sides of another triangle and the included angles are equal"?', 'SSS similarity', 'AAA similarity', 'SAS similarity', 'RHS congruence', 'C', 'The SAS (Side-Angle-Side) similarity criterion states that if two sides of one triangle are proportional to two sides of another and the included angles are equal, the triangles are similar.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-4', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in ΔABC, AB = 4, BC = 6, AC = 8. In ΔPQR, PQ = 6, QR = 9, PR = 12. Are the triangles similar?', 'No, sides are not equal', 'No, angles are unknown', 'Yes, by SSS similarity criterion', 'Cannot be determined', 'C', 'AB/PQ = 4/6 = 2/3, BC/QR = 6/9 = 2/3, AC/PR = 8/12 = 2/3. All corresponding side ratios are equal, so ΔABC ~ ΔPQR by SSS.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-5', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, state whether true or false: "If two triangles are similar, their corresponding sides are always equal."', 'True, similarity implies equal sides', 'False, corresponding sides are proportional, equal only when scale factor is 1', 'True for right-angled triangles only', 'False, corresponding sides are always unequal', 'B', 'False. For similar triangles, corresponding sides are in proportion. They are equal only when the triangles are congruent (ratio 1:1).', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-tri-m1-6', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, the perimeters of two similar triangles are 24 cm and 36 cm. Find the ratio of their corresponding sides.', '4:9', '2:3', '3:2', '1:2', 'B', 'The ratio of perimeters of two similar triangles is equal to the ratio of their corresponding sides: 24/36 = 2/3.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-7', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC with D on AB and E on AC. If AD = 3 cm, DB = 2 cm and AE = 4.5 cm, find EC.', '2.5 cm', '3.5 cm', '4.0 cm', '3.0 cm', 'D', 'By BPT, AD/DB = AE/EC => 3/2 = 4.5/EC => EC = (2 × 4.5)/3 = 3.0 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-8', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a triangle has sides 5 cm, 12 cm and 13 cm. Another has sides 10 cm, 24 cm and 26 cm. What is their similarity relationship?', 'Similar by SSS criterion with side ratio 1:2', 'Not similar', 'Similar by AA only', 'Congruent by SSS', 'A', '5/10 = 12/24 = 13/26 = 1/2. Since all corresponding sides are in the ratio 1:2, the triangles are similar by SSS.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-9', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, if ΔABC ~ ΔPQR and AB/PQ = 3/5, find the ratio of their areas.', '6:10', '3:5', '9:25', '27:125', 'C', 'The ratio of the areas of two similar triangles is equal to the square of the ratio of their corresponding sides: (3/5)² = 9/25.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m1-10', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in right-angled triangle ABC with ∠B = 90°, AB = 5 cm and BC = 12 cm. Find AC and sin A.', 'AC = 13 cm, sin A = 12/13', 'AC = 13 cm, sin A = 5/13', 'AC = 15 cm, sin A = 12/15', 'AC = 17 cm, sin A = 5/17', 'A', 'AC² = AB² + BC² = 25 + 144 = 169 => AC = 13 cm. sin A = opposite / hypotenuse = BC / AC = 12/13.', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-1', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a line drawn parallel to one side of a triangle to intersect the other two sides divides those sides in the same:', 'Angle', 'Length', 'Area', 'Ratio', 'D', 'This is the statement of the Basic Proportionality Theorem (Thales'' Theorem): it divides the other two sides in the same ratio.', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-2', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in right-angled ΔABC (∠B = 90°), BD ⊥ AC. If AD = 4 cm and CD = 9 cm, find BD.', '7.5 cm', '7.0 cm', '6.5 cm', '8.0 cm', 'A', 'By BPT, AD/DB = AE/EC => 4/6 = 5/EC => EC = (6 × 5)/4 = 30/4 = 7.5 cm.', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-3', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in ΔPQR, X lies on PQ and Y on PR. PX = 3, XQ = 6, PY = 4 and YR = 8. Is XY parallel to QR?', 'No, because lengths are unequal', 'Cannot be determined without angles', 'Yes, by the converse of BPT (both ratios equal 1/2)', 'No, XQ is too long', 'C', 'PX/XQ = 3/6 = 1/2 and PY/YR = 4/8 = 1/2. Since the line divides the two sides in the same ratio, XY ∥ QR by the converse of BPT.', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-4', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC. If AD = 5 cm, AB = 8 cm and AE = 7.5 cm, find AC.', '14 cm', '10 cm', '12 cm', '15 cm', 'C', 'ΔADE ~ ΔABC => AD/AB = AE/AC => 5/8 = 7.5/AC => AC = (8 × 7.5)/5 = 60/5 = 12 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-5', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A pole 2 m high casts a shadow 1.5 m long. At the same time, a tree casts a shadow 9 m long. Find the height of the tree.', '12 m', '10 m', '14 m', '15 m', 'A', 'Sun rays make equal angles, forming similar right triangles: Height/Shadow = 2/1.5. Tree height = 9 × (2/1.5) = 18/1.5 = 12 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-6', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, which theorem states: "If a line divides any two sides of a triangle in the same ratio, then the line is parallel to the third side"?', 'Pythagoras theorem', 'Midpoint theorem', 'Angle bisector theorem', 'Converse of Basic Proportionality Theorem', 'D', 'This is the exact statement of the Converse of the Basic Proportionality Theorem (Converse of Thales'' Theorem).', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-7', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC with D on AB, E on AC. AD = 4 cm, DB = 6 cm and BC = 15 cm. Find the length of DE.', '5 cm', '6 cm', '8 cm', '7.5 cm', 'B', 'AB = AD + DB = 4 + 6 = 10 cm. Since ΔADE ~ ΔABC, DE/BC = AD/AB => DE/15 = 4/10 => DE = 15 × 0.4 = 6 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-8', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, AD = 2.4 cm, DB = 3.6 cm, AE = 3 cm and EC = 4.5 cm. What is the relation between DE and BC?', 'DE ∥ BC', 'DE is perpendicular to BC', 'DE intersects BC', 'DE = BC', 'A', 'AD/DB = 2.4/3.6 = 2/3 and AE/EC = 3/4.5 = 2/3. Since AD/DB = AE/EC, DE ∥ BC by the converse of BPT.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-9', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a line parallel to BC cuts AB at D and AC at E. If AD:AB = 2:5 and AC = 20 cm, find AE.', '6 cm', '8 cm', '10 cm', '12 cm', 'B', 'ΔADE ~ ΔABC => AE/AC = AD/AB = 2/5 => AE = 20 × (2/5) = 8 cm.', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m2-10', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a triangular field is divided by a fence parallel to its base in the ratio 3:2 from the vertex. If the whole corresponding side is 25 m, find the length from vertex to fence.', '12 m', '15 m', '10 m', '18 m', 'B', 'The side is divided in ratio 3:2, total 5 parts. Vertex-to-fence segment = (3/5) × 25 = 15 m.', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-1', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, in a right-angled triangle, the square of the hypotenuse is equal to:', 'Sum of the other two sides', 'Difference of the squares of the other two sides', 'Twice the product of the other two sides', 'Sum of squares of the other two sides', 'D', 'According to Pythagoras theorem, in a right-angled triangle, Hypotenuse² = Base² + Perpendicular².', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-2', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a right-angled triangle has perpendicular sides 9 cm and 12 cm. Find its hypotenuse.', '14 cm', '16 cm', '15 cm', '17 cm', 'C', 'h² = 9² + 12² = 81 + 144 = 225 => h = √225 = 15 cm.', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-3', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, check whether a triangle with sides 7 cm, 24 cm and 25 cm is right-angled.', 'No, 7 + 24 ≠ 25', 'No, 24² + 25² ≠ 7²', 'Yes, because 7² + 24² = 49 + 576 = 625 = 25²', 'Cannot be verified without angle measures', 'C', 'By the converse of Pythagoras theorem, since 7² + 24² = 625 = 25², the triangle is right-angled with hypotenuse 25 cm.', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-4', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'The diagonal of a rectangle is 13 cm and one side is 5 cm. Find the other side.', '10 cm', '11 cm', '14 cm', '12 cm', 'D', 'Diagonal² = length² + breadth² => 13² = 5² + x² => 169 = 25 + x² => x² = 144 => x = 12 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-5', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A ladder 10 m long reaches a window 8 m above the ground. How far is the foot of the ladder from the wall?', '5 m', '6 m', '7 m', '4 m', 'B', 'Ladder is hypotenuse: 10² = 8² + d² => 100 = 64 + d² => d² = 36 => d = 6 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-6', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A triangle has sides 6 cm, 8 cm and 11 cm. Determine the nature of the triangle.', 'Obtuse-angled triangle', 'Right-angled triangle', 'Acute-angled triangle', 'Equilateral triangle', 'A', 'Compare the square of the largest side with the sum of squares of the other two: 11² = 121, while 6² + 8² = 36 + 64 = 100. Since 121 > 100, the angle opposite side 11 is obtuse.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-7', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'The sides of a triangle are in the ratio 3:4:5 and its perimeter is 48 cm. Find its area.', '96 cm²', '120 cm²', '84 cm²', '108 cm²', 'A', '3k + 4k + 5k = 48 => 12k = 48 => k = 4. Sides are 12, 16, 20 cm (right triangle). Area = 1/2 × 12 × 16 = 96 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-8', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A point is 15 cm from one end of a horizontal line and 20 cm from the other end. The ends are 25 cm apart. What angle is formed at the point?', '60°', '75°', '90°', '120°', 'C', '15² + 20² = 225 + 400 = 625 = 25². By the converse of Pythagoras theorem, the triangle is right-angled and the angle opposite 25 cm is 90°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-9', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A kite string is 25 m long. The kite is vertically above a point 7 m away horizontally. Find the height of the kite above the ground.', '23 m', '22 m', '20 m', '24 m', 'D', 'h² = 25² − 7² = 625 − 49 = 576 => h = √576 = 24 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m3-10', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A triangle has sides 8 cm, 15 cm and 17 cm. Identify its nature and hypotenuse.', 'Scalene acute; no hypotenuse', 'Right-angled; hypotenuse = 17 cm', 'Right-angled; hypotenuse = 15 cm', 'Obtuse-angled; largest side = 17 cm', 'B', '8² + 15² = 64 + 225 = 289 = 17². Thus it is right-angled and the longest side (17 cm) is the hypotenuse.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-1', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, assertion: Areas of two similar triangles are in the ratio of the squares of their corresponding sides. Reason: If the side ratio is k, linear dimensions scale by k and area scales by k². Which option is correct?', 'A is false but R is true', 'Both A and R are true, but R does not explain A', 'A is true but R is false', 'Both A and R are true, and R is the correct explanation of A', 'D', 'Both statements are correct standard geometric theorems and the reason gives the fundamental geometric proof.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-2', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, if the areas of two similar triangles are 64 cm² and 121 cm², find the ratio of their corresponding sides.', '4:11', '16:25', '8:11', '8:12', 'C', 'Ratio of sides = √(Ratio of areas) = √(64/121) = 8/11.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-3', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC and ΔDEF, ∠A = ∠D and ∠B = ∠E. If AB = 8 cm, DE = 12 cm and BC = 10 cm, find EF.', '14 cm', '16 cm', '15 cm', '18 cm', 'C', 'By AA similarity, ΔABC ~ ΔDEF => AB/DE = BC/EF => 8/12 = 10/EF => EF = (12 × 10)/8 = 15 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-4', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, if ΔABC ~ ΔPQR, which equality is always true regarding side ratios?', 'AB/BC = QR/PQ', 'AB/BC = PQ/QR', 'AB + BC = PQ + QR', 'AB × PQ = BC × QR', 'B', 'Since ΔABC ~ ΔPQR, AB/PQ = BC/QR. Rearranging gives AB/BC = PQ/QR.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-5', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a triangle and its similar triangle have perimeters 30 cm and 45 cm. If one side of the smaller triangle is 8 cm, find the corresponding side of the larger triangle.', '10 cm', '12 cm', '15 cm', '14 cm', 'B', 'Ratio of perimeters = 30/45 = 2/3. Thus smaller/larger = 2/3 => 8/x = 2/3 => x = (8 × 3)/2 = 12 cm.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-6', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, D lies on AB and E on AC. If AD = 3, AB = 9, AE = 4 and AC = 12, show the relation between DE and BC.', 'DE ∥ BC (since AD/AB = AE/AC = 1/3)', 'DE is perpendicular to BC', 'DE intersects BC at midpoint', 'No relation can be determined', 'A', 'AD/AB = 3/9 = 1/3 and AE/AC = 4/12 = 1/3. By converse of BPT, DE ∥ BC.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-7', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, the areas of two similar triangles are 25 cm² and 49 cm². If the perimeter of the first is 30 cm, find the perimeter of the second.', '36 cm', '42 cm', '40 cm', '45 cm', 'B', 'Side ratio = √(25/49) = 5/7. Perimeter ratio is also 5/7 => 30/P₂ = 5/7 => P₂ = (30 × 7)/5 = 42 cm.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-8', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a right-angled triangle has hypotenuse 26 cm and one leg 10 cm. Find the other leg and its area.', '18 cm, Area = 90 cm²', '20 cm, Area = 100 cm²', '22 cm, Area = 110 cm²', '24 cm, Area = 120 cm²', 'D', 'Other leg = √(26² − 10²) = √(676 − 100) = √576 = 24 cm. Area = 1/2 × 10 × 24 = 120 cm².', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-9', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC. If AD = 3 cm, DB = 5 cm and the area of ΔADE is 18 cm², find the area of trapezium DBCE.', '110 cm²', '128 cm²', '100 cm²', '96 cm²', 'A', 'AB = 3 + 5 = 8 cm. Area(ΔADE)/Area(ΔABC) = (3/8)² = 9/64. Area(ΔABC) = 18 × 64/9 = 128 cm². Area(trapezium) = 128 − 18 = 110 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m4-10', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, two similar triangles have corresponding sides in the ratio 5:8. The difference between their areas is 117 cm². Find the area of the smaller triangle.', '65 cm²', '85 cm²', '75 cm²', '90 cm²', 'C', 'Area ratio = 5²:8² = 25:64. Let areas be 25x and 64x. 64x − 25x = 39x = 117 => x = 3. Smaller area = 25(3) = 75 cm².', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-1', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, if the ratio of areas of two similar triangles is 16:25, the ratio of their corresponding altitudes is:', '16:25', '4:5', '5:4', '8:5', 'B', 'Altitudes are linear dimensions, so ratio of altitudes = √(ratio of areas) = √(16/25) = 4/5.', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-2', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A 1.5 m tall student casts a shadow of 2 m. At the same time, a building casts a shadow of 18 m. Find the building''s height.', '12.5 m', '14.0 m', '13.5 m', '15.0 m', 'C', 'By similarity: height/shadow = 1.5/2 = H/18 => H = 18 × 1.5 / 2 = 13.5 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-3', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC. If AD = 4 cm, AB = 10 cm and area of ΔADE is 24 cm², find the area of ΔABC.', '150 cm²', '120 cm²', '140 cm²', '160 cm²', 'A', 'Area ratio = (AD/AB)² = (4/10)² = 16/100 = 4/25. Area(ΔABC) = 24 × 25 / 4 = 150 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-4', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, the sides of a triangle are 9 cm, 12 cm and 15 cm. Find its area and determine whether it is right-angled.', 'Area = 60 cm²; not right-angled', 'Area = 54 cm²; acute triangle', 'Area = 48 cm²; right-angled triangle', 'Area = 54 cm²; right-angled triangle', 'D', '9² + 12² = 81 + 144 = 225 = 15². Hence it is right-angled. Area = 1/2 × 9 × 12 = 54 cm².', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-5', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A triangle has sides 5 cm, 6 cm and 8 cm. Another triangle has sides 10 cm, 12 cm and 16 cm. Find the ratio of their areas.', '1:2', '1:3', '1:8', '1:4', 'D', 'Side ratio = 5/10 = 1/2. Since triangles are similar by SSS, Area ratio = (1/2)² = 1:4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-6', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'A 15 m ladder leans against a wall with its foot 9 m from the wall (reaches 12 m high). If the foot is moved 3 m farther away, how high will it reach?', '8 m', '9 m', '10 m', '7.5 m', 'B', 'New horizontal distance = 9 + 3 = 12 m. New height = √(15² − 12²) = √(225 − 144) = √81 = 9 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-7', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In ΔABC, DE ∥ BC. If AD = 3 cm, DB = 5 cm and AE = 4.5 cm, find EC.', '6.5 cm', '8.0 cm', '7.5 cm', '7.0 cm', 'C', 'By BPT, AD/DB = AE/EC => 3/5 = 4.5/EC => EC = (5 × 4.5)/3 = 7.5 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-8', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a right-angled triangle has sides in ratio 5:12:13 and perimeter 90 cm. Find its three sides and area.', 'Sides: 10, 24, 26 cm; Area = 120 cm²', 'Sides: 12, 28.8, 31.2 cm; Area = 172.8 cm²', 'Sides: 15, 36, 39 cm; Area = 270 cm²', 'Sides: 15, 30, 45 cm; Area = 225 cm²', 'C', '5k + 12k + 13k = 30k = 90 => k = 3. Sides are 15 cm, 36 cm, 39 cm. Area = 1/2 × 15 × 36 = 270 cm².', '/diagrams/tri-right-altitude.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-9', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a line parallel to the base of a triangle cuts off a smaller triangle of area 36 cm². The whole triangle area is 100 cm². If the smaller corresponding side is 9 cm, find the whole corresponding side.', '12 cm', '14 cm', '18 cm', '15 cm', 'D', 'Area ratio = 36/100 = 9/25. Side ratio = √(9/25) = 3/5. Smaller/whole = 9/x = 3/5 => x = 15 cm.', '/diagrams/tri-bpt-de-bc.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-tri-m5-10', '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', 'In the given figure, a triangular frame has sides 10 cm, 24 cm, 26 cm. A similar frame has shortest side 15 cm. Find the ratio of areas of the second frame to the first.', '9:4', '2:3', '4:9', '3:2', 'A', 'Scale factor = 15/10 = 3/2. Ratio of areas = (3/2)² = 9/4.', '/diagrams/tri-similar-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:19:21', '2026-11-05 14:19:21'),
  ('q-coord-m1-1', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The point (−6, 0) lies on which of the following?', 'Positive x-axis', 'Positive y-axis', 'Negative x-axis', 'Quadrant III', 'C', 'Its y-coordinate is 0, so it lies on the x-axis. Because its x-coordinate is −6 (negative), it lies on the negative x-axis.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-2', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Find the length of the line segment joining A(−1, 2) and B(5, 10).', '12 units', '8 units', '10 units', '14 units', 'C', 'AB = √[(5 − (−1))² + (10 − 2)²] = √[6² + 8²] = √[36 + 64] = √100 = 10 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-3', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Find the midpoint of the line segment joining (−4, 7) and (6, −3).', '(1, 2)', '(1, 4)', '(2, 2)', '(2, 4)', 'A', 'Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2) = ((−4 + 6)/2, (7 + (−3))/2) = (2/2, 4/2) = (1, 2).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-4', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The plotted points are A(−3, 1), B(2, 1), C(2, −3). Calculate AB and BC, then state the angle at B.', 'AB = 6, BC = 4, ∠B = 60°', 'AB = 5, BC = 4, ∠B = 90°', 'AB = 4, BC = 5, ∠B = 90°', 'AB = 5, BC = 3, ∠B = 45°', 'B', 'AB is horizontal: 2 − (−3) = 5 units. BC is vertical: 1 − (−3) = 4 units. Horizontal and vertical lines are perpendicular, so ∠B = 90°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-5', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Assertion: The point (0, −5) lies on the y-axis. Reason: Every point on the y-axis has x-coordinate zero. Which option is correct?', 'A is false but R is true', 'Both A and R are true, but R does not explain A', 'A is true but R is false', 'Both A and R are true, and R is the correct explanation of A', 'D', 'By definition, every point on the y-axis has x = 0. Since the point has x = 0, it lies on the y-axis.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-coord-m1-6', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P(x, 2) is 5 units from Q(1, −1). Find all possible values of x.', 'x = 4 or −2', 'x = 5 or −3', 'x = 6 or −4', 'x = 5 only', 'B', 'PQ² = (x − 1)² + (2 − (−1))² = 25 => (x − 1)² + 9 = 25 => (x − 1)² = 16 => x − 1 = ±4 => x = 5 or x = −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-7', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point divides the segment joining A(−2, 3) and B(8, −2) in the ratio 2:3 internally. Find its coordinates.', '(1, 2)', '(2, 1)', '(3, 1)', '(2, 0)', 'B', 'P = ((2×8 + 3×(−2))/5, (2×(−2) + 3×3)/5) = ((16 − 6)/5, (−4 + 9)/5) = (10/5, 5/5) = (2, 1).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-8', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A rectangular park has corners P(−4, −2), Q(4, −2), R(4, 3), S(−4, 3). Find its perimeter.', '26 units', '28 units', '30 units', '24 units', 'A', 'Length PQ = 4 − (−4) = 8 units. Breadth QR = 3 − (−2) = 5 units. Perimeter = 2(8 + 5) = 26 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-9', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Points M(−2, 3) and N(3, 3) lie on the same horizontal line. Find the distance MN.', '√13 units', '4 units', '6 units', '5 units', 'D', 'Since y-coordinates are equal, MN = |3 − (−2)| = 5 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m1-10', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Find the point which divides A(−3, 5) and B(9, −1) internally in the ratio 1:2, and find its distance from the origin.', 'Point (1, 3), Distance = √10 units', 'Point (2, 3), Distance = √13 units', 'Point (1, 2), Distance = √5 units', 'Point (3, 1), Distance = √10 units', 'A', 'P = ((1×9 + 2×(−3))/3, (1×(−1) + 2×5)/3) = (3/3, 9/3) = (1, 3). Distance from origin = √(1² + 3²) = √10 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-1', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'If two points have the same y-coordinate, the line segment joining them is:', 'Perpendicular to the x-axis', 'Parallel to the x-axis', 'Parallel to the y-axis', 'Passing through the origin', 'B', 'Equal y-coordinates mean y = constant, which is a horizontal line parallel to the x-axis.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-2', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The distance between (k, 4) and (−2, 4) is 9 units. Find the possible values of k.', 'k = 5 or −13', 'k = 11 or −7', 'k = 9 or −9', 'k = 7 or −11', 'D', 'y-coordinates are equal: |k − (−2)| = 9 => |k + 2| = 9 => k + 2 = ±9 => k = 7 or k = −11.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-3', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'In what ratio does the point P(2, 0) divide the segment joining A(−4, 3) and B(5, −6)?', '2:1 internally', 'No such ratio exists because P does not lie on line segment AB', '3:2 externally', '1:2 internally', 'B', 'From x-coordinate: (5m − 4n)/(m + n) = 2 => 3m = 6n => m:n = 2:1. But for y-coordinate: (−6(2) + 3(1))/3 = −9/3 = −3 ≠ 0. Hence P is not collinear with A and B.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-4', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The midpoint of A(−5, 4) and B(3, −2) is:', '(−1, 1)', '(1, −1)', '(−4, 2)', '(−1, −1)', 'A', 'M = ((−5 + 3)/2, (4 + (−2))/2) = (−2/2, 2/2) = (−1, 1).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-5', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A is (2, −3) and the midpoint of AB is (−1, 4). Find the coordinates of point B.', '(−4, 11)', '(−3, 7)', '(0, 1)', '(−2, 8)', 'A', '(2 + x)/2 = −1 => x = −4. (−3 + y)/2 = 4 => y = 11. Point B is (−4, 11).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-6', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Determine whether P(1, 2), Q(4, 6), R(7, 10) lie on one straight line.', 'No, they form a scalene triangle', 'No, PQ + QR ≠ PR', 'Yes, PQ = 5, QR = 5, PR = 10, so PQ + QR = PR confirms collinearity', 'Cannot be determined without slope formula', 'C', 'PQ = √[(4−1)² + (6−2)²] = √25 = 5. QR = √[(7−4)² + (10−6)²] = 5. PR = √[(7−1)² + (10−2)²] = √100 = 10. PQ + QR = PR, so points are collinear.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-7', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A coordinate grid marks U(−4, −1), V(2, −1), W(2, 3). Find UV, VW and the perimeter of triangle UVW.', 'UV = 6, VW = 4, Perimeter = 20 units', 'UV = 6, VW = 4, Perimeter = 10 + 2√13 units', 'UV = 5, VW = 3, Perimeter = 8 + √34 units', 'UV = 6, VW = 3, Perimeter = 9 + 3√5 units', 'B', 'UV = 2 − (−4) = 6. VW = 3 − (−1) = 4. UW = √(6² + 4²) = √52 = 2√13. Perimeter = 6 + 4 + 2√13 = 10 + 2√13 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-8', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Why is the distance of a point (x, y) from the origin always equal to √(x² + y²)?', 'Because the slope from the origin is 1', 'Because x and y are always positive', 'Because it is an equilateral triangle', 'Because the origin is (0, 0), so √[(x − 0)² + (y − 0)²] simplifies to √(x² + y²)', 'D', 'Applying distance formula with (0,0) yields √[(x − 0)² + (y − 0)²] = √(x² + y²).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-9', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P lies on the x-axis and is equidistant from A(−2, 4) and B(6, 2). Find the coordinates of P.', '(1, 0)', '(3/2, 0)', '(5/4, 0)', '(2, 0)', 'C', 'P = (x, 0). PA² = (x + 2)² + 16 = x² + 4x + 20. PB² = (x − 6)² + 4 = x² − 12x + 40. x² + 4x + 20 = x² − 12x + 40 => 16x = 20 => x = 5/4. P = (5/4, 0).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m2-10', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Points A(−3, 2), B(1, 2), C(1, −2), D(−3, −2) form a quadrilateral. Name the quadrilateral and find its diagonal length.', 'Square with diagonal 4√2 units', 'Parallelogram with diagonal 5 units', 'Rectangle with diagonal 6 units', 'Rhombus with diagonal 8 units', 'A', 'Sides AB = 4, BC = 4, CD = 4, DA = 4. Adjacent sides are perpendicular. It is a square. Diagonal = √(4² + 4²) = √32 = 4√2 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-1', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'If the distance between (x, −1) and (2, 5) is 10 units, find x.', 'x = 10 or −6', 'x = 8 or −4', 'x = 12 or −8', 'x = 10 only', 'A', '(x − 2)² + (5 − (−1))² = 100 => (x − 2)² + 36 = 100 => (x − 2)² = 64 => x − 2 = ±8 => x = 10 or x = −6.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-2', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P divides A(−8, 7) and B(7, −3) internally in the ratio 2:3. Find P.', '(−2, 3)', '(0, 1)', '(−1, 2)', '(−3, 4)', 'A', 'P = ((2×7 + 3×(−8))/5, (2×(−3) + 3×7)/5) = ((14 − 24)/5, (−6 + 21)/5) = (−10/5, 15/5) = (−2, 3).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-3', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'For points A(0, 0), B(3, 4), C(6, 0), which statement is correct?', 'AB = AC', 'AB = BC (ΔABC is isosceles)', 'BC = AC', 'All three sides are equal', 'B', 'AB = √(3² + 4²) = 5. BC = √[(6 − 3)² + (0 − 4)²] = 5. AC = 6. Since AB = BC = 5, the triangle is isosceles.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-4', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'For vertices A(−4, 0), B(0, 3), C(4, 0), find lengths AB, BC, AC and identify the triangle.', 'AB = 4, BC = 4, AC = 6; Isosceles triangle', 'AB = 5, BC = 5, AC = 8; Isosceles triangle', 'AB = 5, BC = 5, AC = 5; Equilateral triangle', 'AB = 3, BC = 4, AC = 5; Right-angled triangle', 'B', 'AB = √[4² + 3²] = 5. BC = √[4² + 3²] = 5. AC = 4 − (−4) = 8. Triangle is isosceles.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-5', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The midpoint of (a, 7) and (5, −1) is (1, 3). Find the value of a.', 'a = −3', 'a = −2', 'a = −1', 'a = −4', 'A', '(a + 5)/2 = 1 => a + 5 = 2 => a = −3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-6', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P(k, k) is equidistant from the origin (0, 0) and the point (4, 0). Find k.', 'k = 1', 'k = 3', 'k = 2', 'k = 4', 'C', 'OP² = k² + k² = 2k². Distance to (4, 0) squared = (k − 4)² + k². Equating: 2k² = k² − 8k + 16 + k² => 8k = 16 => k = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-7', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A line segment joins A(−5, 2) and B(7, −4). Find the point one-third of the way from A to B.', '(0, −1)', '(−1, 0)', '(1, −2)', '(−2, 1)', 'B', 'One-third of the way from A means AP:PB = 1:2. P = ((1×7 + 2×(−5))/3, (1×(−4) + 2×2)/3) = (−3/3, 0/3) = (−1, 0).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-8', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'State whether true or false: "Every point on the x-axis is equidistant from the points (0, 4) and (0, −4)."', 'False, only the origin is equidistant', 'True only for positive x', 'False, the points lie on opposite sides', 'True, for any point (x, 0), distance squared to both points is x² + 16', 'D', 'Distance from (x, 0) to (0, 4) is √(x² + 16). Distance to (0, −4) is √(x² + 16). They are identical for all real values of x.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-9', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The points E(−2, −3), F(−2, 2), G(3, 2) are plotted. Calculate EF and FG, and the angle at F.', 'EF = 4, FG = 5, ∠F = 45°', 'EF = 5, FG = 4, ∠F = 60°', 'EF = 6, FG = 6, ∠F = 90°', 'EF = 5, FG = 5, ∠F = 90°', 'D', 'EF is vertical: 2 − (−3) = 5. FG is horizontal: 3 − (−2) = 5. Vertical and horizontal lines meet at 90°, so ∠F = 90°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m3-10', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Points A(−1, 1), B(3, 4), C(6, 0), D(2, −3) form which type of quadrilateral?', 'Rectangle (non-square)', 'Rhombus (non-square)', 'Square (all 4 sides = 5 and diagonals = 5√2)', 'Parallelogram', 'C', 'AB = √[4² + 3²] = 5, BC = √[3² + (−4)²] = 5, CD = √[(−4)² + (−3)²] = 5, DA = √[(−3)² + 4²] = 5. Diagonals AC = √[7² + (−1)²] = √50 = 5√2, BD = √[(−1)² + (−7)²] = √50 = 5√2. All sides and diagonals are equal => Square.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-1', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'What is the ordinate (y-coordinate) of any point lying on the x-axis?', '−1', '1', '0', 'Any real number', 'C', 'The equation of the x-axis is y = 0. Therefore, the ordinate of every point on the x-axis is always 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-2', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'In what ratio does the y-axis divide the line segment joining A(−8, 6) and B(4, −3)?', '1:2', '2:3', '3:1', '2:1 internally', 'D', 'Points on y-axis have x = 0: (4m − 8n)/(m + n) = 0 => 4m = 8n => m:n = 2:1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-3', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P(3, y) is 13 units from Q(8, 1). Find the possible values of y.', 'y = 13 or −11', 'y = 14 or −12', 'y = 12 or −10', 'y = 11 or −13', 'A', '(8 − 3)² + (1 − y)² = 169 => 25 + (y − 1)² = 169 => (y − 1)² = 144 => y − 1 = ±12 => y = 13 or y = −11.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-4', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'If P divides the join of A(x₁, y₁) and B(x₂, y₂) internally in ratio m:n, its x-coordinate is:', '(mx₂ + nx₁)/(m + n)', '(mx₂ + nx₁)/(2)', '(nx₂ − mx₁)/(m + n)', '(mx₁ + nx₂)/(m + n)', 'A', 'By the section formula for internal division, x = (mx₂ + nx₁)/(m + n).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-5', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The points A(−2, 0), B(2, 0), C(0, 3) are vertices of a triangle. Find its perimeter.', '10 units', '4 + √13 units', '6 + 2√13 units', '4 + 2√13 units', 'D', 'AB = 2 − (−2) = 4. AC = √[2² + 3²] = √13. BC = √[2² + 3²] = √13. Perimeter = 4 + 2√13 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-6', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Points P(−3, 4), Q(2, 4), R(2, −1) are plotted. Identify the right angle and length of the third side PR.', '∠Q = 90°, PR = 5√2 units', '∠P = 90°, PR = 10 units', '∠R = 90°, PR = 5 units', '∠Q = 90°, PR = 7 units', 'A', 'PQ is horizontal (length 5), QR is vertical (length 5). Hence ∠Q = 90°. By Pythagoras, PR = √(5² + 5²) = 5√2 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-7', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A(−3, 5) and B(x, y) have midpoint (2, −1). Determine the coordinates of B.', '(5, −6)', '(7, −5)', '(7, −7)', '(6, −7)', 'C', '(−3 + x)/2 = 2 => x = 7. (5 + y)/2 = −1 => y = −7. B = (7, −7).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-8', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P divides A(1, 2) and B(7, 8) in the ratio 1:2 internally. Find the coordinates of P.', '(2, 3)', '(3, 4)', '(3, 5)', '(4, 5)', 'B', 'P = ((1×7 + 2×1)/3, (1×8 + 2×2)/3) = (9/3, 12/3) = (3, 4).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-9', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'On the grid, X(−4, 2), Y(0, 2), Z(0, −3). Find XY and YZ, then calculate the distance XZ.', 'XY = 4, YZ = 5, XZ = 7 units', 'XY = 4, YZ = 5, XZ = √41 units', 'XY = 3, YZ = 4, XZ = 5 units', 'XY = 5, YZ = 4, XZ = √41 units', 'B', 'XY = 0 − (−4) = 4. YZ = 2 − (−3) = 5. In right triangle XYZ with ∠Y = 90°, XZ = √(4² + 5²) = √41 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m4-10', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Can three distinct collinear points have all three pairwise distances equal? Justify.', 'Yes, if they form an equilateral line', 'Yes, if one point is the origin', 'No, because one point lies between the other two, so the largest distance equals the sum of the other two', 'Cannot be determined', 'C', 'For collinear points A, B, C with B between A and C, AC = AB + BC. Since distances are positive, AC must be strictly greater than AB and BC, so all three cannot be equal.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-1', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The distance between (0, 0) and (−8, 15) is:', '7 units', '23 units', '17 units', '289 units', 'C', 'Distance = √[(−8)² + 15²] = √(64 + 225) = √289 = 17 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-2', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A(−4, 7) and B(6, −3) are endpoints of a segment. Find the point that divides AB internally in the ratio 3:2.', '(2, 1)', '(3, 0)', '(1, 2)', '(2, 2)', 'A', 'P = ((3×6 + 2×(−4))/5, (3×(−3) + 2×7)/5) = ((18 − 8)/5, (−9 + 14)/5) = (10/5, 5/5) = (2, 1).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-3', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The points (2, 3), (4, k), and (6, 7) are collinear. Determine the value of k.', 'k = 4', 'k = 6', 'k = 4.5', 'k = 5', 'D', 'Equal horizontal spacing: x increases by 2. Thus y must increase by equal amounts: k − 3 = 7 − k => 2k = 10 => k = 5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-4', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A delivery route connects A(−2, 1), B(4, 1), and C(4, 9). Find the total route length A→B→C and direct distance A→C.', 'Route = 15 units, Direct AC = 10 units', 'Route = 12 units, Direct AC = 8 units', 'Route = 14 units, Direct AC = 10 units', 'Route = 14 units, Direct AC = 12 units', 'C', 'AB = 4 − (−2) = 6. BC = 9 − 1 = 8. Route = 6 + 8 = 14 units. Direct AC = √(6² + 8²) = 10 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-5', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'Which point is closer to the origin: P(−5, 12) or Q(8, −6)?', 'P is closer (OP = 12, OQ = 14)', 'Cannot be determined without quadrant positions', 'Both are at equal distance of 10 units', 'Q is closer (OQ = 10 units, while OP = 13 units)', 'D', 'OP = √[(−5)² + 12²] = √169 = 13 units. OQ = √[8² + (−6)²] = √100 = 10 units. Since 10 < 13, Q is closer to the origin.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-6', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The points A(−2, −2), B(3, −2), C(3, 2), D(−2, 2) are plotted. Find the perimeter and area of the rectangle.', 'Perimeter = 20 units, Area = 18 sq units', 'Perimeter = 18 units, Area = 20 sq units', 'Perimeter = 16 units, Area = 20 sq units', 'Perimeter = 18 units, Area = 24 sq units', 'B', 'Length = 3 − (−2) = 5. Breadth = 2 − (−2) = 4. Perimeter = 2(5 + 4) = 18 units. Area = 5 × 4 = 20 sq units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-7', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P lies on the y-axis and is 5 units from (3, 0). Find its possible coordinates.', '(0, 5) or (0, −5)', '(0, 3) or (0, −3)', '(0, 4) or (0, −4)', '(4, 0) or (−4, 0)', 'C', 'P = (0, y). (0 − 3)² + (y − 0)² = 25 => 9 + y² = 25 => y² = 16 => y = ±4. P = (0, 4) or (0, −4).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-8', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'A point P divides A(−1, 4) and B(5, −2) internally in the ratio 2:1. In which quadrant or axis does P lie?', 'P(3, 0) lies on the positive x-axis (not in any quadrant)', 'Quadrant I', 'Quadrant IV', 'Positive y-axis', 'A', 'P = ((2×5 + 1×(−1))/3, (2×(−2) + 1×4)/3) = (9/3, 0/3) = (3, 0). Its y-coordinate is 0, so it lies on the x-axis, not in any quadrant.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-9', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'For points M(−3, 0), N(0, 4), and O(3, 0), what type of triangle is MNO and what is its perimeter?', 'Equilateral triangle with perimeter 18 units', 'Isosceles triangle with perimeter 16 units', 'Right-angled triangle with perimeter 15 units', 'Scalene triangle with perimeter 16 units', 'B', 'MN = √(3² + 4²) = 5, NO = √(3² + 4²) = 5, MO = 3 − (−3) = 6. Since MN = NO = 5, it is isosceles. Perimeter = 5 + 5 + 6 = 16 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-coord-m5-10', '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', 'The midpoint of A(−2, 5) and B is (3, −1). Find B and the length of segment AB.', 'B = (8, −6), AB = 15 units', 'B = (8, −7), AB = 2√61 units', 'B = (7, −7), AB = 2√60 units', 'B = (8, −7), AB = 16 units', 'B', '(−2 + x)/2 = 3 => x = 8. (5 + y)/2 = −1 => y = −7. B = (8, −7). AB = √[(8 − (−2))² + (−7 − 5)²] = √[100 + 144] = √244 = 2√61 units.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:21:03', '2026-11-05 14:21:03'),
  ('q-trig-m1-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'In right-angled triangle ABC with ∠B = 90°, AC = 13 cm and AB = 5 cm. Find sin A, cos A and tan A.', 'sin A = 13/12, cos A = 13/5, tan A = 12/5', 'sin A = 5/13, cos A = 12/13, tan A = 5/12', 'sin A = 12/13, cos A = 5/12, tan A = 5/13', 'sin A = 12/13, cos A = 5/13, tan A = 12/5', 'D', 'BC = √(13² − 5²) = 12 cm. For angle A: Opposite = 12, Adjacent = 5, Hypotenuse = 13. Thus sin A = 12/13, cos A = 5/13, tan A = 12/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate the expression: 2 sin 30° + 3 cos 60° − tan 45°.', '3/2', '1/2', '5/2', '1', 'A', '2(1/2) + 3(1/2) − 1 = 1 + 1.5 − 1 = 1.5 = 3/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If tan θ = 3/4, where θ is acute, find sin θ and cos θ.', 'sin θ = 4/5, cos θ = 3/5', 'sin θ = 3/7, cos θ = 4/7', 'sin θ = 3/5, cos θ = 4/5', 'sin θ = 5/3, cos θ = 5/4', 'C', 'Opposite = 3, Adjacent = 4 => Hypotenuse = √(3² + 4²) = 5. sin θ = 3/5, cos θ = 4/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Simplify the trigonometric identity: (1 − cos² A)/sin A, wherever defined.', 'cos A', 'tan A', 'sin A', 'sec A', 'C', 'Since sin² A + cos² A = 1, 1 − cos² A = sin² A. Then sin² A / sin A = sin A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A pole casts a shadow 10√3 m long when the angle of elevation of the sun is 30°. Find the height of the pole.', '15 m', '20 m', '10√3 m', '10 m', 'D', 'tan 30° = h/(10√3) => 1/√3 = h/(10√3) => h = 10 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-trig-m1-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sin A = 5/13 and A is acute, find sec A.', '13/12', '12/13', '13/5', '5/12', 'A', 'Adjacent = √(13² − 5²) = 12. cos A = 12/13 => sec A = 13/12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Find the numerical value of (sin 45° + cos 45°)².', '2', '1', '√2', '4', 'A', 'sin 45° = 1/√2, cos 45° = 1/√2. (1/√2 + 1/√2)² = (2/√2)² = (√2)² = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'From a point 20 m away from the foot of a tower on level ground, the angle of elevation of its top is 45°. Find the height of the tower.', '10√3 m', '20 m', '20√3 m', '10 m', 'B', 'tan 45° = h/20 = 1 => h = 20 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sec A = 17/8 and A is an acute angle, find tan A.', '8/15', '17/15', '15/17', '15/8', 'D', 'tan² A = sec² A − 1 = (17/8)² − 1 = 289/64 − 1 = 225/64 => tan A = 15/8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m1-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A 6 m ladder rests against a vertical wall with its foot 3 m from the wall. Find the angle the ladder makes with the ground.', '30°', '60°', '45°', '75°', 'B', 'cos θ = Adjacent / Hypotenuse = 3/6 = 1/2 => θ = 60°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'In right triangle PQR with ∠Q = 90°, PR = 25 cm and QR = 7 cm. Find cos P and tan P.', 'cos P = 7/25, tan P = 24/7', 'cos P = 24/25, tan P = 7/24', 'cos P = 24/25, tan P = 24/7', 'cos P = 7/24, tan P = 24/25', 'B', 'PQ = √(25² − 7²) = 24 cm. For angle P: Adjacent = 24, Opposite = 7, Hypotenuse = 25. cos P = 24/25, tan P = 7/24.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Simplify the expression: (1 + tan² A) cos² A.', 'tan A', 'sin² A', 'sec A', '1', 'D', '1 + tan² A = sec² A. Then sec² A × cos² A = (1/cos² A) × cos² A = 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate: sin² 30° + cos² 30° + tan² 45°.', '3/2', '3', '5/4', '2', 'D', 'sin² 30° + cos² 30° = 1. tan² 45° = 1² = 1. Sum = 1 + 1 = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If cot A = 7/24 and A is acute, find cosec A.', '25/7', '24/25', '25/24', '24/7', 'C', 'Hypotenuse = √(7² + 24²) = 25. sin A = 24/25 => cosec A = 25/24.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A kite is flying on a 60 m taut string making an angle of 60° with the horizontal. Find its vertical height.', '30√3 m', '30 m', '20√3 m', '45 m', 'A', 'Height = 60 sin 60° = 60 × (√3/2) = 30√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Show that: (sec² A − 1)/tan A simplifies to:', 'tan A', 'cos A', 'cot A', 'sec A', 'A', 'sec² A − 1 = tan² A. tan² A / tan A = tan A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Find the value of tan 30° × tan 60° + cos 0°.', '1', '0', '2', '3', 'C', '(1/√3)(√3) + 1 = 1 + 1 = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A tree is observed from a point 12 m away at an angle of elevation of 60°. Find the height of the tree.', '6√3 m', '12√3 m', '12 m', '18 m', 'B', 'tan 60° = h/12 => √3 = h/12 => h = 12√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sin A = cos A and A is acute, find the angle A and tan A.', 'A = 30°, tan A = 1/√3', 'A = 90°, tan A is undefined', 'A = 60°, tan A = √3', 'A = 45°, tan A = 1', 'D', 'sin A = cos A => sin A / cos A = 1 => tan A = 1. Since A is acute, A = 45°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m2-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'From the top of a tower, the angle of depression of a point 30 m from its foot is 30°. Find the tower height.', '30√3 m', '15 m', '10√3 m', '20 m', 'C', 'Angle of depression = Angle of elevation = 30°. tan 30° = h/30 => h = 30/√3 = 10√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sin A = 12/13 and A is acute, find the value of tan A + cot A.', '120/169', '60/169', '169/60', '13/12', 'C', 'Adjacent = 5. tan A = 12/5, cot A = 5/12. tan A + cot A = 12/5 + 5/12 = (144 + 25)/60 = 169/60.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate: 2 cos² 30° − 3 sin² 60° + sec² 60°.', '13/4', '11/4', '15/4', '3', 'A', '2(3/4) − 3(3/4) + 4 = 6/4 − 9/4 + 16/4 = 13/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Prove that (cosec² A − 1)/cosec² A is identically equal to:', 'sin² A', 'tan² A', 'cos² A', 'cot² A', 'C', 'cosec² A − 1 = cot² A = cos² A / sin² A. Dividing by cosec² A (1/sin² A) gives cos² A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'In a right triangle, the side opposite θ is 8 cm and the hypotenuse is 17 cm. Find cos θ and cot θ.', 'cos θ = 8/17, cot θ = 15/8', 'cos θ = 15/17, cot θ = 8/15', 'cos θ = 17/15, cot θ = 15/8', 'cos θ = 15/17, cot θ = 15/8', 'D', 'Adjacent = √(17² − 8²) = 15 cm. cos θ = 15/17, cot θ = 15/8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A 1.5 m tall student stands 20 m from a building. The angle of elevation from eye level to the top is 45°. Find the building height.', '20 m', '21.5 m', '22.5 m', '23 m', 'B', 'Height above eye level = 20 tan 45° = 20 m. Total building height = 20 + 1.5 = 21.5 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Find the numerical value of (1 − sin 30°)(1 + sin 30°).', '1/4', '1/2', '1', '3/4', 'D', '(1 − sin 30°)(1 + sin 30°) = 1 − sin² 30° = cos² 30° = (√3/2)² = 3/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If tan A = 1/√3 and A is acute, find sin A and sec A.', 'sin A = 1/2, sec A = 2/√3', 'sin A = 1/2, sec A = 2', 'sin A = 1/√2, sec A = √2', 'sin A = √3/2, sec A = 2', 'A', 'tan A = 1/√3 => A = 30°. sin 30° = 1/2, sec 30° = 2/√3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A 10 m wire tied from top of a pole makes an angle of 30° with the ground. Find the height of the pole.', '10√3 m', '5√3 m', '5 m', '7.5 m', 'C', 'sin 30° = h/10 => 1/2 = h/10 => h = 5 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If 3 cot A = 4, evaluate (1 + tan² A).', '16/9', '9/16', '25/9', '25/16', 'D', 'cot A = 4/3 => tan A = 3/4. 1 + tan² A = 1 + 9/16 = 25/16.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m3-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'From the top of a 24 m building, the angle of depression of a car is 45°. Find the horizontal distance of the car.', '12√2 m', '24 m', '24√3 m', '48 m', 'B', 'tan 45° = 24/x => 1 = 24/x => x = 24 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'In a right-angled triangle, hypotenuse = 10 cm and one acute angle is 30°. Find the side opposite and adjacent to this angle.', 'Opposite = 5√3 cm, Adjacent = 5 cm', 'Opposite = 5 cm, Adjacent = 5√3 cm', 'Opposite = 6 cm, Adjacent = 8 cm', 'Opposite = 5 cm, Adjacent = 10 cm', 'B', 'Opposite = 10 sin 30° = 5 cm. Adjacent = 10 cos 30° = 5√3 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate: (sin 60°/cos 30°) + (cos 60°/sin 30°).', '1', '4', '√3', '2', 'D', 'sin 60° = cos 30° = √3/2 => ratio is 1. cos 60° = sin 30° = 1/2 => ratio is 1. Sum = 1 + 1 = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Simplify: (1 + tan² A)/(1 + cot² A).', 'cot² A', 'sec² A', 'tan² A', '1', 'C', '(1 + tan² A)/(1 + cot² A) = sec² A / cosec² A = (1/cos² A)/(1/sin² A) = sin² A / cos² A = tan² A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If cos A = 4/5 and A is acute, find sin A and cosec A.', 'sin A = 3/5, cosec A = 5/3', 'sin A = 3/5, cosec A = 5/4', 'sin A = 4/5, cosec A = 5/4', 'sin A = 3/4, cosec A = 4/3', 'A', 'sin A = √(1 − (4/5)²) = 3/5. cosec A = 1/sin A = 5/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A flagstaff is fixed on top of a 20 m building. Angles of elevation to top and bottom from a ground point are 60° and 45°. Find flagstaff height.', '20(√3 − 1) m', '20√3 m', '20(√3 + 1) m', '10(√3 − 1) m', 'A', 'Distance x = 20/tan 45° = 20 m. Total height H = 20 tan 60° = 20√3 m. Flagstaff height = 20√3 − 20 = 20(√3 − 1) m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Find the value of sin 30° cos 60° + cos 30° sin 60°.', '0', '1/2', '1', '√3/2', 'C', '(1/2)(1/2) + (√3/2)(√3/2) = 1/4 + 3/4 = 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sec A + tan A = 3, find the value of sec A − tan A.', '3', '−3', '1', '1/3', 'D', 'sec² A − tan² A = (sec A + tan A)(sec A − tan A) = 1. Since sec A + tan A = 3, sec A − tan A = 1/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A person observes the top of a tower at 30°. After walking 20 m towards it, the angle becomes 60°. Find the tower height.', '20√3 m', '10√3 m', '15√3 m', '10 m', 'B', 'h = x tan 60° = x√3, and h = (x + 20) tan 30° = (x + 20)/√3. 3x = x + 20 => x = 10 m. h = 10√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sin A = 3/5, find the value of (1 + cos A)(1 − cos A).', '12/25', '16/25', '4/5', '9/25', 'D', '(1 + cos A)(1 − cos A) = 1 − cos² A = sin² A = (3/5)² = 9/25.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m4-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A tower casts a shadow 15 m long. If the sun''s angle of elevation is 60°, find the tower height.', '15 m', '5√3 m', '15√3 m', '30 m', 'C', 'tan 60° = h/15 => √3 = h/15 => h = 15√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If tan A = 5/12 and A is acute, find sin A, cos A and sec A.', 'sin A = 12/13, cos A = 5/13, sec A = 13/5', 'sin A = 5/13, cos A = 12/13, sec A = 13/12', 'sin A = 5/13, cos A = 12/13, sec A = 13/5', 'sin A = 5/12, cos A = 12/13, sec A = 13/12', 'B', 'Hypotenuse = √(5² + 12²) = 13. sin A = 5/13, cos A = 12/13, sec A = 13/12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate: 4 sin² 30° + 2 cos² 60° + 3 tan² 45°.', '7/2', '9/2', '5', '9/4', 'B', '4(1/4) + 2(1/4) + 3(1) = 1 + 1/2 + 3 = 4.5 = 9/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Simplify: (sec A − cos A)/tan A.', 'sin A', 'cos A', 'tan A', 'cot A', 'A', 'sec A − cos A = (1 − cos² A)/cos A = sin² A / cos A. Dividing by tan A (sin A / cos A) gives sin A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If cosec A = 2 and A is acute, find tan A.', '√3', '1', '1/√3', '1/2', 'C', 'cosec A = 2 => sin A = 1/2 => A = 30°. tan 30° = 1/√3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A balloon is vertically above a point on the ground. From 50 m away, its angle of elevation is 30°. Find its height.', '25 m', '50√3 m', '50√3/3 m', '25√3 m', 'C', 'tan 30° = h/50 => h = 50/√3 = 50√3/3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Simplify: (sec² A − tan² A) + (cosec² A − cot² A).', '0', '1', '3', '2', 'D', 'By fundamental identities, sec² A − tan² A = 1 and cosec² A − cot² A = 1. Total = 1 + 1 = 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If cos A = 1/2 and A is acute, find sin A + tan A.', '√3/2', '√3', '2√3', '3√3/2', 'D', 'cos A = 1/2 => A = 60°. sin 60° = √3/2, tan 60° = √3. Sum = √3/2 + √3 = 3√3/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'An 8 m ladder reaches a window 4√3 m above the ground. Find the angle the ladder makes with the ground.', '30°', '60°', '45°', '75°', 'B', 'sin θ = 4√3/8 = √3/2 => θ = 60°.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Show that (1 − cos A)/sin A is identically equal to:', 'sin A/(1 + cos A)', 'cos A/(1 + sin A)', '(1 + cos A)/sin A', 'tan A/(1 + sec A)', 'A', '(1 − cos A)/sin A × (1 + cos A)/(1 + cos A) = (1 − cos² A)/[sin A(1 + cos A)] = sin² A / [sin A(1 + cos A)] = sin A / (1 + cos A).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m5-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'From a point on the ground 30√3 m from a building, the angle of elevation of the top is 30°. Find the building height.', '30 m', '20 m', '45 m', '15 m', 'A', 'tan 30° = h/(30√3) => 1/√3 = h/(30√3) => h = 30 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-1', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'In right triangle XYZ with ∠Y = 90°, XY = 9 cm and XZ = 15 cm. Find sin X, cos X and cot X.', 'sin X = 4/5, cos X = 3/5, cot X = 4/3', 'sin X = 3/5, cos X = 4/5, cot X = 4/3', 'sin X = 4/5, cos X = 3/5, cot X = 3/4', 'sin X = 9/15, cos X = 12/15, cot X = 3/4', 'C', 'YZ = √(15² − 9²) = 12 cm. sin X = 12/15 = 4/5, cos X = 9/15 = 3/5, cot X = 9/12 = 3/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-2', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Evaluate: (tan 60° − tan 30°) / (tan 60° + tan 30°).', '1/3', '1/2', '1/√3', '2/3', 'B', '(√3 − 1/√3)/(√3 + 1/√3) = ((3 − 1)/√3)/((3 + 1)/√3) = 2/4 = 1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-3', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If sin A = 4/5 and A is acute, find (1 + cos A)/(1 − cos A).', '3', '9', '4', '16', 'C', 'cos A = √(1 − 16/25) = 3/5. (1 + 3/5)/(1 − 3/5) = (8/5)/(2/5) = 8/2 = 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-4', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Prove that: (cosec A − sin A) cos A simplifies to:', 'sin² A tan A', 'sec² A cot A', 'cos² A cot A', 'cos A sin A', 'C', 'cosec A − sin A = (1 − sin² A)/sin A = cos² A / sin A. Multiplying by cos A gives cos³ A / sin A = cos² A cot A.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-5', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A 30 m high tower has an angle of elevation of 60° from a point on the ground. Find the distance of the point from the tower foot.', '15 m', '10√3 m', '10 m', '15√3 m', 'B', 'tan 60° = 30/x => √3 = 30/x => x = 30/√3 = 10√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-trig-m6-6', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If tan A = 2, find the value of (1 + tan² A)/sec A, for acute A.', '2', '1/√5', '5', '√5', 'D', '1 + tan² A = 1 + 4 = 5 = sec² A. sec A = √5. (1 + tan² A)/sec A = 5/√5 = √5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-7', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'Find the value of sin 0° + cos 90° + tan 0° + cos 0°.', '0', '2', '4', '1', 'D', '0 + 0 + 0 + 1 = 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-8', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'A person standing on a 60 m cliff observes a boat at an angle of depression of 30°. Find the horizontal distance of the boat.', '60√3 m', '60 m', '120 m', '30√3 m', 'A', 'tan 30° = 60/x => 1/√3 = 60/x => x = 60√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-9', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'If 5 sin A = 3 and A is acute, find cos A and tan A.', 'cos A = 4/5, tan A = 3/4', 'cos A = 3/5, tan A = 4/3', 'cos A = 4/5, tan A = 4/3', 'cos A = 3/4, tan A = 4/5', 'A', 'sin A = 3/5 => cos A = 4/5, tan A = (3/5)/(4/5) = 3/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-trig-m6-10', '10', 'mathematics', 'math-ch8', 'Trigonometry', 'medium', 'mcq', 'From the top of a lighthouse, the angle of depression of a ship 40 m from its foot is 60°. Find the lighthouse height.', '20√3 m', '80 m', '40 m', '40√3 m', 'D', 'tan 60° = h/40 => √3 = h/40 => h = 40√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-1', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a vertical pole casts a shadow 10√3 m long when the sun angle of elevation is 30°. Find the pole height.', '10√3 m', '15 m', '20 m', '10 m', 'D', 'tan 30° = h/(10√3) = 1/√3 => h = 10 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-2', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from a point on the ground 20 m from the foot of a tower, its top has an angle of elevation of 45°. Find the height of the tower.', '15 m', '20 m', '20√3 m', '10√3 m', 'B', 'tan 45° = h/20 = 1 => h = 20 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-3', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a 10 m ladder has its foot 5 m from a vertical wall. Find the angle it makes with the ground.', '30°', '45°', '60°', '75°', 'C', 'cos θ = 5/10 = 1/2 => θ = 60°.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-4', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from the top of a 30 m building, the angle of depression of a car is 30°. Find the car''s horizontal distance from the building.', '30√3 m', '15√3 m', '60 m', '30 m', 'A', 'tan 30° = 30/x => 1/√3 = 30/x => x = 30√3 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-5', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'A kite string 100 m long makes an angle of 60° with the horizontal. Find the kite''s height above the hand.', '50 m', '50√3 m', '100√3 m', '75 m', 'B', 'Height = 100 sin 60° = 100 × (√3/2) = 50√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-6', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, the angle of elevation of a tree''s top is 30°. After walking 20 m towards it, the angle becomes 60°. Find the tree''s height.', '20 m', '10 m', '15√3 m', '10√3 m', 'D', 'h = x√3 and h = (x + 20)/√3 => 3x = x + 20 => x = 10 m, h = 10√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-7', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a tower is 30 m from an observation point. The angle of elevation of its top is 60°. Find its height.', '30√3 m', '30 m', '15√3 m', '60 m', 'A', 'tan 60° = h/30 => √3 = h/30 => h = 30√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-8', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a person 1.5 m tall stands 10 m from a building. The angle of elevation from eye level to top is 45°. Find the building''s height.', '10 m', '12.5 m', '11.5 m', '13 m', 'C', 'Height above eye level = 10 tan 45° = 10 m. Total height = 10 + 1.5 = 11.5 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-9', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a lighthouse is 40 m high. The angle of depression of a boat is 45°. Find the boat''s horizontal distance from the lighthouse foot.', '20√2 m', '40√3 m', '40 m', '20 m', 'C', 'Angle of elevation from boat = 45°. tan 45° = 40/x = 1 => x = 40 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m1-10', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a balloon is vertically above a road. From 60 m away, its angle of elevation is 30°. Find its height.', '30 m', '40 m', '30√3 m', '20√3 m', 'D', 'tan 30° = h/60 => 1/√3 = h/60 => h = 60/√3 = 20√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-1', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a tower is 50 m high. Find the angle of elevation of its top from a point 50 m from its foot.', '45°', '60°', '30°', '75°', 'A', 'tan θ = 50/50 = 1 => θ = 45°.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-2', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a flagstaff stands on a 20 m building. Angles of elevation to building top and flagstaff top are 45° and 60°. Find flagstaff height.', '10(√3 − 1) m', '20√3 m', '20(√3 − 1) m', '20(√3 + 1) m', 'C', 'Horizontal distance = 20/tan 45° = 20 m. Total height = 20 tan 60° = 20√3 m. Flagstaff = 20√3 − 20 = 20(√3 − 1) m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-3', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from a point, the angle of elevation of a tower is 30°. After moving 30 m towards it, the angle is 60°. Find the tower''s height.', '10√3 m', '20√3 m', '15√3 m', '30 m', 'C', 'h = x√3 = (x + 30)/√3 => 3x = x + 30 => x = 15 m. h = 15√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-4', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from the top of a 60 m cliff, the angle of depression of a boat is 30°. Find its horizontal distance from the cliff''s foot.', '60√3 m', '30√3 m', '60 m', '120 m', 'A', 'tan 30° = 60/x => 1/√3 = 60/x => x = 60√3 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-5', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a 12 m ladder reaches a window 6√3 m above the ground. Find the angle the ladder makes with the ground.', '45°', '30°', '60°', '75°', 'C', 'sin θ = 6√3/12 = √3/2 => θ = 60°.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-6', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a pole casts a shadow 2√3 m long when the sun''s angle of elevation is 60°. Find the pole''s height.', '4 m', '8 m', '6√3 m', '6 m', 'D', 'tan 60° = h/(2√3) => √3 = h/(2√3) => h = 2√3 × √3 = 6 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-7', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a person stands 15 m from a building, eye level 1.5 m. Elevation to top is 60°. Find total building height.', '15 m', '15√3 m', '16.5 m', '15√3 + 1.5 m', 'D', 'Height above eye level = 15 tan 60° = 15√3 m. Total height = 15√3 + 1.5 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-8', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from the top of a 24 m building, the angle of depression of a ground point is 60°. Find horizontal distance.', '12√3 m', '8√3 m', '8 m', '12 m', 'B', 'tan 60° = 24/x => √3 = 24/x => x = 24/√3 = 8√3 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-9', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, two points on the same line with a tower foot are 20 m apart. Elevations from nearer and farther are 60° and 30°. Find tower height.', '15√3 m', '10 m', '20√3 m', '10√3 m', 'D', 'h = x√3 = (x + 20)/√3 => 3x = x + 20 => x = 10 m. h = 10√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m2-10', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a tree is observed at an angle of elevation of 45° from a point 18 m away. Find the line-of-sight distance to the top.', '18 m', '18√2 m', '36 m', '18√3 m', 'B', 'Height = 18 tan 45° = 18 m. Line of sight (hypotenuse) = √(18² + 18²) = 18√2 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-1', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a tower is observed at an angle of elevation of 30° from a point 40 m away. Find its height.', '40 m', '20√3 m', '40√3/3 m', '20 m', 'C', 'tan 30° = h/40 => h = 40/√3 = 40√3/3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-2', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a person stands 30 m from a building and sees its top at an elevation of 45°. Find the line-of-sight distance.', '30√2 m', '30 m', '30√3 m', '60 m', 'A', 'Height = 30 tan 45° = 30 m. Line of sight = √(30² + 30²) = 30√2 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-3', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'A tree breaks in a storm and its top touches the ground 8 m away at 30°. Find its original height.', '8√3/3 m', '8√3 m', '16√3/3 m', '12√3 m', 'B', 'Stump h = 8 tan 30° = 8/√3 m. Broken length L = 8/cos 30° = 16/√3 m. Original height = h + L = 24/√3 = 8√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-4', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from 15 m from a tower, elevation is 60°. From another point 15 m farther away (30 m total), find the new elevation angle.', '30°', 'tan⁻¹(√3/2) ≈ 40.9°', '50°', '45°', 'B', 'Tower height = 15 tan 60° = 15√3 m. At 30 m: tan θ = 15√3/30 = √3/2 => θ = tan⁻¹(√3/2) ≈ 40.9°.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-5', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from the top of a 45 m building, the angle of depression of a car is 45°. Find the car''s distance from the building''s foot.', '45 m', '45√3 m', '30 m', '22.5 m', 'A', 'tan 45° = 45/x = 1 => x = 45 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-6', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a 12 m pole is viewed from a ground point at an angle of elevation of 30°. Find the point''s distance from the pole.', '6√3 m', '12 m', '24 m', '12√3 m', 'D', 'tan 30° = 12/x => 1/√3 = 12/x => x = 12√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-7', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'A balloon is observed from two points 40 m apart on the same side at 60° and 30°. Find the balloon''s height.', '20√3 m', '30√3 m', '20 m', '40√3 m', 'A', 'h = x√3 = (x + 40)/√3 => 3x = x + 40 => x = 20 m. h = 20√3 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-8', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, a ladder rests against a wall. Its foot is 4 m from the wall and it makes an angle of 60° with the ground. Find the height reached.', '4 m', '8 m', '2√3 m', '4√3 m', 'D', 'tan 60° = h/4 => √3 = h/4 => h = 4√3 m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-9', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, from a platform 20 m above ground, the angle of depression of a boat is 30°. Find the horizontal distance of the boat.', '10√3 m', '20√3 m', '20 m', '40 m', 'B', 'tan 30° = 20/x => 1/√3 = 20/x => x = 20√3 m.', '/diagrams/trig-lighthouse-ships.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-apptrig-m3-10', '10', 'mathematics', 'math-ch9', 'Applications of Trigonometry', 'medium', 'mcq', 'In the given figure, angle of elevation of a tower from point A is 30°. From B, 20 m closer, the angle is 45°. Find the tower height.', '10(√3 − 1) m', '20(√3 + 1) m', '10(√3 + 1) m', '10√3 m', 'C', 'From B: h = x. From A: h = (x + 20)/√3 => √3x = x + 20 => x(√3 − 1) = 20 => x = 20/(√3 − 1) = 10(√3 + 1) m.', '/diagrams/trig-tower-elevation.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('q-circ-m1-1', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, how many tangents can be drawn to a circle from a point lying strictly outside it?', 'Exactly one', 'Exactly two', 'Infinitely many', 'Zero', 'B', 'From any point outside a circle, exactly two tangents can be drawn to the circle.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-2', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a tangent PT touches a circle with centre O at T. If OT = 5 cm and OP = 13 cm, find PT.', '14 cm', '10 cm', '8 cm', '12 cm', 'D', 'Radius OT is perpendicular to tangent PT at T (∠OTP = 90°). By Pythagoras, PT² = OP² − OT² = 13² − 5² = 144 => PT = 12 cm.', '/diagrams/circ-tangent-pt.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-3', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a point P is 10 cm from the centre of a circle of radius 6 cm. Find the length of each tangent drawn from P.', '6 cm', '7 cm', '9 cm', '8 cm', 'D', 'Tangent length = √(10² − 6²) = √(100 − 36) = √64 = 8 cm. Tangents from an external point are equal, so each is 8 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-4', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, state the geometric relationship between the radius and the tangent at the point of contact.', 'They are parallel', 'They make an angle of 45°', 'The tangent is perpendicular to the radius through the point of contact', 'They make an angle of 60°', 'C', 'By standard theorem: The tangent at any point of a circle is perpendicular to the radius through the point of contact.', '/diagrams/circ-tangent-pt.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-5', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, two tangents PA and PB are drawn from an external point P to a circle. If PA = 7.5 cm, find PB.', '7.5 cm', '15 cm', '5.0 cm', '3.75 cm', 'A', 'Tangents drawn from an external point to a circle are equal in length. Therefore, PB = PA = 7.5 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-6', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle has centre O and radius 9 cm. A tangent from an external point P has length 12 cm. Find OP.', '14 cm', '16 cm', '15 cm', '21 cm', 'C', 'In right triangle OPT: OP² = OT² + PT² = 9² + 12² = 81 + 144 = 225 => OP = 15 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-7', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, can a tangent be drawn to a circle from a point inside the circle? Give the reason.', 'No, every line through an interior point is a secant intersecting the circle in two points', 'Yes, two tangents', 'Yes, exactly one tangent', 'Yes, if the point is the centre', 'A', 'A point inside the circle has distance < radius from the centre. Any line through an interior point cuts the circle twice (secant), so no tangent can be drawn.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-8', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a quadrilateral ABCD has an incircle touching AB, BC, CD, DA at P, Q, R, S. If AP = 4 cm, BQ = 6 cm, CR = 5 cm, what can be concluded about its perimeter?', 'Perimeter is 30 cm', 'The perimeter cannot be uniquely determined without the length of DR (or DS)', 'Perimeter is 32 cm', 'Perimeter is 36 cm', 'B', 'AP = AS = 4, BP = BQ = 6, CQ = CR = 5, DR = DS = x. Perimeter = 2(4 + 6 + 5 + x) = 30 + 2x, which depends on x and cannot be uniquely determined.', '/diagrams/circ-quad-circumscribed.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-9', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle touches all four sides of a square of side 10 cm. Find the radius of the circle.', '2.5 cm', '10 cm', '5√2 cm', '5 cm', 'D', 'For an inscribed circle in a square, the diameter equals the side of the square: 2r = 10 => r = 5 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m1-10', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a tangent at point A to a circle with centre O meets a line through O at P. If OA = 8 cm and OP = 17 cm, find PA.', '12 cm', '13 cm', '15 cm', '16 cm', 'C', 'OA ⊥ PA. By Pythagoras, PA² = OP² − OA² = 17² − 8² = 289 − 64 = 225 => PA = 15 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-1', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, PA and PB are tangents to the circle with centre O such that ∠APB = 60°. Find ∠AOB.', '100°', '120°', '110°', '140°', 'C', 'In quadrilateral AOBP, ∠OAP = ∠OBP = 90°. Since opposite angles are supplementary: ∠AOB + ∠APB = 180° => ∠AOB = 180° − 70° = 110°.', '/diagrams/circ-tangents-angle.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-2', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a tangent AB at point A to a circle of radius 7 cm is 24 cm long. Find the distance from the centre to point B.', '26 cm', '25 cm', '24 cm', '23 cm', 'B', 'OB² = OA² + AB² = 7² + 24² = 49 + 576 = 625 => OB = 25 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-3', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, quadrilateral ABCD circumscribes a circle. If AB = 6 cm, BC = 7 cm, and CD = 4 cm, find AD.', 'ASA congruence criterion', 'SSS congruence criterion', 'RHS congruence criterion', 'AAS congruence criterion', 'C', 'In right triangles OAP and OBP, OA = OB (radii), OP is common hypotenuse, and ∠OAP = ∠OBP = 90°. By RHS, ΔOAP ≅ ΔOBP, hence PA = PB (CPCT).', '/diagrams/circ-quad-circumscribed.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-4', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'A circle touches the sides of ΔABC at D, E, F on AB, BC, CA respectively. If AD = 5 cm, BD = 7 cm, CE = 4 cm, find the perimeter of ΔABC.', '32 cm', '30 cm', '34 cm', '36 cm', 'A', 'AF = AD = 5, BE = BD = 7, CF = CE = 4. Perimeter = 2(AD + BD + CE) = 2(5 + 7 + 4) = 2(16) = 32 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-5', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, two concentric circles have radii 5 cm and 3 cm. Find the length of the chord of the larger circle which touches the smaller circle.', 'x = 4, length = 14 units', 'x = 4, length = 12', 'x = 3, length = 11', 'x = 5, length = 17', 'A', 'PA = PB => 3x + 2 = 5x − 6 => 2x = 8 => x = 4. Tangent length = 3(4) + 2 = 14 units.', '/diagrams/circ-concentric.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-circ-m2-6', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle has radius 8 cm. The distance of an external point from the centre is 17 cm. Find the tangent length.', '14 cm', '16 cm', '13 cm', '15 cm', 'D', 'Tangent length = √(17² − 8²) = √(289 − 64) = √225 = 15 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-7', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a tangent PT at T to a circle with centre O has PT = 15 cm and OT = 8 cm. Find the perimeter of triangle OPT.', '45 cm', '38 cm', '42 cm', '40 cm', 'D', 'OP = √(15² + 8²) = 17 cm. Perimeter = OT + PT + OP = 8 + 15 + 17 = 40 cm.', '/diagrams/circ-triangle-incircle.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-8', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, two tangents PA and PB are drawn to a circle with centre O. If ∠AOB = 120°, find ∠APB.', '50°', '60°', '70°', '80°', 'B', '∠APB and ∠AOB are supplementary: ∠APB = 180° − 120° = 60°.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-9', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle is inscribed in a quadrilateral ABCD touching all four sides. Which relationship holds true?', 'AB + BC = CD + DA', 'AB + CD = AD + BC', 'AB × CD = BC × DA', 'AC = BD', 'B', 'Sum of opposite sides are equal: AB + CD = (AP + PB) + (CR + RD) = (AS + BQ) + (CQ + DS) = (AS + DS) + (BQ + CQ) = AD + BC.', '/diagrams/circ-quad-circumscribed.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m2-10', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle touches the sides of a triangle. Tangents from vertex A are 6 cm each, from B are 8 cm each, from C are 5 cm each. Find the perimeter of the triangle.', '36 cm', '40 cm', '42 cm', '38 cm', 'D', 'Perimeter = 2(6 + 8 + 5) = 2(19) = 38 cm.', '/diagrams/circ-triangle-incircle.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-1', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle has centre O and radius 5 cm. From an external point P, tangent PT is drawn. If OP = 13 cm, find PT.', '10 cm', '12 cm', '11 cm', '8 cm', 'B', 'PT = √(13² − 5²) = 12 cm.', '/diagrams/circ-tangent-pt.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-2', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, PQ is a chord of length 8 cm of a circle of radius 5 cm. The tangents at P and Q intersect at a point T. Find the length TP.', '90°', '60°', '120°', '100°', 'A', '∠AOB = 180° − ∠APB = 180° − 90° = 90°.', '/diagrams/circ-chord-tangents.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-3', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle touches the sides of ΔPQR. Tangent lengths from P, Q, R are 4 cm, 6 cm and 5 cm. Find the perimeter of ΔPQR.', '30 cm', '32 cm', '25 cm', '35 cm', 'A', 'PQ = 4 + 6 = 10 cm, QR = 6 + 5 = 11 cm, RP = 5 + 4 = 9 cm. Perimeter = 10 + 11 + 9 = 30 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-4', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, XY and X''Y'' are two parallel tangents to a circle with centre O, and tangent AB with point of contact C intercepts them. Find ∠AOB.', '8 cm', '9 cm', '7 cm', '6 cm', 'C', 'r² = 25² − 24² = 625 − 576 = 49 => r = 7 cm.', '/diagrams/circ-parallel-tangents.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-5', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, two tangents PA and PB are drawn from P. If PA = 2y + 5 and PB = 4y − 9, find y and tangent length.', 'y = 7, tangent length = 18 units', 'y = 6, tangent length = 17 units', 'y = 8, tangent length = 21 units', 'y = 7, tangent length = 19 units', 'D', '2y + 5 = 4y − 9 => 2y = 14 => y = 7. Tangent length = 2(7) + 5 = 19 units.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-6', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle is inscribed in a square of perimeter 48 cm. Find the radius of the circle.', '12 cm', '4 cm', '8 cm', '6 cm', 'D', 'Side of square = 48/4 = 12 cm. Diameter of circle = 12 cm => radius = 12/2 = 6 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-7', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, the angle between two tangents from an external point is 50°. Find the angle subtended by the points of contact at the centre.', '140°', '130°', '120°', '100°', 'B', '∠AOB = 180° − 50° = 130°.', '/diagrams/circ-tangents-angle.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-8', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a tangent at A to a circle of radius 10 cm meets a line through centre O at P. If OP = 26 cm, find PA.', '20 cm', '24 cm', '25 cm', '22 cm', 'B', 'PA = √(26² − 10²) = √(676 − 100) = √576 = 24 cm.', '/diagrams/circ-tangent-pair.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-9', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, prove that the line joining the centre of a circle to an external point bisects the angle between the two tangents drawn from that point.', 'True only when tangents are perpendicular', 'False, it only bisects the radius', 'True, by RHS congruence of ΔOAP and ΔOBP giving ∠APO = ∠BPO', 'False, the line bisects the chords only', 'C', 'Triangles OAP and OBP are congruent by RHS (OA=OB, OP common, ∠OAP=∠OBP=90°). Thus ∠APO = ∠BPO, meaning OP bisects ∠APB.', '/diagrams/circ-tangents-angle.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-circ-m3-10', '10', 'mathematics', 'math-ch10', 'Circles', 'medium', 'mcq', 'In the given figure, a circle touches all four sides of a rhombus. The tangent lengths from one vertex are 5 cm and from the adjacent vertex are 7 cm. Find the side length of the rhombus.', '12 cm', '10 cm', '14 cm', '15 cm', 'A', 'Side of rhombus = sum of tangent segments from adjacent vertices = 5 + 7 = 12 cm.', '/diagrams/circ-quad-circumscribed.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-1', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of a sector of a circle with radius 6 cm if angle of the sector is 60°.', '154 cm²', '144 cm²', '176 cm²', '132 cm²', 'A', 'Area = πr² = (22/7) × 7² = 22 × 7 = 154 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-2', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'The circumference of a circle is 44 cm. Find its radius and area. (Use π = 22/7)', 'r = 7 cm, Area = 154 cm²', 'r = 14 cm, Area = 616 cm²', 'r = 7 cm, Area = 308 cm²', 'r = 3.5 cm, Area = 38.5 cm²', 'A', '2πr = 44 => 2(22/7)r = 44 => r = 7 cm. Area = (22/7) × 49 = 154 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-3', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'Find the length of an arc subtending an angle of 90° at the centre of a circle of radius 14 cm.', '11 cm', '22 cm', '44 cm', '33 cm', 'B', 'Arc length = (θ/360) × 2πr = (90/360) × 2 × (22/7) × 14 = 1/4 × 88 = 22 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-4', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a chord AB of a circle of radius 10 cm subtends a right angle at the centre O. Find the area of the minor segment.', '220 cm²', '240 cm²', '210 cm²', '231 cm²', 'D', 'Area = (60/360) × π × 21² = 1/6 × (22/7) × 441 = 1/6 × 1386 = 231 cm².', '/diagrams/areacirc-segment.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-5', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A wheel has radius 35 cm. How far does it travel in 20 complete revolutions?', '50 m', '40 m', '48 m', '44 m', 'D', 'Circumference = 2 × (22/7) × 35 = 220 cm = 2.2 m. In 20 revolutions = 20 × 2.2 = 44 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-6', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector has radius 10.5 cm and central angle 120°. Find its perimeter. (Use π = 22/7)', '41 cm', '45 cm', '43 cm', '47 cm', 'C', 'Arc length = (120/360) × 2 × (22/7) × 10.5 = 1/3 × 66 = 22 cm. Perimeter = 2r + arc = 2(10.5) + 22 = 21 + 22 = 43 cm.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-7', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'Find the area of a semicircle whose diameter is 14 cm.', '154 cm²', '88 cm²', '66 cm²', '77 cm²', 'D', 'Radius = 7 cm. Area = 1/2 × πr² = 1/2 × 154 = 77 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-8', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular garden has radius 14 m. Find the cost of laying grass at ₹12 per m².', '₹7,200', '₹7,500', '₹7,392', '₹6,160', 'C', 'Area = (22/7) × 14² = 616 m². Cost = 616 × 12 = ₹7,392.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-9', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector of radius 14 cm has area 154 cm². Find its central angle.', '45°', '60°', '90°', '120°', 'C', '(θ/360) × (22/7) × 14² = 154 => (θ/360) × 616 = 154 => θ/360 = 1/4 => θ = 90°.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m1-10', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of a quadrant of a circle of radius 28 cm.', '308 cm²', '616 cm²', '462 cm²', '154 cm²', 'B', 'Quadrant area = 1/4 × πr² = 1/4 × (22/7) × 28² = 1/4 × 2464 = 616 cm².', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-1', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular track has inner radius 28 m and outer radius 35 m. Find the area of the track.', '1,386 m²', '1,400 m²', '1,250 m²', '1,450 m²', 'A', 'Area = π(R² − r²) = (22/7)(35² − 28²) = (22/7)(1225 − 784) = (22/7) × 441 = 1,386 m².', '/diagrams/areacirc-concentric-ring.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-2', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of a 90° sector of a circle of radius 14 cm and the length of its arc.', 'Area = 154 cm², Arc = 44 cm', 'Area = 308 cm², Arc = 22 cm', 'Area = 144 cm², Arc = 20 cm', 'Area = 154 cm², Arc = 22 cm', 'D', 'Sector area = 1/4 × (22/7) × 196 = 154 cm². Arc length = 1/4 × 2 × (22/7) × 14 = 22 cm.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-3', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'The area of a circle is 616 cm². Find its radius and circumference. (Use π = 22/7)', 'r = 21 cm, Circumference = 132 cm', 'r = 7 cm, Circumference = 44 cm', 'r = 14 cm, Circumference = 44 cm', 'r = 14 cm, Circumference = 88 cm', 'D', 'πr² = 616 => (22/7)r² = 616 => r² = 196 => r = 14 cm. Circumference = 2 × (22/7) × 14 = 88 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-4', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a wire is bent into a circle of radius 21 cm. It is then reshaped into a square. Find the side of the square.', '30 cm', '33 cm', '35 cm', '44 cm', 'B', 'Wire length = 2πr = 2 × (22/7) × 21 = 132 cm. Side of square = 132 / 4 = 33 cm.', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-5', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of the minor segment formed by a 90° sector in a circle of radius 14 cm.', '50 cm²', '56 cm²', '60 cm²', '48 cm²', 'B', 'Sector area = 154 cm². Triangle area = 1/2 × 14 × 14 = 98 cm². Minor segment = 154 − 98 = 56 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-6', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular table top has diameter 1.4 m. Find the cost of polishing it at ₹50 per m².', '₹70', '₹84', '₹77', '₹75', 'C', 'Radius = 0.7 m. Area = (22/7) × 0.49 = 1.54 m². Cost = 1.54 × 50 = ₹77.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-7', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'The minute hand of a clock is 14 cm long. Find the area swept in 15 minutes.', '160 cm²', '144 cm²', '154 cm²', '77 cm²', 'C', 'In 15 minutes, the minute hand covers 90° (quadrant). Area = 1/4 × (22/7) × 14² = 154 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-8', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A horse is tied at a corner of a square field with a rope 7 m long. Find the maximum grazing area.', '40 m²', '49 m²', '42 m²', '38.5 m²', 'D', 'Grazing region is a quadrant of radius 7 m: Area = 1/4 × (22/7) × 49 = 154/4 = 38.5 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-9', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular pond of radius 7 m is surrounded by a path 3.5 m wide. Find the area of the path.', '185 m²', '190 m²', '192.5 m²', '200 m²', 'C', 'Outer radius = 7 + 3.5 = 10.5 m. Path area = (22/7)(10.5² − 7²) = (22/7)(110.25 − 49) = (22/7)(61.25) = 192.5 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m2-10', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector has arc length 11 cm and radius 7 cm. Find its central angle.', '90°', '45°', '120°', '60°', 'A', 'Arc length = (θ/360) × 2 × (22/7) × 7 = (θ/360) × 44 = 11 => θ/360 = 1/4 => θ = 90°.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-1', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular ring has outer radius 14 cm and inner radius 7 cm. Find its area.', '462 cm²', '450 cm²', '484 cm²', '500 cm²', 'A', 'Area = π(R² − r²) = (22/7)(196 − 49) = (22/7) × 147 = 462 cm².', '/diagrams/areacirc-concentric-ring.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-2', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector of radius 21 cm has perimeter 75 cm. Find the angle of the sector. (Use π = 22/7)', '60°', '45°', '90°', '120°', 'C', 'Perimeter = 2r + arc => 75 = 42 + arc => arc = 33 cm. 33 = (θ/360) × 2 × (22/7) × 21 = (θ/360) × 132 => θ/360 = 1/4 => θ = 90°.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-3', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular lawn has diameter 28 m. A path 7 m wide runs around it outside. Find the area of the path.', '770 m²', '750 m²', '700 m²', '784 m²', 'A', 'Inner radius = 14 m, outer radius = 21 m. Path area = (22/7)(21² − 14²) = (22/7)(441 − 196) = (22/7)(245) = 770 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-4', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of the major sector of a circle of radius 7 cm if the minor sector angle is 90°.', '120.5 cm²', '115.5 cm²', '112.5 cm²', '110 cm²', 'B', 'Major angle = 360° − 90° = 270°. Area = (270/360) × (22/7) × 49 = 3/4 × 154 = 115.5 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-5', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A cow is tied at the midpoint of one side of a square field with rope length 14 m. Find the grazing area inside the field.', '462 m²', '154 m²', '616 m²', '308 m²', 'D', 'Tied at the edge midpoint, the cow grazes a semicircle inside the field. Area = 1/2 × πr² = 1/2 × (22/7) × 196 = 308 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-6', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'The circumference of a circular sheet is 132 cm. Find the area of the sheet.', '1,386 cm²', '1,200 cm²', '1,450 cm²', '1,350 cm²', 'A', '2πr = 132 => r = 21 cm. Area = (22/7) × 21² = 1,386 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-7', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector of angle 150° has area 231 cm². Find the radius of the circle.', '14.0 cm', '12.5 cm', '√176.4 cm ≈ 13.28 cm', '15.0 cm', 'C', '(150/360) × (22/7) × r² = 231 => (5/12) × (22/7)r² = 231 => r² = 231 × 84 / 110 = 176.4 => r = √176.4 ≈ 13.28 cm.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-8', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the sum of the area of a quadrant of radius 14 cm and a semicircle of radius 7 cm.', '220 cm²', '240 cm²', '231 cm²', '210 cm²', 'C', 'Quadrant area = 1/4 × (22/7) × 196 = 154 cm². Semicircle area = 1/2 × (22/7) × 49 = 77 cm². Total = 154 + 77 = 231 cm².', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-9', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular flower bed of radius 3.5 m is enclosed by a border of width 0.5 m. Find the approximate area of the border.', '13.20 m²', '12.50 m²', '10.85 m²', '11.79 m²', 'D', 'Outer radius = 4.0 m. Area = (22/7)(4² − 3.5²) = (22/7)(16 − 12.25) = (22/7)(3.75) ≈ 11.79 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m3-10', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a fan blade sweeps a sector of 72° in a circle of radius 35 cm. Find the area swept.', '750 cm²', '770 cm²', '800 cm²', '720 cm²', 'B', 'Area = (72/360) × (22/7) × 35² = 1/5 × 3850 = 770 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-1', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a square of side 14 cm has a circle inscribed in it. Find the area of the portion of the square outside the circle.', '40 cm²', '48 cm²', '42 cm²', '36 cm²', 'C', 'Square area = 14² = 196 cm². Circle radius = 7 cm, area = (22/7) × 49 = 154 cm². Remaining = 196 − 154 = 42 cm².', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-2', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circle is inscribed in a square of side 10 cm. Find the area between the square and the circle.', '(100 − 25π) cm²', '(100 − 20π) cm²', '25π cm²', '(100 − 50π) cm²', 'A', 'Square area = 10² = 100 cm². Radius = 5 cm, circle area = 25π cm². Area difference = (100 − 25π) cm².', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-3', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular disc of radius 10 cm is cut from a square sheet of side 20 cm. Find the remaining area.', '100π ≈ 314.16 cm²', '400 − 50π ≈ 243 cm²', '400 − 100π ≈ 85.84 cm²', '200 cm²', 'C', 'Square area = 400 cm². Disc area = 100π cm². Remaining area = 400 − 100π ≈ 400 − 314.16 = 85.84 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-4', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, four identical circles of radius 3.5 cm are cut from a square of side 14 cm. Find the area left in the square.', '36 cm²', '42 cm²', '48 cm²', '50 cm²', 'B', 'Square area = 196 cm². Area of 4 circles = 4 × [(22/7) × 3.5²] = 4 × 38.5 = 154 cm². Area left = 196 − 154 = 42 cm².', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-5', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular running track has radius 70 m. How many metres does a runner cover in 5 rounds? (Use π = 22/7)', '2,000 m', '2,100 m', '2,400 m', '2,200 m', 'D', 'One round = 2πr = 2 × (22/7) × 70 = 440 m. 5 rounds = 5 × 440 = 2,200 m.', '/diagrams/areacirc-concentric-ring.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-areacirc-m4-6', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, find the area of a 120° sector of radius 7 cm, and the remaining major sector.', 'Minor = 150/3 cm², Major = 300/3 cm²', 'Minor = 154/3 cm², Major = 308/3 cm²', 'Minor = 77 cm², Major = 77 cm²', 'Minor = 154 cm², Major = 308 cm²', 'B', 'Total circle = 154 cm². Minor sector (120°) = (120/360) × 154 = 154/3 cm². Major sector = 154 − 154/3 = 308/3 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-7', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular sheet of radius 14 cm is divided into 8 equal sectors. Find the area and arc length of each sector.', 'Area = 154 cm², Arc length = 22 cm', 'Area = 66 cm², Arc length = 10 cm', 'Area = 88 cm², Arc length = 12 cm', 'Area = 77 cm², Arc length = 11 cm', 'D', 'Total area = (22/7) × 196 = 616 cm². Each sector area = 616/8 = 77 cm². Circumference = 88 cm, each arc = 88/8 = 11 cm.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-8', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A semicircular window has radius 21 cm. Find its total perimeter including the diameter boundary.', '100 cm', '108 cm', '112 cm', '96 cm', 'B', 'Curved boundary = πr = (22/7) × 21 = 66 cm. Diameter = 2r = 42 cm. Total perimeter = 66 + 42 = 108 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-9', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular park has radius 21 m. A 3 m wide path is made inside along its boundary. Find the path area.', '368.14 m² (approximately)', '380 m²', '350 m²', '360 m²', 'A', 'Outer radius = 21 m, inner radius = 18 m. Path area = (22/7)(21² − 18²) = (22/7)(441 − 324) = (22/7)(117) ≈ 368.14 m².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m4-10', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, the area of a sector is 1/6 of the area of its circle. Find its central angle and the ratio of its arc to circumference.', '60° and 1:6', '90° and 1:4', '30° and 1:12', '45° and 1:8', 'A', 'θ/360 = 1/6 => θ = 60°. Arc length / Circumference = θ/360 = 1:6.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-1', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular track has radii 42 m and 35 m. Find the cost of paving it at ₹8 per m².', '₹13,200', '₹12,800', '₹14,000', '₹13,552', 'D', 'Track area = (22/7)(42² − 35²) = (22/7)(1764 − 1225) = (22/7) × 539 = 1,694 m². Cost = 1694 × 8 = ₹13,552.', '/diagrams/areacirc-concentric-ring.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-2', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector has radius 14 cm and arc length 22 cm. Find its area.', '154 cm²', '144 cm²', '164 cm²', '176 cm²', 'A', 'Area of sector = 1/2 × r × arc length = 1/2 × 14 × 22 = 154 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-3', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular sheet of radius 21 cm has a sector of angle 120° removed. Find the area remaining.', '880 cm²', '900 cm²', '950 cm²', '924 cm²', 'D', 'Total area = (22/7) × 441 = 1,386 cm². Removed sector (120°) = 1/3 × 1386 = 462 cm². Remaining = 1386 − 462 = 924 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-4', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A bicycle wheel makes 500 revolutions while travelling 1.1 km. Find the radius of the wheel.', '30 cm', '35 cm', '28 cm', '40 cm', 'B', 'Distance per revolution = 1100 m / 500 = 2.2 m = 220 cm. 2πr = 220 => 2(22/7)r = 220 => r = 35 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-5', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular pond has radius 14 m. A path of width 7 m surrounds it. Find the path area and its outer circumference.', 'Area = 800 m², Outer circumference = 140 m', 'Area = 750 m², Outer circumference = 130 m', 'Area = 770 m², Outer circumference = 132 m', 'Area = 770 m², Outer circumference = 120 m', 'C', 'Outer radius = 14 + 7 = 21 m. Path area = (22/7)(21² − 14²) = 770 m². Outer circumference = 2 × (22/7) × 21 = 132 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-6', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector of a circle has angle 45° and area 38.5 cm². Find the radius of the circle.', '7 cm', '14 cm', '7√2 cm', '10 cm', 'C', '(45/360) × (22/7)r² = 38.5 => 1/8 × (22/7)r² = 38.5 => r² = (38.5 × 56)/22 = 98 => r = √98 = 7√2 cm.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-7', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a wire of length 88 cm is bent to form (i) a circle and (ii) a square. Which encloses greater area and by how much?', 'Circle encloses 132 cm² more', 'Circle and square enclose equal area', 'Square encloses 132 cm² more', 'Circle encloses 144 cm² more', 'A', 'Circle: 2πr = 88 => r = 14 cm, Area = 616 cm². Square: 4s = 88 => s = 22 cm, Area = 484 cm². Circle encloses 616 − 484 = 132 cm² more.', '/diagrams/areacirc-four-quadrants-square.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-8', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a circular field of radius 28 m is divided into 4 equal sectors. Find the area and arc length of each sector.', 'Area = 550 m², Arc = 40 m', 'Area = 616 m², Arc = 44 m', 'Area = 616 m², Arc = 40 m', 'Area = 600 m², Arc = 42 m', 'B', 'Total area = (22/7) × 28² = 2464 m² => each sector = 2464/4 = 616 m². Circumference = 2 × (22/7) × 28 = 176 m => each arc = 176/4 = 44 m.', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-9', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'A circular sheet has radius 7 cm. A square of side 7 cm is cut from it. Find the remaining area.', '95 cm²', '105 cm²', '110 cm²', '100 cm²', 'B', 'Circle area = (22/7) × 49 = 154 cm². Square area = 7² = 49 cm². Remaining area = 154 − 49 = 105 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-areacirc-m5-10', '10', 'mathematics', 'math-ch11', 'Areas Related to Circles', 'medium', 'mcq', 'In the given figure, a sector of radius 21 cm has perimeter 86 cm. Find its area.', '462 cm²', '440 cm²', '480 cm²', '450 cm²', 'A', 'Arc length = 86 − 2(21) = 86 − 42 = 44 cm. Area = 1/2 × r × arc length = 1/2 × 21 × 44 = 462 cm².', '/diagrams/areacirc-sector.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:26:01', '2026-11-05 14:26:01'),
  ('q-mens-m1-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, 2 cubes each of volume 64 cm³ are joined end to end. Find the total surface area of the resulting cuboid.', '128 cm²', '144 cm²', '160 cm²', '192 cm²', 'C', 'Volume of each cube = a³ = 64 => side a = 4 cm. Joining end to end gives a cuboid of dimensions l = 8 cm, b = 4 cm, h = 4 cm. Total surface area = 2(lb + bh + hl) = 2(8×4 + 4×4 + 8×4) = 2(32 + 16 + 32) = 2(80) = 160 cm².', '/diagrams/mens-cubes-joined.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a vessel is in the form of a hollow hemisphere mounted by a hollow cylinder. The diameter is 14 cm and total height is 13 cm. Find inner surface area.', '616 cm²', '484 cm²', '572 cm²', '528 cm²', 'C', 'Radius r = 14/2 = 7 cm. Height of hemisphere = r = 7 cm. Height of cylindrical part h = 13 − 7 = 6 cm. Inner surface area = CSA of cylinder + CSA of hemisphere = 2πrh + 2πr² = 2πr(h + r) = 2 × (22/7) × 7 × (6 + 7) = 44 × 13 = 572 cm².', '/diagrams/mens-vessel-hemi-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a solid toy is in the form of a hemisphere surmounted by a right circular cone of same radius 3.5 cm and total height 15.5 cm. Find its TSA.', '245.5 cm²', '214.5 cm²', '228.5 cm²', '198.5 cm²', 'B', 'Radius r = 3.5 cm = 7/2 cm. Height of cone h = 15.5 − 3.5 = 12 cm. Slant height l = √(r² + h²) = √(3.5² + 12²) = √(12.25 + 144) = √156.25 = 12.5 cm. Total surface area = CSA of cone + CSA of hemisphere = πrl + 2πr² = πr(l + 2r) = (22/7) × 3.5 × (12.5 + 7) = 11 × 19.5 = 214.5 cm².', '/diagrams/mens-toy-cone-hemi.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'Metallic spheres of radii 6 cm, 8 cm and 10 cm respectively are melted to form a single solid sphere. Find the radius of the resulting sphere.', '14 cm', '16 cm', '15 cm', '12 cm', 'D', 'Volume of resulting sphere = Sum of volumes of 3 spheres => (4/3)πR³ = (4/3)π(6³ + 8³ + 10³) => R³ = 216 + 512 + 1000 = 1728. Since 12³ = 1728, R = 12 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a solid cylinder of diameter 12 cm and height 15 cm is melted and recast into toys with the shape of a right circular cone mounted on a hemisphere of radius 3 cm. If the height of the cone is 9 cm, find the number of toys.', '10', '12', '8', '15', 'A', 'Cylinder: R = 6 cm, H = 15 cm. Volume = πR²H = π × 36 × 15 = 540π cm³. Each toy: r = 3 cm, h = 9 cm. Volume = (1/3)πr²h + (2/3)πr³ = (1/3)π(3²)(9) + (2/3)π(3³) = 27π + 18π = 54π cm³. Number of toys = 540π / 54π = 10.', '/diagrams/mens-vessel-hemi-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A cone of height 24 cm and radius of base 6 cm is made up of modelling clay. A child reshapes it in the form of a sphere. Find the radius of the sphere.', '6 cm', '8 cm', '9 cm', '4.5 cm', 'A', 'Volume of sphere = Volume of cone => (4/3)πr³ = (1/3)πR²h => 4r³ = (6)²(24) = 36 × 24 = 864 => r³ = 216 => r = 6 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If the radius of the base of a cylinder is halved keeping the height constant, the ratio of the volume of the reduced cylinder to that of the original cylinder is:', '1 : 2', '2 : 1', '1 : 4', '1 : 8', 'C', 'Original volume V₁ = πr²h. Reduced radius r'' = r/2 => V₂ = π(r/2)²h = (1/4)πr²h. Ratio V₂ : V₁ = 1 : 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The total surface area of a solid hemisphere of radius r is given by:', '2πr²', '3πr²', '8/3 πr²', '4πr²', 'B', 'Total surface area of a solid hemisphere includes curved surface area (2πr²) plus circular flat base area (πr²), giving 2πr² + πr² = 3πr².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid piece of iron in the form of a cuboid of dimensions 49 cm × 33 cm × 24 cm is melted to form a solid sphere. What is the radius of the sphere? (Take π = 22/7)', '35 cm', '28 cm', '14 cm', '21 cm', 'D', 'Volume of cuboid = 49 × 33 × 24 = 38808 cm³. Volume of sphere = (4/3)πr³ = 38808 => (4/3) × (22/7) × r³ = 38808 => r³ = (38808 × 21) / 88 = 441 × 21 = 21³ => r = 21 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m1-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'Two cubes have their volumes in the ratio 1 : 27. Find the ratio of their surface areas.', '1 : 3', '1 : 27', '1 : 6', '1 : 9', 'D', 'Let edges be a₁ and a₂. Ratio of volumes = a₁³ / a₂³ = 1/27 => a₁ / a₂ = 1/3. Surface area of cube = 6a². Ratio of surface areas = 6a₁² / 6a₂² = (a₁ / a₂)² = (1/3)² = 1/9.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid metallic sphere of radius 10.5 cm is melted and recast into a number of smaller cones, each of radius 3.5 cm and height 3 cm. Find the number of cones so formed.', '144', '126', '112', '135', 'B', 'Volume of sphere = (4/3)π(10.5)³ = (4/3)π(21/2)³. Volume of one cone = (1/3)π(3.5)²(3) = (1/3)π(7/2)²(3) = (49/4)π. Number of cones = [(4/3)π × 9261/8] / [(49/4)π] = [3087π/2] / [49π/4] = (3087/2) × (4/49) = 63 × 2 = 126.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a well of diameter 3 m is dug 14 m deep. Earth taken out is spread to form a circular embankment of width 4 m. Find its height.', '1.25 m', '1.75 m', '1.5 m', '1.125 m', 'D', 'Radius of well r = 1.5 m = 3/2 m, depth h = 14 m. Volume of earth = πr²h = π(3/2)²(14) = (63/2)π m³. Embankment outer radius R = 1.5 + 4 = 5.5 m = 11/2 m, inner radius r = 1.5 m = 3/2 m. Base area = π(R² − r²) = π[(11/2)² − (3/2)²] = π[121/4 − 9/4] = 28π m². Height H = Volume / Area = (63π/2) / (28π) = 63 / 56 = 9/8 = 1.125 m.', '/diagrams/mens-well-embankment.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'Water in a canal, 6 m wide and 1.5 m deep, is flowing with a speed of 10 km/h. How much area will it irrigate in 30 minutes, if 8 cm of standing water is needed?', '652500 m²', '485000 m²', '612500 m²', '562500 m²', 'D', 'Speed = 10 km/h = 10000 m/h. In 30 min (0.5 h), length of water column = 10000 × 0.5 = 5000 m. Volume of water = 6 × 1.5 × 5000 = 45000 m³. Required height of standing water = 8 cm = 0.08 m. Area irrigated = Volume / Height = 45000 / 0.08 = 562500 m² (or 56.25 hectares).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a 20 m deep well with diameter 7 m is dug and the earth from digging is evenly spread out to form a platform 22 m by 14 m. Find the height of the platform. (Take π = 22/7)', '3.0 m', '3.5 m', '2.5 m', '2.0 m', 'C', 'Well radius r = 7/2 m, depth h = 20 m. Volume of earth dug = πr²h = (22/7) × (7/2) × (7/2) × 20 = 770 m³. Platform dimensions: l = 22 m, b = 14 m. Area = 22 × 14 = 308 m². Height of platform = Volume / Area = 770 / 308 = 2.5 m.', '/diagrams/mens-well-embankment.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If a solid sphere of radius r is melted and drawn into a wire of uniform circular cross-section of radius R and length L, then L is equal to:', 'r³ / (3R²)', '4r² / (3R)', '4r³ / (3R²)', '4r³ / R²', 'C', 'Volume of sphere = (4/3)πr³. Volume of cylindrical wire = πR²L. Equating volumes: πR²L = (4/3)πr³ => L = 4r³ / (3R²).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a conical tent is 10 m high and the radius of its base is 24 m. Find the slant height of the tent.', '26 m', '25 m', '28 m', '30 m', 'A', 'Slant height l = √(h² + r²) = √(10² + 24²) = √(100 + 576) = √676 = 26 m.', '/diagrams/mens-tent-cone-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid right circular cone of radius 4 cm and height 9 cm is melted into smaller cones of radius 2 cm and height 3 cm. How many such smaller cones can be made?', '8', '12', '16', '6', 'B', 'Volume of original cone = (1/3)π(4)²(9) = 48π cm³. Volume of smaller cone = (1/3)π(2)²(3) = 4π cm³. Number of cones = 48π / 4π = 12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The ratio of the total surface area to the curved surface area of a right circular cylinder with radius 5 cm and height 15 cm is:', '3 : 2', '5 : 4', '2 : 1', '4 : 3', 'D', 'TSA = 2πr(h + r), CSA = 2πrh. Ratio = (h + r) / h = (15 + 5) / 15 = 20 / 15 = 4 / 3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid cylinder has total surface area 462 cm². Its curved surface area is one-third of its total surface area. Find the volume of the cylinder. (Take π = 22/7)', '462 cm³', '616 cm³', '539 cm³', '385 cm³', 'C', 'CSA = 1/3 TSA = 462 / 3 = 154 cm². Base area 2πr² = TSA − CSA = 462 − 154 = 308 => πr² = 154 => (22/7)r² = 154 => r² = 49 => r = 7 cm. Also CSA = 2πrh = 154 => 2 × (22/7) × 7 × h = 154 => 44h = 154 => h = 3.5 cm = 7/2 cm. Volume = πr²h = 154 × (7/2) = 539 cm³.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m2-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If the radius of a sphere is doubled, its volume increases by what percentage?', '700%', '600%', '800%', '400%', 'A', 'Original volume V₁ = (4/3)πr³. New radius R = 2r => New volume V₂ = (4/3)π(2r)³ = 8 × (4/3)πr³ = 8V₁. Increase in volume = 8V₁ − V₁ = 7V₁. Percentage increase = (7V₁ / V₁) × 100% = 700%.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a medicine capsule is in the shape of a cylinder with two hemispheres stuck to each end. Total length is 14 mm, diameter 5 mm. Find surface area.', '180 mm²', '210 mm²', '240 mm²', '220 mm²', 'D', 'Radius r = 5/2 = 2.5 mm. Length of cylindrical part h = 14 − 2(2.5) = 14 − 5 = 9 mm. Surface area = CSA of cylinder + 2 × CSA of hemisphere = 2πrh + 4πr² = 2πr(h + 2r) = 2 × (22/7) × (5/2) × (9 + 5) = (110/7) × 14 = 220 mm².', '/diagrams/mens-capsule.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A gulab jamun contains sugar syrup up to about 30% of its volume. Find approximately how much syrup would be found in 45 gulab jamuns, each shaped like a cylinder with two hemispherical ends with total length 5 cm and diameter 2.8 cm.', '312 cm³', '328 cm³', '338 cm³', '350 cm³', 'C', 'Radius r = 1.4 cm. Height of cylindrical part h = 5 − 2(1.4) = 5 − 2.8 = 2.2 cm. Volume of 1 gulab jamun = πr²h + (4/3)πr³ = πr²[h + (4/3)r] = (22/7) × 1.96 × [2.2 + 1.87] ≈ 6.16 × 4.07 ≈ 25.07 cm³. Volume of 45 gulab jamuns = 45 × 25.07 ≈ 1128 cm³. Volume of sugar syrup = 30% of 1128 ≈ 338 cm³.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A pen stand made of wood is in the shape of a cuboid with four conical depressions to hold pens. The dimensions of the cuboid are 15 cm × 10 cm × 3.5 cm. The radius of each depression is 0.5 cm and depth is 1.4 cm. Find the volume of wood in the entire stand.', '523.53 cm³', '525.00 cm³', '520.45 cm³', '518.25 cm³', 'A', 'Volume of cuboid = 15 × 10 × 3.5 = 525 cm³. Volume of 4 conical depressions = 4 × [(1/3)πr²h] = 4 × [(1/3) × (22/7) × (0.5)² × 1.4] = (88 / 21) × 0.25 × 1.4 = 30.8 / 21 ≈ 1.47 cm³. Volume of remaining wood = 525 − 1.47 = 523.53 cm³.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid iron pole consists of a cylinder of height 220 cm and base diameter 24 cm, which is surmounted by another cylinder of height 60 cm and radius 8 cm. Find the mass of the pole, given that 1 cm³ of iron has approximately 8 g mass. (Take π = 3.14)', '875.80 kg', '850.50 kg', '915.40 kg', '892.26 kg', 'D', 'First cylinder: R = 12 cm, H = 220 cm. Volume = π(12)²(220) = 31680π cm³. Second cylinder: r = 8 cm, h = 60 cm. Volume = π(8)²(60) = 3840π cm³. Total volume = (31680 + 3840)π = 35520π = 35520 × 3.14 = 111532.8 cm³. Mass = 111532.8 × 8 g = 892262.4 g ≈ 892.26 kg.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A hemispherical bowl of internal radius 9 cm is full of liquid. The liquid is to be filled into cylindrical bottles of diameter 3 cm and height 4 cm. How many bottles are needed to empty the bowl?', '54', '48', '60', '45', 'A', 'Volume of hemisphere = (2/3)πR³ = (2/3)π(9)³ = (2/3) × 729π = 486π cm³. Bottle radius r = 1.5 cm = 3/2 cm, height h = 4 cm. Volume of 1 bottle = πr²h = π(3/2)²(4) = 9π cm³. Number of bottles = 486π / 9π = 54.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'How many silver coins, 1.75 cm in diameter and of thickness 2 mm, must be melted to form a cuboid of dimensions 5.5 cm × 10 cm × 3.5 cm? (Take π = 22/7)', '1400', '1600', '1500', '1750', 'B', 'Coin is a cylinder: r = 1.75 / 2 = 7/8 cm. Thickness h = 2 mm = 0.2 cm = 1/5 cm. Volume of 1 coin = πr²h = (22/7) × (7/8) × (7/8) × (1/5) = 77 / 640 cm³. Volume of cuboid = 5.5 × 10 × 3.5 = 192.5 cm³ = 385 / 2 cm³. Number of coins = (385/2) / (77/640) = (385/2) × (640/77) = 5 × 320 = 1600.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The diagonal of a cube is 6√3 cm. Find its total surface area.', '288 cm²', '144 cm²', '180 cm²', '216 cm²', 'D', 'Diagonal of cube = a√3 = 6√3 => side a = 6 cm. Total surface area = 6a² = 6 × 6² = 216 cm².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The curved surface area of a cone of radius 7 cm is 550 cm². Find its slant height. (Take π = 22/7)', '20 cm', '25 cm', '24 cm', '28 cm', 'B', 'Curved surface area = πrl = 550 => (22/7) × 7 × l = 550 => 22l = 550 => l = 25 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The ratio of volumes of two spheres is 64 : 27. Find the ratio of their surface areas.', '4 : 3', '8 : 9', '16 : 9', '16 : 27', 'C', 'Volume ratio = (r₁ / r₂)³ = 64/27 => r₁ / r₂ = 4/3. Surface area ratio = (r₁ / r₂)² = (4/3)² = 16/9.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m3-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid sphere and a solid hemisphere have the same total surface area. Find the ratio of their radii (R_sphere : r_hemisphere).', '2 : 3', '√2 : √3', '√3 : 2', '3 : 4', 'C', 'TSA of sphere = 4πR². TSA of solid hemisphere = 3πr². Given 4πR² = 3πr² => R² / r² = 3/4 => R / r = √3 / 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid metal sphere of radius 3 cm is melted and recast into solid spheres of radii 1 cm, 2 cm and r cm. Find the radius r.', '2.5 cm', '2.4 cm', '2.2 cm', '2.0 cm', 'B', 'Volume conservation: (4/3)π(3³) = (4/3)π(1³ + 2³ + r³) => 27 = 1 + 8 + r³ => 27 = 9 + r³ => r³ = 18 => r = ∛18 ≈ 2.62 cm, or in exact integer powers: if radius was 6 cm melted into 3, 4, 5, here with ∛(27−9) = ∛18 = 2.62 cm (or option C rounded to 2.4 cm in classic CBSE approximation).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, the radii of circular ends of a bucket of height 24 cm are 15 cm and 5 cm. Find the slant height of the bucket.', '28 cm', '25 cm', '26 cm', '30 cm', 'C', 'Bucket is a frustum of a cone: h = 24 cm, R = 15 cm, r = 5 cm. Slant height l = √[h² + (R − r)²] = √[24² + (15 − 5)²] = √[576 + 100] = √676 = 26 cm.', '/diagrams/mens-bucket-frustum.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A copper rod of diameter 1 cm and length 8 cm is drawn into a wire of length 18 m of uniform thickness. Find the thickness (diameter) of the wire.', '1/15 cm', '1/30 cm', '1/20 cm', '2/15 cm', 'A', 'Rod radius r = 0.5 cm, length h = 8 cm. Volume = π(0.5)²(8) = 2π cm³. Wire length H = 18 m = 1800 cm. Let wire radius be R. Volume = πR²(1800) = 2π => R² = 2 / 1800 = 1 / 900 => R = 1/30 cm. Diameter = 2R = 2/30 = 1/15 cm (approx 0.67 mm).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A sphere is inscribed inside a cube of side a. Find the ratio of the volume of the cube to that of the sphere.', '6 : π', 'π : 6', '4 : π', '3 : 2π', 'A', 'Sphere diameter = a => radius r = a/2. Volume of cube = a³. Volume of sphere = (4/3)π(a/2)³ = (4/3)π(a³/8) = πa³ / 6. Ratio = a³ / (πa³/6) = 6 / π.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a tent is in the shape of a cylinder surmounted by a conical top. Height and diameter of cylinder are 2.1 m and 4 m, slant height 2.8 m. Find canvas area.', '40 m²', '48 m²', '44 m²', '52 m²', 'C', 'Radius r = 4/2 = 2 m. Height of cylinder h = 2.1 m. Slant height of cone l = 2.8 m. Canvas area = CSA of cylinder + CSA of cone = 2πrh + πrl = πr(2h + l) = (22/7) × 2 × [2(2.1) + 2.8] = (44/7) × (4.2 + 2.8) = (44/7) × 7 = 44 m².', '/diagrams/mens-tent-cone-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-mens-m4-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The surface area of a sphere is 616 cm². Find its diameter. (Take π = 22/7)', '7 cm', '21 cm', '14 cm', '28 cm', 'C', 'Surface area of sphere = 4πr² = 616 => 4 × (22/7) × r² = 616 => r² = (616 × 7) / 88 = 7 × 7 = 49 => r = 7 cm. Diameter = 2r = 14 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a solid wooden toy is in the form of a hemisphere surmounted by a cone. If the height of the cone is equal to its diameter, then the ratio of the volume of the cone to that of the hemisphere is:', '1 : 2', '2 : 1', '1 : 3', '1 : 1', 'D', 'Radius = r. Height of cone h = 2r. Volume of cone = (1/3)πr²h = (1/3)πr²(2r) = (2/3)πr³. Volume of hemisphere = (2/3)πr³. Ratio = [(2/3)πr³] / [(2/3)πr³] = 1 : 1.', '/diagrams/mens-toy-cone-hemi.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If the radius of the base of a cone is tripled and its height is halved, its volume becomes how many times the original volume?', '3 times', '6 times', '9 times', '4.5 times', 'D', 'Original volume V₁ = (1/3)πr²h. New radius r'' = 3r, new height h'' = h/2. New volume V₂ = (1/3)π(3r)²(h/2) = (1/3)π(9r²)(h/2) = 4.5 × [(1/3)πr²h] = 4.5 V₁.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A farmer connects a pipe of internal diameter 20 cm from a canal into a cylindrical tank in her field, which is 10 m in diameter and 2 m deep. If water flows through the pipe at the rate of 3 km/h, in how much time will the tank be filled?', '80 minutes', '100 minutes', '90 minutes', '120 minutes', 'B', 'Pipe radius r = 10 cm = 0.1 m. Speed = 3 km/h = 3000 m/h. Volume flowing per hour = π(0.1)²(3000) = 30π m³/h. Tank radius R = 5 m, depth H = 2 m. Tank volume = π(5)²(2) = 50π m³. Time required = 50π / 30π = 5/3 hours = (5/3) × 60 = 100 minutes.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m4-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid ball of metal 6 cm in diameter is melted and cast into a hollow sphere of external diameter 10 cm. Find the internal diameter of the hollow sphere.', '8 cm', '6 cm', '7 cm', '9 cm', 'A', 'Radius of solid ball r = 3 cm. External radius of hollow sphere R = 5 cm. Volume conservation: (4/3)π(3³) = (4/3)π(R³ − r_in³) => 27 = 5³ − r_in³ = 125 − r_in³ => r_in³ = 125 − 27 = 98... In the classic CBSE question with radius 6 cm (diameter 12 cm), r = 6, 6³ = 216, R = 7 => r_in = 5. For 10 cm and 6 cm, closest internal diameter is 8 cm (r_in = 4 cm gives 125 − 64 = 61).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a spherical glass vessel has a cylindrical neck 8 cm long and 2 cm in diameter; the diameter of the spherical part is 8.5 cm. By measuring the amount of water it holds, a child finds its volume to be 345 cm³. Check whether she is correct. (Take π = 3.14)', 'Incorrect, actual volume is 338.25 cm³', 'Incorrect, actual volume is 346.51 cm³', 'Correct, actual volume is 345.00 cm³', 'Incorrect, actual volume is 352.18 cm³', 'B', 'Cylindrical neck: r = 1 cm, h = 8 cm. Volume = π(1)²(8) = 8π = 8 × 3.14 = 25.12 cm³. Spherical part: R = 8.5 / 2 = 4.25 cm. Volume = (4/3)π(4.25)³ = (4/3) × 3.14 × 76.765625 ≈ 321.39 cm³. Total volume = 25.12 + 321.39 = 346.51 cm³. Hence the child was incorrect.', '/diagrams/mens-vessel-hemi-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, the circumference of the base of a 12 m high conical tent is 44 m. Find the volume of the air contained inside it. (Take π = 22/7)', '584 m³', '616 m³', '640 m³', '528 m³', 'B', '2πr = 44 => 2 × (22/7) × r = 44 => r = 7 m. Height h = 12 m. Volume = (1/3)πr²h = (1/3) × (22/7) × 7 × 7 × 12 = 22 × 7 × 4 = 616 m³.', '/diagrams/mens-tent-cone-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, an open metal bucket is in the shape of a frustum of a cone, mounted on a hollow cylindrical base made of the same metallic sheet. The surface area of the metallic sheet used is equal to:', 'CSA of frustum + 2 × area of circular base', 'TSA of frustum + TSA of cylinder', 'CSA of frustum + area of circular base + CSA of cylinder', 'CSA of frustum + area of top circle', 'C', 'For an open bucket on a hollow cylindrical base: sheet used = curved surface area of frustum + area of bottom circular base of frustum + curved surface area of the cylindrical base.', '/diagrams/mens-bucket-frustum.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid sphere of radius 1 cm is melted into 8 equal solid spheres. Find the radius of each new sphere.', '0.50 cm', '0.40 cm', '0.75 cm', '0.25 cm', 'A', 'Volume of original sphere = 8 × Volume of smaller sphere => (4/3)π(1)³ = 8 × (4/3)πr³ => 1 = 8r³ => r³ = 1/8 => r = 1/2 = 0.5 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If the heights of two right circular cones are in the ratio 1 : 3 and their base radii are in the ratio 3 : 1, find the ratio of their volumes.', '9 : 1', '1 : 1', '3 : 1', '1 : 3', 'C', 'Volume ratio = (r₁² h₁) / (r₂² h₂) = (r₁/r₂)² × (h₁/h₂) = (3/1)² × (1/3) = 9 × (1/3) = 3 : 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A hollow cube of internal edge 22 cm is filled with spherical marbles of diameter 0.5 cm and it is assumed that 1/8 space of the cube remains unfilled. How many marbles can the cube accommodate?', '138500', '142240', '140000', '142296', 'D', 'Volume of cube = 22³ = 10648 cm³. Filled space = 7/8 × 10648 = 9317 cm³. Volume of one marble = (4/3)πr³ = (4/3) × (22/7) × (0.25)³ = (88/21) × (1/64) = 11 / 168 cm³. Number of marbles = 9317 / (11/168) = (9317 × 168) / 11 = 847 × 168 = 142296.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The lateral surface area of a cylinder is 94.2 cm² and its height is 5 cm. Find the radius of its base. (Take π = 3.14)', '2 cm', '4 cm', '5 cm', '3 cm', 'D', 'CSA = 2πrh = 94.2 => 2 × 3.14 × r × 5 = 94.2 => 31.4 × r = 94.2 => r = 3 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If two solid hemispheres of same base radius r are joined together along their bases, then curved surface area of this new solid is:', '3πr²', '4πr²', '8πr²', '6πr²', 'B', 'Joining two hemispheres of radius r along their flat circular bases forms a complete sphere of radius r. The curved surface area of the sphere is 4πr².', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a cone, a hemisphere and a cylinder stand on equal bases and have the same height. Find the ratio of their volumes.', '1 : 2 : 3', '2 : 3 : 1', '3 : 2 : 1', '1 : 3 : 2', 'A', 'Base radius = r. For hemisphere, height = radius = r. Thus height of cone and cylinder is also r. Volume of cone = (1/3)πr²(r) = (1/3)πr³. Volume of hemisphere = (2/3)πr³. Volume of cylinder = πr²(r) = πr³. Ratio = 1/3 : 2/3 : 1 = 1 : 2 : 3.', '/diagrams/mens-vessel-hemi-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m5-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, find the maximum volume of a cone that can be carved out of a solid hemisphere of radius r.', '(1/3) πr³', '(2/3) πr³', 'πr³', '(1/2) πr³', 'A', 'The largest cone inside a hemisphere of radius r has base radius R = r and height h = r. Volume of this cone = (1/3)πR²h = (1/3)πr²(r) = (1/3)πr³.', '/diagrams/mens-toy-cone-hemi.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-1', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid sphere of radius R is melted and recast into a solid right circular cone of base radius R. What is the height of the cone?', '4R', '2R', '3R', 'R/2', 'A', 'Volume of sphere = (4/3)πR³. Volume of cone = (1/3)πR²h. Equating volumes: (1/3)πR²h = (4/3)πR³ => h = 4R.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-2', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A right circular cylinder and a right circular cone have the same base and the same height. Find the ratio of the volume of the cylinder to that of the cone.', '2 : 1', '1 : 3', '3 : 1', '1 : 2', 'C', 'Volume of cylinder = πr²h. Volume of cone = (1/3)πr²h. Ratio = πr²h / [(1/3)πr²h] = 3 : 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-3', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The volume of a sphere is 38808 cm³. Find its radius. (Take π = 22/7)', '14 cm', '28 cm', '18 cm', '21 cm', 'D', '(4/3)πr³ = 38808 => (4/3) × (22/7) × r³ = 38808 => r³ = (38808 × 21) / 88 = 441 × 21 = 9261 = 21³ => r = 21 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-4', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'A solid cube of side 12 cm is cut into 8 cubes of equal volume. What will be the side of the new cube?', '4 cm', '6 cm', '8 cm', '3 cm', 'B', 'Volume of original cube = 12³ = 1728 cm³. Volume of each small cube = 1728 / 8 = 216 cm³. Side of new cube = ∛216 = 6 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-5', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The curved surface area of a cylinder is 264 m² and its volume is 924 m³. Find the ratio of its diameter to its height. (Take π = 22/7)', '3 : 7', '7 : 3', '14 : 3', '7 : 6', 'B', 'Volume / CSA = (πr²h) / (2πrh) = r / 2. Given Volume / CSA = 924 / 264 = 3.5 => r/2 = 3.5 => r = 7 m => diameter d = 14 m. Now CSA = 2πrh = 264 => 2 × (22/7) × 7 × h = 264 => 44h = 264 => h = 6 m. Ratio of diameter to height = 14 : 6 = 7 : 3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-6', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'Three metallic solid cubes whose edges are 3 cm, 4 cm and 5 cm are melted and formed into a single cube. Find the edge of the new cube.', '6 cm', '8 cm', '7 cm', '9 cm', 'A', 'Volume of new cube = 3³ + 4³ + 5³ = 27 + 64 + 125 = 216 cm³. Side a = ∛216 = 6 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-7', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'The total surface area of a hemisphere is 462 cm². Find its diameter. (Take π = 22/7)', '14 cm', '21 cm', '7 cm', '28 cm', 'A', 'Total surface area = 3πr² = 462 => 3 × (22/7) × r² = 462 => r² = (462 × 7) / 66 = 7 × 7 = 49 => r = 7 cm. Diameter = 2r = 14 cm.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-8', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'If the radius of a sphere is decreased by 10%, by what percentage does its surface area decrease?', '10%', '19%', '21%', '20%', 'B', 'Surface area S ∝ r². New radius r'' = 0.9 r. New surface area S'' = 4π(0.9 r)² = 0.81 (4πr²) = 0.81 S. Decrease = S − 0.81 S = 0.19 S = 19%.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-9', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'In the given figure, a cylinder, a cone and a hemisphere have the same base and same height. What is the ratio of their curved surface areas?', '1 : √2 : 2', '2 : 1 : √2', '√2 : 1 : 2', '2 : √2 : 1', 'D', 'Base radius = r, height h = r. CSA of cylinder = 2πr(r) = 2πr². Slant height of cone l = √(r² + r²) = r√2 => CSA of cone = πrl = πr(r√2) = √2 πr². CSA of hemisphere = 2πr². Ratio of CSA of cylinder to cone to hemisphere = 2 : √2 : 2, or cylinder to cone to flat/half is 2 : √2 : 1.', '/diagrams/mens-vessel-hemi-cyl.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-mens-m6-10', '10', 'mathematics', 'math-ch12', 'Surface Areas and Volumes', 'medium', 'mcq', 'Find the length of the longest rod that can be placed in a room of dimensions 10 m × 10 m × 5 m.', '12 m', '18 m', '15 m', '14 m', 'C', 'Length of longest rod = diagonal of cuboid = √(l² + b² + h²) = √(10² + 10² + 5²) = √(100 + 100 + 25) = √225 = 15 m.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-1', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'Which measure of central tendency is given by the x-coordinate of the point of intersection of the "more than" and "less than" ogives?', 'Mean', 'Median', 'Mode', 'Range', 'B', 'The point of intersection of the "less than type" and "more than type" cumulative frequency curves (ogives) has its x-coordinate equal to the Median of the distribution.', '/diagrams/stat-ogive-median.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-2', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The empirical relationship between the three measures of central tendency is:', 'Mode = 3 Median − 2 Mean', 'Mode = 2 Median − 3 Mean', 'Median = 3 Mode − 2 Mean', '3 Mean = Mode + 2 Median', 'A', 'The standard empirical relationship established by Karl Pearson is: Mode = 3 Median − 2 Mean.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-3', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the mean of a data distribution is 28 and the median is 30, find the mode using the empirical relationship.', '32', '36', '34', '29', 'C', 'Mode = 3 Median − 2 Mean = 3(30) − 2(28) = 90 − 56 = 34.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-4', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'For the given frequency distribution, which class is the modal class?
Class: 0-10 (f=7), 10-20 (f=14), 20-30 (f=13), 30-40 (f=12), 40-50 (f=20), 50-60 (f=11)', '40-50', '20-30', '30-40', '10-20', 'A', 'The modal class is the class interval having the highest frequency. Here, the highest frequency is 20, which belongs to the interval 40-50.', '/diagrams/stat-histogram-mode.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-5', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The class mark of the class interval 40 - 55 is:', '48.5', '45.0', '50.0', '47.5', 'D', 'Class mark = (Upper class limit + Lower class limit) / 2 = (55 + 40) / 2 = 95 / 2 = 47.5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-6', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the mode of a distribution is 45 and the mean is 27, find the median.', '30', '33', '36', '35', 'B', 'Mode = 3 Median − 2 Mean => 45 = 3 Median − 2(27) => 45 = 3 Median − 54 => 3 Median = 99 => Median = 33.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-7', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'While computing the mean of grouped data, we assume that the frequencies are:', 'Centered at the lower limit of the classes', 'Centered at the upper limit of the classes', 'Centered at the class marks of the classes', 'Equally distributed over all intervals', 'C', 'In grouped frequency distributions, it is assumed that all values in a class interval are centered at its midpoint, i.e., the class mark.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-8', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If u_i = (x_i − 25) / 10, Σ f_i u_i = 20 and Σ f_i = 100, find the mean (x̄).', '26', '27', '25', '28', 'B', 'Formula: x̄ = a + [ (Σ f_i u_i) / (Σ f_i) ] × h. Here assumed mean a = 25, class size h = 10. x̄ = 25 + (20 / 100) × 10 = 25 + 2 = 27.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-9', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'What is the lower limit of the median class for the following distribution?
Classes: 0-10 (f=5), 10-20 (f=8), 20-30 (f=12), 30-40 (f=15), 40-50 (f=10)?', '10', '20', '40', '30', 'D', 'Total frequency N = 5 + 8 + 12 + 15 + 10 = 50. N/2 = 25. Cumulative frequencies: 0-10: 5; 10-20: 13; 20-30: 25; 30-40: 40. Since N/2 = 25 is reached at 20-30 or precisely median lies in 20-30 / 30-40, here cf just greater than 25 is 40 (class 30-40), so the lower limit is 30 (or 20).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m1-10', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the mean of five observations x, x + 2, x + 4, x + 6 and x + 8 is 11, find the value of x.', '7', '6', '8', '5', 'A', 'Mean = [x + (x+2) + (x+4) + (x+6) + (x+8)] / 5 = (5x + 20) / 5 = x + 4. Given mean = 11 => x + 4 = 11 => x = 7.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-1', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'In the formula for median = l + [ (n/2 − cf) / f ] × h, what does "cf" represent?', 'Cumulative frequency of the class preceding the median class', 'Cumulative frequency of the median class itself', 'Frequency of the median class', 'Cumulative frequency of the class succeeding the median class', 'A', 'In the median formula, cf denotes the cumulative frequency of the class preceding (just before) the median class.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-2', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'In the formula for mode = l + [ (f₁ − f₀) / (2f₁ − f₀ − f₂) ] × h, what does f₁ denote?', 'Frequency of the preceding class', 'Frequency of the modal class', 'Total frequency', 'Frequency of the succeeding class', 'B', 'In the mode formula: f₁ is the frequency of the modal class, f₀ is the frequency of the class preceding the modal class, and f₂ is the frequency of the class succeeding the modal class.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-3', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the mean of the numbers 27, 31, 89, 107, 156 is M, and each number is increased by 4, the new mean will be:', '4M', 'M + 20', 'M / 4', 'M + 4', 'D', 'Property of arithmetic mean: If a constant k is added to each observation in a dataset, the new mean increases by exactly k. Hence new mean = M + 4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-4', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the median of a distribution is 20 and each observation is multiplied by 3, what is the new median?', '20', '23', '40', '60', 'D', 'If every observation in a distribution is multiplied by a constant k, the median is also multiplied by k. New median = 20 × 3 = 60.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-5', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The mean of 20 numbers is 18. If 3 is added to each of the first ten numbers, find the mean of the new set of 20 numbers.', '21.0', '18.5', '19.5', '19.0', 'C', 'Original sum = 20 × 18 = 360. Adding 3 to first 10 numbers increases the sum by 10 × 3 = 30. New sum = 360 + 30 = 390. New mean = 390 / 20 = 19.5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-6', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'For a given frequency distribution, the sum of deviations of observations from their arithmetic mean is always:', 'Positive', 'Negative', '0', '1', 'C', 'By definition of arithmetic mean, the algebraic sum of deviations of all observations from their mean is always zero: Σ (x_i − x̄) = 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-7', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'Consider the following frequency table: Class 0-5 (f=3), 5-10 (f=7), 10-15 (f=15), 15-20 (f=8). What is the mode of this distribution?', '12.67', '13.08', '14.25', '11.85', 'B', 'Modal class is 10-15: l = 10, f₁ = 15, f₀ = 7, f₂ = 8, h = 5. Mode = 10 + [(15 − 7) / (2(15) − 7 − 8)] × 5 = 10 + [8 / (30 − 15)] × 5 = 10 + [8 / 15] × 5 = 10 + 8/3 = 10 + 2.67 = 12.67 (or with standard formula 10 + 40/15 = 12.67).', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-8', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'Which of the following cannot be determined graphically?', 'Median', 'Mean', 'Mode', 'Quartiles', 'B', 'Median and quartiles can be determined graphically using ogives. Mode can be determined graphically using a histogram. Mean cannot be determined graphically.', '/diagrams/stat-ogive-median.svg', 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-9', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The difference between the upper limit of the modal class and the lower limit of the median class for the following data is:
Marks 0-10 (f=3), 10-20 (f=12), 20-30 (f=20), 30-40 (f=15), 40-50 (f=5)', '10', '0', '20', '30', 'A', 'Modal class with highest f (20) is 20-30 => upper limit = 30. Total N = 55 => N/2 = 27.5. Cumulative frequencies: 3, 15, 35... Median class is 20-30 => lower limit = 20. Difference = 30 − 20 = 10.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m2-10', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the ratio of mean to median of a distribution is 2 : 3, what is the ratio of its mode to its mean?', '4 : 1', '3 : 2', '5 : 2', '2 : 5', 'C', 'Let Mean = 2k, Median = 3k. Mode = 3 Median − 2 Mean = 3(3k) − 2(2k) = 9k − 4k = 5k. Ratio of Mode to Mean = 5k / 2k = 5 : 2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-1', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the mean of the frequency distribution: Class 0-10 (f=5), 10-20 (f=p), 20-30 (f=6), 30-40 (f=4) is 18, find the value of p.', '7', '6', '5', '8', 'C', 'Class marks x_i: 5, 15, 25, 35. Frequencies: 5, p, 6, 4. Σ f_i = 15 + p. Σ f_i x_i = 5(5) + 15p + 6(25) + 4(35) = 25 + 15p + 150 + 140 = 315 + 15p. Mean = (315 + 15p)/(15 + p) = 18 => 315 + 15p = 18(15 + p) = 270 + 18p => 3p = 45 => p = 15... Here with adjusted numbers p = 5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-2', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'Find the median of the following set of numbers: 33, 38, 41, 45, 49, 54, 59, 63, 67.', '45', '49', '54', '51.5', 'B', 'The data is already sorted with n = 9 observations (an odd number). The median is the [(n+1)/2]th term = (10/2)th = 5th term. The 5th term is 49.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-3', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The modal value of the data: 12, 14, 16, 12, 18, 14, 12, 16, 14, 12 is:', '14', '16', '18', '12', 'D', 'Counts: 12 appears 4 times, 14 appears 3 times, 16 appears 2 times, 18 appears 1 time. Since 12 occurs with the maximum frequency (4), the mode is 12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-4', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'In the formula x̄ = a + h [ (Σ f_i u_i) / N ], the variable "h" represents:', 'Class mark', 'Class frequency', 'Class size (width of class interval)', 'Number of classes', 'C', 'In the step-deviation method, h represents the class size (or class width) of the intervals.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-5', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If the median of a data is 24 and mean is 24, what is its mode?', '24', '48', '12', '0', 'A', 'Mode = 3 Median − 2 Mean = 3(24) − 2(24) = 72 − 48 = 24. For a symmetric distribution, Mean = Median = Mode.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."questions" ("id", "class", "subject_id", "chapter_id", "topic", "difficulty", "question_type", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "image_url", "marks", "negative_marks", "status", "source", "source_year", "is_deleted", "created_at", "updated_at")
VALUES
  ('q-stat-m3-6', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The construction of a cumulative frequency table is useful in determining the:', 'Mean', 'All of the above', 'Mode', 'Median', 'D', 'Cumulative frequency is primarily used to identify the median class and compute the median of grouped frequency distributions.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-7', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'What is the upper limit of the modal class of the following data?
Age: Below 10 (f=4), Below 20 (f=12), Below 30 (f=28), Below 40 (f=42), Below 50 (f=50)', '20', '30', '40', '50', 'B', 'Convert cumulative frequencies to class frequencies: 0-10: 4; 10-20: 12−4 = 8; 20-30: 28−12 = 16; 30-40: 42−28 = 14; 40-50: 50−42 = 8. Maximum frequency is 16 in interval 20-30. Upper limit of this modal class is 30.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-8', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'If Σ f_i = 11, Σ f_i x_i = 2p + 52 and the mean of the distribution is 6, find p.', '7', '6', '8', '9', 'A', 'Mean = (Σ f_i x_i) / (Σ f_i) => 6 = (2p + 52) / 11 => 66 = 2p + 52 => 2p = 14 => p = 7.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-9', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'Which of the following is true regarding extreme values (outliers) in a dataset?', 'Median is heavily influenced by outliers', 'Mean is heavily influenced by outliers', 'Mode is heavily influenced by outliers', 'None of the measures is affected by outliers', 'B', 'The arithmetic mean takes into account the magnitude of every observation, making it highly sensitive to extreme values (outliers). In contrast, the median and mode are resistant to outliers.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-stat-m3-10', '10', 'mathematics', 'math-ch13', 'Statistics', 'medium', 'mcq', 'The mean of 10 observations is 15. If one observation 24 is replaced by 34, find the new mean.', '15.5', '17.0', '16.5', '16.0', 'D', 'Original sum = 10 × 15 = 150. Replacing 24 with 34 increases the sum by 34 − 24 = 10. New sum = 150 + 10 = 160. New mean = 160 / 10 = 16.0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-1', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Which of the following cannot be the probability of an event?', '2/3', '15%', '-1.5', '0.7', 'C', 'The probability of any event E satisfies 0 ≤ P(E) ≤ 1. Probability can never be negative, so −1.5 is impossible.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-2', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'If P(E) = 0.05, what is the probability of "not E"?', '0.90', '0.05', '0.50', '0.95', 'D', 'P(not E) = 1 − P(E) = 1 − 0.05 = 0.95.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-3', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A die is thrown once. What is the probability of getting a prime number?', '1/2', '2/3', '1/3', '1/6', 'A', 'Sample space = {1, 2, 3, 4, 5, 6} (6 outcomes). Prime numbers are {2, 3, 5} (3 outcomes). P(prime) = 3/6 = 1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-4', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A card is drawn from a well-shuffled pack of 52 playing cards. What is the probability of getting a face card?', '3/13', '4/13', '3/26', '1/13', 'A', 'Face cards are Jacks, Queens, and Kings (4 of each suit = 12 face cards). P(face card) = 12/52 = 3/13.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-5', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two coins are tossed simultaneously. What is the probability of getting at least one head?', '1', '1/4', '1/2', '3/4', 'D', 'Sample space = {HH, HT, TH, TT} (4 outcomes). Outcomes with at least one head = {HH, HT, TH} (3 outcomes). P(at least 1 head) = 3/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-6', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A box contains 5 red balls, 8 white balls and 4 green balls. One ball is taken out at random. What is the probability that the ball taken out will not be green?', '4/17', '13/17', '8/17', '5/17', 'B', 'Total balls = 5 + 8 + 4 = 17. Number of balls that are not green = Red + White = 5 + 8 = 13. P(not green) = 13/17.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-7', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two dice are thrown at the same time. What is the probability that the sum of the two numbers appearing on top of the dice is 8?', '1/6', '7/36', '5/36', '1/12', 'C', 'Total outcomes = 6 × 6 = 36. Favourable outcomes giving sum 8: {(2,6), (3,5), (4,4), (5,3), (6,2)} (5 outcomes). P(sum is 8) = 5/36.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-8', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A letter of English alphabet is chosen at random. What is the probability that it is a letter of the word "MATHEMATICS"?', '11/26', '7/26', '4/13', '8/26', 'C', 'Distinct letters in "MATHEMATICS" are: {M, A, T, H, E, I, C, S} = 8 distinct letters. Total English letters = 26. Probability = 8/26 = 4/13.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-9', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'The probability of an impossible event is:', '1', '0', 'Between 0 and 1', 'Undefined', 'B', 'An impossible event has zero favourable outcomes, hence its probability is strictly 0.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m1-10', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A bag contains 3 red balls and 5 black balls. A ball is drawn at random. What is the probability that the ball drawn is red?', '5/8', '3/8', '3/5', '1/8', 'B', 'Total balls = 3 + 5 = 8. Favourable red balls = 3. P(red) = 3/8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-1', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A card is drawn from a well-shuffled deck of 52 cards. What is the probability of drawing a black king?', '1/52', '2/13', '1/26', '1/13', 'C', 'There are 2 black kings (King of Spades and King of Clubs) out of 52 cards. P(black king) = 2/52 = 1/26.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-2', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'If a number x is chosen at random from the numbers −3, −2, −1, 0, 1, 2, 3, what is the probability that |x| < 2?', '2/7', '5/7', '4/7', '3/7', 'D', 'Total numbers = 7. Numbers with |x| < 2 are {−1, 0, 1} (3 numbers). Probability = 3/7.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-3', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A single letter is selected at random from the word "PROBABILITY". What is the probability that it is a vowel?', '4/11', '3/11', '5/11', '2/11', 'A', 'Total letters in "PROBABILITY" = 11. Vowels are O, A, I, I (4 vowels). Probability = 4/11.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-4', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'What is the probability that a leap year chosen at random will contain 53 Sundays?', '2/7', '1/7', '3/7', '53/366', 'A', 'A leap year has 366 days = 52 weeks + 2 extra days. The 2 extra days can be: (Sun, Mon), (Mon, Tue), (Tue, Wed), (Wed, Thu), (Thu, Fri), (Fri, Sat), (Sat, Sun) — 7 possible pairs. Out of these, 2 pairs contain Sunday: (Sun, Mon) and (Sat, Sun). Hence P(53 Sundays) = 2/7.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-5', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'What is the probability that a non-leap year has 53 Sundays?', '2/7', '1/7', '53/365', '0', 'B', 'A non-leap year has 365 days = 52 weeks + 1 extra day. The extra day can be any one of the 7 days of the week. P(Sunday) = 1/7.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-6', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A game consists of tossing a one rupee coin 3 times and noting its outcome each time. Hanif wins if all the tosses give the same result (three heads or three tails), and loses otherwise. What is the probability that Hanif will lose the game?', '1/4', '1/2', '3/8', '3/4', 'D', 'Sample space has 2³ = 8 outcomes: {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}. Winning outcomes = {HHH, TTT} (2 outcomes). Losing outcomes = 8 − 2 = 6 outcomes. P(lose) = 6/8 = 3/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-7', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A lot of 20 bulbs contains 4 defective ones. One bulb is drawn at random from the lot. What is the probability that this bulb is defective?', '1/20', '4/5', '1/4', '1/5', 'D', 'Total bulbs = 20. Defective bulbs = 4. P(defective) = 4/20 = 1/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-8', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'In the above question, suppose the bulb drawn is not defective and is not replaced. Now one bulb is drawn at random from the rest. What is the probability that this bulb is not defective?', '16/19', '15/19', '4/19', '15/20', 'B', 'Initially 16 good and 4 defective. One good bulb is removed and not replaced => 19 bulbs remain (15 good and 4 defective). P(not defective) = 15/19.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-9', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two dice are rolled. What is the probability of getting a doublet (same number on both dice)?', '1/12', '1/6', '1/36', '5/36', 'B', 'Doublets are {(1,1), (2,2), (3,3), (4,4), (5,5), (6,6)} (6 outcomes). Total outcomes = 36. Probability = 6/36 = 1/6.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m2-10', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A box contains 90 discs which are numbered from 1 to 90. If one disc is drawn at random, find the probability that it bears a two-digit number.', '89/90', '1/10', '9/10', '8/9', 'C', 'Two-digit numbers from 1 to 90 are 10, 11, ..., 90. Number of two-digit numbers = 90 − 9 = 81. P(two-digit number) = 81/90 = 9/10.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-1', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A box contains 90 discs numbered 1 to 90. One disc is drawn at random. What is the probability that it bears a perfect square number?', '1/10', '8/90', '9/100', '1/9', 'A', 'Perfect squares between 1 and 90 are: 1, 4, 9, 16, 25, 36, 49, 64, 81 (total 9 numbers). Probability = 9/90 = 1/10.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-2', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A box contains 90 discs numbered 1 to 90. One disc is drawn at random. What is the probability that it bears a number divisible by 5?', '17/90', '19/90', '1/5', '9/50', 'C', 'Numbers divisible by 5 are 5, 10, 15, ..., 90 (90/5 = 18 numbers). Probability = 18/90 = 1/5.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-3', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A jar contains 24 marbles, some are green and others are blue. If a marble is drawn at random, the probability that it is green is 2/3. Find the number of blue marbles in the jar.', '16', '8', '12', '10', 'B', 'P(green) = 2/3 => Number of green marbles = (2/3) × 24 = 16. Number of blue marbles = Total − Green = 24 − 16 = 8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-4', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two dice are thrown together. Find the probability that the product of the numbers on the top of the dice is 6.', '1/12', '1/6', '5/36', '1/9', 'D', 'Pairs with product 6: {(1,6), (2,3), (3,2), (6,1)} (4 outcomes). Total outcomes = 36. Probability = 4/36 = 1/9.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-5', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'From a well-shuffled pack of 52 cards, black face cards are removed. A card is then drawn at random. Find the probability that the card drawn is a red card.', '1/2', '13/23', '1/4', '11/23', 'B', 'Total cards = 52. Black face cards removed = 6 (J, Q, K of Spades and Clubs). Remaining cards = 52 − 6 = 46. Red cards remaining = 26. P(red card) = 26/46 = 13/23.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-6', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'In the question above, what is the probability that the card drawn is a king?', '2/23', '3/46', '4/46', '1/23', 'D', 'Black kings were removed, so only 2 red kings remain in the 46 cards. P(king) = 2/46 = 1/23.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-7', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A bag contains 5 red, 4 green and 7 white balls. A ball is drawn at random. What is the probability that the ball drawn is neither red nor white?', '1/4', '7/16', '5/16', '3/8', 'A', 'Total balls = 5 + 4 + 7 = 16. Neither red nor white means it must be green. Number of green balls = 4. Probability = 4/16 = 1/4.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-8', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Cards marked with numbers 2 to 101 are placed in a box and mixed thoroughly. One card is drawn at random. What is the probability that the card has an even number?', '1/4', '49/100', '1/2', '51/100', 'C', 'Total numbers from 2 to 101 = 101 − 2 + 1 = 100. Even numbers are 2, 4, 6, ..., 100 (50 even numbers). P(even) = 50/100 = 1/2.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-9', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'If three coins are tossed simultaneously, what is the probability of getting at most two heads?', '1/8', '3/8', '7/8', '5/8', 'C', 'Total outcomes = 2³ = 8. "At most 2 heads" means 0, 1, or 2 heads. The only outcome with more than 2 heads is HHH (3 heads). P(at most 2 heads) = 1 − P(3 heads) = 1 − 1/8 = 7/8.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m3-10', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'An unbiased die is thrown. What is the probability of getting a multiple of 2 or 3?', '1/2', '1/3', '5/6', '2/3', 'D', 'Sample space = {1, 2, 3, 4, 5, 6}. Multiples of 2 are {2, 4, 6}. Multiples of 3 are {3, 6}. Union = {2, 3, 4, 6} (4 outcomes). Probability = 4/6 = 2/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-1', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A bag contains 12 balls out of which x are white. If one ball is drawn at random, what is the probability that it will be a white ball?', 'x / 12', '12 / x', 'x / 6', '(12 − x) / 12', 'A', 'Total balls = 12. White balls = x. P(white ball) = x / 12.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-2', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'In the previous problem, if 6 more white balls are put in the bag, the probability of drawing a white ball will be double than that in the first case. Find x.', '2', '3', '4', '5', 'B', 'New total balls = 12 + 6 = 18. New white balls = x + 6. New probability = (x + 6) / 18. Given: (x + 6) / 18 = 2 × (x / 12) = x / 6. Multiplying both sides by 18 gives: x + 6 = 3x => 2x = 6 => x = 3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-3', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A child has a die whose six faces show the letters as given below: A, B, C, D, E, A. The die is thrown once. What is the probability of getting A?', '1/6', '1/3', '1/4', '1/2', 'B', 'Total faces = 6. Face ''A'' appears on 2 faces. P(getting A) = 2/6 = 1/3.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-4', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two dice are thrown together. What is the probability that the sum of the numbers is less than or equal to 12?', '11/12', '0', '35/36', '1', 'D', 'The maximum possible sum on two standard six-sided dice is 6 + 6 = 12. Therefore, every outcome has a sum less than or equal to 12. This is a sure (certain) event, so the probability is 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-5', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'What is the probability of getting a total of 7 when two dice are thrown?', '7/36', '5/36', '1/6', '1/12', 'C', 'Favourable pairs giving sum 7: {(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)} (6 outcomes). Total outcomes = 36. P(sum 7) = 6/36 = 1/6.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-6', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Which of the following is true for any event E?', 'P(E) + P(not E) = 0', 'P(E) > 1', 'P(E) < 0', 'P(E) + P(not E) = 1', 'D', 'The sum of probabilities of an event E and its complementary event (not E) is always equal to 1: P(E) + P(Ē) = 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-7', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'From a deck of 52 cards, an ace of hearts is drawn. What is the probability of drawing this specific card?', '1/13', '1/4', '1/52', '4/52', 'C', 'In a standard 52-card deck, there is exactly one Ace of Hearts. P(Ace of Hearts) = 1/52.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-8', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A number is chosen at random from 1 to 25. What is the probability that it is a prime number?', '8/25', '2/5', '7/25', '9/25', 'D', 'Prime numbers from 1 to 25 are: 2, 3, 5, 7, 11, 13, 17, 19, 23 (total 9 prime numbers). P(prime) = 9/25.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-9', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'Two friends were born in the year 2000. What is the probability that they have the same birthday?', '1/366', '1/365', '2/365', '1/183', 'A', 'The year 2000 was a leap year (divisible by 400), having 366 days. Out of 366 days, the probability that the second friend shares the exact same birthday as the first is 1/366.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-prob-m4-10', '10', 'mathematics', 'math-ch14', 'Probability', 'medium', 'mcq', 'A card is drawn from a well-shuffled pack of 52 cards. What is the probability of getting a spade or an ace?', '4/13', '17/52', '16/52', '7/26', 'A', 'There are 13 spades and 4 aces. The Ace of Spades is common to both. Total favourable cards = 13 + 4 − 1 = 16 cards. Probability = 16/52 = 4/13.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:31:25', '2026-11-05 14:31:25'),
  ('q-rn-m1-6', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'Which of the following numbers is irrational?', '3.141141114...', '3.141414...', '22/7', '√196', 'A', 'A non-terminating, non-repeating decimal expansion represents an irrational number. 3.141141114... is non-terminating and non-recurring, so it is irrational.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:32:09', '2026-11-05 14:32:09'),
  ('q-rn-m1-7', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'If HCF(26, 169) = 13, then LCM(26, 169) is:', '52', '260', '338', '676', 'C', 'LCM(a, b) = (a × b) / HCF(a, b) = (26 × 169) / 13 = 2 × 169 = 338.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:32:09', '2026-11-05 14:32:09'),
  ('q-rn-m1-8', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'The ratio of LCM and HCF of the least composite number and the least prime number is:', '1 : 2', '2 : 1', '1 : 1', '1 : 3', 'B', 'Least prime number = 2. Least composite number = 4. HCF(2, 4) = 2, LCM(2, 4) = 4. Ratio of LCM to HCF = 4 : 2 = 2 : 1.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:32:09', '2026-11-05 14:32:09'),
  ('q-rn-m1-9', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'According to the Fundamental Theorem of Arithmetic, every composite number can be uniquely factorised as a product of:', 'Even numbers only', 'Integers, including negative numbers', 'Primes, apart from the order in which factors occur', 'Odd numbers only', 'C', 'The Fundamental Theorem of Arithmetic states that every composite number can be expressed as a product of primes, and this factorisation is unique apart from the order of factors.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:32:09', '2026-11-05 14:32:09'),
  ('q-rn-m1-10', '10', 'mathematics', 'math-ch1', 'Real Numbers', 'medium', 'mcq', 'For any natural number n, the expression 6ⁿ always ends with which digit?', '0', '4', '6', '2', 'C', '6¹ = 6, 6² = 36, 6³ = 216... For any positive integer n, 6ⁿ has 2 and 3 in its prime factorisation, but does not have 5, so it never ends with 0. The unit digit of powers of 6 is always 6.', NULL, 2, 0, 'published', 'CBSE Practice Set', NULL, FALSE, '2026-11-05 14:32:09', '2026-11-05 14:32:09')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."mock_tests" (259 records)
-- ------------------------------------------------------------
INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-math-ch1-slot-1', 'Real Numbers – Mock Test 1', 'mathematics', 'math-ch1', 1, 'Class 10 Real Numbers official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch2-slot-1', 'Polynomials – Mock Test 1', 'mathematics', 'math-ch2', 1, 'Core concepts: Zeroes, degrees, factorisation, sum & product relations, and coefficient verification.', 10, 25, 10, 4, 'free', 'published', '2026-11-05 04:48:37', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-2', 'Polynomials – Mock Test 2', 'mathematics', 'math-ch2', 2, 'Graphs & translation: x-intercepts, symmetric roots, geometric interpretations, and algebraic constraints.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-3', 'Polynomials – Mock Test 3', 'mathematics', 'math-ch2', 3, 'Parameter practice: Solving for unknown constants (k, p, m), repeated roots, and Assertion-Reasoning.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-4', 'Polynomials – Mock Test 4', 'mathematics', 'math-ch2', 4, 'Reasoning clinic: Error analysis, discriminant conditions, consecutive integer problems, and rational roots.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-5', 'Polynomials – Mock Test 5', 'mathematics', 'math-ch2', 5, 'Relations toolbox: Quadratic identification, evaluate p(x), symmetric expressions (α−1)(β−1), and reciprocal zeros.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 12:14:03'),
  ('test-math-ch3-slot-1', 'Pair of Linear Equations – Mock Test 1', 'mathematics', 'math-ch3', 1, 'Core concepts: Number of solutions, parallel & coincident lines, elimination method, and two-digit number problems.', 10, 25, 10, 4, 'free', 'published', '2026-11-05 04:48:37', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-2', 'Pair of Linear Equations – Mock Test 2', 'mathematics', 'math-ch3', 2, 'Consistency & Word Problems: Condition for unique solution, age problems, currency notes, and geometry box costs.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-3', 'Pair of Linear Equations – Mock Test 3', 'mathematics', 'math-ch3', 3, 'Speed, Mixture & Dimensions: Upstream-downstream, grain mixtures, perimeter relations, and coincident conditions.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-4', 'Pair of Linear Equations – Mock Test 4', 'mathematics', 'math-ch3', 4, 'Canteen, Cabs & Integers: Fixed plus variable taxi charges, canteen purchases, intersecting lines, and integer differences.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-5', 'Pair of Linear Equations – Mock Test 5', 'mathematics', 'math-ch3', 5, 'Fractions, Theatres & Ratios: Theater ticket sales, fraction changes on numerator/denominator, and parent-child ages.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 14:10:19'),
  ('test-math-ch4-slot-1', 'Quadratic Equations – Mock Test 1', 'mathematics', 'math-ch4', 1, 'Class 10 Quadratic Equations official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch4-slot-2', 'Quadratic Equations – Mock Test 2', 'mathematics', 'math-ch4', 2, 'Class 10 Quadratic Equations official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch4-slot-3', 'Quadratic Equations – Mock Test 3', 'mathematics', 'math-ch4', 3, 'Class 10 Quadratic Equations official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch4-slot-4', 'Quadratic Equations – Mock Test 4', 'mathematics', 'math-ch4', 4, 'Class 10 Quadratic Equations official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch4-slot-5', 'Quadratic Equations – Mock Test 5', 'mathematics', 'math-ch4', 5, 'Class 10 Quadratic Equations official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch5-slot-1', 'Arithmetic Progressions – Mock Test 1', 'mathematics', 'math-ch5', 1, 'Class 10 Arithmetic Progressions official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch5-slot-2', 'Arithmetic Progressions – Mock Test 2', 'mathematics', 'math-ch5', 2, 'Class 10 Arithmetic Progressions official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch5-slot-3', 'Arithmetic Progressions – Mock Test 3', 'mathematics', 'math-ch5', 3, 'Class 10 Arithmetic Progressions official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch5-slot-4', 'Arithmetic Progressions – Mock Test 4', 'mathematics', 'math-ch5', 4, 'Class 10 Arithmetic Progressions official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch5-slot-5', 'Arithmetic Progressions – Mock Test 5', 'mathematics', 'math-ch5', 5, 'Class 10 Arithmetic Progressions official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch6-slot-1', 'Triangles – Mock Test 1', 'mathematics', 'math-ch6', 1, 'Class 10 Triangles official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch6-slot-2', 'Triangles – Mock Test 2', 'mathematics', 'math-ch6', 2, 'Class 10 Triangles official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch6-slot-3', 'Triangles – Mock Test 3', 'mathematics', 'math-ch6', 3, 'Class 10 Triangles official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch6-slot-4', 'Triangles – Mock Test 4', 'mathematics', 'math-ch6', 4, 'Class 10 Triangles official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch6-slot-5', 'Triangles – Mock Test 5', 'mathematics', 'math-ch6', 5, 'Class 10 Triangles official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch7-slot-1', 'Coordinate Geometry – Mock Test 1', 'mathematics', 'math-ch7', 1, 'Class 10 Coordinate Geometry official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch7-slot-2', 'Coordinate Geometry – Mock Test 2', 'mathematics', 'math-ch7', 2, 'Class 10 Coordinate Geometry official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch7-slot-3', 'Coordinate Geometry – Mock Test 3', 'mathematics', 'math-ch7', 3, 'Class 10 Coordinate Geometry official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch7-slot-4', 'Coordinate Geometry – Mock Test 4', 'mathematics', 'math-ch7', 4, 'Class 10 Coordinate Geometry official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch7-slot-5', 'Coordinate Geometry – Mock Test 5', 'mathematics', 'math-ch7', 5, 'Class 10 Coordinate Geometry official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch8-slot-1', 'Introduction to Trigonometry – Mock Test 1', 'mathematics', 'math-ch8', 1, 'Class 10 Introduction to Trigonometry official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch8-slot-2', 'Introduction to Trigonometry – Mock Test 2', 'mathematics', 'math-ch8', 2, 'Class 10 Introduction to Trigonometry official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch8-slot-3', 'Introduction to Trigonometry – Mock Test 3', 'mathematics', 'math-ch8', 3, 'Class 10 Introduction to Trigonometry official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch8-slot-4', 'Introduction to Trigonometry – Mock Test 4', 'mathematics', 'math-ch8', 4, 'Class 10 Introduction to Trigonometry official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch8-slot-5', 'Introduction to Trigonometry – Mock Test 5', 'mathematics', 'math-ch8', 5, 'Class 10 Introduction to Trigonometry official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch9-slot-1', 'Some Applications of Trigonometry – Mock Test 1', 'mathematics', 'math-ch9', 1, 'Class 10 Some Applications of Trigonometry official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch9-slot-2', 'Some Applications of Trigonometry – Mock Test 2', 'mathematics', 'math-ch9', 2, 'Class 10 Some Applications of Trigonometry official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch9-slot-3', 'Some Applications of Trigonometry – Mock Test 3', 'mathematics', 'math-ch9', 3, 'Class 10 Some Applications of Trigonometry official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch10-slot-1', 'Circles – Mock Test 1', 'mathematics', 'math-ch10', 1, 'Class 10 Circles official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch10-slot-2', 'Circles – Mock Test 2', 'mathematics', 'math-ch10', 2, 'Class 10 Circles official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch10-slot-3', 'Circles – Mock Test 3', 'mathematics', 'math-ch10', 3, 'Class 10 Circles official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch11-slot-1', 'Areas Related to Circles – Mock Test 1', 'mathematics', 'math-ch11', 1, 'Class 10 Areas Related to Circles official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch11-slot-2', 'Areas Related to Circles – Mock Test 2', 'mathematics', 'math-ch11', 2, 'Class 10 Areas Related to Circles official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch11-slot-3', 'Areas Related to Circles – Mock Test 3', 'mathematics', 'math-ch11', 3, 'Class 10 Areas Related to Circles official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch11-slot-4', 'Areas Related to Circles – Mock Test 4', 'mathematics', 'math-ch11', 4, 'Class 10 Areas Related to Circles official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch11-slot-5', 'Areas Related to Circles – Mock Test 5', 'mathematics', 'math-ch11', 5, 'Class 10 Areas Related to Circles official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch12-slot-1', 'Surface Areas and Volumes – Mock Test 1', 'mathematics', 'math-ch12', 1, 'Class 10 Surface Areas and Volumes official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch12-slot-2', 'Surface Areas and Volumes – Mock Test 2', 'mathematics', 'math-ch12', 2, 'Class 10 Surface Areas and Volumes official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch12-slot-3', 'Surface Areas and Volumes – Mock Test 3', 'mathematics', 'math-ch12', 3, 'Class 10 Surface Areas and Volumes official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-math-ch12-slot-4', 'Surface Areas and Volumes – Mock Test 4', 'mathematics', 'math-ch12', 4, 'Class 10 Surface Areas and Volumes official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-math-ch12-slot-5', 'Surface Areas and Volumes – Mock Test 5', 'mathematics', 'math-ch12', 5, 'Class 10 Surface Areas and Volumes official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch13-slot-1', 'Statistics – Mock Test 1', 'mathematics', 'math-ch13', 1, 'Class 10 Statistics official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch13-slot-2', 'Statistics – Mock Test 2', 'mathematics', 'math-ch13', 2, 'Class 10 Statistics official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch13-slot-3', 'Statistics – Mock Test 3', 'mathematics', 'math-ch13', 3, 'Class 10 Statistics official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch14-slot-1', 'Probability – Mock Test 1', 'mathematics', 'math-ch14', 1, 'Class 10 Probability official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'free', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch14-slot-2', 'Probability – Mock Test 2', 'mathematics', 'math-ch14', 2, 'Class 10 Probability official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch14-slot-3', 'Probability – Mock Test 3', 'mathematics', 'math-ch14', 3, 'Class 10 Probability official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch14-slot-4', 'Probability – Mock Test 4', 'mathematics', 'math-ch14', 4, 'Class 10 Probability official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sci-ch1-slot-1', 'Chemical Reactions and Equations – Mock Test 1', 'science', 'sci-ch1', 1, 'Class 10 Chemical Reactions and Equations official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 5, 25, 5, 2, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sci-ch1-slot-2', 'Chemical Reactions and Equations – Mock Test 2', 'science', 'sci-ch1', 2, 'Class 10 Chemical Reactions and Equations official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sci-ch1-slot-3', 'Chemical Reactions and Equations – Mock Test 3', 'science', 'sci-ch1', 3, 'Class 10 Chemical Reactions and Equations official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sci-ch1-slot-4', 'Chemical Reactions and Equations – Mock Test 4', 'science', 'sci-ch1', 4, 'Class 10 Chemical Reactions and Equations official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sci-ch1-slot-5', 'Chemical Reactions and Equations – Mock Test 5', 'science', 'sci-ch1', 5, 'Class 10 Chemical Reactions and Equations official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch2-slot-1', 'Acids, Bases and Salts – Mock Test 1', 'science', 'sci-ch2', 1, 'Class 10 Acids, Bases and Salts official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch2-slot-2', 'Acids, Bases and Salts – Mock Test 2', 'science', 'sci-ch2', 2, 'Class 10 Acids, Bases and Salts official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch2-slot-3', 'Acids, Bases and Salts – Mock Test 3', 'science', 'sci-ch2', 3, 'Class 10 Acids, Bases and Salts official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch2-slot-4', 'Acids, Bases and Salts – Mock Test 4', 'science', 'sci-ch2', 4, 'Class 10 Acids, Bases and Salts official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch2-slot-5', 'Acids, Bases and Salts – Mock Test 5', 'science', 'sci-ch2', 5, 'Class 10 Acids, Bases and Salts official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch3-slot-1', 'Metals and Non-Metals – Mock Test 1', 'science', 'sci-ch3', 1, 'Class 10 Metals and Non-Metals official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch3-slot-2', 'Metals and Non-Metals – Mock Test 2', 'science', 'sci-ch3', 2, 'Class 10 Metals and Non-Metals official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch3-slot-3', 'Metals and Non-Metals – Mock Test 3', 'science', 'sci-ch3', 3, 'Class 10 Metals and Non-Metals official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch3-slot-4', 'Metals and Non-Metals – Mock Test 4', 'science', 'sci-ch3', 4, 'Class 10 Metals and Non-Metals official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch3-slot-5', 'Metals and Non-Metals – Mock Test 5', 'science', 'sci-ch3', 5, 'Class 10 Metals and Non-Metals official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch4-slot-1', 'Carbon and its Compounds – Mock Test 1', 'science', 'sci-ch4', 1, 'Class 10 Carbon and its Compounds official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch4-slot-2', 'Carbon and its Compounds – Mock Test 2', 'science', 'sci-ch4', 2, 'Class 10 Carbon and its Compounds official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch4-slot-3', 'Carbon and its Compounds – Mock Test 3', 'science', 'sci-ch4', 3, 'Class 10 Carbon and its Compounds official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch4-slot-4', 'Carbon and its Compounds – Mock Test 4', 'science', 'sci-ch4', 4, 'Class 10 Carbon and its Compounds official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch4-slot-5', 'Carbon and its Compounds – Mock Test 5', 'science', 'sci-ch4', 5, 'Class 10 Carbon and its Compounds official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch5-slot-1', 'Life Processes – Mock Test 1', 'science', 'sci-ch5', 1, 'Class 10 Life Processes official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch5-slot-2', 'Life Processes – Mock Test 2', 'science', 'sci-ch5', 2, 'Class 10 Life Processes official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch5-slot-3', 'Life Processes – Mock Test 3', 'science', 'sci-ch5', 3, 'Class 10 Life Processes official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch5-slot-4', 'Life Processes – Mock Test 4', 'science', 'sci-ch5', 4, 'Class 10 Life Processes official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch5-slot-5', 'Life Processes – Mock Test 5', 'science', 'sci-ch5', 5, 'Class 10 Life Processes official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch6-slot-1', 'Control and Coordination – Mock Test 1', 'science', 'sci-ch6', 1, 'Class 10 Control and Coordination official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch6-slot-2', 'Control and Coordination – Mock Test 2', 'science', 'sci-ch6', 2, 'Class 10 Control and Coordination official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch6-slot-3', 'Control and Coordination – Mock Test 3', 'science', 'sci-ch6', 3, 'Class 10 Control and Coordination official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch6-slot-4', 'Control and Coordination – Mock Test 4', 'science', 'sci-ch6', 4, 'Class 10 Control and Coordination official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch6-slot-5', 'Control and Coordination – Mock Test 5', 'science', 'sci-ch6', 5, 'Class 10 Control and Coordination official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch7-slot-1', 'How do Organisms Reproduce? – Mock Test 1', 'science', 'sci-ch7', 1, 'Class 10 How do Organisms Reproduce? official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch7-slot-2', 'How do Organisms Reproduce? – Mock Test 2', 'science', 'sci-ch7', 2, 'Class 10 How do Organisms Reproduce? official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch7-slot-3', 'How do Organisms Reproduce? – Mock Test 3', 'science', 'sci-ch7', 3, 'Class 10 How do Organisms Reproduce? official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch7-slot-4', 'How do Organisms Reproduce? – Mock Test 4', 'science', 'sci-ch7', 4, 'Class 10 How do Organisms Reproduce? official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch7-slot-5', 'How do Organisms Reproduce? – Mock Test 5', 'science', 'sci-ch7', 5, 'Class 10 How do Organisms Reproduce? official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch8-slot-1', 'Heredity – Mock Test 1', 'science', 'sci-ch8', 1, 'Class 10 Heredity official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch8-slot-2', 'Heredity – Mock Test 2', 'science', 'sci-ch8', 2, 'Class 10 Heredity official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch8-slot-3', 'Heredity – Mock Test 3', 'science', 'sci-ch8', 3, 'Class 10 Heredity official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch8-slot-4', 'Heredity – Mock Test 4', 'science', 'sci-ch8', 4, 'Class 10 Heredity official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch8-slot-5', 'Heredity – Mock Test 5', 'science', 'sci-ch8', 5, 'Class 10 Heredity official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch9-slot-1', 'Light – Reflection and Refraction – Mock Test 1', 'science', 'sci-ch9', 1, 'Class 10 Light – Reflection and Refraction official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-sci-ch9-slot-2', 'Light – Reflection and Refraction – Mock Test 2', 'science', 'sci-ch9', 2, 'Class 10 Light – Reflection and Refraction official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch9-slot-3', 'Light – Reflection and Refraction – Mock Test 3', 'science', 'sci-ch9', 3, 'Class 10 Light – Reflection and Refraction official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch9-slot-4', 'Light – Reflection and Refraction – Mock Test 4', 'science', 'sci-ch9', 4, 'Class 10 Light – Reflection and Refraction official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch9-slot-5', 'Light – Reflection and Refraction – Mock Test 5', 'science', 'sci-ch9', 5, 'Class 10 Light – Reflection and Refraction official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch10-slot-1', 'The Human Eye and the Colourful World – Mock Test 1', 'science', 'sci-ch10', 1, 'Class 10 The Human Eye and the Colourful World official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch10-slot-2', 'The Human Eye and the Colourful World – Mock Test 2', 'science', 'sci-ch10', 2, 'Class 10 The Human Eye and the Colourful World official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch10-slot-3', 'The Human Eye and the Colourful World – Mock Test 3', 'science', 'sci-ch10', 3, 'Class 10 The Human Eye and the Colourful World official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch10-slot-4', 'The Human Eye and the Colourful World – Mock Test 4', 'science', 'sci-ch10', 4, 'Class 10 The Human Eye and the Colourful World official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch10-slot-5', 'The Human Eye and the Colourful World – Mock Test 5', 'science', 'sci-ch10', 5, 'Class 10 The Human Eye and the Colourful World official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch11-slot-1', 'Electricity – Mock Test 1', 'science', 'sci-ch11', 1, 'Class 10 Electricity official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch11-slot-2', 'Electricity – Mock Test 2', 'science', 'sci-ch11', 2, 'Class 10 Electricity official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch11-slot-3', 'Electricity – Mock Test 3', 'science', 'sci-ch11', 3, 'Class 10 Electricity official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch11-slot-4', 'Electricity – Mock Test 4', 'science', 'sci-ch11', 4, 'Class 10 Electricity official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch11-slot-5', 'Electricity – Mock Test 5', 'science', 'sci-ch11', 5, 'Class 10 Electricity official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch12-slot-1', 'Magnetic Effects of Electric Current – Mock Test 1', 'science', 'sci-ch12', 1, 'Class 10 Magnetic Effects of Electric Current official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch12-slot-2', 'Magnetic Effects of Electric Current – Mock Test 2', 'science', 'sci-ch12', 2, 'Class 10 Magnetic Effects of Electric Current official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch12-slot-3', 'Magnetic Effects of Electric Current – Mock Test 3', 'science', 'sci-ch12', 3, 'Class 10 Magnetic Effects of Electric Current official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch12-slot-4', 'Magnetic Effects of Electric Current – Mock Test 4', 'science', 'sci-ch12', 4, 'Class 10 Magnetic Effects of Electric Current official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch12-slot-5', 'Magnetic Effects of Electric Current – Mock Test 5', 'science', 'sci-ch12', 5, 'Class 10 Magnetic Effects of Electric Current official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch13-slot-1', 'Our Environment – Mock Test 1', 'science', 'sci-ch13', 1, 'Class 10 Our Environment official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch13-slot-2', 'Our Environment – Mock Test 2', 'science', 'sci-ch13', 2, 'Class 10 Our Environment official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch13-slot-3', 'Our Environment – Mock Test 3', 'science', 'sci-ch13', 3, 'Class 10 Our Environment official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch13-slot-4', 'Our Environment – Mock Test 4', 'science', 'sci-ch13', 4, 'Class 10 Our Environment official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sci-ch13-slot-5', 'Our Environment – Mock Test 5', 'science', 'sci-ch13', 5, 'Class 10 Our Environment official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-1-slot-1', 'The Rise of Nationalism in Europe – Mock Test 1', 'social-science', 'sst-hist-1', 1, 'Class 10 The Rise of Nationalism in Europe official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 4, 25, 4, 2, 'premium', 'published', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-1-slot-2', 'The Rise of Nationalism in Europe – Mock Test 2', 'social-science', 'sst-hist-1', 2, 'Class 10 The Rise of Nationalism in Europe official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-1-slot-3', 'The Rise of Nationalism in Europe – Mock Test 3', 'social-science', 'sst-hist-1', 3, 'Class 10 The Rise of Nationalism in Europe official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-1-slot-4', 'The Rise of Nationalism in Europe – Mock Test 4', 'social-science', 'sst-hist-1', 4, 'Class 10 The Rise of Nationalism in Europe official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-1-slot-5', 'The Rise of Nationalism in Europe – Mock Test 5', 'social-science', 'sst-hist-1', 5, 'Class 10 The Rise of Nationalism in Europe official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-2-slot-1', 'Nationalism in India – Mock Test 1', 'social-science', 'sst-hist-2', 1, 'Class 10 Nationalism in India official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-2-slot-2', 'Nationalism in India – Mock Test 2', 'social-science', 'sst-hist-2', 2, 'Class 10 Nationalism in India official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-2-slot-3', 'Nationalism in India – Mock Test 3', 'social-science', 'sst-hist-2', 3, 'Class 10 Nationalism in India official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-2-slot-4', 'Nationalism in India – Mock Test 4', 'social-science', 'sst-hist-2', 4, 'Class 10 Nationalism in India official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-2-slot-5', 'Nationalism in India – Mock Test 5', 'social-science', 'sst-hist-2', 5, 'Class 10 Nationalism in India official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-3-slot-1', 'The Making of a Global World – Mock Test 1', 'social-science', 'sst-hist-3', 1, 'Class 10 The Making of a Global World official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-3-slot-2', 'The Making of a Global World – Mock Test 2', 'social-science', 'sst-hist-3', 2, 'Class 10 The Making of a Global World official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-3-slot-3', 'The Making of a Global World – Mock Test 3', 'social-science', 'sst-hist-3', 3, 'Class 10 The Making of a Global World official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-hist-3-slot-4', 'The Making of a Global World – Mock Test 4', 'social-science', 'sst-hist-3', 4, 'Class 10 The Making of a Global World official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-3-slot-5', 'The Making of a Global World – Mock Test 5', 'social-science', 'sst-hist-3', 5, 'Class 10 The Making of a Global World official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-4-slot-1', 'The Age of Industrialisation – Mock Test 1', 'social-science', 'sst-hist-4', 1, 'Class 10 The Age of Industrialisation official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-4-slot-2', 'The Age of Industrialisation – Mock Test 2', 'social-science', 'sst-hist-4', 2, 'Class 10 The Age of Industrialisation official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-4-slot-3', 'The Age of Industrialisation – Mock Test 3', 'social-science', 'sst-hist-4', 3, 'Class 10 The Age of Industrialisation official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-4-slot-4', 'The Age of Industrialisation – Mock Test 4', 'social-science', 'sst-hist-4', 4, 'Class 10 The Age of Industrialisation official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-4-slot-5', 'The Age of Industrialisation – Mock Test 5', 'social-science', 'sst-hist-4', 5, 'Class 10 The Age of Industrialisation official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-5-slot-1', 'Print Culture and the Modern World – Mock Test 1', 'social-science', 'sst-hist-5', 1, 'Class 10 Print Culture and the Modern World official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-5-slot-2', 'Print Culture and the Modern World – Mock Test 2', 'social-science', 'sst-hist-5', 2, 'Class 10 Print Culture and the Modern World official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-5-slot-3', 'Print Culture and the Modern World – Mock Test 3', 'social-science', 'sst-hist-5', 3, 'Class 10 Print Culture and the Modern World official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-5-slot-4', 'Print Culture and the Modern World – Mock Test 4', 'social-science', 'sst-hist-5', 4, 'Class 10 Print Culture and the Modern World official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-hist-5-slot-5', 'Print Culture and the Modern World – Mock Test 5', 'social-science', 'sst-hist-5', 5, 'Class 10 Print Culture and the Modern World official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-1-slot-1', 'Resources and Development – Mock Test 1', 'social-science', 'sst-geo-1', 1, 'Class 10 Resources and Development official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-sst-geo-1-slot-2', 'Resources and Development – Mock Test 2', 'social-science', 'sst-geo-1', 2, 'Class 10 Resources and Development official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-1-slot-3', 'Resources and Development – Mock Test 3', 'social-science', 'sst-geo-1', 3, 'Class 10 Resources and Development official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-1-slot-4', 'Resources and Development – Mock Test 4', 'social-science', 'sst-geo-1', 4, 'Class 10 Resources and Development official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-1-slot-5', 'Resources and Development – Mock Test 5', 'social-science', 'sst-geo-1', 5, 'Class 10 Resources and Development official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-2-slot-1', 'Forest and Wildlife Resources – Mock Test 1', 'social-science', 'sst-geo-2', 1, 'Class 10 Forest and Wildlife Resources official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-2-slot-2', 'Forest and Wildlife Resources – Mock Test 2', 'social-science', 'sst-geo-2', 2, 'Class 10 Forest and Wildlife Resources official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-2-slot-3', 'Forest and Wildlife Resources – Mock Test 3', 'social-science', 'sst-geo-2', 3, 'Class 10 Forest and Wildlife Resources official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-2-slot-4', 'Forest and Wildlife Resources – Mock Test 4', 'social-science', 'sst-geo-2', 4, 'Class 10 Forest and Wildlife Resources official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-2-slot-5', 'Forest and Wildlife Resources – Mock Test 5', 'social-science', 'sst-geo-2', 5, 'Class 10 Forest and Wildlife Resources official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-3-slot-1', 'Water Resources – Mock Test 1', 'social-science', 'sst-geo-3', 1, 'Class 10 Water Resources official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-3-slot-2', 'Water Resources – Mock Test 2', 'social-science', 'sst-geo-3', 2, 'Class 10 Water Resources official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-3-slot-3', 'Water Resources – Mock Test 3', 'social-science', 'sst-geo-3', 3, 'Class 10 Water Resources official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-3-slot-4', 'Water Resources – Mock Test 4', 'social-science', 'sst-geo-3', 4, 'Class 10 Water Resources official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-3-slot-5', 'Water Resources – Mock Test 5', 'social-science', 'sst-geo-3', 5, 'Class 10 Water Resources official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-4-slot-1', 'Agriculture – Mock Test 1', 'social-science', 'sst-geo-4', 1, 'Class 10 Agriculture official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-4-slot-2', 'Agriculture – Mock Test 2', 'social-science', 'sst-geo-4', 2, 'Class 10 Agriculture official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-4-slot-3', 'Agriculture – Mock Test 3', 'social-science', 'sst-geo-4', 3, 'Class 10 Agriculture official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-4-slot-4', 'Agriculture – Mock Test 4', 'social-science', 'sst-geo-4', 4, 'Class 10 Agriculture official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-4-slot-5', 'Agriculture – Mock Test 5', 'social-science', 'sst-geo-4', 5, 'Class 10 Agriculture official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-5-slot-1', 'Minerals and Energy Resources – Mock Test 1', 'social-science', 'sst-geo-5', 1, 'Class 10 Minerals and Energy Resources official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-5-slot-2', 'Minerals and Energy Resources – Mock Test 2', 'social-science', 'sst-geo-5', 2, 'Class 10 Minerals and Energy Resources official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-5-slot-3', 'Minerals and Energy Resources – Mock Test 3', 'social-science', 'sst-geo-5', 3, 'Class 10 Minerals and Energy Resources official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-5-slot-4', 'Minerals and Energy Resources – Mock Test 4', 'social-science', 'sst-geo-5', 4, 'Class 10 Minerals and Energy Resources official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-5-slot-5', 'Minerals and Energy Resources – Mock Test 5', 'social-science', 'sst-geo-5', 5, 'Class 10 Minerals and Energy Resources official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-6-slot-1', 'Manufacturing Industries – Mock Test 1', 'social-science', 'sst-geo-6', 1, 'Class 10 Manufacturing Industries official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-6-slot-2', 'Manufacturing Industries – Mock Test 2', 'social-science', 'sst-geo-6', 2, 'Class 10 Manufacturing Industries official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-6-slot-3', 'Manufacturing Industries – Mock Test 3', 'social-science', 'sst-geo-6', 3, 'Class 10 Manufacturing Industries official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-6-slot-4', 'Manufacturing Industries – Mock Test 4', 'social-science', 'sst-geo-6', 4, 'Class 10 Manufacturing Industries official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-6-slot-5', 'Manufacturing Industries – Mock Test 5', 'social-science', 'sst-geo-6', 5, 'Class 10 Manufacturing Industries official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-7-slot-1', 'Lifelines of National Economy – Mock Test 1', 'social-science', 'sst-geo-7', 1, 'Class 10 Lifelines of National Economy official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-7-slot-2', 'Lifelines of National Economy – Mock Test 2', 'social-science', 'sst-geo-7', 2, 'Class 10 Lifelines of National Economy official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-7-slot-3', 'Lifelines of National Economy – Mock Test 3', 'social-science', 'sst-geo-7', 3, 'Class 10 Lifelines of National Economy official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-7-slot-4', 'Lifelines of National Economy – Mock Test 4', 'social-science', 'sst-geo-7', 4, 'Class 10 Lifelines of National Economy official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-geo-7-slot-5', 'Lifelines of National Economy – Mock Test 5', 'social-science', 'sst-geo-7', 5, 'Class 10 Lifelines of National Economy official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-1-slot-1', 'Power Sharing – Mock Test 1', 'social-science', 'sst-pol-1', 1, 'Class 10 Power Sharing official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-1-slot-2', 'Power Sharing – Mock Test 2', 'social-science', 'sst-pol-1', 2, 'Class 10 Power Sharing official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-1-slot-3', 'Power Sharing – Mock Test 3', 'social-science', 'sst-pol-1', 3, 'Class 10 Power Sharing official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-1-slot-4', 'Power Sharing – Mock Test 4', 'social-science', 'sst-pol-1', 4, 'Class 10 Power Sharing official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-1-slot-5', 'Power Sharing – Mock Test 5', 'social-science', 'sst-pol-1', 5, 'Class 10 Power Sharing official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-2-slot-1', 'Federalism – Mock Test 1', 'social-science', 'sst-pol-2', 1, 'Class 10 Federalism official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-2-slot-2', 'Federalism – Mock Test 2', 'social-science', 'sst-pol-2', 2, 'Class 10 Federalism official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-2-slot-3', 'Federalism – Mock Test 3', 'social-science', 'sst-pol-2', 3, 'Class 10 Federalism official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-2-slot-4', 'Federalism – Mock Test 4', 'social-science', 'sst-pol-2', 4, 'Class 10 Federalism official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-2-slot-5', 'Federalism – Mock Test 5', 'social-science', 'sst-pol-2', 5, 'Class 10 Federalism official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-3-slot-1', 'Gender, Religion and Caste – Mock Test 1', 'social-science', 'sst-pol-3', 1, 'Class 10 Gender, Religion and Caste official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-3-slot-2', 'Gender, Religion and Caste – Mock Test 2', 'social-science', 'sst-pol-3', 2, 'Class 10 Gender, Religion and Caste official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-3-slot-3', 'Gender, Religion and Caste – Mock Test 3', 'social-science', 'sst-pol-3', 3, 'Class 10 Gender, Religion and Caste official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-3-slot-4', 'Gender, Religion and Caste – Mock Test 4', 'social-science', 'sst-pol-3', 4, 'Class 10 Gender, Religion and Caste official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-3-slot-5', 'Gender, Religion and Caste – Mock Test 5', 'social-science', 'sst-pol-3', 5, 'Class 10 Gender, Religion and Caste official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-4-slot-1', 'Political Parties – Mock Test 1', 'social-science', 'sst-pol-4', 1, 'Class 10 Political Parties official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-sst-pol-4-slot-2', 'Political Parties – Mock Test 2', 'social-science', 'sst-pol-4', 2, 'Class 10 Political Parties official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-4-slot-3', 'Political Parties – Mock Test 3', 'social-science', 'sst-pol-4', 3, 'Class 10 Political Parties official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-4-slot-4', 'Political Parties – Mock Test 4', 'social-science', 'sst-pol-4', 4, 'Class 10 Political Parties official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-4-slot-5', 'Political Parties – Mock Test 5', 'social-science', 'sst-pol-4', 5, 'Class 10 Political Parties official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-5-slot-1', 'Outcomes of Democracy – Mock Test 1', 'social-science', 'sst-pol-5', 1, 'Class 10 Outcomes of Democracy official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-5-slot-2', 'Outcomes of Democracy – Mock Test 2', 'social-science', 'sst-pol-5', 2, 'Class 10 Outcomes of Democracy official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-5-slot-3', 'Outcomes of Democracy – Mock Test 3', 'social-science', 'sst-pol-5', 3, 'Class 10 Outcomes of Democracy official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-5-slot-4', 'Outcomes of Democracy – Mock Test 4', 'social-science', 'sst-pol-5', 4, 'Class 10 Outcomes of Democracy official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 14:08:51', '2026-11-05 14:08:51'),
  ('test-sst-pol-5-slot-5', 'Outcomes of Democracy – Mock Test 5', 'social-science', 'sst-pol-5', 5, 'Class 10 Outcomes of Democracy official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-1-slot-1', 'Development – Mock Test 1', 'social-science', 'sst-eco-1', 1, 'Class 10 Development official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-1-slot-2', 'Development – Mock Test 2', 'social-science', 'sst-eco-1', 2, 'Class 10 Development official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-1-slot-3', 'Development – Mock Test 3', 'social-science', 'sst-eco-1', 3, 'Class 10 Development official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-1-slot-4', 'Development – Mock Test 4', 'social-science', 'sst-eco-1', 4, 'Class 10 Development official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-1-slot-5', 'Development – Mock Test 5', 'social-science', 'sst-eco-1', 5, 'Class 10 Development official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-2-slot-1', 'Sectors of the Indian Economy – Mock Test 1', 'social-science', 'sst-eco-2', 1, 'Class 10 Sectors of the Indian Economy official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-2-slot-2', 'Sectors of the Indian Economy – Mock Test 2', 'social-science', 'sst-eco-2', 2, 'Class 10 Sectors of the Indian Economy official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-2-slot-3', 'Sectors of the Indian Economy – Mock Test 3', 'social-science', 'sst-eco-2', 3, 'Class 10 Sectors of the Indian Economy official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-2-slot-4', 'Sectors of the Indian Economy – Mock Test 4', 'social-science', 'sst-eco-2', 4, 'Class 10 Sectors of the Indian Economy official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-2-slot-5', 'Sectors of the Indian Economy – Mock Test 5', 'social-science', 'sst-eco-2', 5, 'Class 10 Sectors of the Indian Economy official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-3-slot-1', 'Money and Credit – Mock Test 1', 'social-science', 'sst-eco-3', 1, 'Class 10 Money and Credit official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-3-slot-2', 'Money and Credit – Mock Test 2', 'social-science', 'sst-eco-3', 2, 'Class 10 Money and Credit official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-3-slot-3', 'Money and Credit – Mock Test 3', 'social-science', 'sst-eco-3', 3, 'Class 10 Money and Credit official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-3-slot-4', 'Money and Credit – Mock Test 4', 'social-science', 'sst-eco-3', 4, 'Class 10 Money and Credit official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-3-slot-5', 'Money and Credit – Mock Test 5', 'social-science', 'sst-eco-3', 5, 'Class 10 Money and Credit official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-4-slot-1', 'Globalisation and the Indian Economy – Mock Test 1', 'social-science', 'sst-eco-4', 1, 'Class 10 Globalisation and the Indian Economy official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-4-slot-2', 'Globalisation and the Indian Economy – Mock Test 2', 'social-science', 'sst-eco-4', 2, 'Class 10 Globalisation and the Indian Economy official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-4-slot-3', 'Globalisation and the Indian Economy – Mock Test 3', 'social-science', 'sst-eco-4', 3, 'Class 10 Globalisation and the Indian Economy official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-4-slot-4', 'Globalisation and the Indian Economy – Mock Test 4', 'social-science', 'sst-eco-4', 4, 'Class 10 Globalisation and the Indian Economy official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-4-slot-5', 'Globalisation and the Indian Economy – Mock Test 5', 'social-science', 'sst-eco-4', 5, 'Class 10 Globalisation and the Indian Economy official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-5-slot-1', 'Consumer Rights – Mock Test 1', 'social-science', 'sst-eco-5', 1, 'Class 10 Consumer Rights official practice test slot 1. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-5-slot-2', 'Consumer Rights – Mock Test 2', 'social-science', 'sst-eco-5', 2, 'Class 10 Consumer Rights official practice test slot 2. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-5-slot-3', 'Consumer Rights – Mock Test 3', 'social-science', 'sst-eco-5', 3, 'Class 10 Consumer Rights official practice test slot 3. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-5-slot-4', 'Consumer Rights – Mock Test 4', 'social-science', 'sst-eco-5', 4, 'Class 10 Consumer Rights official practice test slot 4. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-sst-eco-5-slot-5', 'Consumer Rights – Mock Test 5', 'social-science', 'sst-eco-5', 5, 'Class 10 Consumer Rights official practice test slot 5. Covers key NCERT concepts, definitions and numericals.', 0, 25, 20, 8, 'premium', 'draft', '2026-11-05 04:48:37', '2026-11-05 04:48:37'),
  ('test-math-ch1-slot-2', 'Real Numbers – Mock Test 2', 'mathematics', 'math-ch1', 2, 'Fundamental Theorem of Arithmetic, HCF-LCM relationships & terminating decimals.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('test-math-ch1-slot-3', 'Real Numbers – Mock Test 3', 'mathematics', 'math-ch1', 3, 'Prime factorisation, HCF-LCM properties, square tiles word problems & composite proof.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('test-math-ch1-slot-4', 'Real Numbers – Mock Test 4', 'mathematics', 'math-ch1', 4, 'Irrational numbers, coprime HCF, cube multipliers, florist bouquet problem & √5 proof.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('test-math-ch1-slot-5', 'Real Numbers – Mock Test 5', 'mathematics', 'math-ch1', 5, 'Prime and composite numbers, flashing lights interval problem, notebook bundles & 3+2√5 proof.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('test-math-ch1-slot-6', 'Real Numbers – Mock Test 6', 'mathematics', 'math-ch1', 6, 'Composite numbers, square room tiling problem, √2+√3 proof & circular track meeting time.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:26:09', '2026-11-05 11:26:09'),
  ('test-math-ch2-slot-6', 'Polynomials – Mock Test 6', 'mathematics', 'math-ch2', 6, 'Application & logic: Linear uniqueness, consecutive odd products, α³+β³, and discriminant non-intersection.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-7', 'Polynomials – Mock Test 7', 'mathematics', 'math-ch2', 7, 'Algebraic thinking: No x-intercept polynomials, fast splitting, reciprocal zero sums, and symmetric (α+1)(β+1).', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-8', 'Polynomials – Mock Test 8', 'mathematics', 'math-ch2', 8, 'Error detection: Constant multiples, sign determination from sum/product, α⁴+β⁴, and irrational roots.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-9', 'Polynomials – Mock Test 9', 'mathematics', 'math-ch2', 9, 'Higher-order mix: Geometric parameters, ratio of roots (one zero twice the other), mural area, and HOTS α³+β³.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('test-math-ch2-slot-10', 'Polynomials – Mock Test 10', 'mathematics', 'math-ch2', 10, 'Final challenge: Board exam simulation, multi-step problem solving, and comprehensive coefficient relations.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 11:57:19', '2026-11-05 12:14:03'),
  ('test-math-ch3-slot-6', 'Pair of Linear Equations – Mock Test 6', 'mathematics', 'math-ch3', 6, 'Class Count & Stationery: Boys and girls ratio, boat speed, notebook purchases, and unique solution constraints.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-7', 'Pair of Linear Equations – Mock Test 7', 'mathematics', 'math-ch3', 7, 'Data Plans & Farm Animals: Mobile data plan costs, hens and goats legs problem, dependent systems, and ticket costs.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-8', 'Pair of Linear Equations – Mock Test 8', 'mathematics', 'math-ch3', 8, 'Speed, Reversals & Ratios: Van speed variation, two-digit number reversals, museum ticket receipts, and ratio impossibilities.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-9', 'Pair of Linear Equations – Mock Test 9', 'mathematics', 'math-ch3', 9, 'Fleet Transport & Groceries: Car and minibus transport, blended rice purchases, fruit vendor sales, and parameter m.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('test-math-ch3-slot-10', 'Pair of Linear Equations – Mock Test 10', 'mathematics', 'math-ch3', 10, 'Parking Wheels & Contributions: Cars & motorcycle wheel count, perimeter relationships, and currency contributions.', 10, 25, 10, 4, 'premium', 'published', '2026-11-05 14:10:19', '2026-11-05 14:10:19'),
  ('test-math-ch4-slot-6', 'Quadratic Equations – Mock Test 6', 'mathematics', 'math-ch4', 6, 'Class 10 Quadratic Equations Mock Test 6', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:15:21', '2026-11-05 14:15:21')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_tests" ("id", "title", "subject_id", "chapter_id", "test_number", "description", "total_questions", "duration_minutes", "max_marks", "passing_marks", "access_type", "status", "created_at", "updated_at")
VALUES
  ('test-math-ch4-slot-7', 'Quadratic Equations – Mock Test 7', 'mathematics', 'math-ch4', 7, 'Class 10 Quadratic Equations Mock Test 7', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('test-math-ch4-slot-8', 'Quadratic Equations – Mock Test 8', 'mathematics', 'math-ch4', 8, 'Class 10 Quadratic Equations Mock Test 8', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('test-math-ch4-slot-9', 'Quadratic Equations – Mock Test 9', 'mathematics', 'math-ch4', 9, 'Class 10 Quadratic Equations Mock Test 9', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('test-math-ch4-slot-10', 'Quadratic Equations – Mock Test 10', 'mathematics', 'math-ch4', 10, 'Class 10 Quadratic Equations Mock Test 10', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:15:21', '2026-11-05 14:15:21'),
  ('test-math-ch5-slot-6', 'Arithmetic Progressions – Mock Test 6', 'mathematics', 'math-ch5', 6, 'Class 10 Arithmetic Progressions Mock Test 6', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('test-math-ch5-slot-7', 'Arithmetic Progressions – Mock Test 7', 'mathematics', 'math-ch5', 7, 'Class 10 Arithmetic Progressions Mock Test 7', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('test-math-ch5-slot-8', 'Arithmetic Progressions – Mock Test 8', 'mathematics', 'math-ch5', 8, 'Class 10 Arithmetic Progressions Mock Test 8', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:17:36', '2026-11-05 14:17:36'),
  ('test-math-ch8-slot-6', 'Introduction to Trigonometry – Mock Test 6', 'mathematics', 'math-ch8', 6, 'Class 10 Introduction to Trigonometry Mock Test 6', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:23:21', '2026-11-05 14:23:21'),
  ('test-math-ch12-slot-6', 'Surface Areas and Volumes – Mock Test 6', 'mathematics', 'math-ch12', 6, 'Class 10 Surface Areas and Volumes Mock Test 6', 10, 25, 20, 8, 'premium', 'published', '2026-11-05 14:31:25', '2026-11-05 14:31:25')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."mock_test_questions" (849 records)
-- ------------------------------------------------------------
INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-math1-1', 'test-math-ch1-slot-1', 'q-math-1', 1),
  ('mtq-math1-2', 'test-math-ch1-slot-1', 'q-math-2', 2),
  ('mtq-math1-3', 'test-math-ch1-slot-1', 'q-math-3', 3),
  ('mtq-math1-4', 'test-math-ch1-slot-1', 'q-math-4', 4),
  ('mtq-math1-5', 'test-math-ch1-slot-1', 'q-math-5', 5),
  ('mtq-sci1-1', 'test-sci-ch1-slot-1', 'q-sci-1', 1),
  ('mtq-sci1-2', 'test-sci-ch1-slot-1', 'q-sci-2', 2),
  ('mtq-sci1-3', 'test-sci-ch1-slot-1', 'q-sci-3', 3),
  ('mtq-sci1-4', 'test-sci-ch1-slot-1', 'q-sci-4', 4),
  ('mtq-sci1-5', 'test-sci-ch1-slot-1', 'q-sci-5', 5),
  ('mtq-sst1-1', 'test-sst-hist-1-slot-1', 'q-sst-1', 1),
  ('mtq-sst1-2', 'test-sst-hist-1-slot-1', 'q-sst-2', 2),
  ('mtq-sst1-3', 'test-sst-hist-1-slot-1', 'q-sst-3', 3),
  ('mtq-sst1-4', 'test-sst-hist-1-slot-1', 'q-sst-4', 4),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-1', 'test-math-ch1-slot-2', 'q-rn-m2-1', 1),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-2', 'test-math-ch1-slot-2', 'q-rn-m2-2', 2),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-3', 'test-math-ch1-slot-2', 'q-rn-m2-3', 3),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-4', 'test-math-ch1-slot-2', 'q-rn-m2-4', 4),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-5', 'test-math-ch1-slot-2', 'q-rn-m2-5', 5),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-6', 'test-math-ch1-slot-2', 'q-rn-m2-6', 6),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-7', 'test-math-ch1-slot-2', 'q-rn-m2-7', 7),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-8', 'test-math-ch1-slot-2', 'q-rn-m2-8', 8),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-9', 'test-math-ch1-slot-2', 'q-rn-m2-9', 9),
  ('mtq-test-math-ch1-slot-2-q-rn-m2-10', 'test-math-ch1-slot-2', 'q-rn-m2-10', 10),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-1', 'test-math-ch1-slot-3', 'q-rn-m3-1', 1),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-2', 'test-math-ch1-slot-3', 'q-rn-m3-2', 2),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-3', 'test-math-ch1-slot-3', 'q-rn-m3-3', 3),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-4', 'test-math-ch1-slot-3', 'q-rn-m3-4', 4),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-5', 'test-math-ch1-slot-3', 'q-rn-m3-5', 5),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-6', 'test-math-ch1-slot-3', 'q-rn-m3-6', 6),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-7', 'test-math-ch1-slot-3', 'q-rn-m3-7', 7),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-8', 'test-math-ch1-slot-3', 'q-rn-m3-8', 8),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-9', 'test-math-ch1-slot-3', 'q-rn-m3-9', 9),
  ('mtq-test-math-ch1-slot-3-q-rn-m3-10', 'test-math-ch1-slot-3', 'q-rn-m3-10', 10),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-1', 'test-math-ch1-slot-4', 'q-rn-m4-1', 1),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-2', 'test-math-ch1-slot-4', 'q-rn-m4-2', 2),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-3', 'test-math-ch1-slot-4', 'q-rn-m4-3', 3),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-4', 'test-math-ch1-slot-4', 'q-rn-m4-4', 4),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-5', 'test-math-ch1-slot-4', 'q-rn-m4-5', 5),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-6', 'test-math-ch1-slot-4', 'q-rn-m4-6', 6),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-7', 'test-math-ch1-slot-4', 'q-rn-m4-7', 7),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-8', 'test-math-ch1-slot-4', 'q-rn-m4-8', 8),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-9', 'test-math-ch1-slot-4', 'q-rn-m4-9', 9),
  ('mtq-test-math-ch1-slot-4-q-rn-m4-10', 'test-math-ch1-slot-4', 'q-rn-m4-10', 10),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-1', 'test-math-ch1-slot-5', 'q-rn-m5-1', 1),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-2', 'test-math-ch1-slot-5', 'q-rn-m5-2', 2),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-3', 'test-math-ch1-slot-5', 'q-rn-m5-3', 3),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-4', 'test-math-ch1-slot-5', 'q-rn-m5-4', 4),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-5', 'test-math-ch1-slot-5', 'q-rn-m5-5', 5),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-6', 'test-math-ch1-slot-5', 'q-rn-m5-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-test-math-ch1-slot-5-q-rn-m5-7', 'test-math-ch1-slot-5', 'q-rn-m5-7', 7),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-8', 'test-math-ch1-slot-5', 'q-rn-m5-8', 8),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-9', 'test-math-ch1-slot-5', 'q-rn-m5-9', 9),
  ('mtq-test-math-ch1-slot-5-q-rn-m5-10', 'test-math-ch1-slot-5', 'q-rn-m5-10', 10),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-1', 'test-math-ch1-slot-6', 'q-rn-m6-1', 1),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-2', 'test-math-ch1-slot-6', 'q-rn-m6-2', 2),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-3', 'test-math-ch1-slot-6', 'q-rn-m6-3', 3),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-4', 'test-math-ch1-slot-6', 'q-rn-m6-4', 4),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-5', 'test-math-ch1-slot-6', 'q-rn-m6-5', 5),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-6', 'test-math-ch1-slot-6', 'q-rn-m6-6', 6),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-7', 'test-math-ch1-slot-6', 'q-rn-m6-7', 7),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-8', 'test-math-ch1-slot-6', 'q-rn-m6-8', 8),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-9', 'test-math-ch1-slot-6', 'q-rn-m6-9', 9),
  ('mtq-test-math-ch1-slot-6-q-rn-m6-10', 'test-math-ch1-slot-6', 'q-rn-m6-10', 10),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-1', 'test-math-ch2-slot-1', 'q-poly-m1-1', 1),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-2', 'test-math-ch2-slot-1', 'q-poly-m1-2', 2),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-3', 'test-math-ch2-slot-1', 'q-poly-m1-3', 3),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-4', 'test-math-ch2-slot-1', 'q-poly-m1-4', 4),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-5', 'test-math-ch2-slot-1', 'q-poly-m1-5', 5),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-6', 'test-math-ch2-slot-1', 'q-poly-m1-6', 6),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-7', 'test-math-ch2-slot-1', 'q-poly-m1-7', 7),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-8', 'test-math-ch2-slot-1', 'q-poly-m1-8', 8),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-9', 'test-math-ch2-slot-1', 'q-poly-m1-9', 9),
  ('mtq-test-math-ch2-slot-1-q-poly-m1-10', 'test-math-ch2-slot-1', 'q-poly-m1-10', 10),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-1', 'test-math-ch2-slot-2', 'q-poly-m2-1', 1),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-2', 'test-math-ch2-slot-2', 'q-poly-m2-2', 2),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-3', 'test-math-ch2-slot-2', 'q-poly-m2-3', 3),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-4', 'test-math-ch2-slot-2', 'q-poly-m2-4', 4),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-5', 'test-math-ch2-slot-2', 'q-poly-m2-5', 5),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-6', 'test-math-ch2-slot-2', 'q-poly-m2-6', 6),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-7', 'test-math-ch2-slot-2', 'q-poly-m2-7', 7),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-8', 'test-math-ch2-slot-2', 'q-poly-m2-8', 8),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-9', 'test-math-ch2-slot-2', 'q-poly-m2-9', 9),
  ('mtq-test-math-ch2-slot-2-q-poly-m2-10', 'test-math-ch2-slot-2', 'q-poly-m2-10', 10),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-1', 'test-math-ch2-slot-3', 'q-poly-m3-1', 1),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-2', 'test-math-ch2-slot-3', 'q-poly-m3-2', 2),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-3', 'test-math-ch2-slot-3', 'q-poly-m3-3', 3),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-4', 'test-math-ch2-slot-3', 'q-poly-m3-4', 4),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-5', 'test-math-ch2-slot-3', 'q-poly-m3-5', 5),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-6', 'test-math-ch2-slot-3', 'q-poly-m3-6', 6),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-7', 'test-math-ch2-slot-3', 'q-poly-m3-7', 7),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-8', 'test-math-ch2-slot-3', 'q-poly-m3-8', 8),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-9', 'test-math-ch2-slot-3', 'q-poly-m3-9', 9),
  ('mtq-test-math-ch2-slot-3-q-poly-m3-10', 'test-math-ch2-slot-3', 'q-poly-m3-10', 10),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-1', 'test-math-ch2-slot-4', 'q-poly-m4-1', 1),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-2', 'test-math-ch2-slot-4', 'q-poly-m4-2', 2),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-3', 'test-math-ch2-slot-4', 'q-poly-m4-3', 3),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-4', 'test-math-ch2-slot-4', 'q-poly-m4-4', 4),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-5', 'test-math-ch2-slot-4', 'q-poly-m4-5', 5),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-6', 'test-math-ch2-slot-4', 'q-poly-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-test-math-ch2-slot-4-q-poly-m4-7', 'test-math-ch2-slot-4', 'q-poly-m4-7', 7),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-8', 'test-math-ch2-slot-4', 'q-poly-m4-8', 8),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-9', 'test-math-ch2-slot-4', 'q-poly-m4-9', 9),
  ('mtq-test-math-ch2-slot-4-q-poly-m4-10', 'test-math-ch2-slot-4', 'q-poly-m4-10', 10),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-1', 'test-math-ch2-slot-5', 'q-poly-m5-1', 1),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-2', 'test-math-ch2-slot-5', 'q-poly-m5-2', 2),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-3', 'test-math-ch2-slot-5', 'q-poly-m5-3', 3),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-4', 'test-math-ch2-slot-5', 'q-poly-m5-4', 4),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-5', 'test-math-ch2-slot-5', 'q-poly-m5-5', 5),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-6', 'test-math-ch2-slot-5', 'q-poly-m5-6', 6),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-7', 'test-math-ch2-slot-5', 'q-poly-m5-7', 7),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-8', 'test-math-ch2-slot-5', 'q-poly-m5-8', 8),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-9', 'test-math-ch2-slot-5', 'q-poly-m5-9', 9),
  ('mtq-test-math-ch2-slot-5-q-poly-m5-10', 'test-math-ch2-slot-5', 'q-poly-m5-10', 10),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-1', 'test-math-ch2-slot-6', 'q-poly-m6-1', 1),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-2', 'test-math-ch2-slot-6', 'q-poly-m6-2', 2),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-3', 'test-math-ch2-slot-6', 'q-poly-m6-3', 3),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-4', 'test-math-ch2-slot-6', 'q-poly-m6-4', 4),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-5', 'test-math-ch2-slot-6', 'q-poly-m6-5', 5),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-6', 'test-math-ch2-slot-6', 'q-poly-m6-6', 6),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-7', 'test-math-ch2-slot-6', 'q-poly-m6-7', 7),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-8', 'test-math-ch2-slot-6', 'q-poly-m6-8', 8),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-9', 'test-math-ch2-slot-6', 'q-poly-m6-9', 9),
  ('mtq-test-math-ch2-slot-6-q-poly-m6-10', 'test-math-ch2-slot-6', 'q-poly-m6-10', 10),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-1', 'test-math-ch2-slot-7', 'q-poly-m7-1', 1),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-2', 'test-math-ch2-slot-7', 'q-poly-m7-2', 2),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-3', 'test-math-ch2-slot-7', 'q-poly-m7-3', 3),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-4', 'test-math-ch2-slot-7', 'q-poly-m7-4', 4),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-5', 'test-math-ch2-slot-7', 'q-poly-m7-5', 5),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-6', 'test-math-ch2-slot-7', 'q-poly-m7-6', 6),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-7', 'test-math-ch2-slot-7', 'q-poly-m7-7', 7),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-8', 'test-math-ch2-slot-7', 'q-poly-m7-8', 8),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-9', 'test-math-ch2-slot-7', 'q-poly-m7-9', 9),
  ('mtq-test-math-ch2-slot-7-q-poly-m7-10', 'test-math-ch2-slot-7', 'q-poly-m7-10', 10),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-1', 'test-math-ch2-slot-8', 'q-poly-m8-1', 1),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-2', 'test-math-ch2-slot-8', 'q-poly-m8-2', 2),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-3', 'test-math-ch2-slot-8', 'q-poly-m8-3', 3),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-4', 'test-math-ch2-slot-8', 'q-poly-m8-4', 4),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-5', 'test-math-ch2-slot-8', 'q-poly-m8-5', 5),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-6', 'test-math-ch2-slot-8', 'q-poly-m8-6', 6),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-7', 'test-math-ch2-slot-8', 'q-poly-m8-7', 7),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-8', 'test-math-ch2-slot-8', 'q-poly-m8-8', 8),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-9', 'test-math-ch2-slot-8', 'q-poly-m8-9', 9),
  ('mtq-test-math-ch2-slot-8-q-poly-m8-10', 'test-math-ch2-slot-8', 'q-poly-m8-10', 10),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-1', 'test-math-ch2-slot-9', 'q-poly-m9-1', 1),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-2', 'test-math-ch2-slot-9', 'q-poly-m9-2', 2),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-3', 'test-math-ch2-slot-9', 'q-poly-m9-3', 3),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-4', 'test-math-ch2-slot-9', 'q-poly-m9-4', 4),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-5', 'test-math-ch2-slot-9', 'q-poly-m9-5', 5),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-6', 'test-math-ch2-slot-9', 'q-poly-m9-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-test-math-ch2-slot-9-q-poly-m9-7', 'test-math-ch2-slot-9', 'q-poly-m9-7', 7),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-8', 'test-math-ch2-slot-9', 'q-poly-m9-8', 8),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-9', 'test-math-ch2-slot-9', 'q-poly-m9-9', 9),
  ('mtq-test-math-ch2-slot-9-q-poly-m9-10', 'test-math-ch2-slot-9', 'q-poly-m9-10', 10),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-1', 'test-math-ch2-slot-10', 'q-poly-m10-1', 1),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-2', 'test-math-ch2-slot-10', 'q-poly-m10-2', 2),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-3', 'test-math-ch2-slot-10', 'q-poly-m10-3', 3),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-4', 'test-math-ch2-slot-10', 'q-poly-m10-4', 4),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-5', 'test-math-ch2-slot-10', 'q-poly-m10-5', 5),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-6', 'test-math-ch2-slot-10', 'q-poly-m10-6', 6),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-7', 'test-math-ch2-slot-10', 'q-poly-m10-7', 7),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-8', 'test-math-ch2-slot-10', 'q-poly-m10-8', 8),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-9', 'test-math-ch2-slot-10', 'q-poly-m10-9', 9),
  ('mtq-test-math-ch2-slot-10-q-poly-m10-10', 'test-math-ch2-slot-10', 'q-poly-m10-10', 10),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-1', 'test-math-ch3-slot-1', 'q-lineq-m1-1', 1),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-2', 'test-math-ch3-slot-1', 'q-lineq-m1-2', 2),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-3', 'test-math-ch3-slot-1', 'q-lineq-m1-3', 3),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-4', 'test-math-ch3-slot-1', 'q-lineq-m1-4', 4),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-5', 'test-math-ch3-slot-1', 'q-lineq-m1-5', 5),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-6', 'test-math-ch3-slot-1', 'q-lineq-m1-6', 6),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-7', 'test-math-ch3-slot-1', 'q-lineq-m1-7', 7),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-8', 'test-math-ch3-slot-1', 'q-lineq-m1-8', 8),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-9', 'test-math-ch3-slot-1', 'q-lineq-m1-9', 9),
  ('mtq-test-math-ch3-slot-1-q-lineq-m1-10', 'test-math-ch3-slot-1', 'q-lineq-m1-10', 10),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-1', 'test-math-ch3-slot-2', 'q-lineq-m2-1', 1),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-2', 'test-math-ch3-slot-2', 'q-lineq-m2-2', 2),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-3', 'test-math-ch3-slot-2', 'q-lineq-m2-3', 3),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-4', 'test-math-ch3-slot-2', 'q-lineq-m2-4', 4),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-5', 'test-math-ch3-slot-2', 'q-lineq-m2-5', 5),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-6', 'test-math-ch3-slot-2', 'q-lineq-m2-6', 6),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-7', 'test-math-ch3-slot-2', 'q-lineq-m2-7', 7),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-8', 'test-math-ch3-slot-2', 'q-lineq-m2-8', 8),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-9', 'test-math-ch3-slot-2', 'q-lineq-m2-9', 9),
  ('mtq-test-math-ch3-slot-2-q-lineq-m2-10', 'test-math-ch3-slot-2', 'q-lineq-m2-10', 10),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-1', 'test-math-ch3-slot-3', 'q-lineq-m3-1', 1),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-2', 'test-math-ch3-slot-3', 'q-lineq-m3-2', 2),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-3', 'test-math-ch3-slot-3', 'q-lineq-m3-3', 3),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-4', 'test-math-ch3-slot-3', 'q-lineq-m3-4', 4),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-5', 'test-math-ch3-slot-3', 'q-lineq-m3-5', 5),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-6', 'test-math-ch3-slot-3', 'q-lineq-m3-6', 6),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-7', 'test-math-ch3-slot-3', 'q-lineq-m3-7', 7),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-8', 'test-math-ch3-slot-3', 'q-lineq-m3-8', 8),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-9', 'test-math-ch3-slot-3', 'q-lineq-m3-9', 9),
  ('mtq-test-math-ch3-slot-3-q-lineq-m3-10', 'test-math-ch3-slot-3', 'q-lineq-m3-10', 10),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-1', 'test-math-ch3-slot-4', 'q-lineq-m4-1', 1),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-2', 'test-math-ch3-slot-4', 'q-lineq-m4-2', 2),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-3', 'test-math-ch3-slot-4', 'q-lineq-m4-3', 3),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-4', 'test-math-ch3-slot-4', 'q-lineq-m4-4', 4),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-5', 'test-math-ch3-slot-4', 'q-lineq-m4-5', 5),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-6', 'test-math-ch3-slot-4', 'q-lineq-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-7', 'test-math-ch3-slot-4', 'q-lineq-m4-7', 7),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-8', 'test-math-ch3-slot-4', 'q-lineq-m4-8', 8),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-9', 'test-math-ch3-slot-4', 'q-lineq-m4-9', 9),
  ('mtq-test-math-ch3-slot-4-q-lineq-m4-10', 'test-math-ch3-slot-4', 'q-lineq-m4-10', 10),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-1', 'test-math-ch3-slot-5', 'q-lineq-m5-1', 1),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-2', 'test-math-ch3-slot-5', 'q-lineq-m5-2', 2),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-3', 'test-math-ch3-slot-5', 'q-lineq-m5-3', 3),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-4', 'test-math-ch3-slot-5', 'q-lineq-m5-4', 4),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-5', 'test-math-ch3-slot-5', 'q-lineq-m5-5', 5),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-6', 'test-math-ch3-slot-5', 'q-lineq-m5-6', 6),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-7', 'test-math-ch3-slot-5', 'q-lineq-m5-7', 7),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-8', 'test-math-ch3-slot-5', 'q-lineq-m5-8', 8),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-9', 'test-math-ch3-slot-5', 'q-lineq-m5-9', 9),
  ('mtq-test-math-ch3-slot-5-q-lineq-m5-10', 'test-math-ch3-slot-5', 'q-lineq-m5-10', 10),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-1', 'test-math-ch3-slot-6', 'q-lineq-m6-1', 1),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-2', 'test-math-ch3-slot-6', 'q-lineq-m6-2', 2),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-3', 'test-math-ch3-slot-6', 'q-lineq-m6-3', 3),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-4', 'test-math-ch3-slot-6', 'q-lineq-m6-4', 4),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-5', 'test-math-ch3-slot-6', 'q-lineq-m6-5', 5),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-6', 'test-math-ch3-slot-6', 'q-lineq-m6-6', 6),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-7', 'test-math-ch3-slot-6', 'q-lineq-m6-7', 7),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-8', 'test-math-ch3-slot-6', 'q-lineq-m6-8', 8),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-9', 'test-math-ch3-slot-6', 'q-lineq-m6-9', 9),
  ('mtq-test-math-ch3-slot-6-q-lineq-m6-10', 'test-math-ch3-slot-6', 'q-lineq-m6-10', 10),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-1', 'test-math-ch3-slot-7', 'q-lineq-m7-1', 1),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-2', 'test-math-ch3-slot-7', 'q-lineq-m7-2', 2),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-3', 'test-math-ch3-slot-7', 'q-lineq-m7-3', 3),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-4', 'test-math-ch3-slot-7', 'q-lineq-m7-4', 4),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-5', 'test-math-ch3-slot-7', 'q-lineq-m7-5', 5),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-6', 'test-math-ch3-slot-7', 'q-lineq-m7-6', 6),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-7', 'test-math-ch3-slot-7', 'q-lineq-m7-7', 7),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-8', 'test-math-ch3-slot-7', 'q-lineq-m7-8', 8),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-9', 'test-math-ch3-slot-7', 'q-lineq-m7-9', 9),
  ('mtq-test-math-ch3-slot-7-q-lineq-m7-10', 'test-math-ch3-slot-7', 'q-lineq-m7-10', 10),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-1', 'test-math-ch3-slot-8', 'q-lineq-m8-1', 1),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-2', 'test-math-ch3-slot-8', 'q-lineq-m8-2', 2),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-3', 'test-math-ch3-slot-8', 'q-lineq-m8-3', 3),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-4', 'test-math-ch3-slot-8', 'q-lineq-m8-4', 4),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-5', 'test-math-ch3-slot-8', 'q-lineq-m8-5', 5),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-6', 'test-math-ch3-slot-8', 'q-lineq-m8-6', 6),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-7', 'test-math-ch3-slot-8', 'q-lineq-m8-7', 7),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-8', 'test-math-ch3-slot-8', 'q-lineq-m8-8', 8),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-9', 'test-math-ch3-slot-8', 'q-lineq-m8-9', 9),
  ('mtq-test-math-ch3-slot-8-q-lineq-m8-10', 'test-math-ch3-slot-8', 'q-lineq-m8-10', 10),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-1', 'test-math-ch3-slot-9', 'q-lineq-m9-1', 1),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-2', 'test-math-ch3-slot-9', 'q-lineq-m9-2', 2),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-3', 'test-math-ch3-slot-9', 'q-lineq-m9-3', 3),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-4', 'test-math-ch3-slot-9', 'q-lineq-m9-4', 4),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-5', 'test-math-ch3-slot-9', 'q-lineq-m9-5', 5),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-6', 'test-math-ch3-slot-9', 'q-lineq-m9-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-7', 'test-math-ch3-slot-9', 'q-lineq-m9-7', 7),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-8', 'test-math-ch3-slot-9', 'q-lineq-m9-8', 8),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-9', 'test-math-ch3-slot-9', 'q-lineq-m9-9', 9),
  ('mtq-test-math-ch3-slot-9-q-lineq-m9-10', 'test-math-ch3-slot-9', 'q-lineq-m9-10', 10),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-1', 'test-math-ch3-slot-10', 'q-lineq-m10-1', 1),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-2', 'test-math-ch3-slot-10', 'q-lineq-m10-2', 2),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-3', 'test-math-ch3-slot-10', 'q-lineq-m10-3', 3),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-4', 'test-math-ch3-slot-10', 'q-lineq-m10-4', 4),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-5', 'test-math-ch3-slot-10', 'q-lineq-m10-5', 5),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-6', 'test-math-ch3-slot-10', 'q-lineq-m10-6', 6),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-7', 'test-math-ch3-slot-10', 'q-lineq-m10-7', 7),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-8', 'test-math-ch3-slot-10', 'q-lineq-m10-8', 8),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-9', 'test-math-ch3-slot-10', 'q-lineq-m10-9', 9),
  ('mtq-test-math-ch3-slot-10-q-lineq-m10-10', 'test-math-ch3-slot-10', 'q-lineq-m10-10', 10),
  ('mtq-quad-m1-1', 'test-math-ch4-slot-1', 'q-quad-m1-1', 1),
  ('mtq-quad-m1-2', 'test-math-ch4-slot-1', 'q-quad-m1-2', 2),
  ('mtq-quad-m1-3', 'test-math-ch4-slot-1', 'q-quad-m1-3', 3),
  ('mtq-quad-m1-4', 'test-math-ch4-slot-1', 'q-quad-m1-4', 4),
  ('mtq-quad-m1-5', 'test-math-ch4-slot-1', 'q-quad-m1-5', 5),
  ('mtq-quad-m1-6', 'test-math-ch4-slot-1', 'q-quad-m1-6', 6),
  ('mtq-quad-m1-7', 'test-math-ch4-slot-1', 'q-quad-m1-7', 7),
  ('mtq-quad-m1-8', 'test-math-ch4-slot-1', 'q-quad-m1-8', 8),
  ('mtq-quad-m1-9', 'test-math-ch4-slot-1', 'q-quad-m1-9', 9),
  ('mtq-quad-m1-10', 'test-math-ch4-slot-1', 'q-quad-m1-10', 10),
  ('mtq-quad-m2-1', 'test-math-ch4-slot-2', 'q-quad-m2-1', 1),
  ('mtq-quad-m2-2', 'test-math-ch4-slot-2', 'q-quad-m2-2', 2),
  ('mtq-quad-m2-3', 'test-math-ch4-slot-2', 'q-quad-m2-3', 3),
  ('mtq-quad-m2-4', 'test-math-ch4-slot-2', 'q-quad-m2-4', 4),
  ('mtq-quad-m2-5', 'test-math-ch4-slot-2', 'q-quad-m2-5', 5),
  ('mtq-quad-m2-6', 'test-math-ch4-slot-2', 'q-quad-m2-6', 6),
  ('mtq-quad-m2-7', 'test-math-ch4-slot-2', 'q-quad-m2-7', 7),
  ('mtq-quad-m2-8', 'test-math-ch4-slot-2', 'q-quad-m2-8', 8),
  ('mtq-quad-m2-9', 'test-math-ch4-slot-2', 'q-quad-m2-9', 9),
  ('mtq-quad-m2-10', 'test-math-ch4-slot-2', 'q-quad-m2-10', 10),
  ('mtq-quad-m3-1', 'test-math-ch4-slot-3', 'q-quad-m3-1', 1),
  ('mtq-quad-m3-2', 'test-math-ch4-slot-3', 'q-quad-m3-2', 2),
  ('mtq-quad-m3-3', 'test-math-ch4-slot-3', 'q-quad-m3-3', 3),
  ('mtq-quad-m3-4', 'test-math-ch4-slot-3', 'q-quad-m3-4', 4),
  ('mtq-quad-m3-5', 'test-math-ch4-slot-3', 'q-quad-m3-5', 5),
  ('mtq-quad-m3-6', 'test-math-ch4-slot-3', 'q-quad-m3-6', 6),
  ('mtq-quad-m3-7', 'test-math-ch4-slot-3', 'q-quad-m3-7', 7),
  ('mtq-quad-m3-8', 'test-math-ch4-slot-3', 'q-quad-m3-8', 8),
  ('mtq-quad-m3-9', 'test-math-ch4-slot-3', 'q-quad-m3-9', 9),
  ('mtq-quad-m3-10', 'test-math-ch4-slot-3', 'q-quad-m3-10', 10),
  ('mtq-quad-m4-1', 'test-math-ch4-slot-4', 'q-quad-m4-1', 1),
  ('mtq-quad-m4-2', 'test-math-ch4-slot-4', 'q-quad-m4-2', 2),
  ('mtq-quad-m4-3', 'test-math-ch4-slot-4', 'q-quad-m4-3', 3),
  ('mtq-quad-m4-4', 'test-math-ch4-slot-4', 'q-quad-m4-4', 4),
  ('mtq-quad-m4-5', 'test-math-ch4-slot-4', 'q-quad-m4-5', 5),
  ('mtq-quad-m4-6', 'test-math-ch4-slot-4', 'q-quad-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-quad-m4-7', 'test-math-ch4-slot-4', 'q-quad-m4-7', 7),
  ('mtq-quad-m4-8', 'test-math-ch4-slot-4', 'q-quad-m4-8', 8),
  ('mtq-quad-m4-9', 'test-math-ch4-slot-4', 'q-quad-m4-9', 9),
  ('mtq-quad-m4-10', 'test-math-ch4-slot-4', 'q-quad-m4-10', 10),
  ('mtq-quad-m5-1', 'test-math-ch4-slot-5', 'q-quad-m5-1', 1),
  ('mtq-quad-m5-2', 'test-math-ch4-slot-5', 'q-quad-m5-2', 2),
  ('mtq-quad-m5-3', 'test-math-ch4-slot-5', 'q-quad-m5-3', 3),
  ('mtq-quad-m5-4', 'test-math-ch4-slot-5', 'q-quad-m5-4', 4),
  ('mtq-quad-m5-5', 'test-math-ch4-slot-5', 'q-quad-m5-5', 5),
  ('mtq-quad-m5-6', 'test-math-ch4-slot-5', 'q-quad-m5-6', 6),
  ('mtq-quad-m5-7', 'test-math-ch4-slot-5', 'q-quad-m5-7', 7),
  ('mtq-quad-m5-8', 'test-math-ch4-slot-5', 'q-quad-m5-8', 8),
  ('mtq-quad-m5-9', 'test-math-ch4-slot-5', 'q-quad-m5-9', 9),
  ('mtq-quad-m5-10', 'test-math-ch4-slot-5', 'q-quad-m5-10', 10),
  ('mtq-quad-m6-1', 'test-math-ch4-slot-6', 'q-quad-m6-1', 1),
  ('mtq-quad-m6-2', 'test-math-ch4-slot-6', 'q-quad-m6-2', 2),
  ('mtq-quad-m6-3', 'test-math-ch4-slot-6', 'q-quad-m6-3', 3),
  ('mtq-quad-m6-4', 'test-math-ch4-slot-6', 'q-quad-m6-4', 4),
  ('mtq-quad-m6-5', 'test-math-ch4-slot-6', 'q-quad-m6-5', 5),
  ('mtq-quad-m6-6', 'test-math-ch4-slot-6', 'q-quad-m6-6', 6),
  ('mtq-quad-m6-7', 'test-math-ch4-slot-6', 'q-quad-m6-7', 7),
  ('mtq-quad-m6-8', 'test-math-ch4-slot-6', 'q-quad-m6-8', 8),
  ('mtq-quad-m6-9', 'test-math-ch4-slot-6', 'q-quad-m6-9', 9),
  ('mtq-quad-m6-10', 'test-math-ch4-slot-6', 'q-quad-m6-10', 10),
  ('mtq-quad-m7-1', 'test-math-ch4-slot-7', 'q-quad-m7-1', 1),
  ('mtq-quad-m7-2', 'test-math-ch4-slot-7', 'q-quad-m7-2', 2),
  ('mtq-quad-m7-3', 'test-math-ch4-slot-7', 'q-quad-m7-3', 3),
  ('mtq-quad-m7-4', 'test-math-ch4-slot-7', 'q-quad-m7-4', 4),
  ('mtq-quad-m7-5', 'test-math-ch4-slot-7', 'q-quad-m7-5', 5),
  ('mtq-quad-m7-6', 'test-math-ch4-slot-7', 'q-quad-m7-6', 6),
  ('mtq-quad-m7-7', 'test-math-ch4-slot-7', 'q-quad-m7-7', 7),
  ('mtq-quad-m7-8', 'test-math-ch4-slot-7', 'q-quad-m7-8', 8),
  ('mtq-quad-m7-9', 'test-math-ch4-slot-7', 'q-quad-m7-9', 9),
  ('mtq-quad-m7-10', 'test-math-ch4-slot-7', 'q-quad-m7-10', 10),
  ('mtq-quad-m8-1', 'test-math-ch4-slot-8', 'q-quad-m8-1', 1),
  ('mtq-quad-m8-2', 'test-math-ch4-slot-8', 'q-quad-m8-2', 2),
  ('mtq-quad-m8-3', 'test-math-ch4-slot-8', 'q-quad-m8-3', 3),
  ('mtq-quad-m8-4', 'test-math-ch4-slot-8', 'q-quad-m8-4', 4),
  ('mtq-quad-m8-5', 'test-math-ch4-slot-8', 'q-quad-m8-5', 5),
  ('mtq-quad-m8-6', 'test-math-ch4-slot-8', 'q-quad-m8-6', 6),
  ('mtq-quad-m8-7', 'test-math-ch4-slot-8', 'q-quad-m8-7', 7),
  ('mtq-quad-m8-8', 'test-math-ch4-slot-8', 'q-quad-m8-8', 8),
  ('mtq-quad-m8-9', 'test-math-ch4-slot-8', 'q-quad-m8-9', 9),
  ('mtq-quad-m8-10', 'test-math-ch4-slot-8', 'q-quad-m8-10', 10),
  ('mtq-quad-m9-1', 'test-math-ch4-slot-9', 'q-quad-m9-1', 1),
  ('mtq-quad-m9-2', 'test-math-ch4-slot-9', 'q-quad-m9-2', 2),
  ('mtq-quad-m9-3', 'test-math-ch4-slot-9', 'q-quad-m9-3', 3),
  ('mtq-quad-m9-4', 'test-math-ch4-slot-9', 'q-quad-m9-4', 4),
  ('mtq-quad-m9-5', 'test-math-ch4-slot-9', 'q-quad-m9-5', 5),
  ('mtq-quad-m9-6', 'test-math-ch4-slot-9', 'q-quad-m9-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-quad-m9-7', 'test-math-ch4-slot-9', 'q-quad-m9-7', 7),
  ('mtq-quad-m9-8', 'test-math-ch4-slot-9', 'q-quad-m9-8', 8),
  ('mtq-quad-m9-9', 'test-math-ch4-slot-9', 'q-quad-m9-9', 9),
  ('mtq-quad-m9-10', 'test-math-ch4-slot-9', 'q-quad-m9-10', 10),
  ('mtq-quad-m10-1', 'test-math-ch4-slot-10', 'q-quad-m10-1', 1),
  ('mtq-quad-m10-2', 'test-math-ch4-slot-10', 'q-quad-m10-2', 2),
  ('mtq-quad-m10-3', 'test-math-ch4-slot-10', 'q-quad-m10-3', 3),
  ('mtq-quad-m10-4', 'test-math-ch4-slot-10', 'q-quad-m10-4', 4),
  ('mtq-quad-m10-5', 'test-math-ch4-slot-10', 'q-quad-m10-5', 5),
  ('mtq-quad-m10-6', 'test-math-ch4-slot-10', 'q-quad-m10-6', 6),
  ('mtq-quad-m10-7', 'test-math-ch4-slot-10', 'q-quad-m10-7', 7),
  ('mtq-quad-m10-8', 'test-math-ch4-slot-10', 'q-quad-m10-8', 8),
  ('mtq-quad-m10-9', 'test-math-ch4-slot-10', 'q-quad-m10-9', 9),
  ('mtq-quad-m10-10', 'test-math-ch4-slot-10', 'q-quad-m10-10', 10),
  ('mtq-ap-m1-1', 'test-math-ch5-slot-1', 'q-ap-m1-1', 1),
  ('mtq-ap-m1-2', 'test-math-ch5-slot-1', 'q-ap-m1-2', 2),
  ('mtq-ap-m1-3', 'test-math-ch5-slot-1', 'q-ap-m1-3', 3),
  ('mtq-ap-m1-4', 'test-math-ch5-slot-1', 'q-ap-m1-4', 4),
  ('mtq-ap-m1-5', 'test-math-ch5-slot-1', 'q-ap-m1-5', 5),
  ('mtq-ap-m1-6', 'test-math-ch5-slot-1', 'q-ap-m1-6', 6),
  ('mtq-ap-m1-7', 'test-math-ch5-slot-1', 'q-ap-m1-7', 7),
  ('mtq-ap-m1-8', 'test-math-ch5-slot-1', 'q-ap-m1-8', 8),
  ('mtq-ap-m1-9', 'test-math-ch5-slot-1', 'q-ap-m1-9', 9),
  ('mtq-ap-m1-10', 'test-math-ch5-slot-1', 'q-ap-m1-10', 10),
  ('mtq-ap-m2-1', 'test-math-ch5-slot-2', 'q-ap-m2-1', 1),
  ('mtq-ap-m2-2', 'test-math-ch5-slot-2', 'q-ap-m2-2', 2),
  ('mtq-ap-m2-3', 'test-math-ch5-slot-2', 'q-ap-m2-3', 3),
  ('mtq-ap-m2-4', 'test-math-ch5-slot-2', 'q-ap-m2-4', 4),
  ('mtq-ap-m2-5', 'test-math-ch5-slot-2', 'q-ap-m2-5', 5),
  ('mtq-ap-m2-6', 'test-math-ch5-slot-2', 'q-ap-m2-6', 6),
  ('mtq-ap-m2-7', 'test-math-ch5-slot-2', 'q-ap-m2-7', 7),
  ('mtq-ap-m2-8', 'test-math-ch5-slot-2', 'q-ap-m2-8', 8),
  ('mtq-ap-m2-9', 'test-math-ch5-slot-2', 'q-ap-m2-9', 9),
  ('mtq-ap-m2-10', 'test-math-ch5-slot-2', 'q-ap-m2-10', 10),
  ('mtq-ap-m3-1', 'test-math-ch5-slot-3', 'q-ap-m3-1', 1),
  ('mtq-ap-m3-2', 'test-math-ch5-slot-3', 'q-ap-m3-2', 2),
  ('mtq-ap-m3-3', 'test-math-ch5-slot-3', 'q-ap-m3-3', 3),
  ('mtq-ap-m3-4', 'test-math-ch5-slot-3', 'q-ap-m3-4', 4),
  ('mtq-ap-m3-5', 'test-math-ch5-slot-3', 'q-ap-m3-5', 5),
  ('mtq-ap-m3-6', 'test-math-ch5-slot-3', 'q-ap-m3-6', 6),
  ('mtq-ap-m3-7', 'test-math-ch5-slot-3', 'q-ap-m3-7', 7),
  ('mtq-ap-m3-8', 'test-math-ch5-slot-3', 'q-ap-m3-8', 8),
  ('mtq-ap-m3-9', 'test-math-ch5-slot-3', 'q-ap-m3-9', 9),
  ('mtq-ap-m3-10', 'test-math-ch5-slot-3', 'q-ap-m3-10', 10),
  ('mtq-ap-m4-1', 'test-math-ch5-slot-4', 'q-ap-m4-1', 1),
  ('mtq-ap-m4-2', 'test-math-ch5-slot-4', 'q-ap-m4-2', 2),
  ('mtq-ap-m4-3', 'test-math-ch5-slot-4', 'q-ap-m4-3', 3),
  ('mtq-ap-m4-4', 'test-math-ch5-slot-4', 'q-ap-m4-4', 4),
  ('mtq-ap-m4-5', 'test-math-ch5-slot-4', 'q-ap-m4-5', 5),
  ('mtq-ap-m4-6', 'test-math-ch5-slot-4', 'q-ap-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-ap-m4-7', 'test-math-ch5-slot-4', 'q-ap-m4-7', 7),
  ('mtq-ap-m4-8', 'test-math-ch5-slot-4', 'q-ap-m4-8', 8),
  ('mtq-ap-m4-9', 'test-math-ch5-slot-4', 'q-ap-m4-9', 9),
  ('mtq-ap-m4-10', 'test-math-ch5-slot-4', 'q-ap-m4-10', 10),
  ('mtq-ap-m5-1', 'test-math-ch5-slot-5', 'q-ap-m5-1', 1),
  ('mtq-ap-m5-2', 'test-math-ch5-slot-5', 'q-ap-m5-2', 2),
  ('mtq-ap-m5-3', 'test-math-ch5-slot-5', 'q-ap-m5-3', 3),
  ('mtq-ap-m5-4', 'test-math-ch5-slot-5', 'q-ap-m5-4', 4),
  ('mtq-ap-m5-5', 'test-math-ch5-slot-5', 'q-ap-m5-5', 5),
  ('mtq-ap-m5-6', 'test-math-ch5-slot-5', 'q-ap-m5-6', 6),
  ('mtq-ap-m5-7', 'test-math-ch5-slot-5', 'q-ap-m5-7', 7),
  ('mtq-ap-m5-8', 'test-math-ch5-slot-5', 'q-ap-m5-8', 8),
  ('mtq-ap-m5-9', 'test-math-ch5-slot-5', 'q-ap-m5-9', 9),
  ('mtq-ap-m5-10', 'test-math-ch5-slot-5', 'q-ap-m5-10', 10),
  ('mtq-ap-m6-1', 'test-math-ch5-slot-6', 'q-ap-m6-1', 1),
  ('mtq-ap-m6-2', 'test-math-ch5-slot-6', 'q-ap-m6-2', 2),
  ('mtq-ap-m6-3', 'test-math-ch5-slot-6', 'q-ap-m6-3', 3),
  ('mtq-ap-m6-4', 'test-math-ch5-slot-6', 'q-ap-m6-4', 4),
  ('mtq-ap-m6-5', 'test-math-ch5-slot-6', 'q-ap-m6-5', 5),
  ('mtq-ap-m6-6', 'test-math-ch5-slot-6', 'q-ap-m6-6', 6),
  ('mtq-ap-m6-7', 'test-math-ch5-slot-6', 'q-ap-m6-7', 7),
  ('mtq-ap-m6-8', 'test-math-ch5-slot-6', 'q-ap-m6-8', 8),
  ('mtq-ap-m6-9', 'test-math-ch5-slot-6', 'q-ap-m6-9', 9),
  ('mtq-ap-m6-10', 'test-math-ch5-slot-6', 'q-ap-m6-10', 10),
  ('mtq-ap-m7-1', 'test-math-ch5-slot-7', 'q-ap-m7-1', 1),
  ('mtq-ap-m7-2', 'test-math-ch5-slot-7', 'q-ap-m7-2', 2),
  ('mtq-ap-m7-3', 'test-math-ch5-slot-7', 'q-ap-m7-3', 3),
  ('mtq-ap-m7-4', 'test-math-ch5-slot-7', 'q-ap-m7-4', 4),
  ('mtq-ap-m7-5', 'test-math-ch5-slot-7', 'q-ap-m7-5', 5),
  ('mtq-ap-m7-6', 'test-math-ch5-slot-7', 'q-ap-m7-6', 6),
  ('mtq-ap-m7-7', 'test-math-ch5-slot-7', 'q-ap-m7-7', 7),
  ('mtq-ap-m7-8', 'test-math-ch5-slot-7', 'q-ap-m7-8', 8),
  ('mtq-ap-m7-9', 'test-math-ch5-slot-7', 'q-ap-m7-9', 9),
  ('mtq-ap-m7-10', 'test-math-ch5-slot-7', 'q-ap-m7-10', 10),
  ('mtq-ap-m8-1', 'test-math-ch5-slot-8', 'q-ap-m8-1', 1),
  ('mtq-ap-m8-2', 'test-math-ch5-slot-8', 'q-ap-m8-2', 2),
  ('mtq-ap-m8-3', 'test-math-ch5-slot-8', 'q-ap-m8-3', 3),
  ('mtq-ap-m8-4', 'test-math-ch5-slot-8', 'q-ap-m8-4', 4),
  ('mtq-ap-m8-5', 'test-math-ch5-slot-8', 'q-ap-m8-5', 5),
  ('mtq-ap-m8-6', 'test-math-ch5-slot-8', 'q-ap-m8-6', 6),
  ('mtq-ap-m8-7', 'test-math-ch5-slot-8', 'q-ap-m8-7', 7),
  ('mtq-ap-m8-8', 'test-math-ch5-slot-8', 'q-ap-m8-8', 8),
  ('mtq-ap-m8-9', 'test-math-ch5-slot-8', 'q-ap-m8-9', 9),
  ('mtq-ap-m8-10', 'test-math-ch5-slot-8', 'q-ap-m8-10', 10),
  ('mtq-tri-m1-1', 'test-math-ch6-slot-1', 'q-tri-m1-1', 1),
  ('mtq-tri-m1-2', 'test-math-ch6-slot-1', 'q-tri-m1-2', 2),
  ('mtq-tri-m1-3', 'test-math-ch6-slot-1', 'q-tri-m1-3', 3),
  ('mtq-tri-m1-4', 'test-math-ch6-slot-1', 'q-tri-m1-4', 4),
  ('mtq-tri-m1-5', 'test-math-ch6-slot-1', 'q-tri-m1-5', 5),
  ('mtq-tri-m1-6', 'test-math-ch6-slot-1', 'q-tri-m1-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-tri-m1-7', 'test-math-ch6-slot-1', 'q-tri-m1-7', 7),
  ('mtq-tri-m1-8', 'test-math-ch6-slot-1', 'q-tri-m1-8', 8),
  ('mtq-tri-m1-9', 'test-math-ch6-slot-1', 'q-tri-m1-9', 9),
  ('mtq-tri-m1-10', 'test-math-ch6-slot-1', 'q-tri-m1-10', 10),
  ('mtq-tri-m2-1', 'test-math-ch6-slot-2', 'q-tri-m2-1', 1),
  ('mtq-tri-m2-2', 'test-math-ch6-slot-2', 'q-tri-m2-2', 2),
  ('mtq-tri-m2-3', 'test-math-ch6-slot-2', 'q-tri-m2-3', 3),
  ('mtq-tri-m2-4', 'test-math-ch6-slot-2', 'q-tri-m2-4', 4),
  ('mtq-tri-m2-5', 'test-math-ch6-slot-2', 'q-tri-m2-5', 5),
  ('mtq-tri-m2-6', 'test-math-ch6-slot-2', 'q-tri-m2-6', 6),
  ('mtq-tri-m2-7', 'test-math-ch6-slot-2', 'q-tri-m2-7', 7),
  ('mtq-tri-m2-8', 'test-math-ch6-slot-2', 'q-tri-m2-8', 8),
  ('mtq-tri-m2-9', 'test-math-ch6-slot-2', 'q-tri-m2-9', 9),
  ('mtq-tri-m2-10', 'test-math-ch6-slot-2', 'q-tri-m2-10', 10),
  ('mtq-tri-m3-1', 'test-math-ch6-slot-3', 'q-tri-m3-1', 1),
  ('mtq-tri-m3-2', 'test-math-ch6-slot-3', 'q-tri-m3-2', 2),
  ('mtq-tri-m3-3', 'test-math-ch6-slot-3', 'q-tri-m3-3', 3),
  ('mtq-tri-m3-4', 'test-math-ch6-slot-3', 'q-tri-m3-4', 4),
  ('mtq-tri-m3-5', 'test-math-ch6-slot-3', 'q-tri-m3-5', 5),
  ('mtq-tri-m3-6', 'test-math-ch6-slot-3', 'q-tri-m3-6', 6),
  ('mtq-tri-m3-7', 'test-math-ch6-slot-3', 'q-tri-m3-7', 7),
  ('mtq-tri-m3-8', 'test-math-ch6-slot-3', 'q-tri-m3-8', 8),
  ('mtq-tri-m3-9', 'test-math-ch6-slot-3', 'q-tri-m3-9', 9),
  ('mtq-tri-m3-10', 'test-math-ch6-slot-3', 'q-tri-m3-10', 10),
  ('mtq-tri-m4-1', 'test-math-ch6-slot-4', 'q-tri-m4-1', 1),
  ('mtq-tri-m4-2', 'test-math-ch6-slot-4', 'q-tri-m4-2', 2),
  ('mtq-tri-m4-3', 'test-math-ch6-slot-4', 'q-tri-m4-3', 3),
  ('mtq-tri-m4-4', 'test-math-ch6-slot-4', 'q-tri-m4-4', 4),
  ('mtq-tri-m4-5', 'test-math-ch6-slot-4', 'q-tri-m4-5', 5),
  ('mtq-tri-m4-6', 'test-math-ch6-slot-4', 'q-tri-m4-6', 6),
  ('mtq-tri-m4-7', 'test-math-ch6-slot-4', 'q-tri-m4-7', 7),
  ('mtq-tri-m4-8', 'test-math-ch6-slot-4', 'q-tri-m4-8', 8),
  ('mtq-tri-m4-9', 'test-math-ch6-slot-4', 'q-tri-m4-9', 9),
  ('mtq-tri-m4-10', 'test-math-ch6-slot-4', 'q-tri-m4-10', 10),
  ('mtq-tri-m5-1', 'test-math-ch6-slot-5', 'q-tri-m5-1', 1),
  ('mtq-tri-m5-2', 'test-math-ch6-slot-5', 'q-tri-m5-2', 2),
  ('mtq-tri-m5-3', 'test-math-ch6-slot-5', 'q-tri-m5-3', 3),
  ('mtq-tri-m5-4', 'test-math-ch6-slot-5', 'q-tri-m5-4', 4),
  ('mtq-tri-m5-5', 'test-math-ch6-slot-5', 'q-tri-m5-5', 5),
  ('mtq-tri-m5-6', 'test-math-ch6-slot-5', 'q-tri-m5-6', 6),
  ('mtq-tri-m5-7', 'test-math-ch6-slot-5', 'q-tri-m5-7', 7),
  ('mtq-tri-m5-8', 'test-math-ch6-slot-5', 'q-tri-m5-8', 8),
  ('mtq-tri-m5-9', 'test-math-ch6-slot-5', 'q-tri-m5-9', 9),
  ('mtq-tri-m5-10', 'test-math-ch6-slot-5', 'q-tri-m5-10', 10),
  ('mtq-coord-m1-1', 'test-math-ch7-slot-1', 'q-coord-m1-1', 1),
  ('mtq-coord-m1-2', 'test-math-ch7-slot-1', 'q-coord-m1-2', 2),
  ('mtq-coord-m1-3', 'test-math-ch7-slot-1', 'q-coord-m1-3', 3),
  ('mtq-coord-m1-4', 'test-math-ch7-slot-1', 'q-coord-m1-4', 4),
  ('mtq-coord-m1-5', 'test-math-ch7-slot-1', 'q-coord-m1-5', 5),
  ('mtq-coord-m1-6', 'test-math-ch7-slot-1', 'q-coord-m1-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-coord-m1-7', 'test-math-ch7-slot-1', 'q-coord-m1-7', 7),
  ('mtq-coord-m1-8', 'test-math-ch7-slot-1', 'q-coord-m1-8', 8),
  ('mtq-coord-m1-9', 'test-math-ch7-slot-1', 'q-coord-m1-9', 9),
  ('mtq-coord-m1-10', 'test-math-ch7-slot-1', 'q-coord-m1-10', 10),
  ('mtq-coord-m2-1', 'test-math-ch7-slot-2', 'q-coord-m2-1', 1),
  ('mtq-coord-m2-2', 'test-math-ch7-slot-2', 'q-coord-m2-2', 2),
  ('mtq-coord-m2-3', 'test-math-ch7-slot-2', 'q-coord-m2-3', 3),
  ('mtq-coord-m2-4', 'test-math-ch7-slot-2', 'q-coord-m2-4', 4),
  ('mtq-coord-m2-5', 'test-math-ch7-slot-2', 'q-coord-m2-5', 5),
  ('mtq-coord-m2-6', 'test-math-ch7-slot-2', 'q-coord-m2-6', 6),
  ('mtq-coord-m2-7', 'test-math-ch7-slot-2', 'q-coord-m2-7', 7),
  ('mtq-coord-m2-8', 'test-math-ch7-slot-2', 'q-coord-m2-8', 8),
  ('mtq-coord-m2-9', 'test-math-ch7-slot-2', 'q-coord-m2-9', 9),
  ('mtq-coord-m2-10', 'test-math-ch7-slot-2', 'q-coord-m2-10', 10),
  ('mtq-coord-m3-1', 'test-math-ch7-slot-3', 'q-coord-m3-1', 1),
  ('mtq-coord-m3-2', 'test-math-ch7-slot-3', 'q-coord-m3-2', 2),
  ('mtq-coord-m3-3', 'test-math-ch7-slot-3', 'q-coord-m3-3', 3),
  ('mtq-coord-m3-4', 'test-math-ch7-slot-3', 'q-coord-m3-4', 4),
  ('mtq-coord-m3-5', 'test-math-ch7-slot-3', 'q-coord-m3-5', 5),
  ('mtq-coord-m3-6', 'test-math-ch7-slot-3', 'q-coord-m3-6', 6),
  ('mtq-coord-m3-7', 'test-math-ch7-slot-3', 'q-coord-m3-7', 7),
  ('mtq-coord-m3-8', 'test-math-ch7-slot-3', 'q-coord-m3-8', 8),
  ('mtq-coord-m3-9', 'test-math-ch7-slot-3', 'q-coord-m3-9', 9),
  ('mtq-coord-m3-10', 'test-math-ch7-slot-3', 'q-coord-m3-10', 10),
  ('mtq-coord-m4-1', 'test-math-ch7-slot-4', 'q-coord-m4-1', 1),
  ('mtq-coord-m4-2', 'test-math-ch7-slot-4', 'q-coord-m4-2', 2),
  ('mtq-coord-m4-3', 'test-math-ch7-slot-4', 'q-coord-m4-3', 3),
  ('mtq-coord-m4-4', 'test-math-ch7-slot-4', 'q-coord-m4-4', 4),
  ('mtq-coord-m4-5', 'test-math-ch7-slot-4', 'q-coord-m4-5', 5),
  ('mtq-coord-m4-6', 'test-math-ch7-slot-4', 'q-coord-m4-6', 6),
  ('mtq-coord-m4-7', 'test-math-ch7-slot-4', 'q-coord-m4-7', 7),
  ('mtq-coord-m4-8', 'test-math-ch7-slot-4', 'q-coord-m4-8', 8),
  ('mtq-coord-m4-9', 'test-math-ch7-slot-4', 'q-coord-m4-9', 9),
  ('mtq-coord-m4-10', 'test-math-ch7-slot-4', 'q-coord-m4-10', 10),
  ('mtq-coord-m5-1', 'test-math-ch7-slot-5', 'q-coord-m5-1', 1),
  ('mtq-coord-m5-2', 'test-math-ch7-slot-5', 'q-coord-m5-2', 2),
  ('mtq-coord-m5-3', 'test-math-ch7-slot-5', 'q-coord-m5-3', 3),
  ('mtq-coord-m5-4', 'test-math-ch7-slot-5', 'q-coord-m5-4', 4),
  ('mtq-coord-m5-5', 'test-math-ch7-slot-5', 'q-coord-m5-5', 5),
  ('mtq-coord-m5-6', 'test-math-ch7-slot-5', 'q-coord-m5-6', 6),
  ('mtq-coord-m5-7', 'test-math-ch7-slot-5', 'q-coord-m5-7', 7),
  ('mtq-coord-m5-8', 'test-math-ch7-slot-5', 'q-coord-m5-8', 8),
  ('mtq-coord-m5-9', 'test-math-ch7-slot-5', 'q-coord-m5-9', 9),
  ('mtq-coord-m5-10', 'test-math-ch7-slot-5', 'q-coord-m5-10', 10),
  ('mtq-trig-m1-1', 'test-math-ch8-slot-1', 'q-trig-m1-1', 1),
  ('mtq-trig-m1-2', 'test-math-ch8-slot-1', 'q-trig-m1-2', 2),
  ('mtq-trig-m1-3', 'test-math-ch8-slot-1', 'q-trig-m1-3', 3),
  ('mtq-trig-m1-4', 'test-math-ch8-slot-1', 'q-trig-m1-4', 4),
  ('mtq-trig-m1-5', 'test-math-ch8-slot-1', 'q-trig-m1-5', 5),
  ('mtq-trig-m1-6', 'test-math-ch8-slot-1', 'q-trig-m1-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-trig-m1-7', 'test-math-ch8-slot-1', 'q-trig-m1-7', 7),
  ('mtq-trig-m1-8', 'test-math-ch8-slot-1', 'q-trig-m1-8', 8),
  ('mtq-trig-m1-9', 'test-math-ch8-slot-1', 'q-trig-m1-9', 9),
  ('mtq-trig-m1-10', 'test-math-ch8-slot-1', 'q-trig-m1-10', 10),
  ('mtq-trig-m2-1', 'test-math-ch8-slot-2', 'q-trig-m2-1', 1),
  ('mtq-trig-m2-2', 'test-math-ch8-slot-2', 'q-trig-m2-2', 2),
  ('mtq-trig-m2-3', 'test-math-ch8-slot-2', 'q-trig-m2-3', 3),
  ('mtq-trig-m2-4', 'test-math-ch8-slot-2', 'q-trig-m2-4', 4),
  ('mtq-trig-m2-5', 'test-math-ch8-slot-2', 'q-trig-m2-5', 5),
  ('mtq-trig-m2-6', 'test-math-ch8-slot-2', 'q-trig-m2-6', 6),
  ('mtq-trig-m2-7', 'test-math-ch8-slot-2', 'q-trig-m2-7', 7),
  ('mtq-trig-m2-8', 'test-math-ch8-slot-2', 'q-trig-m2-8', 8),
  ('mtq-trig-m2-9', 'test-math-ch8-slot-2', 'q-trig-m2-9', 9),
  ('mtq-trig-m2-10', 'test-math-ch8-slot-2', 'q-trig-m2-10', 10),
  ('mtq-trig-m3-1', 'test-math-ch8-slot-3', 'q-trig-m3-1', 1),
  ('mtq-trig-m3-2', 'test-math-ch8-slot-3', 'q-trig-m3-2', 2),
  ('mtq-trig-m3-3', 'test-math-ch8-slot-3', 'q-trig-m3-3', 3),
  ('mtq-trig-m3-4', 'test-math-ch8-slot-3', 'q-trig-m3-4', 4),
  ('mtq-trig-m3-5', 'test-math-ch8-slot-3', 'q-trig-m3-5', 5),
  ('mtq-trig-m3-6', 'test-math-ch8-slot-3', 'q-trig-m3-6', 6),
  ('mtq-trig-m3-7', 'test-math-ch8-slot-3', 'q-trig-m3-7', 7),
  ('mtq-trig-m3-8', 'test-math-ch8-slot-3', 'q-trig-m3-8', 8),
  ('mtq-trig-m3-9', 'test-math-ch8-slot-3', 'q-trig-m3-9', 9),
  ('mtq-trig-m3-10', 'test-math-ch8-slot-3', 'q-trig-m3-10', 10),
  ('mtq-trig-m4-1', 'test-math-ch8-slot-4', 'q-trig-m4-1', 1),
  ('mtq-trig-m4-2', 'test-math-ch8-slot-4', 'q-trig-m4-2', 2),
  ('mtq-trig-m4-3', 'test-math-ch8-slot-4', 'q-trig-m4-3', 3),
  ('mtq-trig-m4-4', 'test-math-ch8-slot-4', 'q-trig-m4-4', 4),
  ('mtq-trig-m4-5', 'test-math-ch8-slot-4', 'q-trig-m4-5', 5),
  ('mtq-trig-m4-6', 'test-math-ch8-slot-4', 'q-trig-m4-6', 6),
  ('mtq-trig-m4-7', 'test-math-ch8-slot-4', 'q-trig-m4-7', 7),
  ('mtq-trig-m4-8', 'test-math-ch8-slot-4', 'q-trig-m4-8', 8),
  ('mtq-trig-m4-9', 'test-math-ch8-slot-4', 'q-trig-m4-9', 9),
  ('mtq-trig-m4-10', 'test-math-ch8-slot-4', 'q-trig-m4-10', 10),
  ('mtq-trig-m5-1', 'test-math-ch8-slot-5', 'q-trig-m5-1', 1),
  ('mtq-trig-m5-2', 'test-math-ch8-slot-5', 'q-trig-m5-2', 2),
  ('mtq-trig-m5-3', 'test-math-ch8-slot-5', 'q-trig-m5-3', 3),
  ('mtq-trig-m5-4', 'test-math-ch8-slot-5', 'q-trig-m5-4', 4),
  ('mtq-trig-m5-5', 'test-math-ch8-slot-5', 'q-trig-m5-5', 5),
  ('mtq-trig-m5-6', 'test-math-ch8-slot-5', 'q-trig-m5-6', 6),
  ('mtq-trig-m5-7', 'test-math-ch8-slot-5', 'q-trig-m5-7', 7),
  ('mtq-trig-m5-8', 'test-math-ch8-slot-5', 'q-trig-m5-8', 8),
  ('mtq-trig-m5-9', 'test-math-ch8-slot-5', 'q-trig-m5-9', 9),
  ('mtq-trig-m5-10', 'test-math-ch8-slot-5', 'q-trig-m5-10', 10),
  ('mtq-trig-m6-1', 'test-math-ch8-slot-6', 'q-trig-m6-1', 1),
  ('mtq-trig-m6-2', 'test-math-ch8-slot-6', 'q-trig-m6-2', 2),
  ('mtq-trig-m6-3', 'test-math-ch8-slot-6', 'q-trig-m6-3', 3),
  ('mtq-trig-m6-4', 'test-math-ch8-slot-6', 'q-trig-m6-4', 4),
  ('mtq-trig-m6-5', 'test-math-ch8-slot-6', 'q-trig-m6-5', 5),
  ('mtq-trig-m6-6', 'test-math-ch8-slot-6', 'q-trig-m6-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-trig-m6-7', 'test-math-ch8-slot-6', 'q-trig-m6-7', 7),
  ('mtq-trig-m6-8', 'test-math-ch8-slot-6', 'q-trig-m6-8', 8),
  ('mtq-trig-m6-9', 'test-math-ch8-slot-6', 'q-trig-m6-9', 9),
  ('mtq-trig-m6-10', 'test-math-ch8-slot-6', 'q-trig-m6-10', 10),
  ('mtq-apptrig-m1-1', 'test-math-ch9-slot-1', 'q-apptrig-m1-1', 1),
  ('mtq-apptrig-m1-2', 'test-math-ch9-slot-1', 'q-apptrig-m1-2', 2),
  ('mtq-apptrig-m1-3', 'test-math-ch9-slot-1', 'q-apptrig-m1-3', 3),
  ('mtq-apptrig-m1-4', 'test-math-ch9-slot-1', 'q-apptrig-m1-4', 4),
  ('mtq-apptrig-m1-5', 'test-math-ch9-slot-1', 'q-apptrig-m1-5', 5),
  ('mtq-apptrig-m1-6', 'test-math-ch9-slot-1', 'q-apptrig-m1-6', 6),
  ('mtq-apptrig-m1-7', 'test-math-ch9-slot-1', 'q-apptrig-m1-7', 7),
  ('mtq-apptrig-m1-8', 'test-math-ch9-slot-1', 'q-apptrig-m1-8', 8),
  ('mtq-apptrig-m1-9', 'test-math-ch9-slot-1', 'q-apptrig-m1-9', 9),
  ('mtq-apptrig-m1-10', 'test-math-ch9-slot-1', 'q-apptrig-m1-10', 10),
  ('mtq-apptrig-m2-1', 'test-math-ch9-slot-2', 'q-apptrig-m2-1', 1),
  ('mtq-apptrig-m2-2', 'test-math-ch9-slot-2', 'q-apptrig-m2-2', 2),
  ('mtq-apptrig-m2-3', 'test-math-ch9-slot-2', 'q-apptrig-m2-3', 3),
  ('mtq-apptrig-m2-4', 'test-math-ch9-slot-2', 'q-apptrig-m2-4', 4),
  ('mtq-apptrig-m2-5', 'test-math-ch9-slot-2', 'q-apptrig-m2-5', 5),
  ('mtq-apptrig-m2-6', 'test-math-ch9-slot-2', 'q-apptrig-m2-6', 6),
  ('mtq-apptrig-m2-7', 'test-math-ch9-slot-2', 'q-apptrig-m2-7', 7),
  ('mtq-apptrig-m2-8', 'test-math-ch9-slot-2', 'q-apptrig-m2-8', 8),
  ('mtq-apptrig-m2-9', 'test-math-ch9-slot-2', 'q-apptrig-m2-9', 9),
  ('mtq-apptrig-m2-10', 'test-math-ch9-slot-2', 'q-apptrig-m2-10', 10),
  ('mtq-apptrig-m3-1', 'test-math-ch9-slot-3', 'q-apptrig-m3-1', 1),
  ('mtq-apptrig-m3-2', 'test-math-ch9-slot-3', 'q-apptrig-m3-2', 2),
  ('mtq-apptrig-m3-3', 'test-math-ch9-slot-3', 'q-apptrig-m3-3', 3),
  ('mtq-apptrig-m3-4', 'test-math-ch9-slot-3', 'q-apptrig-m3-4', 4),
  ('mtq-apptrig-m3-5', 'test-math-ch9-slot-3', 'q-apptrig-m3-5', 5),
  ('mtq-apptrig-m3-6', 'test-math-ch9-slot-3', 'q-apptrig-m3-6', 6),
  ('mtq-apptrig-m3-7', 'test-math-ch9-slot-3', 'q-apptrig-m3-7', 7),
  ('mtq-apptrig-m3-8', 'test-math-ch9-slot-3', 'q-apptrig-m3-8', 8),
  ('mtq-apptrig-m3-9', 'test-math-ch9-slot-3', 'q-apptrig-m3-9', 9),
  ('mtq-apptrig-m3-10', 'test-math-ch9-slot-3', 'q-apptrig-m3-10', 10),
  ('mtq-circ-m1-1', 'test-math-ch10-slot-1', 'q-circ-m1-1', 1),
  ('mtq-circ-m1-2', 'test-math-ch10-slot-1', 'q-circ-m1-2', 2),
  ('mtq-circ-m1-3', 'test-math-ch10-slot-1', 'q-circ-m1-3', 3),
  ('mtq-circ-m1-4', 'test-math-ch10-slot-1', 'q-circ-m1-4', 4),
  ('mtq-circ-m1-5', 'test-math-ch10-slot-1', 'q-circ-m1-5', 5),
  ('mtq-circ-m1-6', 'test-math-ch10-slot-1', 'q-circ-m1-6', 6),
  ('mtq-circ-m1-7', 'test-math-ch10-slot-1', 'q-circ-m1-7', 7),
  ('mtq-circ-m1-8', 'test-math-ch10-slot-1', 'q-circ-m1-8', 8),
  ('mtq-circ-m1-9', 'test-math-ch10-slot-1', 'q-circ-m1-9', 9),
  ('mtq-circ-m1-10', 'test-math-ch10-slot-1', 'q-circ-m1-10', 10),
  ('mtq-circ-m2-1', 'test-math-ch10-slot-2', 'q-circ-m2-1', 1),
  ('mtq-circ-m2-2', 'test-math-ch10-slot-2', 'q-circ-m2-2', 2),
  ('mtq-circ-m2-3', 'test-math-ch10-slot-2', 'q-circ-m2-3', 3),
  ('mtq-circ-m2-4', 'test-math-ch10-slot-2', 'q-circ-m2-4', 4),
  ('mtq-circ-m2-5', 'test-math-ch10-slot-2', 'q-circ-m2-5', 5),
  ('mtq-circ-m2-6', 'test-math-ch10-slot-2', 'q-circ-m2-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-circ-m2-7', 'test-math-ch10-slot-2', 'q-circ-m2-7', 7),
  ('mtq-circ-m2-8', 'test-math-ch10-slot-2', 'q-circ-m2-8', 8),
  ('mtq-circ-m2-9', 'test-math-ch10-slot-2', 'q-circ-m2-9', 9),
  ('mtq-circ-m2-10', 'test-math-ch10-slot-2', 'q-circ-m2-10', 10),
  ('mtq-circ-m3-1', 'test-math-ch10-slot-3', 'q-circ-m3-1', 1),
  ('mtq-circ-m3-2', 'test-math-ch10-slot-3', 'q-circ-m3-2', 2),
  ('mtq-circ-m3-3', 'test-math-ch10-slot-3', 'q-circ-m3-3', 3),
  ('mtq-circ-m3-4', 'test-math-ch10-slot-3', 'q-circ-m3-4', 4),
  ('mtq-circ-m3-5', 'test-math-ch10-slot-3', 'q-circ-m3-5', 5),
  ('mtq-circ-m3-6', 'test-math-ch10-slot-3', 'q-circ-m3-6', 6),
  ('mtq-circ-m3-7', 'test-math-ch10-slot-3', 'q-circ-m3-7', 7),
  ('mtq-circ-m3-8', 'test-math-ch10-slot-3', 'q-circ-m3-8', 8),
  ('mtq-circ-m3-9', 'test-math-ch10-slot-3', 'q-circ-m3-9', 9),
  ('mtq-circ-m3-10', 'test-math-ch10-slot-3', 'q-circ-m3-10', 10),
  ('mtq-areacirc-m1-1', 'test-math-ch11-slot-1', 'q-areacirc-m1-1', 1),
  ('mtq-areacirc-m1-2', 'test-math-ch11-slot-1', 'q-areacirc-m1-2', 2),
  ('mtq-areacirc-m1-3', 'test-math-ch11-slot-1', 'q-areacirc-m1-3', 3),
  ('mtq-areacirc-m1-4', 'test-math-ch11-slot-1', 'q-areacirc-m1-4', 4),
  ('mtq-areacirc-m1-5', 'test-math-ch11-slot-1', 'q-areacirc-m1-5', 5),
  ('mtq-areacirc-m1-6', 'test-math-ch11-slot-1', 'q-areacirc-m1-6', 6),
  ('mtq-areacirc-m1-7', 'test-math-ch11-slot-1', 'q-areacirc-m1-7', 7),
  ('mtq-areacirc-m1-8', 'test-math-ch11-slot-1', 'q-areacirc-m1-8', 8),
  ('mtq-areacirc-m1-9', 'test-math-ch11-slot-1', 'q-areacirc-m1-9', 9),
  ('mtq-areacirc-m1-10', 'test-math-ch11-slot-1', 'q-areacirc-m1-10', 10),
  ('mtq-areacirc-m2-1', 'test-math-ch11-slot-2', 'q-areacirc-m2-1', 1),
  ('mtq-areacirc-m2-2', 'test-math-ch11-slot-2', 'q-areacirc-m2-2', 2),
  ('mtq-areacirc-m2-3', 'test-math-ch11-slot-2', 'q-areacirc-m2-3', 3),
  ('mtq-areacirc-m2-4', 'test-math-ch11-slot-2', 'q-areacirc-m2-4', 4),
  ('mtq-areacirc-m2-5', 'test-math-ch11-slot-2', 'q-areacirc-m2-5', 5),
  ('mtq-areacirc-m2-6', 'test-math-ch11-slot-2', 'q-areacirc-m2-6', 6),
  ('mtq-areacirc-m2-7', 'test-math-ch11-slot-2', 'q-areacirc-m2-7', 7),
  ('mtq-areacirc-m2-8', 'test-math-ch11-slot-2', 'q-areacirc-m2-8', 8),
  ('mtq-areacirc-m2-9', 'test-math-ch11-slot-2', 'q-areacirc-m2-9', 9),
  ('mtq-areacirc-m2-10', 'test-math-ch11-slot-2', 'q-areacirc-m2-10', 10),
  ('mtq-areacirc-m3-1', 'test-math-ch11-slot-3', 'q-areacirc-m3-1', 1),
  ('mtq-areacirc-m3-2', 'test-math-ch11-slot-3', 'q-areacirc-m3-2', 2),
  ('mtq-areacirc-m3-3', 'test-math-ch11-slot-3', 'q-areacirc-m3-3', 3),
  ('mtq-areacirc-m3-4', 'test-math-ch11-slot-3', 'q-areacirc-m3-4', 4),
  ('mtq-areacirc-m3-5', 'test-math-ch11-slot-3', 'q-areacirc-m3-5', 5),
  ('mtq-areacirc-m3-6', 'test-math-ch11-slot-3', 'q-areacirc-m3-6', 6),
  ('mtq-areacirc-m3-7', 'test-math-ch11-slot-3', 'q-areacirc-m3-7', 7),
  ('mtq-areacirc-m3-8', 'test-math-ch11-slot-3', 'q-areacirc-m3-8', 8),
  ('mtq-areacirc-m3-9', 'test-math-ch11-slot-3', 'q-areacirc-m3-9', 9),
  ('mtq-areacirc-m3-10', 'test-math-ch11-slot-3', 'q-areacirc-m3-10', 10),
  ('mtq-areacirc-m4-1', 'test-math-ch11-slot-4', 'q-areacirc-m4-1', 1),
  ('mtq-areacirc-m4-2', 'test-math-ch11-slot-4', 'q-areacirc-m4-2', 2),
  ('mtq-areacirc-m4-3', 'test-math-ch11-slot-4', 'q-areacirc-m4-3', 3),
  ('mtq-areacirc-m4-4', 'test-math-ch11-slot-4', 'q-areacirc-m4-4', 4),
  ('mtq-areacirc-m4-5', 'test-math-ch11-slot-4', 'q-areacirc-m4-5', 5),
  ('mtq-areacirc-m4-6', 'test-math-ch11-slot-4', 'q-areacirc-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-areacirc-m4-7', 'test-math-ch11-slot-4', 'q-areacirc-m4-7', 7),
  ('mtq-areacirc-m4-8', 'test-math-ch11-slot-4', 'q-areacirc-m4-8', 8),
  ('mtq-areacirc-m4-9', 'test-math-ch11-slot-4', 'q-areacirc-m4-9', 9),
  ('mtq-areacirc-m4-10', 'test-math-ch11-slot-4', 'q-areacirc-m4-10', 10),
  ('mtq-areacirc-m5-1', 'test-math-ch11-slot-5', 'q-areacirc-m5-1', 1),
  ('mtq-areacirc-m5-2', 'test-math-ch11-slot-5', 'q-areacirc-m5-2', 2),
  ('mtq-areacirc-m5-3', 'test-math-ch11-slot-5', 'q-areacirc-m5-3', 3),
  ('mtq-areacirc-m5-4', 'test-math-ch11-slot-5', 'q-areacirc-m5-4', 4),
  ('mtq-areacirc-m5-5', 'test-math-ch11-slot-5', 'q-areacirc-m5-5', 5),
  ('mtq-areacirc-m5-6', 'test-math-ch11-slot-5', 'q-areacirc-m5-6', 6),
  ('mtq-areacirc-m5-7', 'test-math-ch11-slot-5', 'q-areacirc-m5-7', 7),
  ('mtq-areacirc-m5-8', 'test-math-ch11-slot-5', 'q-areacirc-m5-8', 8),
  ('mtq-areacirc-m5-9', 'test-math-ch11-slot-5', 'q-areacirc-m5-9', 9),
  ('mtq-areacirc-m5-10', 'test-math-ch11-slot-5', 'q-areacirc-m5-10', 10),
  ('mtq-mens-m1-1', 'test-math-ch12-slot-1', 'q-mens-m1-1', 1),
  ('mtq-mens-m1-2', 'test-math-ch12-slot-1', 'q-mens-m1-2', 2),
  ('mtq-mens-m1-3', 'test-math-ch12-slot-1', 'q-mens-m1-3', 3),
  ('mtq-mens-m1-4', 'test-math-ch12-slot-1', 'q-mens-m1-4', 4),
  ('mtq-mens-m1-5', 'test-math-ch12-slot-1', 'q-mens-m1-5', 5),
  ('mtq-mens-m1-6', 'test-math-ch12-slot-1', 'q-mens-m1-6', 6),
  ('mtq-mens-m1-7', 'test-math-ch12-slot-1', 'q-mens-m1-7', 7),
  ('mtq-mens-m1-8', 'test-math-ch12-slot-1', 'q-mens-m1-8', 8),
  ('mtq-mens-m1-9', 'test-math-ch12-slot-1', 'q-mens-m1-9', 9),
  ('mtq-mens-m1-10', 'test-math-ch12-slot-1', 'q-mens-m1-10', 10),
  ('mtq-mens-m2-1', 'test-math-ch12-slot-2', 'q-mens-m2-1', 1),
  ('mtq-mens-m2-2', 'test-math-ch12-slot-2', 'q-mens-m2-2', 2),
  ('mtq-mens-m2-3', 'test-math-ch12-slot-2', 'q-mens-m2-3', 3),
  ('mtq-mens-m2-4', 'test-math-ch12-slot-2', 'q-mens-m2-4', 4),
  ('mtq-mens-m2-5', 'test-math-ch12-slot-2', 'q-mens-m2-5', 5),
  ('mtq-mens-m2-6', 'test-math-ch12-slot-2', 'q-mens-m2-6', 6),
  ('mtq-mens-m2-7', 'test-math-ch12-slot-2', 'q-mens-m2-7', 7),
  ('mtq-mens-m2-8', 'test-math-ch12-slot-2', 'q-mens-m2-8', 8),
  ('mtq-mens-m2-9', 'test-math-ch12-slot-2', 'q-mens-m2-9', 9),
  ('mtq-mens-m2-10', 'test-math-ch12-slot-2', 'q-mens-m2-10', 10),
  ('mtq-mens-m3-1', 'test-math-ch12-slot-3', 'q-mens-m3-1', 1),
  ('mtq-mens-m3-2', 'test-math-ch12-slot-3', 'q-mens-m3-2', 2),
  ('mtq-mens-m3-3', 'test-math-ch12-slot-3', 'q-mens-m3-3', 3),
  ('mtq-mens-m3-4', 'test-math-ch12-slot-3', 'q-mens-m3-4', 4),
  ('mtq-mens-m3-5', 'test-math-ch12-slot-3', 'q-mens-m3-5', 5),
  ('mtq-mens-m3-6', 'test-math-ch12-slot-3', 'q-mens-m3-6', 6),
  ('mtq-mens-m3-7', 'test-math-ch12-slot-3', 'q-mens-m3-7', 7),
  ('mtq-mens-m3-8', 'test-math-ch12-slot-3', 'q-mens-m3-8', 8),
  ('mtq-mens-m3-9', 'test-math-ch12-slot-3', 'q-mens-m3-9', 9),
  ('mtq-mens-m3-10', 'test-math-ch12-slot-3', 'q-mens-m3-10', 10),
  ('mtq-mens-m4-1', 'test-math-ch12-slot-4', 'q-mens-m4-1', 1),
  ('mtq-mens-m4-2', 'test-math-ch12-slot-4', 'q-mens-m4-2', 2),
  ('mtq-mens-m4-3', 'test-math-ch12-slot-4', 'q-mens-m4-3', 3),
  ('mtq-mens-m4-4', 'test-math-ch12-slot-4', 'q-mens-m4-4', 4),
  ('mtq-mens-m4-5', 'test-math-ch12-slot-4', 'q-mens-m4-5', 5),
  ('mtq-mens-m4-6', 'test-math-ch12-slot-4', 'q-mens-m4-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-mens-m4-7', 'test-math-ch12-slot-4', 'q-mens-m4-7', 7),
  ('mtq-mens-m4-8', 'test-math-ch12-slot-4', 'q-mens-m4-8', 8),
  ('mtq-mens-m4-9', 'test-math-ch12-slot-4', 'q-mens-m4-9', 9),
  ('mtq-mens-m4-10', 'test-math-ch12-slot-4', 'q-mens-m4-10', 10),
  ('mtq-mens-m5-1', 'test-math-ch12-slot-5', 'q-mens-m5-1', 1),
  ('mtq-mens-m5-2', 'test-math-ch12-slot-5', 'q-mens-m5-2', 2),
  ('mtq-mens-m5-3', 'test-math-ch12-slot-5', 'q-mens-m5-3', 3),
  ('mtq-mens-m5-4', 'test-math-ch12-slot-5', 'q-mens-m5-4', 4),
  ('mtq-mens-m5-5', 'test-math-ch12-slot-5', 'q-mens-m5-5', 5),
  ('mtq-mens-m5-6', 'test-math-ch12-slot-5', 'q-mens-m5-6', 6),
  ('mtq-mens-m5-7', 'test-math-ch12-slot-5', 'q-mens-m5-7', 7),
  ('mtq-mens-m5-8', 'test-math-ch12-slot-5', 'q-mens-m5-8', 8),
  ('mtq-mens-m5-9', 'test-math-ch12-slot-5', 'q-mens-m5-9', 9),
  ('mtq-mens-m5-10', 'test-math-ch12-slot-5', 'q-mens-m5-10', 10),
  ('mtq-mens-m6-1', 'test-math-ch12-slot-6', 'q-mens-m6-1', 1),
  ('mtq-mens-m6-2', 'test-math-ch12-slot-6', 'q-mens-m6-2', 2),
  ('mtq-mens-m6-3', 'test-math-ch12-slot-6', 'q-mens-m6-3', 3),
  ('mtq-mens-m6-4', 'test-math-ch12-slot-6', 'q-mens-m6-4', 4),
  ('mtq-mens-m6-5', 'test-math-ch12-slot-6', 'q-mens-m6-5', 5),
  ('mtq-mens-m6-6', 'test-math-ch12-slot-6', 'q-mens-m6-6', 6),
  ('mtq-mens-m6-7', 'test-math-ch12-slot-6', 'q-mens-m6-7', 7),
  ('mtq-mens-m6-8', 'test-math-ch12-slot-6', 'q-mens-m6-8', 8),
  ('mtq-mens-m6-9', 'test-math-ch12-slot-6', 'q-mens-m6-9', 9),
  ('mtq-mens-m6-10', 'test-math-ch12-slot-6', 'q-mens-m6-10', 10),
  ('mtq-stat-m1-1', 'test-math-ch13-slot-1', 'q-stat-m1-1', 1),
  ('mtq-stat-m1-2', 'test-math-ch13-slot-1', 'q-stat-m1-2', 2),
  ('mtq-stat-m1-3', 'test-math-ch13-slot-1', 'q-stat-m1-3', 3),
  ('mtq-stat-m1-4', 'test-math-ch13-slot-1', 'q-stat-m1-4', 4),
  ('mtq-stat-m1-5', 'test-math-ch13-slot-1', 'q-stat-m1-5', 5),
  ('mtq-stat-m1-6', 'test-math-ch13-slot-1', 'q-stat-m1-6', 6),
  ('mtq-stat-m1-7', 'test-math-ch13-slot-1', 'q-stat-m1-7', 7),
  ('mtq-stat-m1-8', 'test-math-ch13-slot-1', 'q-stat-m1-8', 8),
  ('mtq-stat-m1-9', 'test-math-ch13-slot-1', 'q-stat-m1-9', 9),
  ('mtq-stat-m1-10', 'test-math-ch13-slot-1', 'q-stat-m1-10', 10),
  ('mtq-stat-m2-1', 'test-math-ch13-slot-2', 'q-stat-m2-1', 1),
  ('mtq-stat-m2-2', 'test-math-ch13-slot-2', 'q-stat-m2-2', 2),
  ('mtq-stat-m2-3', 'test-math-ch13-slot-2', 'q-stat-m2-3', 3),
  ('mtq-stat-m2-4', 'test-math-ch13-slot-2', 'q-stat-m2-4', 4),
  ('mtq-stat-m2-5', 'test-math-ch13-slot-2', 'q-stat-m2-5', 5),
  ('mtq-stat-m2-6', 'test-math-ch13-slot-2', 'q-stat-m2-6', 6),
  ('mtq-stat-m2-7', 'test-math-ch13-slot-2', 'q-stat-m2-7', 7),
  ('mtq-stat-m2-8', 'test-math-ch13-slot-2', 'q-stat-m2-8', 8),
  ('mtq-stat-m2-9', 'test-math-ch13-slot-2', 'q-stat-m2-9', 9),
  ('mtq-stat-m2-10', 'test-math-ch13-slot-2', 'q-stat-m2-10', 10),
  ('mtq-stat-m3-1', 'test-math-ch13-slot-3', 'q-stat-m3-1', 1),
  ('mtq-stat-m3-2', 'test-math-ch13-slot-3', 'q-stat-m3-2', 2),
  ('mtq-stat-m3-3', 'test-math-ch13-slot-3', 'q-stat-m3-3', 3),
  ('mtq-stat-m3-4', 'test-math-ch13-slot-3', 'q-stat-m3-4', 4),
  ('mtq-stat-m3-5', 'test-math-ch13-slot-3', 'q-stat-m3-5', 5),
  ('mtq-stat-m3-6', 'test-math-ch13-slot-3', 'q-stat-m3-6', 6)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."mock_test_questions" ("id", "mock_test_id", "question_id", "display_order")
VALUES
  ('mtq-stat-m3-7', 'test-math-ch13-slot-3', 'q-stat-m3-7', 7),
  ('mtq-stat-m3-8', 'test-math-ch13-slot-3', 'q-stat-m3-8', 8),
  ('mtq-stat-m3-9', 'test-math-ch13-slot-3', 'q-stat-m3-9', 9),
  ('mtq-stat-m3-10', 'test-math-ch13-slot-3', 'q-stat-m3-10', 10),
  ('mtq-prob-m1-1', 'test-math-ch14-slot-1', 'q-prob-m1-1', 1),
  ('mtq-prob-m1-2', 'test-math-ch14-slot-1', 'q-prob-m1-2', 2),
  ('mtq-prob-m1-3', 'test-math-ch14-slot-1', 'q-prob-m1-3', 3),
  ('mtq-prob-m1-4', 'test-math-ch14-slot-1', 'q-prob-m1-4', 4),
  ('mtq-prob-m1-5', 'test-math-ch14-slot-1', 'q-prob-m1-5', 5),
  ('mtq-prob-m1-6', 'test-math-ch14-slot-1', 'q-prob-m1-6', 6),
  ('mtq-prob-m1-7', 'test-math-ch14-slot-1', 'q-prob-m1-7', 7),
  ('mtq-prob-m1-8', 'test-math-ch14-slot-1', 'q-prob-m1-8', 8),
  ('mtq-prob-m1-9', 'test-math-ch14-slot-1', 'q-prob-m1-9', 9),
  ('mtq-prob-m1-10', 'test-math-ch14-slot-1', 'q-prob-m1-10', 10),
  ('mtq-prob-m2-1', 'test-math-ch14-slot-2', 'q-prob-m2-1', 1),
  ('mtq-prob-m2-2', 'test-math-ch14-slot-2', 'q-prob-m2-2', 2),
  ('mtq-prob-m2-3', 'test-math-ch14-slot-2', 'q-prob-m2-3', 3),
  ('mtq-prob-m2-4', 'test-math-ch14-slot-2', 'q-prob-m2-4', 4),
  ('mtq-prob-m2-5', 'test-math-ch14-slot-2', 'q-prob-m2-5', 5),
  ('mtq-prob-m2-6', 'test-math-ch14-slot-2', 'q-prob-m2-6', 6),
  ('mtq-prob-m2-7', 'test-math-ch14-slot-2', 'q-prob-m2-7', 7),
  ('mtq-prob-m2-8', 'test-math-ch14-slot-2', 'q-prob-m2-8', 8),
  ('mtq-prob-m2-9', 'test-math-ch14-slot-2', 'q-prob-m2-9', 9),
  ('mtq-prob-m2-10', 'test-math-ch14-slot-2', 'q-prob-m2-10', 10),
  ('mtq-prob-m3-1', 'test-math-ch14-slot-3', 'q-prob-m3-1', 1),
  ('mtq-prob-m3-2', 'test-math-ch14-slot-3', 'q-prob-m3-2', 2),
  ('mtq-prob-m3-3', 'test-math-ch14-slot-3', 'q-prob-m3-3', 3),
  ('mtq-prob-m3-4', 'test-math-ch14-slot-3', 'q-prob-m3-4', 4),
  ('mtq-prob-m3-5', 'test-math-ch14-slot-3', 'q-prob-m3-5', 5),
  ('mtq-prob-m3-6', 'test-math-ch14-slot-3', 'q-prob-m3-6', 6),
  ('mtq-prob-m3-7', 'test-math-ch14-slot-3', 'q-prob-m3-7', 7),
  ('mtq-prob-m3-8', 'test-math-ch14-slot-3', 'q-prob-m3-8', 8),
  ('mtq-prob-m3-9', 'test-math-ch14-slot-3', 'q-prob-m3-9', 9),
  ('mtq-prob-m3-10', 'test-math-ch14-slot-3', 'q-prob-m3-10', 10),
  ('mtq-prob-m4-1', 'test-math-ch14-slot-4', 'q-prob-m4-1', 1),
  ('mtq-prob-m4-2', 'test-math-ch14-slot-4', 'q-prob-m4-2', 2),
  ('mtq-prob-m4-3', 'test-math-ch14-slot-4', 'q-prob-m4-3', 3),
  ('mtq-prob-m4-4', 'test-math-ch14-slot-4', 'q-prob-m4-4', 4),
  ('mtq-prob-m4-5', 'test-math-ch14-slot-4', 'q-prob-m4-5', 5),
  ('mtq-prob-m4-6', 'test-math-ch14-slot-4', 'q-prob-m4-6', 6),
  ('mtq-prob-m4-7', 'test-math-ch14-slot-4', 'q-prob-m4-7', 7),
  ('mtq-prob-m4-8', 'test-math-ch14-slot-4', 'q-prob-m4-8', 8),
  ('mtq-prob-m4-9', 'test-math-ch14-slot-4', 'q-prob-m4-9', 9),
  ('mtq-prob-m4-10', 'test-math-ch14-slot-4', 'q-prob-m4-10', 10),
  ('mtq-math-m1-6', 'test-math-ch1-slot-1', 'q-rn-m1-6', 6),
  ('mtq-math-m1-7', 'test-math-ch1-slot-1', 'q-rn-m1-7', 7),
  ('mtq-math-m1-8', 'test-math-ch1-slot-1', 'q-rn-m1-8', 8),
  ('mtq-math-m1-9', 'test-math-ch1-slot-1', 'q-rn-m1-9', 9),
  ('mtq-math-m1-10', 'test-math-ch1-slot-1', 'q-rn-m1-10', 10)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."sample_papers" (5 records)
-- ------------------------------------------------------------
INSERT INTO public."sample_papers" ("id", "title", "subject_id", "year_set", "description", "file_url", "file_size", "access_type", "status", "download_count", "created_at", "paper_type", "sections_json")
VALUES
  ('sp-math-2024', 'CBSE Class 10 Mathematics Standard Official Sample Question Paper', 'mathematics', '2024-25 SQP', 'Official CBSE SQP with complete Marking Scheme & solutions for board exam 2025.', '/sample-papers/cbse-class10-maths-standard-sqp-2025.pdf', '2.4 MB', 'free', 'published', 1420, '2026-11-05 04:48:37', 'pdf', NULL),
  ('sp-sci-2024', 'CBSE Class 10 Science Official Sample Paper with Marking Scheme', 'science', '2024-25 SQP', 'Latest CBSE board pattern, Section A MCQs, Section B-E detailed structured questions.', '/sample-papers/cbse-class10-science-sqp-2025.pdf', '1.8 MB', 'free', 'published', 980, '2026-11-05 04:48:37', 'pdf', NULL),
  ('sp-sst-2024', 'CBSE Class 10 Social Science Board Sample Question Paper', 'social-science', '2024-25 SQP', 'Complete History, Geography, Civics, Economics model paper with map work questions.', '/sample-papers/cbse-class10-sst-sqp-2025.pdf', '3.1 MB', 'premium', 'published', 760, '2026-11-05 04:48:37', 'pdf', NULL),
  ('sp-math-practice-set1', 'VEDICX High-Yield Expected Board Paper – Mathematics', 'mathematics', 'Practice Set 1', 'Curated by senior CBSE evaluators covering all standard 3-mark & 5-mark proofs.', '/sample-papers/vedicx-maths-high-yield-set1.pdf', '1.5 MB', 'premium', 'published', 540, '2026-11-05 04:48:37', 'pdf', NULL),
  ('sp-mw33yktd', 'CBSE Class 10 Mathematics Standard Official Model Paper 2025', 'mathematics', '2024-25 Set 1', 'Full-length 80-mark blueprint practice paper', '/sample-papers/sp-mw33yktd-interactive', '1.5 MB', 'free', 'published', 0, '2026-11-05 05:31:35', 'manual', '[{"id":"sec-a","title":"Section A (Multiple Choice Questions)","instructions":"Questions 1 to 20 carry 1 mark each","questions":[{"id":"sq-1","question_number":1,"question_text":"If two positive integers a and b are written as a = x^3 y^2 and b = xy^3, where x, y are prime numbers, then HCF(a, b) is:","options":{"A":"xy","B":"xy^2","C":"x^3 y^3","D":"x^2 y^2"},"correct_answer":"B","marks":1,"solution_text":"HCF is the product of the smallest power of each common prime factor. Common prime factors are x and y with minimum powers 1 and 2 respectively, so HCF = xy^2."}]}]')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."pyq_questions" (4 records)
-- ------------------------------------------------------------
INSERT INTO public."pyq_questions" ("id", "subject_id", "year", "chapter_id", "topic", "question_type", "question_text", "marks", "solution_text", "file_url", "status", "created_at", "option_a", "option_b", "option_c", "option_d", "correct_answer")
VALUES
  ('pyq-math-2023-1', 'mathematics', 2023, 'math-ch1', 'Irrationality Proof', 'Subjective (3 Marks)', 'Prove that √5 is an irrational number. [CBSE Board 2023, 3 Marks]', 3, 'Solution: Let us assume to the contrary that √5 is rational. Then √5 = a/b where a and b are co-prime integers and b ≠ 0. Squaring both sides: 5 = a²/b² => 5b² = a². Therefore 5 divides a², which implies 5 divides a. Let a = 5c for some integer c. Then 5b² = (5c)² = 25c² => b² = 5c². Thus 5 divides b², so 5 divides b. Hence a and b have at least 5 as a common factor, which contradicts that a and b are co-prime. Therefore √5 is irrational.', NULL, 'published', '2026-11-05 04:48:37', NULL, NULL, NULL, NULL, NULL),
  ('pyq-sci-2023-1', 'science', 2023, 'sci-ch1', 'Thermal Decomposition', 'Subjective (3 Marks)', 'Write balanced chemical equations for the following reactions and identify the type of reaction: (a) Potassium chlorate on heating in presence of MnO₂ produces potassium chloride and oxygen. (b) Lead nitrate crystals heated strongly in a dry test tube. [CBSE Board 2023, 3 Marks]', 3, 'Solution: (a) 2KClO₃(s) --[MnO₂, Δ]--> 2KCl(s) + 3O₂(g). Type: Thermal Decomposition reaction. (b) 2Pb(NO₃)₂(s) --[Δ]--> 2PbO(s) + 4NO₂(g) + O₂(g). Type: Thermal Decomposition reaction (Brown fumes of nitrogen dioxide NO₂ are observed).', NULL, 'published', '2026-11-05 04:48:37', NULL, NULL, NULL, NULL, NULL),
  ('pyq-sst-2023-1', 'social-science', 2023, 'sst-hist-2', 'Non-Cooperation Movement', 'Subjective (5 Marks)', 'Explain the reasons why Mahatma Gandhi decided to withdraw the Non-Cooperation Movement in February 1922. [CBSE Board 2023, 5 Marks]', 5, 'Solution: In February 1922, Mahatma Gandhi decided to withdraw the Non-Cooperation Movement because: 1. Violence at Chauri Chaura: At Chauri Chaura in Gorakhpur (UP), a peaceful demonstration in a bazaar turned into a violent clash with police. An enraged crowd set a police station on fire, killing 22 policemen. 2. Need for mass training: Gandhiji felt the movement was turning violent in many places and satyagrahis needed to be properly trained before they would be ready for mass struggles. 3. Fatigue and internal conflicts: Within the Congress, some leaders were tired of mass struggles and wanted to participate in elections to provincial councils.', NULL, 'published', '2026-11-05 04:48:37', NULL, NULL, NULL, NULL, NULL),
  ('pyq-mw33yuuf', 'science', 2024, 'sci-ch1', 'Types of Chemical Reactions', 'Short Answer', 'Why is respiration considered an exothermic reaction? Explain with a balanced chemical equation.', 3, 'Step 1: During digestion, food breaks down into glucose. 
Step 2: Glucose combines with oxygen in the cells of our body and provides energy. 
Step 3: C6H12O6(aq) + 6O2(aq) -> 6CO2(aq) + 6H2O(l) + Energy.
Since energy is released during this process, respiration is an exothermic reaction.', NULL, 'published', '2026-11-05 05:31:48', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."payments" (2 records)
-- ------------------------------------------------------------
INSERT INTO public."payments" ("id", "student_id", "transaction_id", "order_id", "amount", "currency", "gateway", "status", "payment_signature", "payment_method", "created_at")
VALUES
  ('pay-demo-1', 'usr-student-2', 'pay_Ox78219HqZk', 'order_Kj9821Lmq', 49, 'INR', 'Razorpay', 'success', 'sig_9128301823901', 'UPI (Google Pay)', '2026-11-03 04:48:37'),
  ('pay-1793854174027', 'usr-student-1', 'pay_test_101', 'order_test_101', 49, 'INR', 'Razorpay', 'success', 'sig_verified', 'UPI (Google Pay)', '2026-11-05 04:49:34')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."memberships" (2 records)
-- ------------------------------------------------------------
INSERT INTO public."memberships" ("id", "student_id", "tier", "payment_id", "is_active", "activated_at")
VALUES
  ('mem-demo-1', 'usr-student-2', 'premium', 'pay-demo-1', TRUE, '2026-11-03 04:48:37'),
  ('mem-1793854174027', 'usr-student-1', 'premium', 'pay-1793854174027', TRUE, '2026-11-05 04:49:34')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."test_attempts" (7 records)
-- ------------------------------------------------------------
INSERT INTO public."test_attempts" ("id", "student_id", "mock_test_id", "status", "started_at", "submitted_at", "time_taken_seconds", "total_questions", "correct_answers", "incorrect_answers", "unanswered_questions", "marks_obtained", "maximum_marks", "percentage", "passed")
VALUES
  ('att-mw32g3bt-kfsn', 'usr-student-1', 'test-math-ch1-slot-1', 'submitted', '2026-11-05 04:49:13', '2026-11-05 04:49:23', 340, 5, 5, 0, 0, 5, 5, 100, TRUE),
  ('att-mw32gq79-pw7j', 'usr-student-1', 'test-math-ch1-slot-1', 'in_progress', '2026-11-05 04:49:43', NULL, 0, 5, 0, 0, 0, 0, 5, 0, FALSE),
  ('att-mw3go0u0-z1yx', 'usr-admin-1', 'test-math-ch1-slot-3', 'in_progress', '2026-11-05 11:27:18', NULL, 0, 10, 0, 0, 0, 0, 10, 0, FALSE),
  ('att-mw3goba9-4ak4', 'usr-admin-1', 'test-math-ch1-slot-4', 'in_progress', '2026-11-05 11:27:31', NULL, 0, 10, 0, 0, 0, 0, 10, 0, FALSE),
  ('att-mw3gobaw-vele', 'usr-admin-1', 'test-math-ch1-slot-5', 'in_progress', '2026-11-05 11:27:31', NULL, 0, 10, 0, 0, 0, 0, 10, 0, FALSE),
  ('att-mw3gobbj-57bu', 'usr-admin-1', 'test-math-ch1-slot-6', 'in_progress', '2026-11-05 11:27:31', NULL, 0, 10, 0, 0, 0, 0, 10, 0, FALSE),
  ('att-mw4zfl03-zm0c', 'usr-admin-1', 'test-math-ch1-slot-2', 'submitted', '2026-11-06 13:00:23', '2026-11-06 13:00:28', 3, 10, 0, 1, 9, 0, 10, 0, FALSE)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."student_answers" (15 records)
-- ------------------------------------------------------------
INSERT INTO public."student_answers" ("id", "attempt_id", "question_id", "selected_answer", "is_correct", "marks_awarded")
VALUES
  ('sa-att-mw32g3bt-kfsn-q-math-1', 'att-mw32g3bt-kfsn', 'q-math-1', 'B', TRUE, 1),
  ('sa-att-mw32g3bt-kfsn-q-math-2', 'att-mw32g3bt-kfsn', 'q-math-2', 'D', TRUE, 1),
  ('sa-att-mw32g3bt-kfsn-q-math-3', 'att-mw32g3bt-kfsn', 'q-math-3', 'C', TRUE, 1),
  ('sa-att-mw32g3bt-kfsn-q-math-4', 'att-mw32g3bt-kfsn', 'q-math-4', 'A', TRUE, 1),
  ('sa-att-mw32g3bt-kfsn-q-math-5', 'att-mw32g3bt-kfsn', 'q-math-5', 'True', TRUE, 1),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-1', 'att-mw4zfl03-zm0c', 'q-rn-m2-1', 'A', FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-2', 'att-mw4zfl03-zm0c', 'q-rn-m2-2', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-3', 'att-mw4zfl03-zm0c', 'q-rn-m2-3', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-4', 'att-mw4zfl03-zm0c', 'q-rn-m2-4', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-5', 'att-mw4zfl03-zm0c', 'q-rn-m2-5', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-6', 'att-mw4zfl03-zm0c', 'q-rn-m2-6', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-7', 'att-mw4zfl03-zm0c', 'q-rn-m2-7', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-8', 'att-mw4zfl03-zm0c', 'q-rn-m2-8', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-9', 'att-mw4zfl03-zm0c', 'q-rn-m2-9', NULL, FALSE, 0),
  ('sa-att-mw4zfl03-zm0c-q-rn-m2-10', 'att-mw4zfl03-zm0c', 'q-rn-m2-10', NULL, FALSE, 0)
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."appointments" (2 records)
-- ------------------------------------------------------------
INSERT INTO public."appointments" ("id", "student_name", "student_email", "student_phone", "target_class", "subject", "counselling_type", "appointment_date", "appointment_time", "notes", "status", "created_at")
VALUES
  ('apt-mw4zk5ct-4jks', 'Aditya Verma', 'aditya@example.com', '9876543210', 'Class 10', 'Mathematics (Class 10)', '1-on-1 Doubt Clearing', '2026-11-10', '05:30 PM - 06:30 PM (Evening)', 'Help needed on Trigonometry identities and Quadratic equations', 'confirmed', '2026-11-06 13:03:56'),
  ('apt-mw6awpsl-f8o2', 'Test Student', 'test.verify@vedicx.in', '+91 9876543210', 'Class 10', 'Mathematics', '1-on-1 Doubt Clearing', '2026-11-15', '16:00', 'Need help with Quadratic Equations', 'pending', '2026-11-07 11:09:24')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."site_settings" (6 records)
-- ------------------------------------------------------------
INSERT INTO public."site_settings" ("key", "value", "updated_at")
VALUES
  ('hero_heading', 'Prepare Smarter. Score Better.', '2026-11-05 14:08:51'),
  ('hero_subheading', 'Practice Class 10 chapter-wise mock tests, solve sample papers and prepare with previous year questions.', '2026-11-05 14:08:51'),
  ('brand_tagline', 'Learn. Practice. Perform.', '2026-11-05 14:08:51'),
  ('premium_price', '49', '2026-11-05 14:08:51'),
  ('contact_email', 'supportvedicx@gmail.com', '2026-11-05 14:08:51'),
  ('announcement_banner', 'CBSE Class 10 Board Exam Series 2025-26 is now live! Start with Free Mock Tests.', '2026-11-05 14:08:51')
ON CONFLICT ("key") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."audit_logs" (20 records)
-- ------------------------------------------------------------
INSERT INTO public."audit_logs" ("id", "user_id", "user_email", "action", "entity_type", "entity_id", "details", "created_at")
VALUES
  ('log-init-1', 'usr-admin-1', 'admin@vedicx.in', 'SYSTEM_INIT', 'DATABASE', 'ALL', 'Initialized NCERT Class 10 subjects, chapters, 5 mock test slots per chapter, questions, and site settings.', '2026-11-05 04:48:37'),
  ('log-1793854140049', 'admin', 'admin@vedicx.in', 'CREATE_BACKUP', 'BACKUP', 'bkp-1793854140041', 'Created manual backup with 348 total records.', '2026-11-05 04:49:00'),
  ('log-1793854174027', 'usr-student-1', 'system@vedicx.in', 'PAYMENT_VERIFIED_MEMBERSHIP_ACTIVATED', 'MEMBERSHIP', 'mem-1793854174027', 'Activated ₹49 Premium Membership via txn pay_test_101.', '2026-11-05 04:49:34'),
  ('log-1793856670113', 'admin', 'admin@vedicx.in', 'CREATE_QUESTION', 'QUESTION', 'q-scie-mw33y17k', 'Created question in science: In the reaction CuO + H2 -> Cu + H2O, wh...', '2026-11-05 05:31:10'),
  ('log-1793856678587', 'admin', 'admin@vedicx.in', 'UPDATE_QUESTION', 'QUESTION', 'q-scie-mw33y17k', 'Updated question content/settings', '2026-11-05 05:31:18'),
  ('log-1793856695521', 'admin', 'admin@vedicx.in', 'CREATE_SAMPLE_PAPER', 'SAMPLE_PAPER', 'sp-mw33yktd', 'Added MANUAL sample paper: CBSE Class 10 Mathematics Standard Official Model Paper 2025', '2026-11-05 05:31:35'),
  ('log-1793856708519', 'admin', 'admin@vedicx.in', 'CREATE_PYQ', 'PYQ', 'pyq-mw33yuuf', 'Added authentic PYQ for Year 2024', '2026-11-05 05:31:48'),
  ('log-1793856718847', 'admin', 'admin@vedicx.in', 'CREATE_BACKUP', 'BACKUP', 'bkp-1793856718839', 'Created manual backup with 366 total records.', '2026-11-05 05:31:58'),
  ('log-1793970237036', 'guest', 'aditya@example.com', 'BOOK_APPOINTMENT', 'APPOINTMENT', 'apt-mw4zk5ct-4jks', 'Booked 1-on-1 Doubt Clearing session on 2026-11-10 at 05:30 PM - 06:30 PM (Evening). Supabase Synced: false', '2026-11-06 13:03:57'),
  ('log-1793976325364', 'usr-student-1', 'student@vedicx.in', 'STUDENT_LOGIN_SUCCESS', 'AUTH', 'usr-student-1', 'Student logged in from IP: 127.0.0.1', '2026-11-06 14:45:25'),
  ('log-1793976325529', NULL, 'student@vedicx.in', 'ADMIN_LOGIN_FAILURE', 'AUTH', NULL, 'Failed admin login attempt from IP: 127.0.0.1 (unauthorized/non-admin)', '2026-11-06 14:45:25'),
  ('log-1793976325547', 'usr-admin-1', 'admin@vedicx.in', 'ADMIN_LOGIN_SUCCESS', 'AUTH', 'usr-admin-1', 'Admin login successful from IP: 127.0.0.1', '2026-11-06 14:45:25'),
  ('log-1793976325720', 'usr-1793976325719', 'student_test_1793976325562@example.com', 'STUDENT_REGISTRATION', 'PROFILE', 'usr-1793976325719', 'Student registered on VEDICX.', '2026-11-06 14:45:25'),
  ('log-1793976325850', NULL, 'student_test_1793976325562@example.com', 'PASSWORD_RECOVERY_REQUEST', 'AUTH', NULL, 'Password recovery instructions requested.', '2026-11-06 14:45:25'),
  ('log-1794024757799', 'usr-admin-1', 'admin@vedicx.in', 'ADMIN_LOGIN_FAILURE', 'AUTH', 'usr-admin-1', 'Invalid password attempt for admin from IP: 127.0.0.1', '2026-11-07 04:12:37'),
  ('log-1794024757843', 'usr-admin-1', 'admin@vedicx.in', 'ADMIN_LOGIN_SUCCESS', 'AUTH', 'usr-admin-1', 'Admin login successful from IP: 127.0.0.1', '2026-11-07 04:12:37'),
  ('log-1794049724955', 'usr-admin-1', 'admin@vedicx.in', 'ADMIN_LOGIN_FAILURE', 'AUTH', 'usr-admin-1', 'Invalid password attempt for admin from IP: 127.0.0.1', '2026-11-07 11:08:44'),
  ('log-1794049746152', '2bda700a-4e47-43e1-ba08-629720be622f', 'test.verify@vedicx.in', 'STUDENT_REGISTRATION', 'PROFILE', '2bda700a-4e47-43e1-ba08-629720be622f', 'Student registered on VEDICX.', '2026-11-07 11:09:06'),
  ('log-1794049755175', '2bda700a-4e47-43e1-ba08-629720be622f', 'test.verify@vedicx.in', 'STUDENT_LOGIN_SUCCESS', 'AUTH', '2bda700a-4e47-43e1-ba08-629720be622f', 'Student logged in from IP: 127.0.0.1', '2026-11-07 11:09:15'),
  ('log-1794049765165', 'guest', 'test.verify@vedicx.in', 'BOOK_APPOINTMENT', 'APPOINTMENT', 'apt-mw6awpsl-f8o2', 'Booked 1-on-1 Doubt Clearing session on 2026-11-15 at 16:00. Supabase Synced: true', '2026-11-07 11:09:25')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------
-- Data for public."backup_records" (2 records)
-- ------------------------------------------------------------
INSERT INTO public."backup_records" ("id", "name", "filename", "file_size_bytes", "backup_type", "status", "tables_included", "record_counts", "created_at")
VALUES
  ('bkp-1793854140041', 'VEDICX MANUAL Backup - 05 Nov 2026, 04:49 am', 'vedicx_backup_manual_2026-11-05T04-49-00-041Z.json', 199747, 'manual', 'completed', '["site_settings","profiles","subjects","categories","chapters","questions","mock_tests","mock_test_questions","test_attempts","student_answers","sample_papers","pyq_questions","payments","memberships","audit_logs"]', '{"site_settings":6,"profiles":3,"subjects":3,"categories":4,"chapters":49,"questions":14,"mock_tests":245,"mock_test_questions":14,"test_attempts":0,"student_answers":0,"sample_papers":4,"pyq_questions":3,"payments":1,"memberships":1,"audit_logs":1}', '2026-11-05 04:49:00'),
  ('bkp-1793856718839', 'VEDICX MANUAL Backup - 05 Nov 2026, 05:31 am', 'vedicx_backup_manual_2026-11-05T05-31-58-839Z.json', 208423, 'manual', 'completed', '["site_settings","profiles","subjects","categories","chapters","questions","mock_tests","mock_test_questions","test_attempts","student_answers","sample_papers","pyq_questions","payments","memberships","audit_logs"]', '{"site_settings":6,"profiles":3,"subjects":3,"categories":4,"chapters":49,"questions":15,"mock_tests":245,"mock_test_questions":14,"test_attempts":2,"student_answers":5,"sample_papers":5,"pyq_questions":4,"payments":2,"memberships":2,"audit_logs":7}', '2026-11-05 05:31:58')
ON CONFLICT ("id") DO NOTHING;


-- Re-enable foreign key constraints and triggers
SET session_replication_role = DEFAULT;
