import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  ShieldCheck,
  Flame,
  Calendar
} from 'lucide-react';

interface HeroProps {
  onExploreTests: () => void;
  onOpenMembership: () => void;
  onOpenAppointment?: () => void;
  isPremium?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreTests,
  onOpenMembership,
  onOpenAppointment,
  isPremium = false
}) => {
  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100 w-full">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-transparent pointer-events-none rounded-b-[40px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge: wraps gracefully on mobile without overflowing viewport */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] sm:text-xs font-semibold mb-6 shadow-xs max-w-full">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="text-center">CBSE Class 10 Board Exam Series 2025</span>
            <span className="text-slate-300 hidden xs:inline">|</span>
            <span className="font-bold text-blue-900 shrink-0">100% NCERT Aligned</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] sm:leading-[1.15] font-sans break-words">
            Prepare Smarter.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
              Score Better.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            Practice Class 10 chapter-wise mock tests, solve sample papers and prepare with previous year questions.
          </p>

          {/* CTA Buttons */}
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onExploreTests}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Explore Mock Tests</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {!isPremium && (
              <button
                onClick={onOpenMembership}
                className="w-full sm:w-auto px-6 sm:px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm sm:text-base shadow-xs flex items-center justify-center gap-2 border border-slate-800 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Unlock All-Access – ₹49</span>
              </button>
            )}

            {onOpenAppointment && (
              <button
                onClick={onOpenAppointment}
                className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 active:scale-98 text-blue-800 font-bold text-sm sm:text-base border border-blue-200/80 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Book 1-on-1 Doubt Session</span>
              </button>
            )}
          </div>

          {/* Value Props / Trust Indicators */}
          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-left">
            <div className="flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">5 Test Slots</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Every single chapter</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Instant Grading</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Step-by-step solutions</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Real Exam Timer</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Simulate board exam</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 text-purple-700 shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Authentic PYQs</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Verified CBSE boards</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
