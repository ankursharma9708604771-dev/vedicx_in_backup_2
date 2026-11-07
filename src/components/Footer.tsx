import React from 'react';
import { BookOpen, ShieldCheck, Mail, Phone, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenMembership: () => void;
  onOpenAppointment?: () => void;
  onOpenAdminLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenMembership,
  onOpenAppointment,
  onOpenAdminLogin
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
                VX
              </div>
              <span className="text-xl font-black text-white font-sans tracking-tight">
                VEDIC<span className="text-blue-500">X</span>
              </span>
            </div>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">
              Learn. Practice. Perform.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete educational platform for CBSE Class 10 board exam preparation. Chapter-wise mock test slots, official sample papers, and verified PYQs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Examinations & Tests
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('mock-tests')} className="hover:text-white transition-colors cursor-pointer">
                  Mathematics Chapter Mocks
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('mock-tests')} className="hover:text-white transition-colors cursor-pointer">
                  Science Objective Series
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('mock-tests')} className="hover:text-white transition-colors cursor-pointer">
                  Social Science (History, Geo, Civics, Eco)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sample-papers')} className="hover:text-white transition-colors cursor-pointer">
                  Official CBSE SQP 2024-25
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Study Resources
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('pyqs')} className="hover:text-white transition-colors cursor-pointer">
                  Previous Year Questions (PYQs)
                </button>
              </li>
              <li>
                <button onClick={onOpenMembership} className="hover:text-white transition-colors cursor-pointer">
                  All-Access Pass (₹49 One-Time)
                </button>
              </li>
              {onOpenAppointment && (
                <li>
                  <button onClick={onOpenAppointment} className="hover:text-blue-400 font-semibold transition-colors cursor-pointer text-blue-300">
                    Book 1-on-1 Mentorship Session
                  </button>
                </li>
              )}
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                  NCERT Class 10 Syllabus
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Contact */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Trust & Support
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% NCERT & CBSE Verified</span>
              </div>
              <div>
                <a
                  href="mailto:supportvedicx@gmail.com?subject=VEDICX%20Support%20Request"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors text-slate-300"
                  title="Contact VEDICX Official Support"
                >
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>supportvedicx@gmail.com</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Official Domain: <strong>VEDICX.in</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} VEDICX.in – All Rights Reserved. Class 10 Educational Platform.
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <span>Built for academic excellence & CBSE board success</span>
          </div>
        </div>

        {/* Absolute bottom: subtle, small Admin Portal link */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center">
          <button
            onClick={onOpenAdminLogin}
            className="text-[10px] tracking-widest uppercase text-slate-600 hover:text-slate-400 transition-colors font-medium cursor-pointer"
            title="Restricted Administrative Access"
          >
            Admin Portal
          </button>
        </div>
      </div>
    </footer>
  );
};
