import { supabaseServerClient, isSupabaseConfigured } from './supabase.ts';

function getSbClient() {
  if (!isSupabaseConfigured() || !supabaseServerClient) {
    throw new Error('Supabase client is not configured. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseServerClient;
}

// Cache of table availability in Supabase to minimize redundant checks
const supabaseTableAvailable = new Map<string, boolean>();

export async function isTableInSupabase(tableName: string): Promise<boolean> {
  const sb = supabaseServerClient;
  if (!isSupabaseConfigured() || !sb) {
    return false;
  }

  if (supabaseTableAvailable.has(tableName)) {
    return supabaseTableAvailable.get(tableName)!;
  }

  try {
    const { error } = await sb
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      supabaseTableAvailable.set(tableName, false);
      return false;
    }

    supabaseTableAvailable.set(tableName, true);
    return true;
  } catch {
    supabaseTableAvailable.set(tableName, false);
    return false;
  }
}

export function invalidateTableCache(tableName?: string) {
  if (tableName) {
    supabaseTableAvailable.delete(tableName);
  } else {
    supabaseTableAvailable.clear();
  }
}

// ============================================================================
// 1. AUDIT LOGS (Supabase Only)
// ============================================================================
export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string | null = null,
  details: string | null = null,
  userId: string | null = null,
  userEmail: string | null = null
): Promise<void> {
  const sb = getSbClient();
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    await sb.from('audit_logs').insert([{
      id,
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: now
    }]);
  } catch (e: any) {
    console.warn('[SUPABASE AUDIT] Failed to insert audit log:', e?.message || e);
  }
}

// ============================================================================
// 2. SITE SETTINGS (Supabase Only)
// ============================================================================
export async function getSiteSettings(): Promise<Record<string, string>> {
  const sb = getSbClient();
  const { data, error } = await sb
    .from('site_settings')
    .select('key, value');

  if (error) {
    throw new Error(`Failed to fetch site settings from Supabase: ${error.message}`);
  }

  const settings: Record<string, string> = {};
  (data || []).forEach(r => { settings[r.key] = r.value; });
  return settings;
}

export async function updateSiteSettings(settings: Record<string, string>): Promise<void> {
  const sb = getSbClient();
  const now = new Date().toISOString();

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: now
  }));

  const { error } = await sb.from('site_settings').upsert(upserts, { onConflict: 'key' });
  if (error) {
    throw new Error(`Failed to update site settings in Supabase: ${error.message}`);
  }
}

// ============================================================================
// 3. PROFILES & USERS (Supabase Only)
// ============================================================================
export async function getProfileById(id: string): Promise<any | null> {
  const sb = getSbClient();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .or(`id.eq.${id},auth_user_id.eq.${id}`)
    .maybeSingle();

  if (error) {
    console.warn('[SUPABASE PROFILES] Query by id error:', error.message);
  }
  return data || null;
}

export async function getProfileByEmail(email: string): Promise<any | null> {
  const sb = getSbClient();
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (error) {
    console.warn('[SUPABASE PROFILES] Query by email error:', error.message);
  }
  return data || null;
}

export async function getAllProfiles(): Promise<any[]> {
  const sb = getSbClient();
  const { data, error } = await sb
    .from('profiles')
    .select('id, email, full_name, role, free_test_used, membership_tier, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch profiles from Supabase: ${error.message}`);
  }
  return data || [];
}

export async function updateProfile(id: string, updates: Record<string, any>): Promise<any> {
  const sb = getSbClient();
  updates.updated_at = new Date().toISOString();

  const { data, error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update profile in Supabase: ${error.message}`);
  }
  return data;
}

// ============================================================================
// 4. SUBJECTS & CATEGORIES (Supabase Only)
// ============================================================================
export async function getSubjectsWithMeta(): Promise<any[]> {
  const sb = getSbClient();

  const { data: subjects, error: sErr } = await sb
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (sErr) {
    throw new Error(`Failed to fetch subjects from Supabase: ${sErr.message}`);
  }

  const { data: categories } = await sb
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  const { data: chapters } = await sb
    .from('chapters')
    .select('id, subject_id, is_active')
    .eq('is_active', true);

  const { data: tests } = await sb
    .from('mock_tests')
    .select('id, subject_id, status')
    .eq('status', 'published');

  return (subjects || []).map(sub => {
    const subCats = categories?.filter(c => c.subject_id === sub.id) || [];
    const totalChapters = chapters?.filter(ch => ch.subject_id === sub.id).length || 0;
    const publishedTests = tests?.filter(t => t.subject_id === sub.id).length || 0;

    return {
      ...sub,
      categories: subCats,
      total_chapters: totalChapters,
      published_tests: publishedTests
    };
  });
}

export async function createSubject(data: { name: string; code: string; description?: string; icon?: string }): Promise<any> {
  const sb = getSbClient();
  const id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const { data: maxRow } = await sb
    .from('subjects')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const maxOrder = maxRow?.display_order || 0;

  const newSubject = {
    id,
    name: data.name,
    code: data.code,
    description: data.description || '',
    icon: data.icon || 'BookOpen',
    display_order: maxOrder + 1,
    is_active: true
  };

  const { error } = await sb.from('subjects').insert([newSubject]);
  if (error) {
    throw new Error(`Failed to create subject in Supabase: ${error.message}`);
  }

  await logAuditEvent('CREATE_SUBJECT', 'SUBJECT', id, `Added subject ${data.name}`);
  return newSubject;
}

export async function updateSubject(id: string, updates: Partial<{ name: string; code: string; description: string; icon: string; is_active: boolean }>): Promise<any> {
  const sb = getSbClient();
  const { data, error } = await sb.from('subjects').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update subject in Supabase: ${error.message}`);
  }
  return data;
}

