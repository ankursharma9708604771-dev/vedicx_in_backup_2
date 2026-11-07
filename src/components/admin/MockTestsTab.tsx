import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Subject, Chapter, MockTestDetail, Question } from '../../types';
import { api } from '../../services/api';

interface MockTestsTabProps {
  subjects: Subject[];
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const MockTestsTab: React.FC<MockTestsTabProps> = ({ subjects, showNotification }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || 'mathematics');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [tests, setTests] = useState<MockTestDetail[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [editModalTest, setEditModalTest] = useState<MockTestDetail | null>(null);
  const [assignModalTest, setAssignModalTest] = useState<MockTestDetail | null>(null);
  const [previewModalTest, setPreviewModalTest] = useState<MockTestDetail | null>(null);

  // Create slot modal
  const [createSlotOpen, setCreateSlotOpen] = useState(false);
  const [newSlotTitle, setNewSlotTitle] = useState('');
  const [newSlotDuration, setNewSlotDuration] = useState(45);
  const [newSlotMaxMarks, setNewSlotMaxMarks] = useState(25);
  const [newSlotPassingMarks, setNewSlotPassingMarks] = useState(10);
  const [newSlotAccessType, setNewSlotAccessType] = useState<'free' | 'premium'>('premium');

  const loadChapters = async () => {
    if (!selectedSubject) return;
    try {
      const res = await api.getChapters(selectedSubject);
      setChapters(res.chapters);
      if (res.chapters.length > 0) {
        setSelectedChapter(res.chapters[0].id);
      }
    } catch (err: any) {
      showNotification('error', 'Failed to load chapters.');
    }
  };

  useEffect(() => {
    loadChapters();
  }, [selectedSubject]);

  const loadTests = async () => {
    if (!selectedChapter) return;
    try {
      setLoading(true);
      const res = await api.getMockTests({ chapter_id: selectedChapter });
      setTests(res.mock_tests);
    } catch (err: any) {
      showNotification('error', 'Failed to load mock tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [selectedChapter]);

  // Toggle publish
  const handleTogglePublish = async (testId: string) => {
    try {
      const res = await api.togglePublishTest(testId);
      showNotification('success', res.message);
      loadTests();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Duplicate test
  const handleDuplicate = async (testId: string) => {
    try {
      const res = await api.duplicateMockTest(testId);
      showNotification('success', res.message);
      loadTests();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete test
  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Delete this mock test slot?')) return;
    try {
      const res = await api.deleteMockTest(testId);
      showNotification('success', res.message);
      loadTests();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Preview full test
  const handlePreviewTest = async (testId: string) => {
    try {
      const res = await api.getMockTestDetail(testId, 'admin');
      setPreviewModalTest(res.mock_test);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Create extra slot
  const handleCreateSlot = async () => {
    if (!newSlotTitle.trim()) {
      showNotification('error', 'Please enter a test title.');
      return;
    }
    try {
      const nextSlotNumber = tests.length + 1;
      await api.createMockTest({
        subject_id: selectedSubject,
        chapter_id: selectedChapter,
        test_number: nextSlotNumber,
        title: newSlotTitle,
        duration_minutes: Number(newSlotDuration),
        max_marks: Number(newSlotMaxMarks),
        passing_marks: Number(newSlotPassingMarks),
        access_type: newSlotAccessType,
        status: 'draft',
        description: `Class 10 Mock Test Slot ${nextSlotNumber}`
      });
      showNotification('success', `Created Test Slot ${nextSlotNumber}!`);
      setCreateSlotOpen(false);
      setNewSlotTitle('');
      loadTests();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Mock Test Slots Management</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold font-mono">
              {tests.length} Slots in Chapter
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            5 distinct test slots per chapter (245 total platform slots) with question reordering, manual input & access tiering.
          </p>
        </div>

        <button
          onClick={() => {
            setNewSlotTitle(`Test Slot ${tests.length + 1}`);
            setCreateSlotOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add 6th+ Test Slot</span>
        </button>
      </div>

      {/* Subject and Chapter Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="p-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={e => setSelectedChapter(e.target.value)}
          className="p-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl max-w-sm truncate"
        >
          {chapters.map(ch => (
            <option key={ch.id} value={ch.id}>
              Ch {ch.chapter_number}: {ch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Test Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Slot {t.test_number}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      t.access_type === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.access_type}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      t.status === 'published' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-base">{t.title}</h4>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>{t.total_questions} Questions</span>
                <span>•</span>
                <span>{t.duration_minutes} Mins</span>
                <span>•</span>
                <span>Max: {t.max_marks} Marks</span>
                <span>•</span>
                <span>Pass: {t.passing_marks}</span>
              </div>
            </div>

            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssignModalTest(t)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Manage Questions ({t.total_questions})
                </button>
                <button
                  onClick={() => handlePreviewTest(t.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title="Preview Test"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditModalTest(t)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title="Edit Settings"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTogglePublish(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    t.status === 'published'
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {t.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDuplicate(t.id)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                  title="Duplicate Test"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTest(t.id)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete Slot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE EXTRA SLOT MODAL */}
      {createSlotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Mock Test Slot</h3>
              <button onClick={() => setCreateSlotOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Slot Title</label>
                <input
                  type="text"
                  value={newSlotTitle}
                  onChange={e => setNewSlotTitle(e.target.value)}
                  className="w-full p-2 border rounded-xl font-bold"
                  placeholder="e.g. Comprehensive Chapter Mastery Test"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={newSlotDuration}
                    onChange={e => setNewSlotDuration(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newSlotMaxMarks}
                    onChange={e => setNewSlotMaxMarks(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={newSlotPassingMarks}
                    onChange={e => setNewSlotPassingMarks(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Access Tier</label>
                <select
                  value={newSlotAccessType}
                  onChange={e => setNewSlotAccessType(e.target.value as any)}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="premium">Premium Only (₹49)</option>
                  <option value="free">Free Access</option>
                </select>
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setCreateSlotOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleCreateSlot} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                Create Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalTest && (
        <EditMockTestModal
          mockTest={editModalTest}
          onClose={() => setEditModalTest(null)}
          onSaved={() => {
            setEditModalTest(null);
            showNotification('success', 'Test settings saved.');
            loadTests();
          }}
          showNotification={showNotification}
        />
      )}

      {/* ASSIGN & REORDER QUESTIONS MODAL (WITH DIRECT QUESTION CREATION) */}
      {assignModalTest && (
        <AssignQuestionsManagerModal
          mockTest={assignModalTest}
          subjects={subjects}
          currentSubjectId={selectedSubject}
          currentChapterId={selectedChapter}
          onClose={() => {
            setAssignModalTest(null);
            loadTests();
          }}
          showNotification={showNotification}
        />
      )}

      {/* PREVIEW MODAL */}
      {previewModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewModalTest.title}</h3>
                <p className="text-xs text-slate-500">
                  Duration: {previewModalTest.duration_minutes} Mins • Max Marks: {previewModalTest.max_marks} • Pass: {previewModalTest.passing_marks}
                </p>
              </div>
              <button onClick={() => setPreviewModalTest(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {(previewModalTest.questions || []).map((q, idx) => (
                <div key={q.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Q{idx + 1}. {q.topic || 'General'}</span>
                    <span className="text-blue-600">+{q.marks} Marks</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{q.question_text}</p>
                  {q.image_url && (
                    <div className="my-2 p-2 bg-white rounded border inline-block">
                      <img src={q.image_url} alt="Question diagram" className="max-h-48 object-contain" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white border rounded"><strong>A:</strong> {q.option_a}</div>
                    <div className="p-2 bg-white border rounded"><strong>B:</strong> {q.option_b}</div>
                    {q.option_c && <div className="p-2 bg-white border rounded"><strong>C:</strong> {q.option_c}</div>}
                    {q.option_d && <div className="p-2 bg-white border rounded"><strong>D:</strong> {q.option_d}</div>}
                  </div>
                  <div className="font-bold text-emerald-700">Correct Answer: {q.correct_answer}</div>
                  {q.explanation && (
                    <div className="text-slate-600 bg-white p-2 rounded border text-[11px]">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* EDIT MOCK TEST MODAL                                                       */
/* -------------------------------------------------------------------------- */
const EditMockTestModal: React.FC<{
  mockTest: MockTestDetail;
  onClose: () => void;
  onSaved: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}> = ({ mockTest, onClose, onSaved, showNotification }) => {
  const [title, setTitle] = useState(mockTest.title);
  const [duration, setDuration] = useState(mockTest.duration_minutes);
  const [maxMarks, setMaxMarks] = useState(mockTest.max_marks);
  const [passingMarks, setPassingMarks] = useState(mockTest.passing_marks);
  const [accessType, setAccessType] = useState(mockTest.access_type);
  const [status, setStatus] = useState(mockTest.status);
  const [description, setDescription] = useState(mockTest.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.updateMockTest(mockTest.id, {
        title,
        duration_minutes: Number(duration),
        max_marks: Number(maxMarks),
        passing_marks: Number(passingMarks),
        access_type: accessType,
        status,
        description
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
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-base">Edit Mock Test Details</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Duration (Min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full p-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Max Marks</label>
              <input
                type="number"
                value={maxMarks}
                onChange={e => setMaxMarks(Number(e.target.value))}
                className="w-full p-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Pass Marks</label>
              <input
                type="number"
                value={passingMarks}
                onChange={e => setPassingMarks(Number(e.target.value))}
                className="w-full p-2 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Access Type</label>
              <select
                value={accessType}
                onChange={e => setAccessType(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="free">Free Access</option>
                <option value="premium">Premium Only (₹49)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* ASSIGN & REORDER QUESTIONS MODAL WITH DIRECT MANUAL CREATION               */
/* -------------------------------------------------------------------------- */
const AssignQuestionsManagerModal: React.FC<{
  mockTest: MockTestDetail;
  subjects: Subject[];
  currentSubjectId: string;
  currentChapterId: string;
  onClose: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}> = ({ mockTest, subjects, currentSubjectId, currentChapterId, onClose, showNotification }) => {
  // Assigned questions in test
  const [assignedQuestions, setAssignedQuestions] = useState<Question[]>([]);
  // Candidate questions from bank
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [filterSubject, setFilterSubject] = useState(currentSubjectId);
  const [search, setSearch] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab mode in right panel: 'browse' vs 'create'
  const [rightPanelMode, setRightPanelMode] = useState<'browse' | 'create'>('browse');

  // Preview assigned question
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // --------------------------------------------------------------------------
  // MANUAL QUESTION CREATION FORM STATE
  // --------------------------------------------------------------------------
  const [qType, setQType] = useState<'mcq' | 'multiple_select' | 'true_false'>('mcq');
  const [qText, setQText] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qMarks, setQMarks] = useState(1.0);
  const [qNegativeMarks, setQNegativeMarks] = useState(0.0);
  const [qImageUrl, setQImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Options
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qOptionD, setQOptionD] = useState('');

  // Answer selections
  const [mcqAnswer, setMcqAnswer] = useState('A');
  const [multiAnswers, setMultiAnswers] = useState<string[]>(['A']);
  const [tfAnswer, setTfAnswer] = useState<'True' | 'False'>('True');

  // Detailed NCERT Explanation
  const [qExplanation, setQExplanation] = useState('');
  const [creating, setCreating] = useState(false);

  // Load assigned questions
  const loadAssigned = async () => {
    try {
      const res = await api.getMockTestDetail(mockTest.id, 'admin');
      setAssignedQuestions(res.mock_test.questions || []);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Load bank questions
  const loadBank = async () => {
    try {
      const res = await api.getQuestions({ subject_id: filterSubject, search, limit: 100 });
      setBankQuestions(res.questions);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadAssigned(), loadBank()]);
      setLoading(false);
    }
    init();
  }, [filterSubject]);

  // Add selected questions from bank to test
  const handleAddSelectedToTest = async () => {
    if (selectedBankIds.length === 0) return;
    const currentIds = assignedQuestions.map(q => q.id);
    const newIds = Array.from(new Set([...currentIds, ...selectedBankIds]));

    try {
      await api.assignQuestionsToTest(mockTest.id, newIds);
      showNotification('success', `Added ${selectedBankIds.length} question(s) to test.`);
      setSelectedBankIds([]);
      loadAssigned();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Remove question from test
  const handleRemoveFromTest = async (questionId: string) => {
    try {
      await api.removeQuestionFromTest(mockTest.id, questionId);
      showNotification('success', 'Question removed from test.');
      loadAssigned();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Move question up or down
  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assignedQuestions.length) return;

    const listCopy = [...assignedQuestions];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    setAssignedQuestions(listCopy);

    try {
      await api.reorderMockTestQuestions(mockTest.id, listCopy.map(q => q.id));
    } catch (err: any) {
      showNotification('error', err.message);
      loadAssigned();
    }
  };

  // Diagram image upload
  const handleDiagramUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const res = await api.uploadFile(file);
      setQImageUrl(res.file.file_url);
      showNotification('success', 'Diagram uploaded.');
    } catch (err: any) {
      showNotification('error', err.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset form
  const resetCreateForm = () => {
    setQText('');
    setQTopic('');
    setQDifficulty('medium');
    setQMarks(1.0);
    setQNegativeMarks(0.0);
    setQImageUrl('');
    setQOptionA('');
    setQOptionB('');
    setQOptionC('');
    setQOptionD('');
    setMcqAnswer('A');
    setMultiAnswers(['A']);
    setTfAnswer('True');
    setQExplanation('');
  };

  // Compute correct answer string
  const getComputedAnswer = () => {
    if (qType === 'mcq') return mcqAnswer;
    if (qType === 'multiple_select') return multiAnswers.sort().join(',');
    return tfAnswer;
  };

  // Save question directly to DB and add to this test
  const handleCreateAndAddToTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qText.trim()) {
      showNotification('error', 'Please enter question text.');
      return;
    }

    if (qType === 'mcq' && (!qOptionA.trim() || !qOptionB.trim())) {
      showNotification('error', 'Please provide at least Option A and Option B.');
      return;
    }

    if (qType === 'multiple_select' && multiAnswers.length === 0) {
      showNotification('error', 'Select at least one correct option.');
      return;
    }

    const computedAnswer = getComputedAnswer();

    try {
      setCreating(true);

      // 1. Create Question in database
      const createRes = await api.createQuestion({
        class: '10',
        subject_id: mockTest.subject_id || currentSubjectId,
        chapter_id: mockTest.chapter_id || currentChapterId,
        topic: qTopic.trim() || 'General Concept',
        difficulty: qDifficulty,
        question_type: qType,
        question_text: qText.trim(),
        image_url: qImageUrl.trim() || undefined,
        option_a: qType === 'true_false' ? 'True' : qOptionA.trim(),
        option_b: qType === 'true_false' ? 'False' : qOptionB.trim(),
        option_c: qType === 'true_false' ? undefined : (qOptionC.trim() || undefined),
        option_d: qType === 'true_false' ? undefined : (qOptionD.trim() || undefined),
        correct_answer: computedAnswer,
        explanation: qExplanation.trim(),
        marks: Number(qMarks),
        negative_marks: Number(qNegativeMarks),
        status: 'published',
        source: 'Teacher / Mock Test Entry',
        source_year: 2025
      });

      const newQ = createRes.question;

      // 2. Immediately append to this mock test slot
      const currentIds = assignedQuestions.map(q => q.id);
      const updatedIds = [...currentIds, newQ.id];
      await api.assignQuestionsToTest(mockTest.id, updatedIds);

      showNotification('success', `Question created and inserted into ${mockTest.title}!`);

      // 3. Reset form and reload left list & bank
      resetCreateForm();
      await loadAssigned();
      loadBank();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create and assign question');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 border shadow-2xl flex flex-col max-h-[92vh] space-y-4">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Manage Questions: {mockTest.title}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Add questions manually with full options & explanations, or browse and assign existing questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRightPanelMode(rightPanelMode === 'create' ? 'browse' : 'create')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                rightPanelMode === 'create'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{rightPanelMode === 'create' ? '← Back to Browse Bank' : '+ Add Question Manually'}</span>
            </button>

            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Two-Column Working Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
          {/* Left Column: Assigned Questions in this Test Slot (5 cols) */}
          <div className="lg:col-span-5 flex flex-col border border-slate-200 rounded-2xl p-4 bg-slate-50/70 overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Questions in Test ({assignedQuestions.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Total: {assignedQuestions.reduce((a, b) => a + (b.marks || 1), 0)} Marks
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                Live Slot #{mockTest.test_number}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {assignedQuestions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-600">No questions in this test slot yet</div>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Use the right panel to either <strong>create a new question directly</strong> or select from the Question Bank.
                  </p>
                </div>
              ) : (
                assignedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs transition-colors"
                  >
                    <span className="font-bold text-slate-400 font-mono w-6 shrink-0">#{idx + 1}</span>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-slate-900 leading-snug break-words">{q.question_text}</div>
                      {q.image_url && (
                        <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                          <img
                            src={q.image_url}
                            alt="Question Diagram"
                            className="max-h-32 object-contain rounded bg-white shadow-2xs"
                          />
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1.5">
                        <span className="font-semibold text-blue-600">+{q.marks} Marks</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-700 font-bold">Ans: {q.correct_answer}</span>
                        {q.image_url && <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">📷 Diagram Attached</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                        title="Preview Details & Solution"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        disabled={idx === assignedQuestions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromTest(q.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Remove from test"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Either Manual Question Input OR Question Bank Browser (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border border-slate-200 rounded-2xl p-4 bg-white overflow-hidden shadow-xs">
            {/* Right Panel Header Tabs */}
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRightPanelMode('browse')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    rightPanelMode === 'browse'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 Browse Question Bank
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelMode('create')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    rightPanelMode === 'create'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>✍️ Create Question Directly</span>
                </button>
              </div>

              {rightPanelMode === 'browse' && (
                <button
                  disabled={selectedBankIds.length === 0}
                  onClick={handleAddSelectedToTest}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
                >
                  + Add Selected ({selectedBankIds.length})
                </button>
              )}
            </div>

            {/* TAB 1: BROWSE QUESTION BANK */}
            {rightPanelMode === 'browse' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="text-xs p-2 border rounded-xl font-semibold bg-slate-50"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search question text or topic..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadBank()}
                    className="text-xs p-2 border rounded-xl flex-1 bg-slate-50"
                  />
                  <button
                    onClick={loadBank}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {bankQuestions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No matching questions found in bank.<br />Click "+ Create Question Directly" above to input one!
                    </div>
                  ) : (
                    bankQuestions.map(q => {
                      const isAlreadyIn = assignedQuestions.some(aq => aq.id === q.id);
                      const isSelected = selectedBankIds.includes(q.id);

                      return (
                        <label
                          key={q.id}
                          className={`p-3 border rounded-xl text-xs flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                            isAlreadyIn ? 'opacity-50 bg-slate-100 pointer-events-none' : isSelected ? 'bg-blue-50/80 border-blue-400' : 'bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isAlreadyIn}
                            checked={isSelected || isAlreadyIn}
                            onChange={e => {
                              if (e.target.checked) setSelectedBankIds([...selectedBankIds, q.id]);
                              else setSelectedBankIds(selectedBankIds.filter(id => id !== q.id));
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 line-clamp-2">{q.question_text}</div>
                            {q.image_url && (
                              <div className="mt-1.5 p-1 bg-slate-50 border border-slate-200 rounded inline-block">
                                <img src={q.image_url} alt="Question Diagram" className="max-h-20 object-contain rounded bg-white" />
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                              {isAlreadyIn && <span className="font-bold text-emerald-700">✓ In this Test</span>}
                              <span className="capitalize">{q.difficulty}</span>
                              <span>•</span>
                              <span>+{q.marks} Marks</span>
                              <span>•</span>
                              <span className="font-mono font-bold text-emerald-700">Ans: {q.correct_answer}</span>
                              {q.topic && <span className="text-blue-600 font-medium">({q.topic})</span>}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL QUESTION CREATION FORM */}
            {rightPanelMode === 'create' && (
              <form onSubmit={handleCreateAndAddToTest} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* Notice banner */}
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Adding to: <strong>{mockTest.title}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="text-[10px] underline font-bold text-blue-700 hover:text-blue-900"
                  >
                    Clear Inputs
                  </button>
                </div>

                {/* Question Type & Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Question Type</label>
                    <select
                      value={qType}
                      onChange={e => setQType(e.target.value as any)}
                      className="w-full p-2 border rounded-xl font-semibold bg-slate-50"
                    >
                      <option value="mcq">MCQ (Single Option)</option>
                      <option value="multiple_select">Multiple Select (1+ Options)</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Topic / Concept</label>
                    <input
                      type="text"
                      value={qTopic}
                      onChange={e => setQTopic(e.target.value)}
                      placeholder="e.g. Refraction of Light"
                      className="w-full p-2 border rounded-xl bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={e => setQDifficulty(e.target.value as any)}
                      className="w-full p-2 border rounded-xl font-semibold bg-slate-50"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Question Statement */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Question Statement / Text *
                  </label>
                  <textarea
                    rows={3}
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    placeholder="Enter the complete question problem or statement here..."
                    className="w-full p-2.5 border rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    required
                  />
                </div>

                {/* Optional Diagram Upload */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1.5 text-[11px]">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Optional Diagram / Figure</span>
                    </label>
                    {qImageUrl && (
                      <button
                        type="button"
                        onClick={() => setQImageUrl('')}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Remove Diagram
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*,.svg"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleDiagramUpload(e.target.files[0]);
                        }
                      }}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                    />
                    {uploadingImage && <span className="text-[11px] text-blue-600 animate-pulse">Uploading...</span>}
                  </div>

                  {qImageUrl && (
                    <div className="mt-1 flex items-center gap-2 p-1.5 bg-white rounded border">
                      <img src={qImageUrl} alt="Diagram preview" className="h-12 w-12 object-contain rounded border" />
                      <span className="text-[10px] font-mono text-slate-500 truncate">{qImageUrl}</span>
                    </div>
                  )}
                </div>

                {/* Options & Correct Answer Selection */}
                {qType === 'true_false' ? (
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <span className="font-bold text-slate-700 uppercase block">Select Correct Answer:</span>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                        <input
                          type="radio"
                          name="slot-tf"
                          checked={tfAnswer === 'True'}
                          onChange={() => setTfAnswer('True')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>True</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                        <input
                          type="radio"
                          name="slot-tf"
                          checked={tfAnswer === 'False'}
                          onChange={() => setTfAnswer('False')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 uppercase block text-[11px]">
                      Options & Correct Answer Selection:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option A */}
                      <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Option A *</span>
                          {qType === 'mcq' ? (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="radio"
                                name="slot-mcq"
                                checked={mcqAnswer === 'A'}
                                onChange={() => setMcqAnswer('A')}
                              />
                              <span>Correct</span>
                            </label>
                          ) : (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="checkbox"
                                checked={multiAnswers.includes('A')}
                                onChange={e => {
                                  if (e.target.checked) setMultiAnswers([...multiAnswers, 'A']);
                                  else setMultiAnswers(multiAnswers.filter(x => x !== 'A'));
                                }}
                              />
                              <span>Correct</span>
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          value={qOptionA}
                          onChange={e => setQOptionA(e.target.value)}
                          placeholder="Option A statement..."
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                          required
                        />
                      </div>

                      {/* Option B */}
                      <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Option B *</span>
                          {qType === 'mcq' ? (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="radio"
                                name="slot-mcq"
                                checked={mcqAnswer === 'B'}
                                onChange={() => setMcqAnswer('B')}
                              />
                              <span>Correct</span>
                            </label>
                          ) : (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="checkbox"
                                checked={multiAnswers.includes('B')}
                                onChange={e => {
                                  if (e.target.checked) setMultiAnswers([...multiAnswers, 'B']);
                                  else setMultiAnswers(multiAnswers.filter(x => x !== 'B'));
                                }}
                              />
                              <span>Correct</span>
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          value={qOptionB}
                          onChange={e => setQOptionB(e.target.value)}
                          placeholder="Option B statement..."
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                          required
                        />
                      </div>

                      {/* Option C */}
                      <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Option C</span>
                          {qType === 'mcq' ? (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="radio"
                                name="slot-mcq"
                                checked={mcqAnswer === 'C'}
                                onChange={() => setMcqAnswer('C')}
                              />
                              <span>Correct</span>
                            </label>
                          ) : (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="checkbox"
                                checked={multiAnswers.includes('C')}
                                onChange={e => {
                                  if (e.target.checked) setMultiAnswers([...multiAnswers, 'C']);
                                  else setMultiAnswers(multiAnswers.filter(x => x !== 'C'));
                                }}
                              />
                              <span>Correct</span>
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          value={qOptionC}
                          onChange={e => setQOptionC(e.target.value)}
                          placeholder="Option C statement..."
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                        />
                      </div>

                      {/* Option D */}
                      <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Option D</span>
                          {qType === 'mcq' ? (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="radio"
                                name="slot-mcq"
                                checked={mcqAnswer === 'D'}
                                onChange={() => setMcqAnswer('D')}
                              />
                              <span>Correct</span>
                            </label>
                          ) : (
                            <label className="flex items-center gap-1 cursor-pointer text-blue-700 font-bold text-[11px]">
                              <input
                                type="checkbox"
                                checked={multiAnswers.includes('D')}
                                onChange={e => {
                                  if (e.target.checked) setMultiAnswers([...multiAnswers, 'D']);
                                  else setMultiAnswers(multiAnswers.filter(x => x !== 'D'));
                                }}
                              />
                              <span>Correct</span>
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          value={qOptionD}
                          onChange={e => setQOptionD(e.target.value)}
                          placeholder="Option D statement..."
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-blue-800 bg-blue-50/70 p-2 rounded-lg">
                      Active Correct Key: <strong>{getComputedAnswer()}</strong>
                    </div>
                  </div>
                )}

                {/* Detailed Explanation / Solution (NCERT Step-by-Step) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase text-[11px]">
                      Detailed Explanation / Solution *
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQExplanation(prev => prev + '\nStep 1: ')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        + Step 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setQExplanation(prev => prev + '\nFormula: ')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        + Formula
                      </button>
                      <button
                        type="button"
                        onClick={() => setQExplanation(prev => prev + '\nNCERT Ref: ')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        + NCERT Ref
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Shown to students after they submit the test to explain the underlying NCERT reasoning.
                  </p>
                  <textarea
                    rows={4}
                    value={qExplanation}
                    onChange={e => setQExplanation(e.target.value)}
                    placeholder="Provide the complete step-by-step reasoning or formula application..."
                    className="w-full p-2.5 border rounded-xl font-mono text-slate-900 bg-slate-50 text-xs"
                    required
                  />
                </div>

                {/* Marks Allocation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Marks (+)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={qMarks}
                      onChange={e => setQMarks(Number(e.target.value))}
                      className="w-full p-2 border rounded-xl font-bold font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Negative Marks (-)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={qNegativeMarks}
                      onChange={e => setQNegativeMarks(Number(e.target.value))}
                      className="w-full p-2 border rounded-xl font-bold font-mono bg-slate-50"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-white py-2 border-t">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('browse')}
                    className="px-3.5 py-2 border rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || uploadingImage}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{creating ? 'Saving...' : 'Save & Add to This Mock Test'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Done Managing Questions
          </button>
        </div>
      </div>

      {/* QUICK PREVIEW ASSIGNED QUESTION MODAL */}
      {previewQuestion && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-3 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-blue-600 uppercase text-[11px]">Question Details</span>
              <button onClick={() => setPreviewQuestion(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="font-bold text-slate-900 text-sm leading-relaxed">{previewQuestion.question_text}</p>

            {previewQuestion.image_url && (
              <div className="p-2 bg-slate-50 rounded border text-center">
                <img src={previewQuestion.image_url} alt="Question diagram" className="max-h-40 mx-auto object-contain rounded" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border rounded bg-slate-50"><strong>A:</strong> {previewQuestion.option_a}</div>
              <div className="p-2 border rounded bg-slate-50"><strong>B:</strong> {previewQuestion.option_b}</div>
              {previewQuestion.option_c && <div className="p-2 border rounded bg-slate-50"><strong>C:</strong> {previewQuestion.option_c}</div>}
              {previewQuestion.option_d && <div className="p-2 border rounded bg-slate-50"><strong>D:</strong> {previewQuestion.option_d}</div>}
            </div>

            <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg font-bold">
              Correct Answer Key: {previewQuestion.correct_answer}
            </div>

            {previewQuestion.explanation && (
              <div className="p-3 bg-slate-50 text-slate-700 rounded-lg space-y-1">
                <strong className="text-slate-900 block">Detailed Explanation / NCERT Solution:</strong>
                <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{previewQuestion.explanation}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
