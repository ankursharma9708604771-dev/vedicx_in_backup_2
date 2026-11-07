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
-- 5. BASELINE CURRICULUM & DEFAULT ACCOUNTS SEED DATA (SAFE & IDEMPOTENT)
-- ============================================================================

-- 5.1 Site Settings
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('hero_heading', 'Prepare Smarter. Score Better.', 'Main Hero Heading'),
  ('hero_subheading', 'Practice Class 10 chapter-wise mock tests, solve sample papers and prepare with previous year questions.', 'Hero Subtitle'),
  ('brand_tagline', 'Learn. Practice. Perform.', 'Brand Tagline'),
  ('premium_price', '49', 'Premium Membership INR Price'),
  ('contact_email', 'supportvedicx@gmail.com', 'Official Support Email'),
  ('announcement_banner', 'CBSE Class 10 Board Exam Series 2025-26 is now live! Start with Free Mock Tests.', 'Global Header Announcement')
ON CONFLICT (key) DO NOTHING;

-- 5.2 Default Administrator & Demo Accounts
INSERT INTO public.profiles (id, email, full_name, role, free_test_used, membership_tier, password_hash, is_active)
VALUES
  ('usr-admin-1', 'admin@vedicx.in', 'VEDICX Administrator', 'admin', 0, 'premium', 'pbkdf2:3c82d974aca361d5b7990fc5975a4138:cda1e4910038478f75d3533bcb3546659799a1b9d827ff55da7028391825dc8043277dac5ac1ad328cf089113d281e6e4a84e758032e474239beb6e1e1d44d6a', true),
  ('usr-student-1', 'student@vedicx.in', 'Aarav Sharma', 'student', 0, 'free', 'pbkdf2:6c50c71d22acac74f22419b244a81010:fe2b728bec38db1fcb855d8cec3f7a2ffeef27352c1beb13c9832e69cbb45b4628c0d67d4d999407d9251182c1228f2d365f7aee36a0f0f5693c375efbdc6df7', true),
  ('usr-student-2', 'priya.singh@gmail.com', 'Priya Singh', 'student', 1, 'premium', 'student123', true)
ON CONFLICT (id) DO NOTHING;