export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSbClient();
  const { count } = await sb.from('chapters').select('*', { count: 'exact', head: true }).eq('subject_id', id);
  if ((count || 0) > 0) {
    return { success: false, error: `Cannot delete subject because it contains ${count} chapters. Please reassign or delete chapters first.` };
  }

  const { error } = await sb.from('subjects').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete subject in Supabase: ${error.message}`);
  }

  await logAuditEvent('DELETE_SUBJECT', 'SUBJECT', id, 'Deleted subject');
  return { success: true };
}

export async function reorderSubjects(orderedIds: string[]): Promise<void> {
  const sb = getSbClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await sb.from('subjects').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
  }
}

// ============================================================================
// 5. CHAPTERS (Supabase Only)
// ============================================================================
export async function getChaptersBySubject(subjectId: string, includeInactive = false, studentId: string | null = null): Promise<any[]> {
  const sb = getSbClient();

  let q = sb
    .from('chapters')
    .select('*, categories(name)')
    .eq('subject_id', subjectId);

  if (!includeInactive) {
    q = q.eq('is_active', true);
  }

  const { data: chapters, error } = await q
    .order('display_order', { ascending: true })
    .order('chapter_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chapters from Supabase: ${error.message}`);
  }

  const chapterIds = (chapters || []).map(c => c.id);
  const { data: tests } = await sb
    .from('mock_tests')
    .select('*')
    .in('chapter_id', chapterIds)
    .order('test_number', { ascending: true });

  let studentAttempts: any[] = [];
  if (studentId) {
    const { data: attempts } = await sb
      .from('test_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });
    studentAttempts = attempts || [];
  }

  return (chapters || []).map(ch => {
    const chTests = (tests || []).filter(t => t.chapter_id === ch.id);
    const testsWithAttempts = chTests.map(t => {
      const lastAttempt = studentAttempts.find(a => a.mock_test_id === t.id);
      return {
        id: t.id,
        title: t.title,
        test_number: t.test_number,
        total_questions: t.total_questions,
        duration_minutes: t.duration_minutes,
        max_marks: t.max_marks,
        passing_marks: t.passing_marks,
        access_type: t.access_type,
        status: t.status,
        last_attempt_id: lastAttempt?.id || null,
        attempt_status: lastAttempt?.status || null,
        last_score: lastAttempt?.marks_obtained ?? null,
        last_max_marks: lastAttempt?.maximum_marks ?? null,
        last_percentage: lastAttempt?.percentage ?? null,
        last_passed: lastAttempt ? Boolean(lastAttempt.passed) : null,
        last_submitted_at: lastAttempt?.submitted_at || null
      };
    });

    return {
      ...ch,
      category_name: ch.categories?.name || null,
      mock_tests: testsWithAttempts
    };
  });
}

