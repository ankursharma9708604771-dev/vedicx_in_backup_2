import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react';
import { Subject, Chapter } from '../../types';
import { api } from '../../services/api';

interface SubjectsChaptersTabProps {
  subjects: Subject[];
  onRefreshSubjects: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const SubjectsChaptersTab: React.FC<SubjectsChaptersTabProps> = ({
  subjects,
  onRefreshSubjects,
  showNotification
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'chapters'>('chapters');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'mathematics');
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Subject Modal
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editSubjectData, setEditSubjectData] = useState<Subject | null>(null);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjDesc, setSubjDesc] = useState('');

  // Chapter Modal
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [editChapterData, setEditChapterData] = useState<Chapter | null>(null);
  const [chName, setChName] = useState('');
  const [chNumber, setChNumber] = useState(1);
  const [chDesc, setChDesc] = useState('');
  const [chCategoryId, setChCategoryId] = useState('');

  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  const loadChapters = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await api.getChapters(selectedSubjectId, true);
      setChapters(res.chapters);
      setChNumber((res.chapters.length || 0) + 1);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  useEffect(() => {
    loadChapters();
  }, [selectedSubjectId]);

  // Subject Handlers
  const handleCreateSubject = async () => {
    if (!subjName || !subjCode) return;
    try {
      await api.createSubject({
        name: subjName,
        code: subjCode,
        description: subjDesc,
        icon: 'BookOpen'
      });
      showNotification('success', 'Subject created successfully.');
      setAddSubjectOpen(false);
      setSubjName('');
      setSubjCode('');
      setSubjDesc('');
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editSubjectData) return;
    try {
      await api.updateSubject(editSubjectData.id, {
        name: editSubjectData.name,
        code: editSubjectData.code,
        description: editSubjectData.description,
        is_active: editSubjectData.is_active
      });
      showNotification('success', 'Subject updated.');
      setEditSubjectData(null);
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.deleteSubject(id);
      showNotification('success', 'Subject deleted.');
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleMoveSubject = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= subjects.length) return;

    const copy = [...subjects];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);

    try {
      await api.reorderSubjects(copy.map(s => s.id));
      showNotification('success', 'Subjects reordered.');
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Chapter Handlers
  const handleCreateChapter = async () => {
    if (!chName) return;
    try {
      await api.createChapter({
        subject_id: selectedSubjectId,
        category_id: chCategoryId || undefined,
        chapter_number: Number(chNumber),
        name: chName,
        description: chDesc,
        is_active: 1
      });
      showNotification('success', 'Chapter created with 5 mock test slots!');
      setAddChapterOpen(false);
      setChName('');
      setChDesc('');
      loadChapters();
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleUpdateChapter = async () => {
    if (!editChapterData) return;
    try {
      await api.updateChapter(editChapterData.id, {
        name: editChapterData.name,
        chapter_number: Number(editChapterData.chapter_number),
        description: editChapterData.description,
        is_active: editChapterData.is_active
      });
      showNotification('success', 'Chapter updated.');
      setEditChapterData(null);
      loadChapters();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!window.confirm('Delete or deactivate this chapter?')) return;
    try {
      const res = await api.deleteChapter(id);
      showNotification('success', res.message);
      loadChapters();
      onRefreshSubjects();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleMoveChapter = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;

    const copy = [...chapters];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setChapters(copy);

    try {
      await api.reorderChapters(copy.map(c => c.id));
      showNotification('success', 'Chapters reordered.');
    } catch (err: any) {
      showNotification('error', err.message);
      loadChapters();
    }
  };

  return (
    <div className="max-w-5xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Curriculum & Chapter Architecture</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Class 10 Subjects, NCERT Chapter sequences, and sub-categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chapters' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chapters Management
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'subjects' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Subjects Management
          </button>
        </div>
      </div>

      {/* VIEW 1: CHAPTERS MANAGEMENT */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Select Subject:</span>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="text-xs font-semibold p-2 border rounded-xl bg-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setAddChapterOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Chapter</span>
            </button>
          </div>

          <div className="border rounded-xl divide-y text-xs">
            {chapters.map((ch, idx) => (
              <div key={ch.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveChapter(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === chapters.length - 1}
                      onClick={() => handleMoveChapter(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">Ch {ch.chapter_number}</span>
                      <span className="font-bold text-slate-900">{ch.name}</span>
                      {ch.category_name && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                          {ch.category_name}
                        </span>
                      )}
                    </div>
                    {ch.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{ch.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ch.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {ch.is_active ? 'Active' : 'Deactivated'}
                  </span>
                  <button
                    onClick={() => setEditChapterData(ch)}
                    className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(ch.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SUBJECTS MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Class 10 Subjects</span>
            <button
              onClick={() => setAddSubjectOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Subject</span>
            </button>
          </div>

          <div className="border rounded-xl divide-y text-xs">
            {subjects.map((sub, idx) => (
              <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveSubject(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === subjects.length - 1}
                      onClick={() => handleMoveSubject(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{sub.name}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{sub.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sub.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditSubjectData(sub)}
                    className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD CHAPTER MODAL */}
      {addChapterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Chapter (Auto-Provisions 5 Test Slots)</h3>
              <button onClick={() => setAddChapterOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Chapter Name</label>
                <input
                  type="text"
                  value={chName}
                  onChange={e => setChName(e.target.value)}
                  placeholder="e.g. Life Processes"
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chapter Number</label>
                  <input
                    type="number"
                    value={chNumber}
                    onChange={e => setChNumber(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>
                {activeSubject?.categories && activeSubject.categories.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Sub-Category</label>
                    <select
                      value={chCategoryId}
                      onChange={e => setChCategoryId(e.target.value)}
                      className="w-full p-2 border rounded-xl"
                    >
                      <option value="">None</option>
                      {activeSubject.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={chDesc}
                  onChange={e => setChDesc(e.target.value)}
                  placeholder="Key concepts, experiments, formulas..."
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setAddChapterOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button
                onClick={handleCreateChapter}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Create Chapter & 5 Slots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CHAPTER MODAL */}
      {editChapterData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Edit Chapter</h3>
              <button onClick={() => setEditChapterData(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Chapter Name</label>
                <input
                  type="text"
                  value={editChapterData.name}
                  onChange={e => setEditChapterData({ ...editChapterData, name: e.target.value })}
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chapter Number</label>
                  <input
                    type="number"
                    value={editChapterData.chapter_number}
                    onChange={e => setEditChapterData({ ...editChapterData, chapter_number: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Active Status</label>
                  <select
                    value={editChapterData.is_active}
                    onChange={e => setEditChapterData({ ...editChapterData, is_active: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Deactivated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setEditChapterData(null)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button
                onClick={handleUpdateChapter}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {addSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add New Subject</h3>
              <button onClick={() => setAddSubjectOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subjName}
                  onChange={e => setSubjName(e.target.value)}
                  placeholder="e.g. English Language & Literature"
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Code</label>
                <input
                  type="text"
                  value={subjCode}
                  onChange={e => setSubjCode(e.target.value)}
                  placeholder="ENG-10"
                  className="w-full p-2 border rounded-xl font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={subjDesc}
                  onChange={e => setSubjDesc(e.target.value)}
                  placeholder="Syllabus overview..."
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setAddSubjectOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button
                onClick={handleCreateSubject}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Create Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editSubjectData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Edit Subject</h3>
              <button onClick={() => setEditSubjectData(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editSubjectData.name}
                  onChange={e => setEditSubjectData({ ...editSubjectData, name: e.target.value })}
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Code</label>
                <input
                  type="text"
                  value={editSubjectData.code}
                  onChange={e => setEditSubjectData({ ...editSubjectData, code: e.target.value })}
                  className="w-full p-2 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Active Status</label>
                <select
                  value={editSubjectData.is_active}
                  onChange={e => setEditSubjectData({ ...editSubjectData, is_active: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Deactivated</option>
                </select>
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setEditSubjectData(null)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button
                onClick={handleUpdateSubject}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Save Subject Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
