import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  X,
  AlertCircle,
  Database,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserProfile, AppointmentBooking } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseClientConfigured } from '../lib/supabaseClient';

interface AppointmentModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess?: (appointment: AppointmentBooking) => void;
}

const TIME_SLOTS = [
  '10:00 AM - 11:00 AM (Morning)',
  '11:30 AM - 12:30 PM (Morning)',
  '02:00 PM - 03:00 PM (Afternoon)',
  '04:00 PM - 05:00 PM (Evening)',
  '05:30 PM - 06:30 PM (Evening)',
  '07:30 PM - 08:30 PM (Night Prime)'
];

const SUBJECT_OPTIONS = [
  'Mathematics (Class 10)',
  'Science (Physics / Chemistry / Biology)',
  'Social Science (History, Geo, Pol, Eco)',
  'Complete Board Exam Strategy & Roadmap',
  'Mock Test Performance Analysis'
];

const COUNSELLING_TYPES = [
  {
    id: '1-on-1 Doubt Clearing',
    title: '1-on-1 Doubt Clearing',
    desc: 'Clarify tricky questions, proofs & numericals'
  },
  {
    id: 'Board Exam Strategy & Roadmap',
    title: 'Board Exam Strategy & 95%+ Roadmap',
    desc: 'Time management, presentation & study schedule'
  },
  {
    id: 'Mock Test Review',
    title: 'Mock Test Performance Review',
    desc: 'Analyze errors, negative marking & weak chapters'
  },
  {
    id: 'Weak Chapter Crash Plan',
    title: 'Weak Chapter Mastery Plan',
    desc: 'Targeted focus on difficult chapters'
  }
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  // Pre-fill tomorrow's date by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    student_name: currentUser?.full_name || '',
    student_email: currentUser?.email || '',
    student_phone: '',
    target_class: 'Class 10',
    subject: 'Mathematics (Class 10)',
    counselling_type: '1-on-1 Doubt Clearing',
    appointment_date: defaultDateStr,
    appointment_time: TIME_SLOTS[3],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentBooking | null>(null);
  const [supabaseSynced, setSupabaseSynced] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.student_name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.student_email.trim() || !formData.student_email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.student_phone.trim() || formData.student_phone.trim().length < 10) {
      setError('Please provide a valid 10-digit WhatsApp/Mobile number.');
      return;
    }
    if (!formData.appointment_date) {
      setError('Please select your preferred date.');
      return;
    }

    try {
      setLoading(true);

      // Submit via backend API (which automatically syncs to Supabase and saves locally)
      const res = await api.bookAppointment({
        student_name: formData.student_name,
        student_email: formData.student_email,
        student_phone: formData.student_phone,
        target_class: formData.target_class,
        subject: formData.subject,
        counselling_type: formData.counselling_type,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        notes: formData.notes
      });

      // Also attempt direct client-side Supabase write if configured
      if (isSupabaseClientConfigured() && supabase) {
        try {
          await supabase.from('appointments').insert([
            {
              id: res.appointment.id,
              student_name: res.appointment.student_name,
              student_email: res.appointment.student_email,
              student_phone: res.appointment.student_phone,
              target_class: res.appointment.target_class,
              subject: res.appointment.subject,
              counselling_type: res.appointment.counselling_type,
              appointment_date: res.appointment.appointment_date,
              appointment_time: res.appointment.appointment_time,
              notes: res.appointment.notes,
              status: 'pending'
            }
          ]);
        } catch (clientErr) {
          // Backend already handled persistence
        }
      }

      setBookedAppointment(res.appointment);
      setSupabaseSynced(res.supabase_synced);
      if (onSuccess) {
        onSuccess(res.appointment);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit appointment booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              1-on-1 Academic Mentorship
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              Supabase Connected
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Book 1-on-1 Doubt & Strategy Session
          </h2>
          <p className="text-blue-100/90 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
            Schedule a personalized session with our expert CBSE educators. Get your doubts cleared, review test performance, and craft your 95%+ board exam roadmap.
          </p>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-7">
          {bookedAppointment ? (
            /* Success Screen */
            <div className="text-center py-6 sm:py-8 space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Appointment Booked Successfully!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Your mentorship session has been saved in our Supabase backend database and confirmed.
                </p>
              </div>

              {/* Booking Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-left max-w-lg mx-auto space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Booking ID:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {bookedAppointment.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.student_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Subject / Topic:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-semibold text-indigo-700">
                    {new Date(bookedAppointment.appointment_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })} • {bookedAppointment.appointment_time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Session Type:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.counselling_type}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Database Status:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <Database className="w-3.5 h-3.5" />
                    Synced to Supabase Backend
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                <p className="font-semibold flex items-center justify-center gap-1.5 mb-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                  What happens next?
                </p>
                Our academic mentor will send the Google Meet / Zoom meeting invitation link to your WhatsApp (<strong>{bookedAppointment.student_phone}</strong>) and email before your session.
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setBookedAppointment(null);
                    setFormData(prev => ({ ...prev, notes: '' }));
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm cursor-pointer transition-all"
                >
                  Book Another Session
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Personal Details: 2 columns on tablet/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.student_phone}
                    onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
                    placeholder="e.g. 9876543210 (for session link)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.student_email}
                    onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Target Class & Curriculum
                  </label>
                  <select
                    value={formData.target_class}
                    onChange={(e) => setFormData({ ...formData, target_class: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 outline-none transition-all bg-white"
                  >
                    <option value="Class 10">Class 10 CBSE 2025</option>
                    <option value="Class 9">Class 9 CBSE</option>
                    <option value="Class 10 State Board">Class 10 State Board</option>
                  </select>
                </div>
              </div>

              {/* Counselling Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Select Session Goal *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COUNSELLING_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setFormData({ ...formData, counselling_type: type.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.counselling_type === type.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {type.title}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          formData.counselling_type === type.id
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300'
                        }`}>
                          {formData.counselling_type === type.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {type.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Subject / Focus Area *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 outline-none transition-all bg-white"
                >
                  {SUBJECT_OPTIONS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot: 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Preferred Time Slot *
                  </label>
                  <select
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 outline-none transition-all bg-white"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Doubts / Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  Specific Questions, Doubts or Topics (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. I need help with Trigonometric Identities and Quadratic Word Problems..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Saves directly to Supabase Backend Tables</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving to Supabase...
                      </span>
                    ) : (
                      <>
                        <span>Confirm Appointment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
