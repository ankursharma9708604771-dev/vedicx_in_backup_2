import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';

interface MembershipModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyPremium = currentUser?.membership_tier === 'premium';

  const handleInitiatePayment = () => {
    setError('Online payments for the ₹49 All-Access Pass are currently temporarily paused for gateway setup. Free mock test slots, official CBSE sample papers and PYQs remain fully accessible! For inquiries, please reach out to supportvedicx@gmail.com.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-4 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Class 10 Board Exam Pass</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight break-words">
            VEDICX All-Access Membership
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Unlimited chapter-wise mock tests, official CBSE sample papers & PYQs.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          <div>
            {/* Pricing Callout */}
              <div className="bg-slate-50 border-2 border-blue-600 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 relative">
                <span className="absolute -top-3 right-3 sm:right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 sm:px-3 py-0.5 rounded-full shadow-xs">
                  One-Time Only • No Subscription
                </span>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">Lifetime Class 10 Access</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">Valid until board examinations end</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl sm:text-4xl font-black text-slate-900 font-sans">
                      ₹49
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 block line-through">₹499 (90% Off)</span>
                  </div>
                </div>

                {/* Features checklist */}
                <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-2.5 pt-3 sm:pt-4 border-t border-slate-200/80 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span><strong>All 5 mock test slots</strong> for every Mathematics chapter</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span><strong>All 5 mock test slots</strong> for every Science chapter</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span><strong>All 5 mock test slots</strong> for History, Geography, Civics & Economics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span>Full CBSE official sample question papers with marking schemes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span>Authentic Previous Year Questions archive (2019-2024)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold mt-0.5" />
                    <span>Instant detailed step-by-step NCERT explanations</span>
                  </div>
                </div>
              </div>

              {/* Free vs Premium Status Notice */}
              <div className="bg-blue-50/60 rounded-xl p-3 mb-5 sm:mb-6 border border-blue-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-1">
                <span>Free Plan Limit: <strong>1 Free Mock Test</strong></span>
                <span className="font-semibold text-blue-700">
                  {currentUser?.free_test_used ? 'Free test used' : '1 Free test remaining'}
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              {isAlreadyPremium ? (
                <div className="text-center p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>You already possess active Premium Membership!</span>
                </div>
              ) : (
                <button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  <span>Unlock Access – ₹49</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> CBSE Class 10 Verified
                </span>
                <span>•</span>
                <span>One-Time Fee</span>
                <span>•</span>
                <span>Direct Support</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
