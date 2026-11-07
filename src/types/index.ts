export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  free_test_used: number;
  membership_tier: 'free' | 'premium';
  is_active: number;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: number;
  categories?: Category[];
  total_chapters?: number;
  published_tests?: number;
}

export interface Category {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  category_id?: string | null;
  category_name?: string | null;
  chapter_number: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: number;
  mock_tests?: MockTestSummary[];
}

export interface MockTestSummary {
  id: string;
  title: string;
  test_number: number;
  total_questions: number;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
  access_type: 'free' | 'premium';
  status: 'draft' | 'published' | 'archived';
  last_attempt_id?: string;
  attempt_status?: string;
  last_score?: number;
  last_max_marks?: number;
  last_percentage?: number;
  last_passed?: number | boolean;
  last_submitted_at?: string;
}

export interface MockTestDetail extends MockTestSummary {
  subject_id: string;
  subject_name?: string;
  chapter_id: string;
  chapter_name?: string;
  chapter_number?: number;
  description?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  class: string;
  subject_id: string;
  subject_name?: string;
  chapter_id: string;
  chapter_name?: string;
  chapter_number?: number;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: 'mcq' | 'multiple_select' | 'true_false';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string; // only present in admin/results
  explanation?: string;
  image_url?: string;
  marks: number;
  negative_marks: number;
  status: 'draft' | 'published' | 'archived';
  source: string;
  source_year?: number;
  assigned_to_tests_count?: number;
  display_order?: number;
}

export interface TestAttemptResult {
  attempt_id: string;
  mock_test_title: string;
  subject_name: string;
  chapter_name: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  marks_obtained: number;
  maximum_marks: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  breakdown: Array<{
    id: string;
    question_text: string;
    options: { A: string; B: string; C?: string; D?: string };
    selected_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    is_unanswered: boolean;
    marks_awarded: number;
    explanation?: string;
    image_url?: string;
  }>;
}

export interface SamplePaperQuestion {
  id: string;
  question_number: number;
  question_text: string;
  image_url?: string;
  question_type?: 'mcq' | 'subjective';
  options?: { A: string; B: string; C?: string; D?: string };
  correct_answer?: string;
  marks: number;
  solution_text?: string;
}

export interface SamplePaperSection {
  id: string;
  title: string; // e.g. "Section A (Multiple Choice Questions)"
  instructions?: string; // e.g. "Questions 1 to 20 carry 1 mark each"
  questions: SamplePaperQuestion[];
}

export interface SamplePaper {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  year_set: string;
  description?: string;
  file_url: string;
  file_size: string;
  access_type: 'free' | 'premium';
  status: 'draft' | 'published';
  paper_type?: 'pdf' | 'manual';
  sections?: SamplePaperSection[];
  download_count: number;
  created_at: string;
}

export interface PYQ {
  id: string;
  subject_id: string;
  subject_name?: string;
  year: number;
  chapter_id?: string;
  chapter_name?: string;
  topic?: string;
  question_type: string;
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  marks: number;
  solution_text: string;
  file_url?: string;
  status: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  transaction_id: string;
  order_id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'pending' | 'success' | 'failed';
  payment_signature?: string;
  payment_method?: string;
  created_at: string;
}

export interface BackupRecord {
  id: string;
  name: string;
  filename: string;
  file_size_bytes: number;
  backup_type: 'manual' | 'scheduled' | 'pre_restore';
  status: string;
  tables_included: string[];
  record_counts: Record<string, number>;
  created_at: string;
}

export interface DashboardStats {
  total_questions: number;
  published_questions: number;
  total_mock_tests: number;
  published_mock_tests: number;
  total_students: number;
  free_users: number;
  premium_users: number;
  total_payments: number;
  total_revenue: number;
  total_test_attempts: number;
  sample_papers_count: number;
  pyqs_count: number;
}

export interface AppointmentBooking {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  target_class: string;
  subject: string;
  counselling_type: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

