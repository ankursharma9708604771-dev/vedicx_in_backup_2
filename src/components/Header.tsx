import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Shield,
  User,
  Menu,
  X,
  CreditCard,
  FileText,
  HelpCircle,
  Layers,
  ArrowRight,
  LogOut,
  ChevronDown,
  Calendar,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenMembership: () => void;
  onOpenAppointment: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenMembership,
  onOpenAppointment,
  onOpenAuth,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isPremium = currentUser?.membership_tier === 'premium';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all w-full">
      {/* Top Notification Banner */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center font-medium flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <span className="bg-blue-600 text-white text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0">
          Class 10 CBSE 2025
        </span>
        <span className="hidden xs:inline text-slate-300">
          Chapter-wise mock tests, authentic PYQs & Sample Papers are now live!
        </span>
        <span className="xs:hidden text-slate-300">
          Mock tests, PYQs & SQPs live!
        </span>
        {!isPremium && !isAdmin && (
          <button
            onClick={onOpenMembership}
            className="text-blue-400 hover:text-white underline font-semibold cursor-pointer transition-colors shrink-0"
          >
            All-Access ₹49 →
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="font-extrabold text-lg sm:text-xl tracking-tighter">VX</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                  VEDIC<span className="text-blue-600">X</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shrink-0">
                  Class 10
                </span>
              </div>
              <p className="hidden sm:block text-[10px] font-medium text-slate-500 tracking-wide uppercase truncate">
                Learn. Practice. Perform.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-blue-600 bg-blue-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('mock-tests')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'mock-tests'
                  ? 'text-blue-600 bg-blue-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              Mock Tests
            </button>
            <button
              onClick={() => onNavigate('sample-papers')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'sample-papers'
                  ? 'text-blue-600 bg-blue-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              Sample Papers
            </button>
            <button
              onClick={() => onNavigate('pyqs')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'pyqs'
                  ? 'text-blue-600 bg-blue-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              PYQs
            </button>
            <button
              onClick={onOpenAppointment}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Book Mentorship</span>
            </button>
            <button
              onClick={onOpenMembership}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Membership</span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-300">
                ₹49
              </span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* If Logged In as Admin (from Admin Portal) */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(currentView === 'admin-dashboard' ? 'home' : 'admin-dashboard')}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{currentView === 'admin-dashboard' ? 'Student View' : 'Admin Panel'}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sign out of Administrator"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : currentUser ? (
              /* If Logged In as Student */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer transition-colors max-w-[140px] sm:max-w-[190px]"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isPremium ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="truncate font-semibold text-[11px] sm:text-xs text-slate-900">
                    {currentUser.full_name?.split(' ')[0] || 'Student'}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                    isPremium ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isPremium ? '★ Pass' : 'Free'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden xs:block shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900 truncate">{currentUser.full_name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1">
                        <span className={`inline-block text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isPremium ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isPremium ? 'All-Access Member' : 'Free Member'}
                        </span>
                      </div>
                    </div>

                    {!isPremium && (
                      <div className="px-2 py-1">
                        <button
                          onClick={onOpenMembership}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors"
                        >
                          <span>Upgrade to Pass (₹49)</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      </div>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* If Logged Out */
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Student Sign In</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto shadow-xl">
          {/* Mobile User Profile Summary or Login CTA */}
          {currentUser ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</div>
                <div className="text-sm font-bold text-slate-900 truncate">{currentUser.full_name}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isPremium
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isAdmin ? 'Admin' : isPremium ? 'Premium Pass' : 'Free Tier'}
                </span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-[11px] text-rose-600 font-semibold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mb-3 shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Student Sign In / Register</span>
            </button>
          )}

          {/* Navigation Links */}
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
              currentView === 'home' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Home</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('mock-tests');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
              currentView === 'mock-tests' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Chapter Mock Tests (5 Slots)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('sample-papers');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
              currentView === 'sample-papers' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>CBSE Sample Papers (SQP)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('pyqs');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
              currentView === 'pyqs' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Previous Year Questions (PYQs)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Book Mentorship Session */}
          <button
            onClick={() => {
              onOpenAppointment();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer text-slate-700 hover:bg-slate-50 border border-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Book 1-on-1 Mentorship</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Membership CTA in Drawer */}
          {!isPremium && !isAdmin && (
            <button
              onClick={() => {
                onOpenMembership();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-between shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Unlock Unlimited Access – ₹49</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          )}

          {/* If already authenticated as admin, show Admin Panel button */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onNavigate(currentView === 'admin-dashboard' ? 'home' : 'admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-amber-500 text-white cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>{currentView === 'admin-dashboard' ? 'Exit to Student View' : 'Go to Admin Panel'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
