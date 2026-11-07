import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import {
  getSubjectsWithMeta,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  getChaptersBySubject,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters
} from '../supabaseDb.ts';

export const subjectsRouter = Router();

subjectsRouter.use(authenticateUser);

// GET all subjects with categories, total chapters, and published tests
subjectsRouter.get('/', async (req, res) => {
  try {
    const subjects = await getSubjectsWithMeta();
    res.json({ subjects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Subject
subjectsRouter.post('/', requireAdmin, async (req, res) => {
  const { name, code, description, icon = 'BookOpen' } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Subject name and code are required' });
  }

  try {
    const created = await createSubject({ name, code, description, icon });
    res.status(201).json({ success: true, subject: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Subject
subjectsRouter.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, code, description, icon, is_active } = req.body;

  try {
    const updated = await updateSubject(id, {
      name,
      code,
      description,
      icon,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });
    res.json({ success: true, subject: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Subject (safe check)
subjectsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteSubject(id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reorder Subjects
subjectsRouter.post('/reorder', requireAdmin, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array required' });
  }

  try {
    await reorderSubjects(orderedIds);
    res.json({ success: true, message: 'Subjects reordered.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET chapters for a specific subject
subjectsRouter.get('/:id/chapters', async (req, res) => {
  const { id } = req.params;
  const includeInactive = req.query.include_inactive === 'true';
  const studentId = req.user?.id || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);

  try {
    const chapters = await getChaptersBySubject(id, includeInactive, studentId);
    res.json({ chapters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Chapter
subjectsRouter.post('/chapters', requireAdmin, async (req, res) => {
  const { subject_id, category_id, chapter_number, name, description, is_active } = req.body;

  if (!subject_id || !name || chapter_number === undefined) {
    return res.status(400).json({ error: 'Subject, chapter number, and chapter name are required.' });
  }

  try {
    const newChapter = await createChapter({
      subject_id,
      category_id: category_id || null,
      chapter_number: Number(chapter_number),
      name,
      description: description || '',
      is_active: is_active !== undefined ? Boolean(is_active) : true
    });
    res.status(201).json({ success: true, chapter: newChapter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Chapter
subjectsRouter.put('/chapters/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, chapter_number, description, is_active, category_id, display_order } = req.body;

  try {
    const updated = await updateChapter(id, {
      name,
      chapter_number: chapter_number !== undefined ? Number(chapter_number) : undefined,
      description,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      category_id: category_id !== undefined ? category_id : undefined,
      display_order: display_order !== undefined ? Number(display_order) : undefined
    });
    res.json({ success: true, chapter: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete / Deactivate Chapter
subjectsRouter.delete('/chapters/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;

  try {
    const result = await deleteChapter(id, force === 'true');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reorder Chapters
subjectsRouter.post('/chapters/reorder', requireAdmin, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array is required' });
  }

  try {
    await reorderChapters(orderedIds);
    res.json({ success: true, message: 'Chapters reordered successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
