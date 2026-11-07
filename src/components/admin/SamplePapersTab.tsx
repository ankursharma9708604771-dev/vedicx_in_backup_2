import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  PlusCircle,
  Download,
  Trash2,
  Edit,
  Eye,
  FileCheck,
  CheckCircle2,
  X,
  FileQuestion,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Subject, SamplePaper, SamplePaperSection, SamplePaperQuestion } from '../../types';
import { api } from '../../services/api';

interface SamplePapersTabProps {
  subjects: Subject[];
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const SamplePapersTab: React.FC<SamplePapersTabProps> = ({ subjects, showNotification }) => {
  const [papers, setPapers] = useState<SamplePaper[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [pdfUploadModalOpen, setPdfUploadModalOpen] = useState(false);
  const [manualCreateModalOpen, setManualCreateModalOpen] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<SamplePaper | null>(null);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const res = await api.getSamplePapers({ role: 'admin' });
      setPapers(res.sample_papers);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load sample papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sample paper?')) return;
    try {
      await api.deleteSamplePaper(id);
      showNotification('success', 'Sample paper deleted.');
      loadPapers();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleTogglePublish = async (p: SamplePaper) => {
    try {
      const nextStatus = p.status === 'published' ? 'draft' : 'published';
      await api.updateSamplePaper(p.id, { status: nextStatus });
      showNotification('success', `Paper status changed to ${nextStatus}.`);
      loadPapers();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with TWO clearly distinct buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sample Papers Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage official CBSE sample question papers. Choose between uploading a PDF or creating a structured paper manually.
          </p>
        </div>

        {/* TWO DISTINCT CREATION ACTIONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPdfUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>+ Upload PDF</span>
          </button>

          <button
            onClick={() => setManualCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Paper Manually</span>
          </button>
        </div>
      </div>

      {/* Papers Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {papers.map(p => {
          const isPdf = p.paper_type !== 'manual';
          return (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.year_set}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isPdf ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {isPdf ? 'PDF Upload' : 'Manual Structured'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.access_type === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.access_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug">{p.title}</h4>
                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>{p.subject_name}</span>
                  <span>•</span>
                  <span>{p.download_count} Downloads</span>
                  {!isPdf && p.sections && (
                    <>
                      <span>•</span>
                      <span>{p.sections.length} Sections</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPaper(p)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                    title="Preview Paper"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {isPdf && p.file_url && (
                    <a
                      href={p.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-blue-600 rounded cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePublish(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      p.status === 'published'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {p.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete Paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL A: UPLOAD SAMPLE PAPER PDF */}
      {pdfUploadModalOpen && (
        <UploadPdfModal
          subjects={subjects}
          onClose={() => setPdfUploadModalOpen(false)}
          onSuccess={() => {
            setPdfUploadModalOpen(false);
            showNotification('success', 'PDF sample paper uploaded successfully!');
            loadPapers();
          }}
          showNotification={showNotification}
        />
      )}

      {/* MODAL B: CREATE MANUAL STRUCTURED SAMPLE PAPER */}
      {manualCreateModalOpen && (
        <ManualCreateSamplePaperModal
          subjects={subjects}
          onClose={() => setManualCreateModalOpen(false)}
          onSuccess={() => {
            setManualCreateModalOpen(false);
            showNotification('success', 'Manual sample paper created successfully!');
            loadPapers();
          }}
          showNotification={showNotification}
        />
      )}

      {/* PREVIEW PAPER MODAL */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border shadow-2xl flex flex-col max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewPaper.title}</h3>
                <p className="text-xs text-slate-500">{previewPaper.year_set} • {previewPaper.subject_name}</p>
              </div>
              <button onClick={() => setPreviewPaper(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {previewPaper.paper_type === 'manual' && previewPaper.sections ? (
              <div className="space-y-6 text-xs">
                {previewPaper.sections.map((sec, sIdx) => (
                  <div key={sec.id || sIdx} className="border rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{sec.title}</h4>
                      {sec.instructions && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{sec.instructions}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {sec.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3 bg-white border rounded-lg space-y-2">
                          <div className="flex items-center justify-between font-bold">
                            <span>Q{q.question_number || qIdx + 1}.</span>
                            <span className="text-blue-600">+{q.marks} Marks</span>
                          </div>
                          <p className="text-slate-900 font-semibold text-xs">{q.question_text}</p>
                          {q.options && (
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-1.5 border rounded"><strong>A:</strong> {q.options.A}</div>
                              <div className="p-1.5 border rounded"><strong>B:</strong> {q.options.B}</div>
                              {q.options.C && <div className="p-1.5 border rounded"><strong>C:</strong> {q.options.C}</div>}
                              {q.options.D && <div className="p-1.5 border rounded"><strong>D:</strong> {q.options.D}</div>}
                            </div>
                          )}
                          {q.solution_text && (
                            <div className="p-2 bg-emerald-50 text-emerald-900 rounded text-[11px]">
                              <strong>Solution:</strong> {q.solution_text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <FileText className="w-16 h-16 text-blue-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">{previewPaper.title}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">{previewPaper.description}</p>
                <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl text-xs font-mono font-bold">
                  File Size: {previewPaper.file_size}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-MODAL A: UPLOAD PDF SAMPLE PAPER                                       */
/* -------------------------------------------------------------------------- */
const UploadPdfModal: React.FC<{
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}> = ({ subjects, onClose, onSuccess, showNotification }) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'mathematics');
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [paperSet, setPaperSet] = useState('Official CBSE SQP Set 1');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<'free' | 'premium'>('free');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showNotification('error', 'Please select a valid PDF file.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadFile(file);
      setUploadedFileUrl(res.file.file_url);
      setUploadedFileSize(res.file.file_size);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      showNotification('success', 'PDF uploaded successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'PDF upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !uploadedFileUrl) {
      showNotification('error', 'Please provide a title and upload the PDF file.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createSamplePaper({
        title,
        subject_id: subjectId,
        year_set: `${academicYear} • ${paperSet}`,
        description,
        file_url: uploadedFileUrl,
        file_size: uploadedFileSize || '1.8 MB',
        access_type: accessType,
        status,
        paper_type: 'pdf'
      });
      onSuccess();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Upload Sample Paper PDF</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Paper Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. CBSE Class 10 Science Official Model Paper 2025"
              className="w-full p-2.5 border rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full p-2.5 border rounded-xl"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                placeholder="2024-25"
                className="w-full p-2.5 border rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Paper Set</label>
              <input
                type="text"
                value={paperSet}
                onChange={e => setPaperSet(e.target.value)}
                placeholder="Set 1 / SQP"
                className="w-full p-2.5 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Access Type</label>
              <select
                value={accessType}
                onChange={e => setAccessType(e.target.value as any)}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="free">Free Access</option>
                <option value="premium">Premium Only (₹49)</option>
              </select>
            </div>
          </div>

          {/* PDF File Picker */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
            <input
              type="file"
              accept="application/pdf"
              id="sample-pdf-file"
              onChange={handlePdfUpload}
              className="hidden"
            />
            {uploadedFileUrl ? (
              <div className="text-emerald-700 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>PDF Ready ({uploadedFileSize})</span>
                <label htmlFor="sample-pdf-file" className="ml-2 text-blue-600 underline cursor-pointer">
                  Replace
                </label>
              </div>
            ) : (
              <label htmlFor="sample-pdf-file" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-slate-700 block">
                  {uploading ? 'Uploading PDF...' : 'Click to Browse & Upload PDF'}
                </span>
                <span className="text-[10px] text-slate-400">PDF up to 20MB supported</span>
              </label>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Latest CBSE board pattern with complete marking scheme..."
              className="w-full p-2 border rounded-xl"
            />
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !uploadedFileUrl}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Publish Sample Paper'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-MODAL B: CREATE SAMPLE PAPER MANUALLY (With Sections & Questions)      */
/* -------------------------------------------------------------------------- */
const ManualCreateSamplePaperModal: React.FC<{
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}> = ({ subjects, onClose, onSuccess, showNotification }) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'mathematics');
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [paperSet, setPaperSet] = useState('High-Yield Practice Set');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<'free' | 'premium'>('premium');

  // Structured Sections with Questions
  const [sections, setSections] = useState<SamplePaperSection[]>([
    {
      id: 'sec-1',
      title: 'Section A: Multiple Choice Questions',
      instructions: 'Questions 1 to 20 carry 1 mark each.',
      questions: [
        {
          id: 'q-man-1',
          question_number: 1,
          question_text: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x and y are prime numbers, then HCF(a, b) is:',
          options: { A: 'xy', B: 'xy²', C: 'x³y³', D: 'x²y²' },
          correct_answer: 'B',
          marks: 1,
          solution_text: 'Common prime factors are x (power 1) and y (power 2). HCF = xy².'
        }
      ]
    }
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Add Section
  const handleAddSection = () => {
    const nextNum = sections.length + 1;
    setSections([
      ...sections,
      {
        id: `sec-${Date.now()}`,
        title: `Section ${String.fromCharCode(64 + nextNum)}: Short Answer Questions`,
        instructions: `Questions carry ${nextNum * 2} marks each.`,
        questions: []
      }
    ]);
  };

  // Add Question to Section
  const handleAddQuestionToSection = (sectionIndex: number) => {
    const targetSection = sections[sectionIndex];
    const totalExistingQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

    const newQuestion: SamplePaperQuestion = {
      id: `q-man-${Date.now()}`,
      question_number: totalExistingQuestions + 1,
      question_text: '',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: 'A',
      marks: 1,
      solution_text: ''
    };

    const copy = [...sections];
    copy[sectionIndex].questions.push(newQuestion);
    setSections(copy);
  };

  const handleUpdateQuestion = (
    secIdx: number,
    qIdx: number,
    field: keyof SamplePaperQuestion,
    value: any
  ) => {
    const copy = [...sections];
    copy[secIdx].questions[qIdx] = {
      ...copy[secIdx].questions[qIdx],
      [field]: value
    };
    setSections(copy);
  };

  const handleRemoveQuestion = (secIdx: number, qIdx: number) => {
    const copy = [...sections];
    copy[secIdx].questions.splice(qIdx, 1);
    setSections(copy);
  };

  const handleSubmit = async () => {
    if (!title) {
      showNotification('error', 'Please enter a paper title.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createSamplePaper({
        title,
        subject_id: subjectId,
        year_set: `${academicYear} • ${paperSet}`,
        description,
        file_url: `/sample-papers/manual-${Date.now()}`,
        file_size: `${sections.reduce((acc, s) => acc + s.questions.length, 0)} Questions`,
        access_type: accessType,
        status: 'published',
        paper_type: 'manual',
        sections
      });
      onSuccess();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 border shadow-2xl flex flex-col max-h-[92vh] space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Create Sample Paper Manually</h3>
            <p className="text-xs text-slate-500">
              Build a complete structured examination paper with custom sections, marks, and model solutions.
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Paper Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. VEDICX Mathematics Standard Expected Board Paper"
                className="w-full p-2 border rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full p-2 border rounded-xl"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Access</label>
              <select
                value={accessType}
                onChange={e => setAccessType(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="free">Free Access</option>
                <option value="premium">Premium Only (₹49)</option>
              </select>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paper Sections & Questions ({sections.length} Sections)
              </span>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                + Add Another Section
              </button>
            </div>

            {sections.map((sec, sIdx) => (
              <div key={sec.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={e => {
                      const copy = [...sections];
                      copy[sIdx].title = e.target.value;
                      setSections(copy);
                    }}
                    placeholder="Section Title (e.g. Section A: MCQs)"
                    className="text-xs font-bold p-2 bg-white border rounded-lg"
                  />
                  <input
                    type="text"
                    value={sec.instructions || ''}
                    onChange={e => {
                      const copy = [...sections];
                      copy[sIdx].instructions = e.target.value;
                      setSections(copy);
                    }}
                    placeholder="Section Instructions (e.g. 1 Mark Each)"
                    className="text-xs p-2 bg-white border rounded-lg"
                  />
                </div>

                {/* Questions in this Section */}
                <div className="space-y-3">
                  {sec.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-3 bg-white border rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="font-mono text-slate-500">Q#{q.question_number}</span>
                        <div className="flex items-center gap-2">
                          <span>Marks:</span>
                          <input
                            type="number"
                            value={q.marks}
                            onChange={e => handleUpdateQuestion(sIdx, qIdx, 'marks', Number(e.target.value))}
                            className="w-14 p-1 border rounded text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(sIdx, qIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={q.question_text}
                        onChange={e => handleUpdateQuestion(sIdx, qIdx, 'question_text', e.target.value)}
                        placeholder="Question statement..."
                        className="w-full p-2 border rounded-lg"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={q.options?.A || ''}
                          onChange={e => {
                            const copy = [...sections];
                            copy[sIdx].questions[qIdx].options = {
                              ...(copy[sIdx].questions[qIdx].options || { A: '', B: '', C: '', D: '' }),
                              A: e.target.value
                            };
                            setSections(copy);
                          }}
                          placeholder="Option A"
                          className="p-1.5 border rounded text-[11px]"
                        />
                        <input
                          type="text"
                          value={q.options?.B || ''}
                          onChange={e => {
                            const copy = [...sections];
                            copy[sIdx].questions[qIdx].options = {
                              ...(copy[sIdx].questions[qIdx].options || { A: '', B: '', C: '', D: '' }),
                              B: e.target.value
                            };
                            setSections(copy);
                          }}
                          placeholder="Option B"
                          className="p-1.5 border rounded text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={q.correct_answer || ''}
                          onChange={e => handleUpdateQuestion(sIdx, qIdx, 'correct_answer', e.target.value)}
                          placeholder="Correct Answer (e.g. A or B)"
                          className="p-1.5 border rounded text-[11px] font-bold uppercase"
                        />
                        <input
                          type="text"
                          value={q.solution_text || ''}
                          onChange={e => handleUpdateQuestion(sIdx, qIdx, 'solution_text', e.target.value)}
                          placeholder="Solution / Step reasoning"
                          className="p-1.5 border rounded text-[11px]"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddQuestionToSection(sIdx)}
                    className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    + Add Question to {sec.title.split(':')[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save & Publish Manual Sample Paper'}
          </button>
        </div>
      </div>
    </div>
  );
};
