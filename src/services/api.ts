import {
  UserProfile,
  Subject,
  Chapter,
  MockTestDetail,
  Question,
  TestAttemptResult,
  SamplePaper,
  PYQ,
  PaymentRecord,
  BackupRecord,
  DashboardStats,
  AppointmentBooking
} from '../types';

let currentUserId = localStorage.getItem('vedicx_user_id') || '';
let currentAuthToken = localStorage.getItem('vedicx_auth_token') || '';

export function setSessionUserId(id: string) {
  currentUserId = id;
  if (id) {
    localStorage.setItem('vedicx_user_id', id);
  } else {
    localStorage.removeItem('vedicx_user_id');
  }
}

export function getSessionUserId(): string {
  return currentUserId || localStorage.getItem('vedicx_user_id') || '';
}

export function setSessionToken(token: string) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('vedicx_auth_token', token);
  } else {
    localStorage.removeItem('vedicx_auth_token');
  }
}

export function getSessionToken(): string {
  return currentAuthToken || localStorage.getItem('vedicx_auth_token') || '';
}

export function clearSession() {
  currentUserId = '';
  currentAuthToken = '';
  localStorage.removeItem('vedicx_user_id');
  localStorage.removeItem('vedicx_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const userId = getSessionUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as any || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ error: 'Invalid JSON response from server' }));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  getCurrentUser: () => request<{ user: UserProfile | null }>('/api/auth/me'),
  getUsersList: () => request<{ users: UserProfile[] }>('/api/auth/users'),
  login: (credentials: { email: string; password?: string }) =>
    request<{ success: boolean; user: UserProfile; token?: string; session?: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  adminLogin: (credentials: { email: string; password?: string }) =>
    request<{ success: boolean; user: UserProfile; token?: string }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (data: { email: string; full_name: string; password?: string; confirm_password?: string }) =>
    request<{ success: boolean; user: UserProfile; token?: string; session?: any; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST'
    }),
  syncProfile: (token: string) =>
    request<{ success: boolean; user: UserProfile }>('/api/auth/sync-profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Subjects & Chapters
  getSubjects: () => request<{ subjects: Subject[] }>('/api/subjects'),
  createSubject: (data: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSubject: (id: string, data: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSubject: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/subjects/${id}`, {
      method: 'DELETE'
    }),
  reorderSubjects: (orderedIds: string[]) =>
    request<{ success: boolean }>('/api/subjects/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    }),
  getChapters: (subjectId: string, includeInactive = false) =>
    request<{ chapters: Chapter[] }>(`/api/subjects/${subjectId}/chapters?include_inactive=${includeInactive}`),
  createChapter: (data: Partial<Chapter>) =>
    request<{ success: boolean; chapter: Chapter }>('/api/subjects/chapters', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateChapter: (id: string, data: Partial<Chapter>) =>
    request<{ success: boolean; chapter: Chapter }>(`/api/subjects/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteChapter: (id: string, force = false) =>
    request<{ success: boolean; message: string; action: string }>(`/api/subjects/chapters/${id}?force=${force}`, {
      method: 'DELETE'
    }),
  reorderChapters: (orderedIds: string[]) =>
    request<{ success: boolean }>('/api/subjects/chapters/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    }),

  // Mock Tests
  getMockTests: (params: { subject_id?: string; chapter_id?: string; status?: string; access_type?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ mock_tests: MockTestDetail[] }>(`/api/mock-tests?${query}`);
  },
  getMockTestDetail: (id: string, role = 'student') =>
    request<{ mock_test: MockTestDetail }>(`/api/mock-tests/${id}?role=${role}`),
  createMockTest: (data: Partial<MockTestDetail>) =>
    request<{ success: boolean; mock_test: MockTestDetail }>('/api/mock-tests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMockTest: (id: string, data: Partial<MockTestDetail>) =>
    request<{ success: boolean; mock_test: MockTestDetail }>(`/api/mock-tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  togglePublishTest: (id: string) =>
    request<{ success: boolean; status: string; message: string }>(`/api/mock-tests/${id}/toggle-publish`, {
      method: 'POST'
    }),
  duplicateMockTest: (id: string) =>
    request<{ success: boolean; message: string; newTestId: string }>(`/api/mock-tests/${id}/duplicate`, {
      method: 'POST'
    }),
  deleteMockTest: (id: string) =>
    request<{ success: boolean; message: string; action: string }>(`/api/mock-tests/${id}`, {
      method: 'DELETE'
    }),
  assignQuestionsToTest: (id: string, question_ids: string[]) =>
    request<{ success: boolean; message: string; total_questions: number }>(`/api/mock-tests/${id}/assign-questions`, {
      method: 'POST',
      body: JSON.stringify({ question_ids })
    }),
  removeQuestionFromTest: (id: string, question_id: string) =>
    request<{ success: boolean; message: string }>(`/api/mock-tests/${id}/remove-question`, {
      method: 'POST',
      body: JSON.stringify({ question_id })
    }),
  reorderMockTestQuestions: (id: string, ordered_question_ids: string[]) =>
    request<{ success: boolean; message: string }>(`/api/mock-tests/${id}/reorder-questions`, {
      method: 'POST',
      body: JSON.stringify({ ordered_question_ids })
    }),

  // Questions Bank
  getQuestions: (params: {
    subject_id?: string;
    chapter_id?: string;
    difficulty?: string;
    question_type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      questions: Question[];
      pagination: { total: number; page: number; limit: number; total_pages: number };
    }>(`/api/questions?${query}`);
  },
  createQuestion: (data: Partial<Question>) =>
    request<{ success: boolean; question: Question }>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateQuestion: (id: string, data: Partial<Question>) =>
    request<{ success: boolean; question: Question }>(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteQuestion: (id: string) =>
    request<{ success: boolean; message: string; action: string }>(`/api/questions/${id}`, {
      method: 'DELETE'
    }),
  restoreQuestion: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/questions/${id}/restore`, {
      method: 'POST'
    }),
  bulkAssignQuestions: (mock_test_id: string, question_ids: string[]) =>
    request<{ success: boolean; message: string }>('/api/questions/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ mock_test_id, question_ids })
    }),
  bulkQuestionAction: (action: 'publish' | 'archive' | 'delete', question_ids: string[]) =>
    request<{ success: boolean; message: string }>('/api/questions/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, question_ids })
    }),
  importQuestionsCsv: (csv_content: string, dry_run = false) =>
    request<{
      success?: boolean;
      preview?: boolean;
      message?: string;
      total_rows: number;
      valid_count?: number;
      imported_count?: number;
      error_count: number;
      errors: Array<{ row_number: number; question_text: string; reason: string }>;
      sample_valid?: any[];
    }>('/api/questions/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csv_content, dry_run })
    }),

  // Test Engine (Grading & Execution)
  startTest: (mock_test_id: string) =>
    request<{
      success: boolean;
      attempt_id: string;
      test: any;
      questions: Question[];
    }>('/api/test-engine/start', {
      method: 'POST',
      body: JSON.stringify({ mock_test_id })
    }),
  submitTest: (attempt_id: string, answers: Record<string, string>, time_taken_seconds: number) =>
    request<{
      success: boolean;
      result: TestAttemptResult;
    }>('/api/test-engine/submit', {
      method: 'POST',
      body: JSON.stringify({ attempt_id, answers, time_taken_seconds })
    }),
  getStudentTestHistory: () =>
    request<{ history: any[] }>('/api/test-engine/my-history'),
  getAttemptResult: (attemptId: string) =>
    request<{ attempt: any; answers: any[] }>(`/api/test-engine/attempt/${attemptId}`),

  // Sample Papers
  getSamplePapers: (params: { subject_id?: string; access_type?: string; role?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ sample_papers: SamplePaper[] }>(`/api/sample-papers?${query}`);
  },
  createSamplePaper: (data: Partial<SamplePaper>) =>
    request<{ success: boolean; sample_paper: SamplePaper }>('/api/sample-papers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSamplePaper: (id: string, data: Partial<SamplePaper>) =>
    request<{ success: boolean; sample_paper: SamplePaper }>(`/api/sample-papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSamplePaper: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/sample-papers/${id}`, {
      method: 'DELETE'
    }),
  recordSamplePaperDownload: (id: string) =>
    request<{ success: boolean }>(`/api/sample-papers/${id}/download`, {
      method: 'POST'
    }),

  // PYQs
  getPyqs: (params: { subject_id?: string; year?: number; chapter_id?: string; search?: string; role?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ pyqs: PYQ[]; available_years: number[] }>(`/api/pyqs?${query}`);
  },
  createPyq: (data: Partial<PYQ>) =>
    request<{ success: boolean; pyq: PYQ }>('/api/pyqs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePyq: (id: string, data: Partial<PYQ>) =>
    request<{ success: boolean; pyq: PYQ }>(`/api/pyqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePyq: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/pyqs/${id}`, {
      method: 'DELETE'
    }),

  // Payments & Membership
  createPaymentOrder: () =>
    request<{
      success: boolean;
      order: {
        id: string;
        amount: number;
        currency: string;
        display_amount: string;
        key: string;
        student_email: string;
        student_name: string;
        payment_record_id: string;
      };
    }>('/api/payments/create-order', {
      method: 'POST'
    }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    payment_record_id?: string;
    payment_method?: string;
  }) =>
    request<{ success: boolean; message: string; membership_tier: string }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getPayments: (params: { status?: string; search?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ payments: PaymentRecord[] }>(`/api/payments?${query}`);
  },

  // Students
  getStudents: (params: { membership_tier?: string; search?: string; status?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ students: any[] }>(`/api/students?${query}`);
  },
  getStudentDetails: (id: string) =>
    request<{ student: any; attempts: any[]; payments: any[] }>(`/api/students/${id}/details`),
  toggleStudentStatus: (id: string, is_active: boolean) =>
    request<{ success: boolean; is_active: boolean }>(`/api/students/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active })
    }),
  upgradeStudentMembership: (id: string, tier: 'free' | 'premium') =>
    request<{ success: boolean; membership_tier: string }>(`/api/students/${id}/membership`, {
      method: 'PUT',
      body: JSON.stringify({ tier })
    }),

  // Backup & Restore
  getBackupsList: () => request<{ backups: BackupRecord[] }>('/api/backup/list'),
  createBackup: (type: 'manual' | 'scheduled' = 'manual') =>
    request<{ success: boolean; message: string; backup: any }>('/api/backup/create', {
      method: 'POST',
      body: JSON.stringify({ type })
    }),
  verifyBackup: (filename: string) =>
    request<{ valid: boolean; metadata?: any; table_summary?: any[]; error?: string }>('/api/backup/verify', {
      method: 'POST',
      body: JSON.stringify({ filename })
    }),
  restoreBackup: (filename: string) =>
    request<{ success: boolean; message: string; preRestoreBackupId?: string; restoredCounts?: any }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ filename })
    }),
  deleteBackup: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/backup/${id}`, {
      method: 'DELETE'
    }),

  // Dashboard & Settings
  getDashboardStats: () =>
    request<{
      stats: DashboardStats;
      recent_activities: any[];
      recent_questions: any[];
      recent_students: any[];
      recent_payments: any[];
      subject_distribution: any[];
    }>('/api/dashboard/stats'),
  getSettings: () => request<{ settings: Record<string, string> }>('/api/settings'),
  updateSettings: (settings: Record<string, string>) =>
    request<{ success: boolean; message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  // File Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-user-id': currentUserId
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data as {
      success: boolean;
      message: string;
      file: {
        original_name: string;
        filename: string;
        file_url: string;
        file_size: string;
        mimetype: string;
      };
    };
  },
  deleteUploadedFile: (filename: string) =>
    request<{ success: boolean; message: string }>(`/api/upload/${filename}`, {
      method: 'DELETE'
    }),

  // Appointments (Supabase & SQLite Dual-Persisted)
  bookAppointment: (data: {
    student_name: string;
    student_email: string;
    student_phone: string;
    target_class?: string;
    subject?: string;
    counselling_type?: string;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      appointment: AppointmentBooking;
      supabase_synced: boolean;
      supabase_info: string;
    }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAppointments: (params: { status?: string; search?: string; email?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ appointments: AppointmentBooking[] }>(`/api/appointments?${query}`);
  },
  updateAppointmentStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') =>
    request<{ success: boolean; message: string }>(`/api/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  deleteAppointment: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/appointments/${id}`, {
      method: 'DELETE'
    })
};
