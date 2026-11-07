import React, { useState, useEffect } from 'react';
import { FileText, Download, Lock, CheckCircle2, Filter, Sparkles, BookOpen } from 'lucide-react';
import { SamplePaper, UserProfile } from '../types';
import { api } from '../services/api';

interface SamplePapersSectionProps {
  currentUser: UserProfile | null;
  onOpenMembership: () => void;
}

export const SamplePapersSection: React.FC<SamplePapersSectionProps> = ({
  currentUser,
  onOpenMembership
}) => {
  const [papers, setPapers] = useState<SamplePaper[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const isPremium = currentUser?.membership_tier === 'premium' || currentUser?.role === 'admin';

  useEffect(() => {
    async function loadPapers() {
      try {
        setLoading(true);
        const data = await api.getSamplePapers(activeSubject !== 'all' ? { subject_id: activeSubject } : {});
        setPapers(data.sample_papers);
      } catch (err) {
        console.error('Failed to load sample papers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [activeSubject]);

  const handleDownload = async (paper: SamplePaper) => {
    if (paper.access_type === 'premium' && !isPremium) {
      onOpenMembership();
      return;
    }

    try {
      await api.recordSamplePaperDownload(paper.id);
      // Trigger download or open preview
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', `${paper.title}.pdf`);
      // Simulating instantaneous clean PDF download
      const dummyPdfBlob = new Blob([`%PDF-1.4\n% VEDICX Educational Platform - ${paper.title}\nCBSE Class 10 Official Sample Question Paper with Detailed Marking Scheme.\nVerified & Prepared for CBSE Board Exam 2025.\nwww.vedicx.in`], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(dummyPdfBlob);
      link.href = blobUrl;
      link.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      // Increment local count
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, download_count: p.download_count + 1 } : p));
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <section id="sample-papers-section" className="py-12 lg:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Question Papers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Class 10 CBSE Sample Papers (SQP)
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Solve complete official sample question papers strictly based on CBSE latest syllabus and section-wise weightage.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveSubject('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              activeSubject === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setActiveSubject('mathematics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              activeSubject === 'mathematics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mathematics
          </button>
          <button
            onClick={() => setActiveSubject('science')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              activeSubject === 'science'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Science
          </button>
          <button
            onClick={() => setActiveSubject('social-science')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              activeSubject === 'social-science'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Social Science
          </button>
        </div>

        {/* Papers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {papers.map(paper => {
            const isFree = paper.access_type === 'free';
            const canDownload = isFree || isPremium;

            return (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      {paper.year_set}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isFree
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isFree ? 'Free PDF' : 'Premium'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                    {paper.title}
                  </h3>

                  {paper.description && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {paper.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    <span>PDF • {paper.file_size}</span>
                    <span className="mx-1.5">•</span>
                    <span>{paper.download_count} Downloads</span>
                  </div>

                  {canDownload ? (
                    <button
                      onClick={() => handleDownload(paper)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  ) : (
                    <button
                      onClick={onOpenMembership}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock (₹49)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
