import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Upload,
  CheckCircle2,
  XCircle,
  X,
  FileCheck,
  Image,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Subject, Chapter, Question, MockTestDetail } from '../../types';
import { api } from '../../services/api';

interface QuestionBankTabProps {
  subjects: Subject[];
  onAddNew: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  subjects,
  onAddNew,
  showNotification
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, total_pages: 1 });
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [mockTestsList, setMockTestsList] = useState<MockTestDetail[]>([]);
  const [targetTestId, setTargetTestId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load chapters when subject changes
  useEffect(() => {
    async function loadChapters() {
      if (!selectedSubject) {
        setChapters([]);
        setSelectedChapter('');
        return;
      }
      try {
        const res = await api.getChapters(selectedSubject);
        setChapters(res.chapters);
      } catch (err) {
        console.error(err);
      }
    }
    loadChapters();
  }, [selectedSubject]);

  const loadQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedChapter) params.chapter_id = selectedChapter;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedType) params.question_type = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;

      const res = await api.getQuestions(params);
      setQuestions(res.questions);
      setPagination(res.pagination);
      setSelectedIds([]);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, [selectedSubject, selectedChapter, selectedDifficulty, selectedType, selectedStatus]);

  // Bulk actions
  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.bulkQuestionAction(action, selectedIds);
      showNotification('success', res.message);
      loadQuestions(pagination.page);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Open Bulk Assign to Mock Test modal
  const handleOpenBulkAssign = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.getMockTests();
      setMockTestsList(res.mock_tests);
      if (res.mock_tests.length > 0) {
        setTargetTestId(res.mock_tests[0].id);
      }
      setAssignModalOpen(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Could not load mock tests');
    }
  };

  const handleConfirmBulkAssign = async () => {
    if (!targetTestId) return;
    try {
      const res = await api.bulkAssignQuestions(targetTestId, selectedIds);
      showNotification('success', res.message);
      setAssignModalOpen(false);
      loadQuestions(pagination.page);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete / Archive single question
  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete or archive this question?')) return;
    try {
      const res = await api.deleteQuestion(id);
      showNotification('success', res.message);
      loadQuestions(pagination.page);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Restore archived question
  const handleRestore = async (id: string) => {
    try {
      const res = await api.restoreQuestion(id);
      showNotification('success', res.message);
      loadQuestions(pagination.page);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full Question Management: Create, edit, preview, archive, restore, and assign questions to mock tests.
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search questions by statement or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadQuestions(1)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {chapters.length > 0 && (
          <select
            value={selectedChapter}
            onChange={e => setSelectedChapter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none max-w-xs truncate"
          >
            <option value="">All Chapters</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>
                Ch {ch.chapter_number}: {ch.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedDifficulty}
          onChange={e => setSelectedDifficulty(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="mcq">MCQ (Single)</option>
          <option value="multiple_select">Multiple Select</option>
          <option value="true_false">True / False</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <button
          onClick={() => loadQuestions(1)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <span className="font-bold text-blue-900">
            {selectedIds.length} question(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBulkAssign}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Assign to Mock Test</span>
            </button>
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
            >
              Archive Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              Delete / Archive
            </button>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === questions.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(questions.map(q => q.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="p-3">Question Statement</th>
                <th className="p-3">Subject & Chapter</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Type</th>
                <th className="p-3">Correct Answer</th>
                <th className="p-3">Assigned Slots</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No questions found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                questions.map(q => {
                  const isChecked = selectedIds.includes(q.id);
                  const isArchived = q.status === 'archived';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) setSelectedIds([...selectedIds, q.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== q.id));
                          }}
                        />
                      </td>
                      <td className="p-3 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2">{q.question_text}</div>
                        {q.image_url && (
                          <div className="mt-1.5 p-1 bg-slate-50 border border-slate-200 rounded inline-block">
                            <img src={q.image_url} alt="Question Diagram" className="max-h-20 object-contain rounded bg-white shadow-2xs" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        <div className="font-bold">{q.subject_name}</div>
                        <div className="text-[10px] text-slate-400">{q.chapter_name}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'hard'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-3 font-mono uppercase text-slate-500 font-bold">
                        {q.question_type}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">
                        {q.correct_answer}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold">
                          {q.assigned_to_tests_count || 0}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            q.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : q.status === 'archived'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewQ(q)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 cursor-pointer"
                            title="Preview Question & NCERT Solution"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingQ(q)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 cursor-pointer"
                            title="Edit Question & Answer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isArchived ? (
                            <button
                              onClick={() => handleRestore(q.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                              title="Restore Archived Question"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteSingle(q.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Safe Delete / Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {questions.length} of {pagination.total} questions
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadQuestions(pagination.page - 1)}
              className="px-3 py-1 rounded-lg border bg-white disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold">
              Page {pagination.page} of {pagination.total_pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => loadQuestions(pagination.page + 1)}
              className="px-3 py-1 rounded-lg border bg-white disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewQ && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Question Preview & Verification
              </span>
              <button onClick={() => setPreviewQ(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{previewQ.subject_name}</span>
              <span>•</span>
              <span>{previewQ.chapter_name}</span>
              <span>•</span>
              <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 rounded">
                {previewQ.difficulty}
              </span>
            </div>

            <p className="text-base font-bold text-slate-900 leading-relaxed">
              {previewQ.question_text}
            </p>

            {previewQ.image_url && (
              <img
                src={previewQ.image_url}
                alt="Diagram"
                className="max-h-48 rounded-lg border object-contain"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${previewQ.correct_answer?.includes('A') ? 'bg-emerald-50 border-emerald-300 font-bold' : 'border-slate-200'}`}>
                <strong>A:</strong> {previewQ.option_a}
              </div>
              <div className={`p-2.5 rounded-lg border ${previewQ.correct_answer?.includes('B') ? 'bg-emerald-50 border-emerald-300 font-bold' : 'border-slate-200'}`}>
                <strong>B:</strong> {previewQ.option_b}
              </div>
              {previewQ.option_c && (
                <div className={`p-2.5 rounded-lg border ${previewQ.correct_answer?.includes('C') ? 'bg-emerald-50 border-emerald-300 font-bold' : 'border-slate-200'}`}>
                  <strong>C:</strong> {previewQ.option_c}
                </div>
              )}
              {previewQ.option_d && (
                <div className={`p-2.5 rounded-lg border ${previewQ.correct_answer?.includes('D') ? 'bg-emerald-50 border-emerald-300 font-bold' : 'border-slate-200'}`}>
                  <strong>D:</strong> {previewQ.option_d}
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>Correct Answer: {previewQ.correct_answer}</span>
              <span>+{previewQ.marks} Marks {previewQ.negative_marks > 0 ? `(-${previewQ.negative_marks})` : ''}</span>
            </div>

            {previewQ.explanation && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">NCERT Step-by-Step Solution:</span>
                {previewQ.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          subjects={subjects}
          onClose={() => setEditingQ(null)}
          onSaved={() => {
            setEditingQ(null);
            showNotification('success', 'Question updated successfully.');
            loadQuestions(pagination.page);
          }}
          showNotification={showNotification}
        />
      )}

      {/* BULK ASSIGN TO MOCK TEST MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Assign Questions to Test</h3>
              <button onClick={() => setAssignModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Assign {selectedIds.length} selected question(s) to which mock test slot?
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Mock Test</label>
              <select
                value={targetTestId}
                onChange={e => setTargetTestId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border rounded-xl"
              >
                {mockTestsList.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.subject_name}] {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkAssign}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* EDIT QUESTION MODAL (Full Feature Form)                                    */
/* -------------------------------------------------------------------------- */
const EditQuestionModal: React.FC<{
  question: Question;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}> = ({ question, subjects, onClose, onSaved, showNotification }) => {
  const [subjectId, setSubjectId] = useState(question.subject_id);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState(question.chapter_id);
  const [topic, setTopic] = useState(question.topic || '');
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [questionType, setQuestionType] = useState(question.question_type);
  const [questionText, setQuestionText] = useState(question.question_text);
  const [optionA, setOptionA] = useState(question.option_a);
  const [optionB, setOptionB] = useState(question.option_b);
  const [optionC, setOptionC] = useState(question.option_c || '');
  const [optionD, setOptionD] = useState(question.option_d || '');
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || 'A');
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [imageUrl, setImageUrl] = useState(question.image_url || '');
  const [marks, setMarks] = useState(question.marks);
  const [negativeMarks, setNegativeMarks] = useState(question.negative_marks);
  const [status, setStatus] = useState(question.status);
  const [source, setSource] = useState(question.source || 'NCERT');
  const [sourceYear, setSourceYear] = useState(question.source_year?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadChapters() {
      if (!subjectId) return;
      const res = await api.getChapters(subjectId);
      setChapters(res.chapters);
    }
    loadChapters();
  }, [subjectId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await api.uploadFile(file);
      setImageUrl(res.file.file_url);
      showNotification('success', 'Diagram image uploaded.');
    } catch (err: any) {
      showNotification('error', err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!questionText || !optionA || !optionB || !correctAnswer) {
      showNotification('error', 'Please fill required fields (Question, Options A/B, Correct Answer)');
      return;
    }

    try {
      setLoading(true);
      await api.updateQuestion(question.id, {
        subject_id: subjectId,
        chapter_id: chapterId,
        topic,
        difficulty,
        question_type: questionType,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        explanation,
        image_url: imageUrl,
        marks,
        negative_marks: negativeMarks,
        status,
        source,
        source_year: sourceYear ? Number(sourceYear) : undefined
      });
      onSaved();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-lg">Edit Question Details</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            <label className="block font-bold text-slate-700 uppercase mb-1">Chapter</label>
            <select
              value={chapterId}
              onChange={e => setChapterId(e.target.value)}
              className="w-full p-2 border rounded-xl truncate"
            >
              {chapters.map(ch => (
                <option key={ch.id} value={ch.id}>Ch {ch.chapter_number}: {ch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full p-2 border rounded-xl"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Type</label>
            <select
              value={questionType}
              onChange={e => setQuestionType(e.target.value as any)}
              className="w-full p-2 border rounded-xl"
            >
              <option value="mcq">MCQ (Single)</option>
              <option value="multiple_select">Multiple Select</option>
              <option value="true_false">True / False</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Marks (+)</label>
            <input
              type="number"
              step="0.5"
              value={marks}
              onChange={e => setMarks(Number(e.target.value))}
              className="w-full p-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Neg Marks (-)</label>
            <input
              type="number"
              step="0.25"
              value={negativeMarks}
              onChange={e => setNegativeMarks(Number(e.target.value))}
              className="w-full p-2 border rounded-xl"
            />
          </div>
        </div>

        {/* Question Statement */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Question Statement</label>
          <textarea
            rows={3}
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            className="w-full text-xs p-2.5 border rounded-xl"
          />
        </div>

        {/* Diagram image upload & preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase flex items-center gap-1.5 text-[11px]">
              <Image className="w-4 h-4 text-blue-600" />
              <span>Question Diagram / Geometric Figure</span>
            </span>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
              >
                Remove Diagram
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{uploadingImage ? 'Uploading...' : imageUrl ? 'Replace Diagram' : 'Upload Diagram'}</span>
              <input type="file" accept="image/*,.svg" onChange={handleImageUpload} className="hidden" />
            </label>
            {imageUrl && (
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{imageUrl}</span>
            )}
          </div>

          {imageUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 inline-block shadow-2xs">
              <img
                src={imageUrl}
                alt="Diagram Preview"
                className="max-h-28 max-w-xs object-contain rounded"
              />
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Option A</label>
            <input
              type="text"
              value={optionA}
              onChange={e => setOptionA(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Option B</label>
            <input
              type="text"
              value={optionB}
              onChange={e => setOptionB(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />
          </div>
          {questionType !== 'true_false' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Option C</label>
                <input
                  type="text"
                  value={optionC}
                  onChange={e => setOptionC(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Option D</label>
                <input
                  type="text"
                  value={optionD}
                  onChange={e => setOptionD(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </>
          )}
        </div>

        {/* Correct answer key & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Correct Answer Key (e.g. A or A,B)
            </label>
            <input
              type="text"
              value={correctAnswer}
              onChange={e => setCorrectAnswer(e.target.value.toUpperCase())}
              className="w-full p-2 border rounded-xl font-mono uppercase font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full p-2 border rounded-xl font-semibold"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Source / Year</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />
          </div>
        </div>

        {/* Detailed Explanation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Detailed Explanation / NCERT Solution
          </label>
          <textarea
            rows={4}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            className="w-full text-xs p-2.5 border rounded-xl"
          />
        </div>

        <div className="pt-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Question Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