export async function createChapter(data: {
  subject_id: string;
  category_id?: string | null;
  chapter_number: number;
  name: string;
  description?: string;
  is_active?: boolean;
}): Promise<any> {
  const sb = getSbClient();
  const chapterId = `ch-${data.subject_id}-${Date.now().toString(36)}`;

  const { data: maxRow } = await sb
    .from('chapters')
    .select('display_order')
    .eq('subject_id', data.subject_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const maxOrder = maxRow?.display_order || 0;

  const newChapter = {
    id: chapterId,
    subject_id: data.subject_id,
    category_id: data.category_id || null,
    chapter_number: Number(data.chapter_number),
    name: data.name,
    description: data.description || '',
    display_order: maxOrder + 1,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
  };

  const { error } = await sb.from('chapters').insert([newChapter]);
  if (error) {
    throw new Error(`Failed to create chapter in Supabase: ${error.message}`);
  }

  // Provision 5 test slots in Supabase
  const slots = [];
  for (let slot = 1; slot <= 5; slot++) {
    slots.push({
      id: `test-${chapterId}-slot-${slot}`,
      title: `${data.name} – Mock Test ${slot}`,
      subject_id: data.subject_id,
      chapter_id: chapterId,
      test_number: slot,
      description: `Class 10 ${data.name} mock test slot ${slot}.`,
      total_questions: 0,
      duration_minutes: 25,
      max_marks: 20.0,
      passing_marks: 8.0,
      access_type: 'premium',
      status: 'draft'
    });
  }
  await sb.from('mock_tests').insert(slots);

  await logAuditEvent('CREATE_CHAPTER', 'CHAPTER', chapterId, `Created chapter "${data.name}" with 5 mock test slots.`);
  return newChapter;
}

export async function updateChapter(id: string, updates: Partial<{
  name: string;
  chapter_number: number;
  description: string;
  is_active: boolean;
  category_id: string | null;
  display_order: number;
}>): Promise<any> {
  const sb = getSbClient();
  const { data, error } = await sb.from('chapters').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update chapter in Supabase: ${error.message}`);
  }
  return data;
}

export async function deleteChapter(id: string, force = false): Promise<{ success: boolean; message: string; action: string }> {
  const sb = getSbClient();
  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('chapter_id', id).eq('is_deleted', false);
  const questionCount = count || 0;

  if (questionCount > 0 && !force) {
    await sb.from('chapters').update({ is_active: false }).eq('id', id);
    return {
      success: true,
      message: `Chapter contains ${questionCount} questions. It has been deactivated to preserve question history.`,
      action: 'deactivated'
    };
  }

  const { error } = await sb.from('chapters').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete chapter from Supabase: ${error.message}`);
  }

  await logAuditEvent('DELETE_CHAPTER', 'CHAPTER', id, 'Deleted chapter');
  return {
    success: true,
    message: 'Chapter deleted successfully.',
    action: 'deleted'
  };
}

export async function reorderChapters(orderedIds: string[]): Promise<void> {
  const sb = getSbClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await sb.from('chapters').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
  }
}

// ============================================================================
// 6. MOCK TESTS & QUESTION MAPPINGS (Supabase Only)
// ============================================================================
export async function getMockTests(filters: {
  subject_id?: string;
  chapter_id?: string;
  status?: string;
  access_type?: string;
}): Promise<any[]> {
  const sb = getSbClient();

  let q = sb
    .from('mock_tests')
    .select('*, subjects(name), chapters(name, chapter_number), mock_test_questions(count)');

  if (filters.subject_id) q = q.eq('subject_id', filters.subject_id);
  if (filters.chapter_id) q = q.eq('chapter_id', filters.chapter_id);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.access_type) q = q.eq('access_type', filters.access_type);

  const { data, error } = await q.order('test_number', { ascending: true });
  if (error) {
    throw new Error(`Failed to fetch mock tests from Supabase: ${error.message}`);
  }

  return (data || []).map((t: any) => ({
    ...t,
    subject_name: t.subjects?.name || '',
    chapter_name: t.chapters?.name || '',
    chapter_number: t.chapters?.chapter_number || 0,
    total_questions: t.mock_test_questions?.[0]?.count ?? t.total_questions ?? 0,
    assigned_questions_count: t.mock_test_questions?.[0]?.count ?? t.total_questions ?? 0
  }));
}

export async function getMockTestById(id: string, isStudent = true): Promise<any | null> {
  const sb = getSbClient();

  const { data: test, error: tErr } = await sb
    .from('mock_tests')
    .select('*, subjects(name), chapters(name, chapter_number)')
    .eq('id', id)
    .maybeSingle();

  if (tErr || !test) return null;

  const { data: mtq } = await sb
    .from('mock_test_questions')
    .select('display_order, questions(*)')
    .eq('mock_test_id', id)
    .order('display_order', { ascending: true });

  const questions = (mtq || [])
    .map((m: any) => {
      const q = m.questions;
      if (!q || q.is_deleted) return null;
      if (isStudent) {
        const { correct_answer, explanation, ...safeQ } = q;
        return { ...safeQ, display_order: m.display_order };
      }
      return { ...q, display_order: m.display_order };
    })
    .filter(Boolean);

  return {
    ...test,
    subject_name: test.subjects?.name || '',
    chapter_name: test.chapters?.name || '',
    chapter_number: test.chapters?.chapter_number || 0,
    total_questions: questions.length,
    questions
  };
}

