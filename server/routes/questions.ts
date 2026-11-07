import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  logAuditEvent
} from '../supabaseDb.ts';
import { supabaseServerClient } from '../supabase.ts';

export const questionsRouter = Router();

questionsRouter.use(authenticateUser);

// GET Questions with advanced filters & pagination
questionsRouter.get('/', async (req, res) => {
  const {
    subject_id,
    chapter_id,
    difficulty,
    question_type,
    status,
    search,
    page = 1,
    limit = 20
  } = req.query;

  try {
    const result = await getQuestions({
      subject_id: subject_id as string,
      chapter_id: chapter_id as string,
      difficulty: difficulty as string,
      question_type: question_type as string,
      status: status as string,
      search: search as string,
      page: Number(page),
      limit: Number(limit)
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single question
questionsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  try {
    if (!sb) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data, error } = await sb
      .from('questions')
      .select('*, subjects(name), chapters(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = {
      ...data,
      subject_name: data.subjects?.name || '',
      chapter_name: data.chapters?.name || ''
    };

    res.json({ question });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Question (Admin Manual Question Entry)
questionsRouter.post('/', requireAdmin, async (req, res) => {
  const {
    subject_id,
    chapter_id,
    topic,
    difficulty = 'medium',
    question_type = 'mcq',
    question_text,
    option_a,
    option_b,
    option_c = '',
    option_d = '',
    correct_answer,
    explanation = '',
    image_url = '',
    marks = 1.0,
    negative_marks = 0.0,
    status = 'published',
    source = 'NCERT',
    source_year
  } = req.body;

  if (!subject_id || !chapter_id || !question_text || !option_a || !option_b || !correct_answer) {
    return res.status(400).json({ error: 'Subject, chapter, question text, Option A, Option B, and Correct Answer are required.' });
  }

  try {
    const created = await createQuestion({
      subject_id,
      chapter_id,
      topic,
      difficulty,
      question_type,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      image_url,
      marks,
      negative_marks,
      status,
      source,
      source_year
    });
    res.status(201).json({ success: true, question: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Question
questionsRouter.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = await updateQuestion(id, updates);
    await logAuditEvent('UPDATE_QUESTION', 'QUESTION', id, 'Updated question content/settings');
    res.json({ success: true, question: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Safe Delete / Archive Question
questionsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteQuestion(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore Question (unarchive)
questionsRouter.post('/:id/restore', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb.from('questions').update({ is_deleted: false, status: 'published' }).eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    await logAuditEvent('RESTORE_QUESTION', 'QUESTION', id, 'Question restored to published state.');
    res.json({ success: true, message: 'Question restored successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Assign to Mock Test
questionsRouter.post('/bulk-assign', requireAdmin, async (req, res) => {
  const { mock_test_id, question_ids } = req.body;
  if (!mock_test_id || !Array.isArray(question_ids) || question_ids.length === 0) {
    return res.status(400).json({ error: 'mock_test_id and question_ids array are required' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { data: test, error: testErr } = await sb.from('mock_tests').select('id').eq('id', mock_test_id).maybeSingle();
    if (testErr) {
      return res.status(500).json({ error: testErr.message });
    }
    if (!test) {
      return res.status(404).json({ error: 'Mock test not found' });
    }

    const { data: maxRow } = await sb
      .from('mock_test_questions')
      .select('display_order')
      .eq('mock_test_id', mock_test_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextOrder = (maxRow?.display_order || 0) + 1;
    const mappings = question_ids.map(qId => ({
      id: `mtq-${mock_test_id}-${qId}`,
      mock_test_id,
      question_id: qId,
      display_order: nextOrder++
    }));

    const { error: upsertErr } = await sb.from('mock_test_questions').upsert(mappings, { onConflict: 'mock_test_id,question_id' });
    if (upsertErr) {
      return res.status(500).json({ error: upsertErr.message });
    }

    const { data: mtq } = await sb.from('mock_test_questions').select('questions(marks)').eq('mock_test_id', mock_test_id);
    const totalQ = mtq?.length || 0;
    const totalMarks = (mtq || []).reduce((acc: number, m: any) => acc + (Number(m.questions?.marks) || 1), 0);

    await sb.from('mock_tests').update({
      total_questions: totalQ,
      max_marks: totalMarks,
      passing_marks: Math.round(totalMarks * 0.4 * 10) / 10
    }).eq('id', mock_test_id);

    res.json({ success: true, message: `Assigned ${question_ids.length} question(s) to test.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Action (publish, archive, delete)
questionsRouter.post('/bulk-action', requireAdmin, async (req, res) => {
  const { action, question_ids } = req.body;
  if (!action || !Array.isArray(question_ids) || question_ids.length === 0) {
    return res.status(400).json({ error: 'Action and array of question_ids are required.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    if (action === 'publish') {
      await sb.from('questions').update({ status: 'published', is_deleted: false }).in('id', question_ids);
    } else if (action === 'archive') {
      await sb.from('questions').update({ status: 'archived' }).in('id', question_ids);
    } else if (action === 'delete') {
      for (const qId of question_ids) {
        const { count } = await sb.from('student_answers').select('*', { count: 'exact', head: true }).eq('question_id', qId);
        if ((count || 0) > 0) {
          await sb.from('questions').update({ is_deleted: true, status: 'archived' }).eq('id', qId);
        } else {
          await sb.from('mock_test_questions').delete().eq('question_id', qId);
          await sb.from('questions').delete().eq('id', qId);
        }
      }
    }

    await logAuditEvent('BULK_QUESTION_ACTION', 'QUESTION', 'MULTIPLE', `Executed bulk action ${action} on ${question_ids.length} questions.`);
    res.json({ success: true, message: `Bulk action "${action}" completed on ${question_ids.length} question(s).` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download sample CSV format
questionsRouter.get('/sample-csv', (_req, res) => {
  const sampleCsv = `subject_id,chapter_id,topic,difficulty,question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,marks,negative_marks,source,source_year
mathematics,math-ch1,Real Numbers HCF,easy,mcq,If HCF(26, 169) = 13, then LCM(26, 169) is:,13,26,338,52,C,Product of numbers = HCF * LCM => LCM = (26 * 169) / 13 = 338,1.0,0.0,CBSE Board,2023
science,sci-ch1,Chemical Reactions,medium,mcq,Which gas is released when zinc reacts with dilute sulphuric acid?,Oxygen,Hydrogen,Carbon dioxide,Nitrogen,B,Zn + H2SO4 -> ZnSO4 + H2 (Hydrogen gas evolved with pop sound),1.0,0.0,NCERT Exemplar,2022
social-science,sst-hist-1,French Revolution,easy,mcq,When did the French Revolution take place?,1789,1799,1804,1815,A,The French Revolution started on 14th July 1789 with the storming of the Bastille,1.0,0.0,NCERT Textbook,2023`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="vedicx_question_import_sample.csv"');
  res.send(sampleCsv);
});

// CSV Upload & Import with Row-by-Row Validation & Downloadable Error Report
questionsRouter.post('/import-csv', requireAdmin, async (req, res) => {
  const { csv_content, dry_run = false } = req.body;

  if (!csv_content || typeof csv_content !== 'string') {
    return res.status(400).json({ error: 'csv_content string is required.' });
  }

  const lines = csv_content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV file is empty or missing data rows.' });
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const validRows: any[] = [];
  const errors: Array<{ row_number: number; question_text: string; reason: string }> = [];

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  // Cache subjects and chapters for validation
  const subjectIds = new Set<string>();
  const chapterIds = new Set<string>();

  const { data: subs } = await sb.from('subjects').select('id');
  const { data: chs } = await sb.from('chapters').select('id');
  subs?.forEach(s => subjectIds.add(s.id));
  chs?.forEach(c => chapterIds.add(c.id));

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const line = lines[i];

    const values: string[] = [];
    let insideQuotes = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      rowObj[h] = val;
    });

    const subject_id = rowObj['subject_id'];
    const chapter_id = rowObj['chapter_id'];
    const question_text = rowObj['question_text'];
    const option_a = rowObj['option_a'];
    const option_b = rowObj['option_b'];
    const correct_answer = rowObj['correct_answer'];
    const question_type = (rowObj['question_type'] || 'mcq').toLowerCase();

    // Required fields
    if (!subject_id || !chapter_id || !question_text || !option_a || !option_b || !correct_answer) {
      errors.push({
        row_number: rowNum,
        question_text: question_text || 'Missing text',
        reason: 'Missing mandatory fields (subject_id, chapter_id, question_text, option_a, option_b, or correct_answer)'
      });
      continue;
    }

    // Check subject exists
    if (!subjectIds.has(subject_id)) {
      errors.push({
        row_number: rowNum,
        question_text,
        reason: `Invalid subject_id '${subject_id}'. Must be science, mathematics, or social-science.`
      });
      continue;
    }

    // Check chapter exists
    if (!chapterIds.has(chapter_id)) {
      errors.push({
        row_number: rowNum,
        question_text,
        reason: `Invalid chapter_id '${chapter_id}'. Chapter does not exist in database.`
      });
      continue;
    }

    // Check question type
    if (!['mcq', 'multiple_select', 'true_false'].includes(question_type)) {
      errors.push({
        row_number: rowNum,
        question_text,
        reason: `Invalid question_type '${question_type}'. Must be 'mcq', 'multiple_select', or 'true_false'.`
      });
      continue;
    }

    validRows.push({
      id: `q-csv-${Date.now()}-${i}`,
      class: '10',
      subject_id,
      chapter_id,
      topic: rowObj['topic'] || '',
      difficulty: ['easy', 'medium', 'hard'].includes((rowObj['difficulty'] || '').toLowerCase()) ? rowObj['difficulty'].toLowerCase() : 'medium',
      question_type,
      question_text,
      option_a,
      option_b,
      option_c: rowObj['option_c'] || '',
      option_d: rowObj['option_d'] || '',
      correct_answer: correct_answer.toUpperCase().trim(),
      explanation: rowObj['explanation'] || '',
      marks: rowObj['marks'] ? Number(rowObj['marks']) : 1.0,
      negative_marks: rowObj['negative_marks'] ? Number(rowObj['negative_marks']) : 0.0,
      status: 'published',
      source: rowObj['source'] || 'CSV Import',
      source_year: rowObj['source_year'] ? Number(rowObj['source_year']) : null,
      is_deleted: false
    });
  }

  if (dry_run) {
    return res.json({
      preview: true,
      total_rows: lines.length - 1,
      valid_count: validRows.length,
      error_count: errors.length,
      errors,
      sample_valid: validRows.slice(0, 3)
    });
  }

  if (validRows.length > 0) {
    try {
      const { error: insErr } = await sb.from('questions').insert(validRows);
      if (insErr) {
        return res.status(500).json({ error: `Supabase insert failed: ${insErr.message}` });
      }
    } catch (e: any) {
      return res.status(500).json({ error: `Supabase insert exception: ${e.message}` });
    }

    await logAuditEvent('CSV_IMPORT_QUESTIONS', 'QUESTION', 'MULTIPLE', `Imported ${validRows.length} questions from CSV. Failed: ${errors.length}.`);
  }

  res.json({
    success: true,
    message: `CSV Import completed: ${validRows.length} question(s) successfully added, ${errors.length} error(s).`,
    imported_count: validRows.length,
    error_count: errors.length,
    errors
  });
});