-- 5.3 Core Subjects
INSERT INTO public.subjects (id, name, code, description, icon, display_order, is_active)
VALUES
  ('science', 'Science', 'SCI-10', 'Physics, Chemistry, and Biology syllabus based on latest NCERT Class 10.', 'Atom', 1, true),
  ('mathematics', 'Mathematics', 'MATH-10', 'Number systems, Algebra, Geometry, Trigonometry, Statistics & Probability.', 'Calculator', 2, true),
  ('social-science', 'Social Science', 'SST-10', 'History, Geography, Political Science (Civics), and Economics.', 'Globe', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 5.4 Categories for Social Science
INSERT INTO public.categories (id, subject_id, name, display_order)
VALUES
  ('history', 'social-science', 'History (India & the Contemporary World - II)', 1),
  ('geography', 'social-science', 'Geography (Contemporary India - II)', 2),
  ('political-science', 'social-science', 'Political Science (Democratic Politics - II)', 3),
  ('economics', 'social-science', 'Economics (Understanding Economic Development)', 4)
ON CONFLICT (id) DO NOTHING;

-- 5.5 NCERT Class 10 Chapters (49 Chapters)
INSERT INTO public.chapters (id, subject_id, category_id, chapter_number, name, description, display_order, is_active)
VALUES
  -- Mathematics (14 Chapters)
  ('math-ch1', 'mathematics', NULL, 1, 'Real Numbers', 'Fundamental Theorem of Arithmetic, irrationality proofs.', 1, true),
  ('math-ch2', 'mathematics', NULL, 2, 'Polynomials', 'Geometrical meaning of zeroes, relationship between zeroes and coefficients.', 2, true),
  ('math-ch3', 'mathematics', NULL, 3, 'Pair of Linear Equations in Two Variables', 'Graphical & algebraic solutions, elimination, substitution.', 3, true),
  ('math-ch4', 'mathematics', NULL, 4, 'Quadratic Equations', 'Standard form, factorization, quadratic formula, nature of roots.', 4, true),
  ('math-ch5', 'mathematics', NULL, 5, 'Arithmetic Progressions', 'nth term, sum of first n terms of an AP, daily life applications.', 5, true),
  ('math-ch6', 'mathematics', NULL, 6, 'Triangles', 'Similarity criteria, Basic Proportionality Theorem (Thales theorem).', 6, true),
  ('math-ch7', 'mathematics', NULL, 7, 'Coordinate Geometry', 'Distance formula, Section formula.', 7, true),
  ('math-ch8', 'mathematics', NULL, 8, 'Introduction to Trigonometry', 'Trigonometric ratios, values for specific angles, identities.', 8, true),
  ('math-ch9', 'mathematics', NULL, 9, 'Some Applications of Trigonometry', 'Heights and distances, angles of elevation and depression.', 9, true),
  ('math-ch10', 'mathematics', NULL, 10, 'Circles', 'Tangent to a circle, number of tangents from a point to a circle.', 10, true),
  ('math-ch11', 'mathematics', NULL, 11, 'Areas Related to Circles', 'Perimeter and area of sector and segment of a circle.', 11, true),
  ('math-ch12', 'mathematics', NULL, 12, 'Surface Areas and Volumes', 'Surface areas and volumes of combinations of solids.', 12, true),
  ('math-ch13', 'mathematics', NULL, 13, 'Statistics', 'Mean, Median, and Mode of grouped data.', 13, true),
  ('math-ch14', 'mathematics', NULL, 14, 'Probability', 'Classical definition of probability, simple problems.', 14, true),

  -- Science (13 Chapters)
  ('sci-ch1', 'science', NULL, 1, 'Chemical Reactions and Equations', 'Balanced chemical equations, types of reactions, oxidation & reduction.', 15, true),
  ('sci-ch2', 'science', NULL, 2, 'Acids, Bases and Salts', 'Indicators, pH scale, chemical properties of salts.', 16, true),
  ('sci-ch3', 'science', NULL, 3, 'Metals and Non-Metals', 'Physical and chemical properties, reactivity series, ionic compounds.', 17, true),
  ('sci-ch4', 'science', NULL, 4, 'Carbon and its Compounds', 'Covalent bonding, homologous series, functional groups, hydrocarbons.', 18, true),
  ('sci-ch5', 'science', NULL, 5, 'Life Processes', 'Nutrition, respiration, transportation, and excretion in plants and animals.', 19, true),
  ('sci-ch6', 'science', NULL, 6, 'Control and Coordination', 'Nervous system, reflex arc, human brain, hormones in animals & plants.', 20, true),
  ('sci-ch7', 'science', NULL, 7, 'How do Organisms Reproduce?', 'Asexual & sexual reproduction, reproductive health, plant reproduction.', 21, true),
  ('sci-ch8', 'science', NULL, 8, 'Heredity', 'Mendel laws of inheritance, sex determination.', 22, true),
  ('sci-ch9', 'science', NULL, 9, 'Light – Reflection and Refraction', 'Spherical mirrors, lens formula, magnification, refraction laws.', 23, true),
  ('sci-ch10', 'science', NULL, 10, 'The Human Eye and the Colourful World', 'Human eye defect corrections, prism refraction, dispersion, scattering.', 24, true),
  ('sci-ch11', 'science', NULL, 11, 'Electricity', 'Ohm law, resistance, series/parallel combinations, Joule heating.', 25, true),
  ('sci-ch12', 'science', NULL, 12, 'Magnetic Effects of Electric Current', 'Magnetic field lines, solenoid, Fleming left-hand rule, domestic circuits.', 26, true),
  ('sci-ch13', 'science', NULL, 13, 'Our Environment', 'Ecosystem, food chains & webs, ozone depletion, waste management.', 27, true),

  -- Social Science: History
  ('sst-hist-1', 'social-science', 'history', 1, 'The Rise of Nationalism in Europe', 'French Revolution, Romanticism, unification of Germany & Italy.', 28, true),
  ('sst-hist-2', 'social-science', 'history', 2, 'Nationalism in India', 'Non-Cooperation, Civil Disobedience, Salt March, collective belonging.', 29, true),
  ('sst-hist-3', 'social-science', 'history', 3, 'The Making of a Global World', 'Silk routes, colonialism, trade, inter-war economy.', 30, true),
  ('sst-hist-4', 'social-science', 'history', 4, 'The Age of Industrialisation', 'Before Industrial Revolution, hand labour, factories in colonies.', 31, true),
  ('sst-hist-5', 'social-science', 'history', 5, 'Print Culture and the Modern World', 'First printed books, print revolution in Europe & India.', 32, true),

  -- Social Science: Geography
  ('sst-geo-1', 'social-science', 'geography', 1, 'Resources and Development', 'Types of resources, resource planning, land degradation, soil types.', 33, true),
  ('sst-geo-2', 'social-science', 'geography', 2, 'Forest and Wildlife Resources', 'Biodiversity, flora and fauna classification, conservation projects.', 34, true),
  ('sst-geo-3', 'social-science', 'geography', 3, 'Water Resources', 'Water scarcity, multi-purpose river valley projects, rainwater harvesting.', 35, true),
  ('sst-geo-4', 'social-science', 'geography', 4, 'Agriculture', 'Types of farming, cropping patterns, major food & cash crops.', 36, true),
  ('sst-geo-5', 'social-science', 'geography', 5, 'Minerals and Energy Resources', 'Mode of mineral occurrence, ferrous/non-ferrous, conventional/non-conventional.', 37, true),
  ('sst-geo-6', 'social-science', 'geography', 6, 'Manufacturing Industries', 'Agro-based, mineral-based, industrial pollution & environmental degradation.', 38, true),
  ('sst-geo-7', 'social-science', 'geography', 7, 'Lifelines of National Economy', 'Transport systems: roadways, railways, waterways, airways, ports.', 39, true),

  -- Social Science: Political Science
  ('sst-pol-1', 'social-science', 'political-science', 1, 'Power Sharing', 'Case studies of Belgium and Sri Lanka, majoritarianism, forms of power sharing.', 40, true),
  ('sst-pol-2', 'social-science', 'political-science', 2, 'Federalism', 'Features of federalism, decentralisation in India, Union/State lists.', 41, true),
  ('sst-pol-3', 'social-science', 'political-science', 3, 'Gender, Religion and Caste', 'Gender and politics, communalism, secular state, caste inequalities.', 42, true),
  ('sst-pol-4', 'social-science', 'political-science', 4, 'Political Parties', 'Functions of political parties, national & state parties, electoral reforms.', 43, true),
  ('sst-pol-5', 'social-science', 'political-science', 5, 'Outcomes of Democracy', 'Accountable, responsive and legitimate government, economic growth.', 44, true),

  -- Social Science: Economics
  ('sst-eco-1', 'social-science', 'economics', 1, 'Development', 'National development, per capita income, HDI, sustainable development.', 45, true),
  ('sst-eco-2', 'social-science', 'economics', 2, 'Sectors of the Indian Economy', 'Primary, Secondary, Tertiary sectors, organised vs unorganised.', 46, true),
  ('sst-eco-3', 'social-science', 'economics', 3, 'Money and Credit', 'Barter system, modern forms of money, formal and informal credit.', 47, true),
  ('sst-eco-4', 'social-science', 'economics', 4, 'Globalisation and the Indian Economy', 'MNCs, foreign trade integration, WTO, impact on workers.', 48, true),
  ('sst-eco-5', 'social-science', 'economics', 5, 'Consumer Rights', 'Consumer movement, Consumer Protection Act (COPRA), consumer rights.', 49, true)
ON CONFLICT (id) DO NOTHING;

-- 5.6 Sample Published Mock Tests (Slot 1 for first chapters)
INSERT INTO public.mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
VALUES
  ('test-math-ch1-slot-1', 'Real Numbers – Mock Test 1', 'mathematics', 'math-ch1', 1, 'Class 10 Real Numbers official practice test slot 1. Fundamental Theorem of Arithmetic & proofs.', 5, 25, 5.0, 2.0, 'free', 'published'),
  ('test-sci-ch1-slot-1', 'Chemical Reactions – Mock Test 1', 'science', 'sci-ch1', 1, 'Class 10 Chemical Reactions practice test slot 1.', 5, 25, 5.0, 2.0, 'premium', 'published'),
  ('test-sst-hist-1-slot-1', 'Nationalism in Europe – Mock Test 1', 'social-science', 'sst-hist-1', 1, 'Class 10 Rise of Nationalism in Europe practice test slot 1.', 5, 25, 5.0, 2.0, 'premium', 'published')
ON CONFLICT (id) DO NOTHING;

-- 5.7 Sample NCERT Questions for Real Numbers
INSERT INTO public.questions (id, class, subject_id, chapter_id, topic, difficulty, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, negative_marks, status, source, source_year)
VALUES
  ('q-math-1', '10', 'mathematics', 'math-ch1', 'Fundamental Theorem of Arithmetic', 'easy', 'mcq', 'If two positive integers a and b are written as a = x³y² and b = xy³, where x and y are prime numbers, then HCF(a, b) is:', 'xy', 'x²y²', 'x³y³', 'xy²', 'D', 'HCF is the product of the smallest power of each common prime factor involved in the numbers. Common factors are x (smallest power 1) and y (smallest power 2). Therefore, HCF(a, b) = xy².', 1.0, 0.0, 'published', 'CBSE Board Exam', 2023),
  ('q-math-2', '10', 'mathematics', 'math-ch1', 'Irrational Numbers', 'medium', 'mcq', 'The decimal expansion of the rational number 14587 / 1250 will terminate after how many decimal places?', 'One decimal place', 'Four decimal places', 'Three decimal places', 'Two decimal places', 'B', 'The denominator is 1250 = 2¹ × 5⁴. Since the highest power of 2 or 5 in prime factorization of denominator is 4, the decimal expansion terminates after 4 decimal places.', 1.0, 0.0, 'published', 'NCERT Exemplar', 2022),
  ('q-math-3', '10', 'mathematics', 'math-ch1', 'HCF and LCM relation', 'medium', 'mcq', 'If LCM(a, 18) = 36 and HCF(a, 18) = 2, then the value of a is:', '2', '3', '1', '4', 'D', 'For any two positive integers, Product of numbers = HCF × LCM. Hence a × 18 = 2 × 36 => a × 18 = 72 => a = 72 / 18 = 4.', 1.0, 0.0, 'published', 'CBSE Board Exam', 2021),
  ('q-math-4', '10', 'mathematics', 'math-ch1', 'Prime Factorisation', 'hard', 'mcq', 'The largest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:', '13', '65', '875', '1750', 'A', 'Required number is HCF of (70 - 5) and (125 - 8), which is HCF(65, 117). 65 = 5 × 13 and 117 = 3² × 13. Common prime factor is 13. Therefore, the required number is 13.', 1.0, 0.0, 'published', 'NCERT Exemplar', 2020),
  ('q-math-5', '10', 'mathematics', 'math-ch1', 'Nature of Numbers', 'easy', 'mcq', 'The sum of a rational number and an irrational number is always an irrational number.', 'Always an integer', 'Always rational', 'Can be rational or irrational', 'Always irrational', 'D', 'The sum of any rational number and an irrational number is always an irrational number.', 1.0, 0.0, 'published', 'NCERT Textbook', 2023)
ON CONFLICT (id) DO NOTHING;

-- 5.8 Link Questions to Mock Test 1
INSERT INTO public.mock_test_questions (id, mock_test_id, question_id, display_order)
VALUES
  ('mtq-math1-1', 'test-math-ch1-slot-1', 'q-math-1', 1),
  ('mtq-math1-2', 'test-math-ch1-slot-1', 'q-math-2', 2),
  ('mtq-math1-3', 'test-math-ch1-slot-1', 'q-math-3', 3),
  ('mtq-math1-4', 'test-math-ch1-slot-1', 'q-math-4', 4),
  ('mtq-math1-5', 'test-math-ch1-slot-1', 'q-math-5', 5)
ON CONFLICT (id) DO NOTHING;
