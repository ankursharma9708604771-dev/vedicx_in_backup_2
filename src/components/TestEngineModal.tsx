import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  X,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, TestAttemptResult } from '../types';
import { api } from '../services/api';

interface TestEngineModalProps {
  mockTestId: string;
  onClose: () => void;
  onOpenMembership: () => void;
}

export const TestEngineModal: React.FC<TestEngineModalProps> = ({
  mockTestId,
  onClose,
  onOpenMembership
}) => {
  // Test stages: 'instructions' | 'taking' | 'confirm_submit' | 'results'
  const [stage, setStage] = useState<'instructions' | 'taking' | 'confirm_submit' | 'results'>('instructions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test data
  const [attemptId, setAttemptId] = useState<string>('');
  const [testMeta, setTestMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student interaction state
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { [qId]: 'A' }
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  // Image zoom and error fallback handling
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1500); // 25 mins
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);

  // Evaluation results
  const [results, setResults] = useState<TestAttemptResult | null>(null);

  // Refs to avoid stale closures during timer tick / auto-submission
  const answersRef = React.useRef(answers);
  answersRef.current = answers;

  const attemptIdRef = React.useRef(attemptId);
  attemptIdRef.current = attemptId;

  const totalTimeTakenRef = React.useRef(totalTimeTaken);
  totalTimeTakenRef.current = totalTimeTaken;

  // Start test on server
  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.startTest(mockTestId);
      setAttemptId(data.attempt_id);
      attemptIdRef.current = data.attempt_id;
      setTestMeta(data.test);
      setQuestions(data.questions);
      setSecondsRemaining(data.test.duration_minutes * 60);
      setVisited({ [data.questions[0]?.id]: true });
      setStage('taking');
    } catch (err: any) {
      if (err.data?.requires_premium) {
        setError(err.message || 'Premium membership required.');
      } else {
        setError(err.message || 'Could not start mock test.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit test with latest state references
  const handleSubmitTest = async (overrideAnswers?: Record<string, string>, overrideTime?: number) => {
    const curAttemptId = attemptIdRef.current || attemptId;
    if (!curAttemptId) return;

    try {
      setLoading(true);
      setError(null);
      const submitAnswers = overrideAnswers ?? answersRef.current;
      const submitTime = overrideTime ?? totalTimeTakenRef.current;

      const data = await api.submitTest(curAttemptId, submitAnswers, submitTime);
      setResults(data.result);
      setStage('results');

      if (data.result.passed) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore confetti if not loaded
        }
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown with ref-safe auto-submission
  useEffect(() => {
    if (stage !== 'taking') return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(answersRef.current, totalTimeTakenRef.current + 1); // auto submit latest
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (optionKey: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionKey
    }));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    if (questions[index]) {
      setVisited(prev => ({ ...prev, [questions[index].id]: true }));
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Count question stats
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* TOP MODAL HEADER */}
        <div className="bg-slate-900 text-white px-3.5 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-extrabold text-blue-400 font-sans tracking-tight shrink-0 text-sm sm:text-base">VEDICX</span>
            <span className="text-slate-600 shrink-0">|</span>
            <span className="text-xs sm:text-sm font-semibold truncate max-w-[120px] xs:max-w-[200px] sm:max-w-md">
              {testMeta?.title || 'Mock Examination'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {stage === 'taking' && (
              <div
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold ${
                  secondsRemaining < 120
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse'
                    : secondsRemaining < 300
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            {stage !== 'taking' && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* STAGE 1: INSTRUCTIONS */}
        {stage === 'instructions' && (
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>CBSE Class 10 Pattern Assessment</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 break-words">
                Examination Guidelines & Instructions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Please read the following examination rules carefully before commencing the test:
              </p>

              <div className="mt-5 sm:mt-6 space-y-3 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>The test contains multiple-choice and conceptual objective questions based on latest NCERT Class 10 syllabus.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>The clock will be set at the server and will count down continuously.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>You can navigate questions using the right-side question palette or Next/Previous buttons.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>You can mark any question for review and return to it later before submitting.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Correct answers and detailed explanations will be provided instantly after submission.</span>
                </div>
              </div>

              {/* Palette Legend Preview */}
              <div className="mt-5 sm:mt-6">
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Palette Status Color Guide:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span className="text-slate-600 truncate">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span className="text-slate-600 truncate">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                    <span className="text-slate-600 truncate">Marked Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                    <span className="text-slate-600 truncate">Not Visited</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 sm:mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={onOpenMembership}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shrink-0 hover:bg-rose-700 cursor-pointer text-center"
                  >
                    Unlock All-Access ₹49
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                disabled={loading}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Starting...' : 'I am Ready to Begin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: TAKING THE TEST */}
        {stage === 'taking' && currentQ && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">
            {/* Left: Question area */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-visible md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md shrink-0">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {currentQ.topic && (
                    <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                      • {currentQ.topic}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-emerald-600 font-bold">+{currentQ.marks} Marks</span>
                  {currentQ.negative_marks > 0 && (
                    <span className="text-rose-600">-{currentQ.negative_marks} Neg</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed break-words">
                  {currentQ.question_text}
                </p>
                {currentQ.image_url && !imageErrorMap[currentQ.id] && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-2xs max-w-full">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                        <span>Given Figure / Diagram:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomedImage(currentQ.image_url!)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                      >
                        Enlarge Figure 🔍
                      </button>
                    </div>
                    <img
                      src={currentQ.image_url}
                      alt="Question Diagram"
                      onError={() => {
                        setImageErrorMap(prev => ({ ...prev, [currentQ.id]: true }));
                      }}
                      onClick={() => setZoomedImage(currentQ.image_url!)}
                      className="max-h-60 sm:max-h-72 rounded-lg border border-slate-200/80 object-contain max-w-full bg-white mx-auto cursor-zoom-in hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 flex-1">
                {[
                  { key: 'A', text: currentQ.option_a },
                  { key: 'B', text: currentQ.option_b },
                  { key: 'C', text: currentQ.option_c },
                  { key: 'D', text: currentQ.option_d }
                ]
                  .filter(opt => opt.text && opt.text.trim().length > 0)
                  .map(opt => {
                    const isSelected = answers[currentQ.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectAnswer(opt.key)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-sm sm:text-base font-medium transition-all flex items-start gap-3 sm:gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1 pt-0.5 break-words">{opt.text}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Question bottom actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleReview}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 xs:flex-initial ${
                      markedForReview[currentQ.id]
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{markedForReview[currentQ.id] ? 'Marked' : 'Mark Review'}</span>
                  </button>

                  {answers[currentQ.id] && (
                    <button
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleJumpToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Previous Question"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentIndex < questions.length - 1) {
                        handleJumpToQuestion(currentIndex + 1);
                      } else {
                        setStage('confirm_submit');
                      }
                    }}
                    className="flex-1 xs:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{currentIndex === questions.length - 1 ? 'Review & Submit' : 'Next Question'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Question Navigation Palette */}
            <div className="w-full md:w-72 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between shrink-0 border-t md:border-t-0">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Question Palette</span>
                  <span className="text-[11px] font-mono font-normal text-slate-400">{questions.length} Questions</span>
                </h4>

                {/* Grid of question buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = Boolean(answers[q.id]);
                    const isMarked = Boolean(markedForReview[q.id]);
                    const isQVisited = Boolean(visited[q.id]);

                    let btnColor = 'bg-slate-200 text-slate-700'; // not visited
                    if (isAnswered && isMarked) {
                      btnColor = 'bg-purple-600 text-white';
                    } else if (isMarked) {
                      btnColor = 'bg-purple-600 text-white ring-2 ring-purple-300';
                    } else if (isAnswered) {
                      btnColor = 'bg-emerald-600 text-white';
                    } else if (isQVisited) {
                      btnColor = 'bg-amber-500 text-white';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleJumpToQuestion(idx)}
                        className={`h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${btnColor} ${
                          isCurrent ? 'ring-2 ring-blue-700 ring-offset-2 scale-105' : 'hover:opacity-90'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Palette Summary */}
                <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Answered:</span>
                    <span className="font-bold">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-700 font-medium">
                    <span>Unanswered:</span>
                    <span className="font-bold">{unansweredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-700 font-medium">
                    <span>Marked for Review:</span>
                    <span className="font-bold">{reviewCount}</span>
                  </div>
                </div>
              </div>

              {/* Submit Test Trigger */}
              <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStage('confirm_submit')}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Test</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: CONFIRM SUBMISSION MODAL */}
        {stage === 'confirm_submit' && (
          <div className="p-4 sm:p-8 flex-1 flex flex-col justify-center items-center text-center overflow-y-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3 sm:mb-4">
              <Send className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 break-words">
              Ready to Submit Your Examination?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md">
              Once submitted, your answers will be securely evaluated and verified against the official answer keys.
            </p>

            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-5 sm:my-6 w-full max-w-md text-left">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase truncate">Answered</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{answeredCount}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-[10px] sm:text-xs text-amber-600 font-bold uppercase truncate">Unanswered</div>
                <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{unansweredCount}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-[10px] sm:text-xs text-purple-600 font-bold uppercase truncate">For Review</div>
                <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">{reviewCount}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none justify-center">
              <button
                onClick={() => setStage('taking')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
              >
                Back to Questions
              </button>
              <button
                onClick={() => handleSubmitTest()}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Evaluating...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: RESULT SCREEN */}
        {stage === 'results' && results && (
          <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
            {/* Top Score Banner */}
            <div className="text-center pb-5 sm:pb-6 border-b border-slate-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-blue-100 text-blue-800">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Evaluation Complete</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 break-words">
                {results.mock_test_title} – Result
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Completed in {Math.floor(results.time_taken_seconds / 60)} mins {results.time_taken_seconds % 60} secs
              </p>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6 max-w-2xl mx-auto">
                <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase truncate">Score</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
                    {results.marks_obtained} <span className="text-xs sm:text-sm font-normal text-slate-500">/ {results.maximum_marks}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-blue-700 mt-1 font-semibold">{results.percentage}% Marks</div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase truncate">Correct</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{results.correct_answers}</div>
                  <div className="text-[11px] sm:text-xs text-emerald-700 mt-1 font-semibold">Questions</div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase truncate">Incorrect</div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{results.incorrect_answers}</div>
                  <div className="text-[11px] sm:text-xs text-rose-700 mt-1 font-semibold">Questions</div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-slate-100 border border-slate-200 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">Unanswered</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{results.unanswered_questions}</div>
                  <div className="text-[11px] sm:text-xs text-slate-600 mt-1 font-semibold">Skipped</div>
                </div>
              </div>
            </div>

            {/* Question by Question Detailed Solutions */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Detailed Question Breakdown & Explanations</span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {results.breakdown.length} Questions
                </span>
              </h3>

              <div className="space-y-6">
                {results.breakdown.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-xl border ${
                      item.is_correct
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : item.is_unanswered
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        Q{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.is_correct ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{item.marks_awarded})
                          </span>
                        ) : item.is_unanswered ? (
                          <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                            Unanswered (0)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect ({item.marks_awarded})
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
                      {item.question_text}
                    </p>
                    {item.image_url && !imageErrorMap[`res-${item.id}`] && (
                      <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-2xs max-w-full">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                            <span>Given Figure / Diagram:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomedImage(item.image_url!)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                          >
                            Enlarge Figure 🔍
                          </button>
                        </div>
                        <img
                          src={item.image_url}
                          alt="Question Diagram"
                          onError={() => {
                            setImageErrorMap(prev => ({ ...prev, [`res-${item.id}`]: true }));
                          }}
                          onClick={() => setZoomedImage(item.image_url!)}
                          className="max-h-56 rounded-lg object-contain max-w-full mx-auto cursor-zoom-in hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                      {Object.entries(item.options).map(([optKey, optText]) => {
                        if (!optText) return null;
                        const isChosen = item.selected_answer === optKey;
                        const isCorrectKey = item.correct_answer === optKey;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isCorrectKey) {
                          optClass = 'bg-emerald-100/90 border-emerald-400 font-bold text-emerald-950';
                        } else if (isChosen && !item.is_correct) {
                          optClass = 'bg-rose-100/90 border-rose-400 font-bold text-rose-950';
                        }

                        return (
                          <div
                            key={optKey}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${optClass}`}
                          >
                            <span>
                              <strong className="mr-1.5">{optKey}.</strong> {optText}
                            </span>
                            {isCorrectKey && (
                              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                                Correct Answer
                              </span>
                            )}
                            {isChosen && !isCorrectKey && (
                              <span className="text-[10px] uppercase font-black tracking-wider text-rose-800 bg-white px-1.5 py-0.2 rounded border border-rose-300">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step-by-Step Explanation */}
                    {item.explanation && (
                      <div className="mt-3 p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                        <span className="font-bold text-blue-900 block mb-1">Detailed NCERT Explanation:</span>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer shadow-sm transition-colors"
              >
                Close Examination Review
              </button>
            </div>
          </div>
        )}
      </div>
      {/* DIAGRAM LIGHTBOX MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-3xl max-h-[90vh] p-4 flex flex-col items-center shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                High-Resolution Geometric Figure Preview
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={zoomedImage}
                alt="Enlarged Diagram"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