export async function createMockTest(data: {
  title: string;
  subject_id: string;
  chapter_id: string;
  duration_minutes?: number;
  max_marks?: number;
  passing_marks?: number;
  access_type?: string;
  status?: string;
  description?: string;
}): Promise<any> {
  const sb = getSbClient();

  const { data: maxSlot } = await sb
    .from('mock_tests')
    .select('test_number')
    .eq('chapter_id', data.chapter_id)
    .order('test_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const testNumber = (maxSlot?.test_number || 0) + 1;
  const testId = `test-${data.chapter_id}-slot-${testNumber}-${Date.now().toString(36)}`;
  const newTest = {
    id: testId,
    title: data.title,
    subject_id: data.subject_id,
    chapter_id: data.chapter_id,
    test_number: testNumber,
    description: data.description || '',
    total_questions: 0,
    duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : 25,
    max_marks: data.max_marks ? Number(data.max_marks) : 20.0,
    passing_marks: data.passing_marks ? Number(data.passing_marks) : 8.0,
    access_type: data.access_type || 'premium',
    status: data.status || 'draft'
  };

  const { error } = await sb.from('mock_tests').insert([newTest]);
  if (error) {
    throw new Error(`Failed to create mock test in Supabase: ${error.message}`);
  }

  await logAuditEvent('CREATE_MOCK_TEST', 'MOCK_TEST', testId, `Created mock test "${data.title}".`);
  return newTest;
}

export async function updateMockTest(id: string, updates: Partial<{
  title: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
  access_type: string;
  status: string;
  description: string;
}>): Promise<any> {
  const sb = getSbClient();
  const { data, error } = await sb.from('mock_tests').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update mock test in Supabase: ${error.message}`);
  }
  return data;
}

export async function assignQuestionsToMockTest(mockTestId: string, questionIds: string[]): Promise<void> {
  const sb = getSbClient();

  // 1. Delete existing mappings
  await sb.from('mock_test_questions').delete().eq('mock_test_id', mockTestId);

  // 2. Insert new mappings
  const mappings = questionIds.map((qId, idx) => ({
    id: `mtq-${mockTestId}-${qId}`,
    mock_test_id: mockTestId,
    question_id: qId,
    display_order: idx + 1
  }));
  if (mappings.length > 0) {
    const { error: insErr } = await sb.from('mock_test_questions').insert(mappings);
    if (insErr) {
      throw new Error(`Failed to insert question mappings in Supabase: ${insErr.message}`);
    }
  }

  // 3. Recalculate marks
  const { data: qData } = await sb.from('questions').select('marks').in('id', questionIds);
  const totalMarks = (qData || []).reduce((acc, q) => acc + (Number(q.marks) || 1), 0);
  const totalQ = questionIds.length;
  const passingMarks = Math.round(totalMarks * 0.4 * 10) / 10;

  await sb.from('mock_tests').update({
    total_questions: totalQ,
    max_marks: totalMarks,
    passing_marks: passingMarks
  }).eq('id', mockTestId);
}

export async function deleteMockTest(id: string): Promise<{ success: boolean; message: string; action: string }> {
  const sb = getSbClient();
  const { count } = await sb.from('test_attempts').select('*', { count: 'exact', head: true }).eq('mock_test_id', id);
  const attemptsCount = count || 0;

  if (attemptsCount > 0) {
    await sb.from('mock_tests').update({ status: 'archived' }).eq('id', id);
    return {
      success: true,
      message: `Test has ${attemptsCount} student attempt(s). It has been archived to preserve examination records.`,
      action: 'archived'
    };
  }

  const { error } = await sb.from('mock_tests').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete mock test from Supabase: ${error.message}`);
  }

  await logAuditEvent('DELETE_MOCK_TEST', 'MOCK_TEST', id, 'Deleted test slot');
  return { success: true, message: 'Test deleted successfully.', action: 'deleted' };
}

