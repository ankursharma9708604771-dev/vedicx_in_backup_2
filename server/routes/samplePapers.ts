import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { getSamplePapers, logAuditEvent } from '../supabaseDb.ts';
import { supabaseServerClient } from '../supabase.ts';

export const samplePapersRouter = Router();

samplePapersRouter.use(authenticateUser);

// GET all sample papers
samplePapersRouter.get('/', async (req, res) => {
  const { subject_id, access_type, paper_type } = req.query;
  const isStudent = req.user?.role !== 'admin';

  try {
    const papers = await getSamplePapers({
      subject_id: subject_id as string,
      access_type: access_type as string,
      paper_type: paper_type as string,
      isStudent
    });
    res.json({ sample_papers: papers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single sample paper by ID
samplePapersRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { data, error } = await sb
      .from('sample_papers')
      .select('*, subjects(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Sample paper not found' });
    }

    const paper = {
      ...data,
      subject_name: data.subjects?.name || '',
      sections: data.sections_json ? (typeof data.sections_json === 'string' ? JSON.parse(data.sections_json) : data.sections_json) : []
    };

    res.json({ sample_paper: paper });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Sample Paper
samplePapersRouter.post('/', requireAdmin, async (req, res) => {
  const {
    title,
    subject_id,
    year_set,
    description = '',
    file_url = '',
    file_size = '1.5 MB',
    access_type = 'free',
    status = 'published',
    paper_type = 'pdf',
    sections = []
  } = req.body;

  if (!title || !subject_id || !year_set) {
    return res.status(400).json({ error: 'Title, Subject and Year/Set are required.' });
  }

  if (paper_type === 'pdf' && !file_url) {
    return res.status(400).json({ error: 'PDF file or URL is required for PDF sample paper.' });
  }

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const id = `sp-${Date.now().toString(36)}`;
  const finalFileUrl = file_url || `/sample-papers/${id}-interactive`;
  const sectionsJson = Array.isArray(sections) && sections.length > 0 ? JSON.stringify(sections) : null;

  const newPaper = {
    id,
    title,
    subject_id,
    year_set,
    description,
    file_url: finalFileUrl,
    file_size,
    access_type,
    status,
    paper_type,
    sections_json: sectionsJson,
    download_count: 0
  };

  try {
    const { error } = await sb.from('sample_papers').insert([newPaper]);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('CREATE_SAMPLE_PAPER', 'SAMPLE_PAPER', id, `Added ${paper_type.toUpperCase()} sample paper: ${title}`);

    res.status(201).json({
      success: true,
      sample_paper: {
        ...newPaper,
        sections: sections || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Sample Paper
samplePapersRouter.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    subject_id,
    year_set,
    description,
    file_url,
    file_size,
    access_type,
    status,
    paper_type,
    sections
  } = req.body;

  const sb = supabaseServerClient;
  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (subject_id !== undefined) updateData.subject_id = subject_id;
  if (year_set !== undefined) updateData.year_set = year_set;
  if (description !== undefined) updateData.description = description;
  if (file_url !== undefined) updateData.file_url = file_url;
  if (file_size !== undefined) updateData.file_size = file_size;
  if (access_type !== undefined) updateData.access_type = access_type;
  if (status !== undefined) updateData.status = status;
  if (paper_type !== undefined) updateData.paper_type = paper_type;
  if (sections !== undefined) {
    updateData.sections_json = Array.isArray(sections) && sections.length > 0 ? JSON.stringify(sections) : null;
  }

  try {
    const { error } = await sb.from('sample_papers').update(updateData).eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      sample_paper: { id, ...updateData, sections: sections || [] }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Sample Paper
samplePapersRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { error } = await sb.from('sample_papers').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await logAuditEvent('DELETE_SAMPLE_PAPER', 'SAMPLE_PAPER', id, 'Deleted sample paper');
    res.json({ success: true, message: 'Sample paper deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Increment download count
samplePapersRouter.post('/:id/download', async (req, res) => {
  const { id } = req.params;
  const sb = supabaseServerClient;

  if (!sb) {
    return res.status(500).json({ error: 'Database service unavailable' });
  }

  try {
    const { data } = await sb.from('sample_papers').select('download_count').eq('id', id).maybeSingle();
    if (data) {
      await sb.from('sample_papers').update({ download_count: (data.download_count || 0) + 1 }).eq('id', id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
