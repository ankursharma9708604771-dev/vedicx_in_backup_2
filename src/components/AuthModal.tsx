import React, { useState, useMemo } from 'react';
import { X, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { api, setSessionUserId, setSessionToken } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address.');
      }

      if (activeTab === 'forgot') {
        const res = await api.forgotPassword(trimmedEmail);
        setSuccessMsg(res.message || 'Password recovery instructions have been sent to your email.');
      } else if (activeTab === 'register') {
        const trimmedName = fullName.trim();
        if (trimmedName.length < 2) {
          throw new Error('Full Name must be at least 2 characters long.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
          throw new Error('Password must contain at least one letter and one number.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter your password.');
        }

        const data = await api.register({
          email: trimmedEmail,
          full_name: trimmedName,
          password,
          confirm_password: confirmPassword
        });

        setSessionUserId(data.user.id);
        if (data.token) {
          setSessionToken(data.token);
        } else if (data.session?.access_token) {
          setSessionToken(data.session.access_token);
        }

        onAuthSuccess(data.user);
        onClose();
      } else {
        // Login
        if (!password) {
          throw new Error('Please enter your password.');
        }

        const data = await api.login({ email: trimmedEmail, password });
        setSessionUserId(data.user.id);
        if (data.token) {
          setSessionToken(data.token);
        } else if (data.session?.access_token) {
          setSessionToken(data.session.access_token);
        }

        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
              VX
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Class 10 CBSE Platform
              </div>
              <span className="font-bold text-sm sm:text-base">VEDICX Student Portal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Student Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
          {activeTab === 'forgot' && (
            <button
              type="button"
              className="flex-1 py-3 text-center bg-white text-blue-600 border-b-2 border-blue-600"
            >
              Recover Access
            </button>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'forgot'
                ? 'Reset Your Password'
                : activeTab === 'register'
                ? 'Student Registration'
                : 'Welcome Back'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {activeTab === 'forgot'
                ? 'Enter your registered email address to receive secure recovery instructions.'
                : activeTab === 'register'
                ? 'Register your account to access Class 10 mock test slots, CBSE papers and track your marks.'
                : 'Sign in to access your test attempts, analytics, and study resources.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {activeTab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator for registration */}
                {activeTab === 'register' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Password Strength:</span>
                      <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Must be at least 8 characters and include at least 1 letter and 1 number.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processing...'
                : activeTab === 'forgot'
                ? 'Send Recovery Instructions'
                : activeTab === 'register'
                ? 'Complete Registration'
                : 'Sign In to VEDICX'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            {activeTab === 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                ← Return to Sign In
              </button>
            ) : activeTab === 'register' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-600 hover:text-blue-600 font-semibold cursor-pointer"
              >
                Already registered? <span className="text-blue-600 underline">Sign In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-600 hover:text-blue-600 font-semibold cursor-pointer"
              >
                Don't have an account? <span className="text-blue-600 underline">Register free</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