// ============================================================================
// 7. QUESTIONS BANK (Supabase Only)
// ============================================================================
export async function getQuestions(filters: {
  subject_id?: string;
  chapter_id?: string;
  difficulty?: string;
  question_type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ questions: any[]; pagination: { total: number; page: number; limit: number; total_pages: number } }> {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const offset = (page - 1) * limit;

  const sb = getSbClient();

  let q = sb
    .from('questions')
    .select('*, subjects(name), chapters(name, chapter_number), mock_test_questions(count)', { count: 'exact' });

  if (filters.status === 'archived') {
    q = q.or('status.eq.archived,is_deleted.eq.true');
  } else {
    q = q.eq('is_deleted', false);
    if (filters.status) q = q.eq('status', filters.status);
  }

  if (filters.subject_id) q = q.eq('subject_id', filters.subject_id);
  if (filters.chapter_id) q = q.eq('chapter_id', filters.chapter_id);
  if (filters.difficulty) q = q.eq('difficulty', filters.difficulty);
  if (filters.question_type) q = q.eq('question_type', filters.question_type);
  if (filters.search) {
    q = q.or(`question_text.ilike.%${filters.search}%,topic.ilike.%${filters.search}%,source.ilike.%${filters.search}%`);
  }

  const { data, count, error } = await q
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch questions from Supabase: ${error.message}`);
  }

  const enriched = (data || []).map((item: any) => ({
    ...item,
    subject_name: item.subjects?.name || '',
    chapter_name: item.chapters?.name || '',
    chapter_number: item.chapters?.chapter_number || 0,
    assigned_to_tests_count: item.mock_test_questions?.[0]?.count ?? 0
  }));

  const total = count || 0;
  return {
    questions: enriched,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
}

export async function createQuestion(data: any): Promise<any> {
  const sb = getSbClient();
  const questionId = data.id || `q-${data.subject_id.substring(0, 4)}-${Date.now().toString(36)}`;
  const fullData = {
    id: questionId,
    class: '10',
    subject_id: data.subject_id,
    chapter_id: data.chapter_id,
    topic: data.topic || '',
    difficulty: data.difficulty || 'medium',
    question_type: data.question_type || 'mcq',
    question_text: data.question_text,
    option_a: data.option_a,
    option_b: data.option_b,
    option_c: data.option_c || '',
    option_d: data.option_d || '',
    correct_answer: data.correct_answer.toUpperCase().trim(),
    explanation: data.explanation || '',
    image_url: data.image_url || null,
    marks: Number(data.marks || 1.0),
    negative_marks: Number(data.negative_marks || 0.0),
    status: data.status || 'published',
    source: data.source || 'NCERT',
    source_year: data.source_year ? Number(data.source_year) : null,
    is_deleted: false
  };

  const { error } = await sb.from('questions').insert([fullData]);
  if (error) {
    throw new Error(`Failed to insert question into Supabase: ${error.message}`);
  }

  await logAuditEvent('CREATE_QUESTION', 'QUESTION', questionId, `Created question: ${data.question_text.substring(0, 40)}...`);
  return fullData;
}

export async function updateQuestion(id: string, updates: any): Promise<any> {
  const sb = getSbClient();
  updates.updated_at = new Date().toISOString();
  if (updates.correct_answer) {
    updates.correct_answer = updates.correct_answer.toUpperCase().trim();
  }

  const { data, error } = await sb.from('questions').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update question in Supabase: ${error.message}`);
  }
  return data;
}

export async function deleteQuestion(id: string): Promise<{ success: boolean; message: string; action: string }> {
  const sb = getSbClient();
  const { count } = await sb.from('student_answers').select('*', { count: 'exact', head: true }).eq('question_id', id);
  const answerCount = count || 0;

  if (answerCount > 0) {
    await sb.from('questions').update({ is_deleted: true, status: 'archived' }).eq('id', id);
    return {
      success: true,
      message: `Question is referenced in ${answerCount} student answer(s). It has been safely archived to preserve historical examination records.`,
      action: 'archived'
    };
  }

  await sb.from('mock_test_questions').delete().eq('question_id', id);
  const { error } = await sb.from('questions').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete question from Supabase: ${error.message}`);
  }

  await logAuditEvent('DELETE_QUESTION', 'QUESTION', id, 'Question permanently deleted.');
  return { success: true, message: 'Question deleted successfully.', action: 'deleted' };
}

// ============================================================================
// 8. TEST ENGINE (Supabase Only)
// ============================================================================
export async function startTestAttempt(studentId: string, mockTestId: string): Promise<any> {
  const sb = getSbClient();

  // 1. Fetch student profile
  const student = await getProfileById(studentId);
  if (!student) {
    throw new Error('Student profile not found');
  }

  // 2. Fetch mock test
  const { data: testData, error: tErr } = await sb
    .from('mock_tests')
    .select('*, subjects(name), chapters(name)')
    .eq('id', mockTestId)
    .maybeSingle();

  if (tErr || !testData) {
    throw new Error('Mock test not found');
  }

  const test = {
    ...testData,
    subject_name: testData.subjects?.name || '',
    chapter_name: testData.chapters?.name || ''
  };

  if (test.status !== 'published') {
    throw new Error('This mock test is not published yet.');
  }

  // 3. Access verification (Free vs Premium)
  const isPremium = student.membership_tier === 'premium' || student.role === 'admin';
  if (!isPremium) {
    if (test.access_type === 'premium') {
      const err: any = new Error('This is a Premium Mock Test. Please upgrade your membership to ₹49 to access all chapter-wise tests.');
      err.requires_premium = true;
      throw err;
    }

    if (student.free_test_used >= 1) {
      const { count } = await sb
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('mock_test_id', mockTestId)
        .eq('status', 'submitted');

      if ((count || 0) === 0) {
        const err: any = new Error('You have already utilized your 1 Free Mock Test. Unlock unlimited tests across all subjects for only ₹49.');
        err.requires_premium = true;
        err.free_limit_reached = true;
        throw err;
      }
    }
  }

  // 4. Fetch assigned questions WITHOUT correct answer or explanation
  const { data: mtq, error: qErr } = await sb
    .from('mock_test_questions')
    .select('display_order, questions(id, topic, difficulty, question_type, question_text, option_a, option_b, option_c, option_d, image_url, marks, negative_marks, is_deleted)')
    .eq('mock_test_id', mockTestId)
    .order('display_order', { ascending: true });

  if (qErr) {
    throw new Error(`Failed to load test questions from Supabase: ${qErr.message}`);
  }

  const questions = (mtq || [])
    .map((m: any) => {
      const q = m.questions;
      if (!q || q.is_deleted) return null;
      return {
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        question_type: q.question_type,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        image_url: q.image_url,
        marks: q.marks,
        negative_marks: q.negative_marks,
        display_order: m.display_order
      };
    })
    .filter(Boolean);

  if (questions.length === 0) {
    throw new Error('This mock test currently has no questions assigned.');
  }

  // 5. Create attempt record in Supabase
  const attemptId = `att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const { error: attErr } = await sb.from('test_attempts').insert([{
    id: attemptId,
    student_id: studentId,
    mock_test_id: mockTestId,
    status: 'in_progress',
    started_at: now,
    total_questions: questions.length,
    maximum_marks: Number(test.max_marks)
  }]);

  if (attErr) {
    throw new Error(`Failed to initialize test attempt in Supabase: ${attErr.message}`);
  }

  return {
    success: true,
    attempt_id: attemptId,
    test: {
      id: test.id,
      title: test.title,
      subject_name: test.subject_name,
      chapter_name: test.chapter_name,
      duration_minutes: test.duration_minutes,
      max_marks: test.max_marks,
      passing_marks: test.passing_marks,
      total_questions: questions.length
    },
    questions
  };
}

