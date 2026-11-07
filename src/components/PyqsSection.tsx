import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle, ShieldCheck, Calendar, Filter } from 'lucide-react';
import { PYQ } from '../types';
import { api } from '../services/api';

export const PyqsSection: React.FC = () => {
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPyqs() {
      try {
        setLoading(true);
        const params: any = {};
        if (selectedSubject !== 'all') params.subject_id = selectedSubject;
        if (selectedYear !== 'all') params.year = Number(selectedYear);

        const data = await api.getPyqs(params);
        setPyqs(data.pyqs);
        setAvailableYears(data.available_years);
      } catch (err) {
        console.error('Failed to load PYQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPyqs();
  }, [selectedSubject, selectedYear]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section id="pyqs-section" className="py-12 lg:py-16 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>CBSE Board Exam Archive</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Authentic Previous Year Questions (PYQs)
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Examined directly from verified CBSE board question papers with official step-by-step marking scheme answers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {/* Subject buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            {['all', 'mathematics', 'science', 'social-science'].map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub === 'all' ? 'All' : sub === 'social-science' ? 'SST' : sub.substring(0, 4)}
              </button>
            ))}
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Year:
            </span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Board Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  CBSE {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {pyqs.map(pyq => {
            const isExpanded = expandedId === pyq.id;
            return (
              <div
                key={pyq.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                      CBSE {pyq.year}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                      {pyq.subject_name} {pyq.chapter_name ? `• ${pyq.chapter_name}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {pyq.question_type} ({pyq.marks} Marks)
                    </span>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed mt-2 break-words">
                  {pyq.question_text}
                </p>

                {/* Solution Toggle Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Verified CBSE Marking Scheme
                  </span>

                  <button
                    onClick={() => toggleExpand(pyq.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Solution' : 'View Verified Solution'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expandable Solution */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed animate-in fade-in duration-150">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>CBSE Evaluator Solution:</span>
                    </div>
                    <div className="whitespace-pre-line font-normal text-slate-700 break-words">
                      {pyq.solution_text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
