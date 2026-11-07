import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import {
  getMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  assignQuestionsToMockTest,
  deleteMockTest,
  logAuditEvent
} from '../supabaseDb.ts';
import { supabaseServerClient } from '../supabase.ts';

export const mockTestsRouter = Router();

mockTestsRouter.use(authenticateUser);

// GET all mock tests with filters
mockTestsRouter.get('/', async (req, res) => {
  const { subject_id, chapter_id, status, access_type } = req.query;

  try {
    const tests = await getMockTests({
      subject_id: subject_id as string,
      chapter_id: chapter_id as string,
      status: status as string,
      access_type: access_type as string
    });
    res.json({ mock_tests: tests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single mock test by ID
mockTestsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const isStudent = req.query.role !== 'admin' && req.user?.role !== 'admin';

  try {
    const test = await getMockTestById(id, isStudent);
    if (!test) {
      return res.status(404).json({ error: 'Mock test not found' });
    }
    res.json({ mock_test: test });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new mock test
mockTestsRouter.post('/', requireAdmin, async (req, res) => {
  const { title, subject_id, chapter_id, duration_minutes, max_marks, passing_marks, access_type, status, description } = req.body;

  if (!title || !subject_id || !chapter_id) {
    return res.status(400).json({ error: 'Title, Subject and Chapter are required.' });
  }

  try {
    const created = await createMockTest({
      title,
      subject_id,
      chapter_id,
      duration_minutes,
      max_marks,
      passing_marks,
      access_type,
      status,
      description
    });
    res.status(201).json({ success: true, mock_test: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update mock test
mockTestsRouter.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, duration_minutes, max_marks, passing_marks, access_type, status, description } = req.body;

  try {
    const updated = await updateMockTest(id, {
      title,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
      max_marks: max_marks !== undefined ? Number(max_marks) : undefined,
      passing_marks: passing_marks !== undefined ? Number(passing_marks) : undefined,
      access_type,
      status,
      description
    });
    res.json({ success: true, mock_test: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle publish status
mockTestsRouter.post('/:id/toggle-publish', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  try {
    const { data: currentTest, error: fErr } = await sb.from('mock_tests').select('*').eq('id', id).maybeSingle();
    if (fErr || !currentTest) {
      return res.status(404).json({ error: 'Mock test not found' });
    }

    const newStatus = currentTest.status === 'published' ? 'draft' : 'published';

    if (newStatus === 'published') {
      const { count } = await sb.from('mock_test_questions').select('*', { count: 'exact', head: true }).eq('mock_test_id', id);
      if ((count || 0) === 0) {
        return res.status(400).json({ error: 'Cannot publish a test with 0 questions. Please assign questions first.' });
      }
    }

    await updateMockTest(id, { status: newStatus });
    await logAuditEvent('TOGGLE_PUBLISH_TEST', 'MOCK_TEST', id, `Changed test status to ${newStatus}.`);

    res.json({ success: true, status: newStatus, message: `Test is now ${newStatus}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate mock test
mockTestsRouter.post('/:id/duplicate', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  try {
    const { data: original, error: oErr } = await sb.from('mock_tests').select('*').eq('id', id).maybeSingle();
    if (oErr || !original) {
      return res.status(404).json({ error: 'Mock test not found' });
    }

    const { data: maxRow } = await sb
      .from('mock_tests')
      .select('test_number')
      .eq('chapter_id', original.chapter_id)
      .order('test_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newTestNumber = (maxRow?.test_number || 0) + 1;
    const newId = `test-${original.chapter_id}-slot-${newTestNumber}-${Date.now().toString(36)}`;
    const newTitle = `${original.title} (Copy)`;

    const newTest = {
      id: newId,
      title: newTitle,
      subject_id: original.subject_id,
      chapter_id: original.chapter_id,
      test_number: newTestNumber,
      description: original.description,
      total_questions: original.total_questions,
      duration_minutes: original.duration_minutes,
      max_marks: original.max_marks,
      passing_marks: original.passing_marks,
      access_type: original.access_type,
      status: 'draft'
    };

    const { error: insErr } = await sb.from('mock_tests').insert([newTest]);
    if (insErr) {
      throw new Error(`Failed to insert duplicated test: ${insErr.message}`);
    }

    const { data: assigned } = await sb.from('mock_test_questions').select('*').eq('mock_test_id', id);
    if (assigned && assigned.length > 0) {
      const dupMappings = assigned.map((a: any, idx: number) => ({
        id: `mtq-dup-${Date.now()}-${idx}`,
        mock_test_id: newId,
        question_id: a.question_id,
        display_order: a.display_order
      }));
      await sb.from('mock_test_questions').insert(dupMappings);
    }

    res.json({ success: true, message: 'Mock test duplicated successfully.', newTestId: newId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete mock test
mockTestsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteMockTest(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manage Questions in Mock Test: Assign question IDs
mockTestsRouter.post('/:id/assign-questions', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { question_ids } = req.body;

  if (!Array.isArray(question_ids)) {
    return res.status(400).json({ error: 'question_ids must be an array of question IDs.' });
  }

  try {
    await assignQuestionsToMockTest(id, question_ids);
    res.json({
      success: true,
      message: `Assigned ${question_ids.length} question(s) to mock test.`,
      total_questions: question_ids.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove single question from test
mockTestsRouter.post('/:id/remove-question', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { question_id } = req.body;
  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  try {
    await sb.from('mock_test_questions').delete().eq('mock_test_id', id).eq('question_id', question_id);
    const { data: mtq } = await sb.from('mock_test_questions').select('questions(marks)').eq('mock_test_id', id);
    const totalQ = mtq?.length || 0;
    const totalMarks = (mtq || []).reduce((acc: number, m: any) => acc + (Number(m.questions?.marks) || 1), 0);
    await sb.from('mock_tests').update({
      total_questions: totalQ,
      max_marks: totalMarks,
      passing_marks: Math.round(totalMarks * 0.4 * 10) / 10
    }).eq('id', id);

    res.json({ success: true, message: 'Question removed from test.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder questions in mock test
mockTestsRouter.post('/:id/reorder-questions', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { ordered_question_ids } = req.body;

  if (!Array.isArray(ordered_question_ids)) {
    return res.status(400).json({ error: 'ordered_question_ids array required' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  try {
    for (let i = 0; i < ordered_question_ids.length; i++) {
      await sb
        .from('mock_test_questions')
        .update({ display_order: i + 1 })
        .eq('mock_test_id', id)
        .eq('question_id', ordered_question_ids[i]);
    }

    res.json({ success: true, message: 'Questions reordered successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