export async function submitTestAttempt(studentId: string, attemptId: string, answers: Record<string, string>, timeTakenSeconds = 0): Promise<any> {
  const sb = getSbClient();

  // 1. Fetch attempt
  const { data: attempt, error: aErr } = await sb.from('test_attempts').select('*').eq('id', attemptId).maybeSingle();
  if (aErr || !attempt) {
    throw new Error('Attempt record not found');
  }

  if (attempt.status === 'submitted') {
    throw new Error('This test attempt has already been submitted.');
  }

  if (attempt.student_id !== studentId) {
    throw new Error('Unauthorized submission.');
  }

  // 2. Fetch questions with actual correct answers
  const { data: mtq, error: mErr } = await sb
    .from('mock_test_questions')
    .select('display_order, questions(*)')
    .eq('mock_test_id', attempt.mock_test_id)
    .order('display_order', { ascending: true });

  if (mErr) {
    throw new Error(`Failed to load evaluation questions from Supabase: ${mErr.message}`);
  }

  const questions = (mtq || []).map((m: any) => m.questions).filter(Boolean);

  // 3. Evaluation
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScore = 0.0;
  let maxScore = 0.0;
  const questionBreakdown: any[] = [];
  const studentAnswersToInsert: any[] = [];

  questions.forEach(q => {
    maxScore += Number(q.marks || 1.0);
    const selected = (answers[q.id] || '').trim();

    if (!selected) {
      unansweredCount++;
      studentAnswersToInsert.push({
        id: `sa-${attemptId}-${q.id}`,
        attempt_id: attemptId,
        question_id: q.id,
        selected_answer: null,
        is_correct: false,
        marks_awarded: 0.0
      });
      questionBreakdown.push({
        id: q.id,
        question_text: q.question_text,
        options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
        selected_answer: null,
        correct_answer: q.correct_answer,
        is_correct: false,
        is_unanswered: true,
        marks_awarded: 0,
        explanation: q.explanation,
        image_url: q.image_url
      });
    } else {
      const isCorrect = selected.toUpperCase() === q.correct_answer.toUpperCase();
      let marksAwarded = 0;
      if (isCorrect) {
        correctCount++;
        marksAwarded = Number(q.marks || 1.0);
        totalScore += marksAwarded;
      } else {
        incorrectCount++;
        marksAwarded = -Number(q.negative_marks || 0.0);
        totalScore += marksAwarded;
      }
      studentAnswersToInsert.push({
        id: `sa-${attemptId}-${q.id}`,
        attempt_id: attemptId,
        question_id: q.id,
        selected_answer: selected,
        is_correct: isCorrect,
        marks_awarded: marksAwarded
      });
      questionBreakdown.push({
        id: q.id,
        question_text: q.question_text,
        options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
        selected_answer: selected,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        is_unanswered: false,
        marks_awarded: marksAwarded,
        explanation: q.explanation,
        image_url: q.image_url
      });
    }
  });

  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  const { data: testData } = await sb
    .from('mock_tests')
    .select('title, passing_marks, subjects(name), chapters(name)')
    .eq('id', attempt.mock_test_id)
    .maybeSingle();

  const passingMarks = Number(testData?.passing_marks || 8.0);
  const testTitle = testData?.title || '';
  const subjectName = (testData?.subjects as any)?.name || '';
  const chapterName = (testData?.chapters as any)?.name || '';
  const passed = totalScore >= passingMarks;
  const now = new Date().toISOString();

  // 4. Update Supabase
  if (studentAnswersToInsert.length > 0) {
    await sb.from('student_answers').upsert(studentAnswersToInsert, { onConflict: 'id' });
  }

  await sb.from('test_attempts').update({
    status: 'submitted',
    submitted_at: now,
    time_taken_seconds: Number(timeTakenSeconds),
    total_questions: questions.length,
    correct_answers: correctCount,
    incorrect_answers: incorrectCount,
    unanswered_questions: unansweredCount,
    marks_obtained: totalScore,
    maximum_marks: maxScore,
    percentage,
    passed
  }).eq('id', attemptId);

  await sb.from('profiles').update({ free_test_used: 1 }).eq('id', studentId);

  return {
    success: true,
    result: {
      attempt_id: attemptId,
      mock_test_title: testTitle,
      subject_name: subjectName,
      chapter_name: chapterName,
      total_questions: questions.length,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered_questions: unansweredCount,
      marks_obtained: totalScore,
      maximum_marks: maxScore,
      percentage,
      passed,
      time_taken_seconds: timeTakenSeconds,
      breakdown: questionBreakdown
    }
  };
}

