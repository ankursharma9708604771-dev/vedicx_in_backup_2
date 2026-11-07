import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { getPyqs, logAuditEvent } from '../supabaseDb.ts';
import { supabaseServerClient } from '../supabase.ts';

export const pyqsRouter = Router();

pyqsRouter.use(authenticateUser);

// GET all PYQs with filters
pyqsRouter.get('/', async (req, res) => {
  const { subject_id, year, chapter_id, search } = req.query;
  const isStudent = req.user?.role !== 'admin';

  try {
    const result = await getPyqs({
      subject_id: subject_id as string,
      year: year ? Number(year) : undefined,
      chapter_id: chapter_id as string,
      search: search as string,
      isStudent
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add PYQ
pyqsRouter.post('/', requireAdmin, async (req, res) => {
  const { subject_id, year, chapter_id, topic, question_type, question_text, marks, solution_text, file_url, status } = req.body;

  if (!subject_id || !year || !question_text || !solution_text) {
    return res.status(400).json({ error: 'Subject, authentic exam year, question text, and verified solution are required.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const id = `pyq-${Date.now().toString(36)}`;
  const newPyq = {
    id,
    subject_id,
    year: Number(year),
    chapter_id: chapter_id || null,
    topic: topic || '',
    question_type: question_type || 'Subjective',
    question_text,
    marks: marks ? Number(marks) : 3,
    solution_text,
    file_url: file_url || null,
    status: status || 'published'
  };

  try {
    const { error } = await sb.from('pyq_questions').insert([newPyq]);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('CREATE_PYQ', 'PYQ', id, `Added authentic PYQ for Year ${year}`);

    res.status(201).json({ success: true, pyq: newPyq });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update PYQ
pyqsRouter.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { subject_id, year, chapter_id, topic, question_type, question_text, marks, solution_text, file_url, status } = req.body;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const updateData: any = {};
  if (subject_id !== undefined) updateData.subject_id = subject_id;
  if (year !== undefined) updateData.year = Number(year);
  if (chapter_id !== undefined) updateData.chapter_id = chapter_id || null;
  if (topic !== undefined) updateData.topic = topic;
  if (question_type !== undefined) updateData.question_type = question_type;
  if (question_text !== undefined) updateData.question_text = question_text;
  if (marks !== undefined) updateData.marks = Number(marks);
  if (solution_text !== undefined) updateData.solution_text = solution_text;
  if (file_url !== undefined) updateData.file_url = file_url || null;
  if (status !== undefined) updateData.status = status;

  try {
    const { error } = await sb.from('pyq_questions').update(updateData).eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, pyq: { id, ...updateData } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete PYQ
pyqsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb.from('pyq_questions').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('DELETE_PYQ', 'PYQ', id, 'Deleted PYQ record');
    res.json({ success: true, message: 'PYQ deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
