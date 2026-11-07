import React, { useState, useEffect } from 'react';
import {
  Layers,
  ChevronRight,
  Lock,
  Play,
  CheckCircle,
  Clock,
  HelpCircle,
  Sparkles,
  AlertCircle,
  FileQuestion,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Subject, Chapter, MockTestSummary, UserProfile } from '../types';
import { api } from '../services/api';

interface SubjectMockTestsProps {
  currentUser: UserProfile | null;
  onStartTest: (testId: string) => void;
  onOpenMembership: () => void;
}

export const SubjectMockTests: React.FC<SubjectMockTestsProps> = ({
  currentUser,
  onStartTest,
  onOpenMembership
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('mathematics');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isPremium = currentUser?.membership_tier === 'premium' || currentUser?.role === 'admin';

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true);
        const data = await api.getSubjects();
        setSubjects(data.subjects);
        if (data.subjects.length > 0 && !activeSubjectId) {
          setActiveSubjectId(data.subjects[0].id);
        }
      } catch (err: any) {
        setError('Failed to load subjects.');
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  // Load chapters when active subject changes
  useEffect(() => {
    if (!activeSubjectId) return;

    async function loadChapters() {
      try {
        setLoading(true);
        const data = await api.getChapters(activeSubjectId);
        setChapters(data.chapters);
        if (data.chapters.length > 0) {
          setSelectedChapterId(data.chapters[0].id);
        }
      } catch (err: any) {
        setError('Failed to load chapters for selected subject.');
      } finally {
        setLoading(false);
      }
    }

    loadChapters();
  }, [activeSubjectId]);

  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const filteredChapters = chapters.filter(ch => {
    if (activeSubjectId === 'social-science' && activeCategoryId !== 'all') {
      return ch.category_id === activeCategoryId;
    }
    return true;
  });

  const selectedChapter = chapters.find(ch => ch.id === selectedChapterId) || filteredChapters[0];

  return (
    <section id="mock-tests-section" className="py-12 lg:py-16 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Chapter-wise Mock Tests</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
            Master Every Chapter with 5 Test Slots
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Select a subject and chapter to explore its dedicated 5-test preparation series. Start with Mock Test 1 for free!
          </p>
        </div>

        {/* Subject Navigation Tabs - fix justify-start on mobile so it doesn't clip leftmost tab */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 px-1 max-w-full">
          {subjects.map(sub => {
            const isActive = sub.id === activeSubjectId;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubjectId(sub.id);
                  setActiveCategoryId('all');
                }}
                className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all flex items-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sub.total_chapters || 0} Ch
                </span>
              </button>
            );
          })}
        </div>

        {/* Social Science Sub-category Filter (History, Geography, Civics, Economics) */}
        {activeSubjectId === 'social-science' && activeSubject?.categories && (
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 px-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <button
              onClick={() => setActiveCategoryId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                activeCategoryId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {activeSubject.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  activeCategoryId === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name.split('(')[0].trim()}
              </button>
            ))}
          </div>
        )}

        {/* Chapter Selection Grid + Mock Test Slots Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chapters List */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2">
                  <span>{activeSubject?.name} Chapters</span>
                  <span className="text-[10px] bg-slate-800 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                    NCERT
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Select a chapter to review available mock test sets</p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400 font-mono">
                {filteredChapters.length} Total
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 sm:max-h-96 lg:max-h-[580px] overflow-y-auto">
              {filteredChapters.map(ch => {
                const isSelected = ch.id === selectedChapter?.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChapterId(ch.id);
                    }}
                    className={`w-full text-left p-3 sm:p-3.5 transition-all flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="pr-2 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-400 font-mono shrink-0">
                          Ch {ch.chapter_number}
                        </span>
                        {ch.category_name && (
                          <span className="text-[9.5px] sm:text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px] sm:max-w-[120px]">
                            {ch.category_name.split('(')[0].trim()}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-xs sm:text-sm font-semibold mt-0.5 truncate ${
                          isSelected ? 'text-blue-900 font-bold' : 'text-slate-800 group-hover:text-blue-600'
                        }`}
                      >
                        {ch.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                        {(ch.mock_tests?.length || 5)} Slots
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                          isSelected ? 'text-blue-600 transform translate-x-1' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: 5 Mock Test Slots for Selected Chapter */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
            {selectedChapter ? (
              <div>
                {/* Chapter Banner */}
                <div className="border-b border-slate-100 pb-4 sm:pb-5 mb-5 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
                    <span>Chapter {selectedChapter.chapter_number}</span>
                    <span>•</span>
                    <span>{activeSubject?.name}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight break-words">
                    {selectedChapter.name}
                  </h3>
                  {selectedChapter.description && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {selectedChapter.description}
                    </p>
                  )}
                </div>

                {/* 5 Mock Test Slots List */}
                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Available Test Slots ({(selectedChapter.mock_tests || []).length} Tests)</span>
                    </h4>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      Official CBSE Marking
                    </span>
                  </div>

                  {(selectedChapter.mock_tests || []).map((test, index) => {
                    const isPublished = test.status === 'published';
                    const isFreeTest = test.access_type === 'free';
                    const canAccess = isPremium || isFreeTest;
                    const isAttempted = !!test.last_attempt_id && test.attempt_status === 'submitted';

                    return (
                      <div
                        key={test.id}
                        className={`rounded-xl border p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
                          isPublished
                            ? isAttempted
                              ? 'bg-slate-50/90 border-indigo-200 hover:border-indigo-300 hover:shadow-xs'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                            : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                            <span className="text-[11px] sm:text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Slot {test.test_number}
                            </span>
                            <span
                              className={`text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isFreeTest
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isFreeTest ? 'Free Test' : 'Premium'}
                            </span>
                            {isAttempted ? (
                              <span
                                className={`text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                  test.last_passed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                }`}
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Attempted ({test.last_percentage}% • {test.last_score}/{test.last_max_marks || test.max_marks})</span>
                              </span>
                            ) : (
                              <span
                                className={`text-[9.5px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  isPublished
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isPublished ? 'Live & Published' : 'Slot Configured'}
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm sm:text-base font-bold text-slate-900 break-words">
                            {test.title}
                          </h5>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[11px] sm:text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {test.total_questions > 0 ? `${test.total_questions} Qs` : 'Ready'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {test.duration_minutes} Mins
                            </span>
                            <span>Max: {test.max_marks} Marks</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 w-full sm:w-auto">
                          {isPublished ? (
                            canAccess ? (
                              isAttempted ? (
                                <button
                                  onClick={() => onStartTest(test.id)}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reattempt</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onStartTest(test.id)}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Start Test</span>
                                </button>
                              )
                            ) : (
                              <button
                                onClick={onOpenMembership}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Unlock (₹49)</span>
                              </button>
                            )
                          ) : (
                            <div className="text-center sm:text-right">
                              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg inline-block w-full sm:w-auto">
                                Slot Configured
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Free vs Premium Notice - responsive wrapping */}
                {!isPremium && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 sm:mt-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          Want unlimited access to all mock test sets across every chapter?
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                          One-time ₹49 fee gives you lifetime Class 10 mock tests, answer explanations, and PDF downloads.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onOpenMembership}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors shadow-xs text-center"
                    >
                      Unlock for ₹49
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Please select a chapter from the left to view mock tests.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