export async function getTestAttemptResult(attemptId: string, currentUserId: string | null, isAdmin = false): Promise<any> {
  const sb = getSbClient();

  const { data, error } = await sb
    .from('test_attempts')
    .select('*, mock_tests(title, passing_marks, subjects(name), chapters(name))')
    .eq('id', attemptId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Attempt not found');
  }

  const attempt = {
    ...data,
    test_title: data.mock_tests?.title || '',
    subject_name: (data.mock_tests?.subjects as any)?.name || '',
    chapter_name: (data.mock_tests?.chapters as any)?.name || '',
    passing_marks: data.mock_tests?.passing_marks || 8.0
  };

  // Student Isolation Enforcement: Only attempt owner or administrator can view results
  if (currentUserId && attempt.student_id !== currentUserId && !isAdmin) {
    const err: any = new Error('Access denied. You cannot view other students’ attempt records.');
    err.status = 403;
    throw err;
  }

  const { data: saList } = await sb
    .from('student_answers')
    .select('selected_answer, is_correct, marks_awarded, questions(id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, image_url, marks, negative_marks)')
    .eq('attempt_id', attemptId);

  const answers = (saList || []).map((sa: any) => ({
    selected_answer: sa.selected_answer,
    is_correct: Boolean(sa.is_correct),
    marks_awarded: sa.marks_awarded,
    question_id: sa.questions?.id,
    question_text: sa.questions?.question_text,
    option_a: sa.questions?.option_a,
    option_b: sa.questions?.option_b,
    option_c: sa.questions?.option_c,
    option_d: sa.questions?.option_d,
    correct_answer: sa.questions?.correct_answer,
    explanation: sa.questions?.explanation,
    image_url: sa.questions?.image_url,
    marks: sa.questions?.marks,
    negative_marks: sa.questions?.negative_marks
  }));

  return { attempt, answers };
}

export async function getStudentTestHistory(studentId: string): Promise<any[]> {
  const sb = getSbClient();

  const { data, error } = await sb
    .from('test_attempts')
    .select('*, mock_tests(title, subjects(name), chapters(name))')
    .eq('student_id', studentId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch student test history from Supabase: ${error.message}`);
  }

  return (data || []).map((ta: any) => ({
    ...ta,
    test_title: ta.mock_tests?.title || '',
    subject_name: (ta.mock_tests?.subjects as any)?.name || '',
    chapter_name: (ta.mock_tests?.chapters as any)?.name || ''
  }));
}

// ============================================================================
// 9. SAMPLE PAPERS (Supabase Only)
// ============================================================================
export async function getSamplePapers(filters: {
  subject_id?: string;
  access_type?: string;
  paper_type?: string;
  isStudent?: boolean;
}): Promise<any[]> {
  const sb = getSbClient();

  let q = sb.from('sample_papers').select('*, subjects(name)');
  if (filters.isStudent) q = q.eq('status', 'published');
  if (filters.subject_id) q = q.eq('subject_id', filters.subject_id);
  if (filters.access_type) q = q.eq('access_type', filters.access_type);
  if (filters.paper_type) q = q.eq('paper_type', filters.paper_type);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch sample papers from Supabase: ${error.message}`);
  }

  return (data || []).map((p: any) => ({
    ...p,
    subject_name: p.subjects?.name || 'Unknown',
    sections: p.sections_json ? JSON.parse(p.sections_json) : []
  }));
}

