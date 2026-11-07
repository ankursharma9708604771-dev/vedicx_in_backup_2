import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  BookOpen,
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Subject, Chapter, Question } from '../../types';
import { api } from '../../services/api';

interface AddQuestionTabProps {
  subjects: Subject[];
  onSaved: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const AddQuestionTab: React.FC<AddQuestionTabProps> = ({
  subjects,
  onSaved,
  showNotification
}) => {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'science');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'mcq' | 'multiple_select' | 'true_false'>('mcq');

  // Question content
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Options
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');

  // Correct answer
  const [correctMcqAnswer, setCorrectMcqAnswer] = useState('A');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>(['A']);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<'True' | 'False'>('True');

  // Explanation
  const [explanation, setExplanation] = useState('');

  // Metadata
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.0);
  const [source, setSource] = useState('NCERT Textbook');
  const [sourceYear, setSourceYear] = useState('2024');
  const [loading, setLoading] = useState(false);

  // Load chapters when subject changes
  useEffect(() => {
    async function loadChapters() {
      if (!subjectId) return;
      try {
        const res = await api.getChapters(subjectId);
        setChapters(res.chapters);
        if (res.chapters.length > 0) {
          setChapterId(res.chapters[0].id);
        } else {
          setChapterId('');
        }
      } catch (err: any) {
        setChapters([]);
      }
    }
    loadChapters();
  }, [subjectId]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const res = await api.uploadFile(file);
      setImageUrl(res.file.file_url);
      showNotification('success', 'Diagram uploaded successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const getComputedCorrectAnswer = () => {
    if (questionType === 'mcq') return correctMcqAnswer;
    if (questionType === 'multiple_select') return multiSelectAnswers.sort().join(',');
    return trueFalseAnswer;
  };

  const handleSubmit = async (targetStatus: 'published' | 'draft') => {
    if (!questionText.trim()) {
      showNotification('error', 'Please enter the question text.');
      return;
    }

    if (!chapterId) {
      showNotification('error', 'Please select a chapter for this question.');
      return;
    }

    if (questionType === 'mcq' && (!optionA.trim() || !optionB.trim())) {
      showNotification('error', 'Please provide at least Option A and Option B.');
      return;
    }

    if (questionType === 'multiple_select' && multiSelectAnswers.length === 0) {
      showNotification('error', 'Please select at least one correct option.');
      return;
    }

    const computedAnswer = getComputedCorrectAnswer();

    try {
      setLoading(true);
      await api.createQuestion({
        class: '10',
        subject_id: subjectId,
        chapter_id: chapterId,
        topic: topic.trim(),
        difficulty,
        question_type: questionType,
        question_text: questionText.trim(),
        image_url: imageUrl.trim() || undefined,
        option_a: questionType === 'true_false' ? 'True' : optionA.trim(),
        option_b: questionType === 'true_false' ? 'False' : optionB.trim(),
        option_c: questionType === 'true_false' ? undefined : (optionC.trim() || undefined),
        option_d: questionType === 'true_false' ? undefined : (optionD.trim() || undefined),
        correct_answer: computedAnswer,
        explanation: explanation.trim(),
        marks: Number(marks),
        negative_marks: Number(negativeMarks),
        status: targetStatus,
        source: source.trim(),
        source_year: sourceYear ? Number(sourceYear) : undefined
      });

      showNotification('success', `Question ${targetStatus === 'published' ? 'published' : 'saved as draft'} successfully!`);
      onSaved();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionText('');
    setImageUrl('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectMcqAnswer('A');
    setMultiSelectAnswers(['A']);
    setTrueFalseAnswer('True');
    setExplanation('');
    setTopic('');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-blue-600" />
            <span>Create New Question</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manual question entry into the central question bank with NCERT solutions & diagram upload.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
        >
          Clear Form
        </button>
      </div>

      <div className="space-y-6 text-xs">
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Basic Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Class</label>
              <input
                type="text"
                value="Class 10"
                disabled
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Subject *</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Chapter *</label>
              <select
                value={chapterId}
                onChange={e => setChapterId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 truncate focus:ring-2 focus:ring-blue-500"
              >
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapter_number}: {ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Topic / Subheading</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Fundamental Theorem of Arithmetic"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
              >
                <option value="easy">Easy (Direct concept)</option>
                <option value="medium">Medium (Application)</option>
                <option value="hard">Hard (Multi-step analysis)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
              >
                <option value="mcq">Multiple Choice (Single Option)</option>
                <option value="multiple_select">Multiple Select (1+ Options)</option>
                <option value="true_false">True / False</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: QUESTION STATEMENT & DIAGRAM */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Question Statement & Diagram</span>
          </h3>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Question Text *</label>
            <textarea
              rows={4}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Enter the complete question statement. You may use scientific units, formulas, or chemical symbols..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium leading-relaxed focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Diagram Upload */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Question Diagram / Geometric Figure (Optional)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
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
                    handleImageUpload(e.target.files[0]);
                  }
                }}
                className="text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploadingImage && <span className="text-[11px] text-blue-600 animate-pulse font-semibold">Uploading diagram...</span>}
            </div>

            {imageUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                <img src={imageUrl} alt="Diagram preview" className="h-16 w-16 object-contain rounded border bg-white" />
                <span className="text-[11px] font-mono text-slate-500 truncate">{imageUrl}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: OPTIONS & CORRECT ANSWER */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Options & Correct Answer Selection</span>
          </h3>

          {questionType === 'true_false' ? (
            <div className="space-y-3">
              <div className="text-slate-600">Select which statement is correct:</div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
                  <input
                    type="radio"
                    name="tf-answer"
                    checked={trueFalseAnswer === 'True'}
                    onChange={() => setTrueFalseAnswer('True')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
                  <input
                    type="radio"
                    name="tf-answer"
                    checked={trueFalseAnswer === 'False'}
                    onChange={() => setTrueFalseAnswer('False')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Option A *</span>
                    {questionType === 'mcq' ? (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correctMcqAnswer === 'A'}
                          onChange={() => setCorrectMcqAnswer('A')}
                        />
                        <span>Correct</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="checkbox"
                          checked={multiSelectAnswers.includes('A')}
                          onChange={e => {
                            if (e.target.checked) setMultiSelectAnswers([...multiSelectAnswers, 'A']);
                            else setMultiSelectAnswers(multiSelectAnswers.filter(x => x !== 'A'));
                          }}
                        />
                        <span>Correct</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={optionA}
                    onChange={e => setOptionA(e.target.value)}
                    placeholder="Option A wording..."
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Option B */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Option B *</span>
                    {questionType === 'mcq' ? (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correctMcqAnswer === 'B'}
                          onChange={() => setCorrectMcqAnswer('B')}
                        />
                        <span>Correct</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="checkbox"
                          checked={multiSelectAnswers.includes('B')}
                          onChange={e => {
                            if (e.target.checked) setMultiSelectAnswers([...multiSelectAnswers, 'B']);
                            else setMultiSelectAnswers(multiSelectAnswers.filter(x => x !== 'B'));
                          }}
                        />
                        <span>Correct</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={optionB}
                    onChange={e => setOptionB(e.target.value)}
                    placeholder="Option B wording..."
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Option C */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Option C</span>
                    {questionType === 'mcq' ? (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correctMcqAnswer === 'C'}
                          onChange={() => setCorrectMcqAnswer('C')}
                        />
                        <span>Correct</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="checkbox"
                          checked={multiSelectAnswers.includes('C')}
                          onChange={e => {
                            if (e.target.checked) setMultiSelectAnswers([...multiSelectAnswers, 'C']);
                            else setMultiSelectAnswers(multiSelectAnswers.filter(x => x !== 'C'));
                          }}
                        />
                        <span>Correct</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={optionC}
                    onChange={e => setOptionC(e.target.value)}
                    placeholder="Option C wording..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                {/* Option D */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Option D</span>
                    {questionType === 'mcq' ? (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correctMcqAnswer === 'D'}
                          onChange={() => setCorrectMcqAnswer('D')}
                        />
                        <span>Correct</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-bold">
                        <input
                          type="checkbox"
                          checked={multiSelectAnswers.includes('D')}
                          onChange={e => {
                            if (e.target.checked) setMultiSelectAnswers([...multiSelectAnswers, 'D']);
                            else setMultiSelectAnswers(multiSelectAnswers.filter(x => x !== 'D'));
                          }}
                        />
                        <span>Correct</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={optionD}
                    onChange={e => setOptionD(e.target.value)}
                    placeholder="Option D wording..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/70 text-blue-900 rounded-xl font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Configured Correct Answer: <strong>{getComputedCorrectAnswer()}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: STEP-BY-STEP NCERT SOLUTION */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Detailed Explanation / NCERT Solution</span>
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExplanation(prev => prev + '\nStep 1: ')}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                + Step 1
              </button>
              <button
                type="button"
                onClick={() => setExplanation(prev => prev + '\nFormula: ')}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                + Formula
              </button>
              <button
                type="button"
                onClick={() => setExplanation(prev => prev + '\nNCERT Ref: Chapter ')}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                + NCERT Ref
              </button>
            </div>
          </div>

          <p className="text-slate-500 text-[11px]">
            This solution is displayed on the student's result scorecard post-submission to reinforce conceptual clarity.
          </p>

          <textarea
            rows={5}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Step-by-step reasoning shown to students after test completion.
E.g.:
Step 1: Apply the discriminant formula D = b² - 4ac.
Step 2: Here a = 2, b = -4, c = 3. D = (-4)² - 4(2)(3) = 16 - 24 = -8.
Step 3: Since D < 0, the equation has no real roots."
            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 leading-relaxed"
          />
        </div>

        {/* SECTION 5: MARKS & SOURCE */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
            <span>Marks & Source Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Marks (+)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={marks}
                onChange={e => setMarks(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Negative Marks (-)</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarks}
                onChange={e => setNegativeMarks(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Source Material</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="NCERT Exemplar / CBSE Board"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Source Year</label>
              <input
                type="number"
                value={sourceYear}
                onChange={e => setSourceYear(e.target.value)}
                placeholder="2024"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={loading || uploadingImage}
            className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={loading || uploadingImage}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : 'Publish Question to Bank'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