// ============================================================================
// 10. PYQS (Supabase Only)
// ============================================================================
export async function getPyqs(filters: {
  subject_id?: string;
  year?: number;
  chapter_id?: string;
  search?: string;
  isStudent?: boolean;
}): Promise<{ pyqs: any[]; available_years: number[] }> {
  const sb = getSbClient();

  let q = sb.from('pyq_questions').select('*, subjects(name), chapters(name)');
  if (filters.isStudent) q = q.eq('status', 'published');
  if (filters.subject_id) q = q.eq('subject_id', filters.subject_id);
  if (filters.year) q = q.eq('year', Number(filters.year));
  if (filters.chapter_id) q = q.eq('chapter_id', filters.chapter_id);
  if (filters.search) {
    q = q.or(`question_text.ilike.%${filters.search}%,topic.ilike.%${filters.search}%`);
  }

  const { data, error } = await q.order('year', { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch PYQs from Supabase: ${error.message}`);
  }

  const pyqs = (data || []).map((item: any) => ({
    ...item,
    subject_name: item.subjects?.name || 'Unknown',
    chapter_name: item.chapters?.name || 'General'
  }));

  const years = Array.from(new Set(pyqs.map((p: any) => p.year))).sort((a: any, b: any) => b - a) as number[];
  return { pyqs, available_years: years };
}

// ============================================================================
// 11. APPOINTMENTS (Supabase Only)
// ============================================================================
export async function getAppointments(filters: {
  status?: string;
  search?: string;
  email?: string;
  isAdmin?: boolean;
}): Promise<any[]> {
  const sb = getSbClient();

  let q = sb.from('appointments').select('*');
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.email && !filters.isAdmin) q = q.eq('student_email', filters.email.toLowerCase());
  if (filters.search) {
    q = q.or(`student_name.ilike.%${filters.search}%,student_email.ilike.%${filters.search}%,student_phone.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error } = await q.order('appointment_date', { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch appointments from Supabase: ${error.message}`);
  }
  return data || [];
}

// ============================================================================
// 12. DASHBOARD STATS (Supabase Only)
// ============================================================================
export async function getDashboardStats(): Promise<any> {
  const sb = getSbClient();

  const [
    { count: totalQuestions },
    { count: publishedQuestions },
    { count: totalMockTests },
    { count: publishedMockTests },
    { count: totalStudents },
    { count: freeUsers },
    { count: premiumUsers },
    { count: totalPayments },
    { count: totalTestAttempts },
    { count: samplePapersCount },
    { count: pyqsCount }
  ] = await Promise.all([
    sb.from('questions').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    sb.from('questions').select('*', { count: 'exact', head: true }).eq('is_deleted', false).eq('status', 'published'),
    sb.from('mock_tests').select('*', { count: 'exact', head: true }),
    sb.from('mock_tests').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('membership_tier', 'free'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('membership_tier', 'premium'),
    sb.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'success'),
    sb.from('test_attempts').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    sb.from('sample_papers').select('*', { count: 'exact', head: true }),
    sb.from('pyq_questions').select('*', { count: 'exact', head: true })
  ]);

  const { data: paymentsData } = await sb.from('payments').select('amount').eq('status', 'success');
  const totalRevenue = (paymentsData || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const { data: recentActivities } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8);

  const { data: recentQuestions } = await sb
    .from('questions')
    .select('id, question_text, difficulty, status, created_at, subjects(name), chapters(name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(5);

  const formattedQuestions = (recentQuestions || []).map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    difficulty: q.difficulty,
    status: q.status,
    created_at: q.created_at,
    subject_name: q.subjects?.name || '',
    chapter_name: q.chapters?.name || ''
  }));

  const { data: recentStudents } = await sb
    .from('profiles')
    .select('id, full_name, email, membership_tier, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentPayments } = await sb
    .from('payments')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5);

  const formattedPayments = (recentPayments || []).map((p: any) => ({
    ...p,
    student_name: p.profiles?.full_name || '',
    student_email: p.profiles?.email || ''
  }));

  const { data: subjects } = await sb.from('subjects').select('id, name');
  const subjectDistribution = [];
  for (const s of (subjects || [])) {
    const { count } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('subject_id', s.id).eq('is_deleted', false);
    subjectDistribution.push({ name: s.name, question_count: count || 0 });
  }

  return {
    stats: {
      total_questions: totalQuestions || 0,
      published_questions: publishedQuestions || 0,
      total_mock_tests: totalMockTests || 0,
      published_mock_tests: publishedMockTests || 0,
      total_students: totalStudents || 0,
      free_users: freeUsers || 0,
      premium_users: premiumUsers || 0,
      total_payments: totalPayments || 0,
      total_revenue: totalRevenue,
      total_test_attempts: totalTestAttempts || 0,
      sample_papers_count: samplePapersCount || 0,
      pyqs_count: pyqsCount || 0
    },
    recent_activities: recentActivities || [],
    recent_questions: formattedQuestions,
    recent_students: recentStudents || [],
    recent_payments: formattedPayments,
    subject_distribution: subjectDistribution
  };
}
