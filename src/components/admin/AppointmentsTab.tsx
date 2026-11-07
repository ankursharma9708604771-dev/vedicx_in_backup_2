import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Database,
  ExternalLink,
  MessageSquare,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AppointmentBooking } from '../../types';
import { api } from '../../services/api';

interface AppointmentsTabProps {
  showNotification: (type: 'success' | 'error', message: string) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ showNotification }) => {
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getAppointments(params);
      setAppointments(res.appointments || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAppointments();
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    try {
      setUpdatingId(id);
      await api.updateAppointmentStatus(id, newStatus);
      showNotification('success', `Appointment status updated to ${newStatus}`);
      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update appointment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment booking?')) return;
    try {
      await api.deleteAppointment(id);
      showNotification('success', 'Appointment deleted successfully.');
      setAppointments(prev => prev.filter(apt => apt.id !== id));
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete appointment');
    }
  };

  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                Mentorship Management
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" />
                Supabase Synced
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              1-on-1 Student Appointments
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage student mentorship bookings, doubt-clearing sessions, and board exam roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAppointments}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All Bookings</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{counts.total}</div>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</div>
            <div className="text-xl font-black text-amber-900 mt-0.5">{counts.pending}</div>
          </button>

          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              statusFilter === 'confirmed'
                ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Confirmed</div>
            <div className="text-xl font-black text-blue-900 mt-0.5">{counts.confirmed}</div>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{counts.completed}</div>
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              statusFilter === 'cancelled'
                ? 'bg-rose-50/80 border-rose-500 ring-1 ring-rose-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Cancelled</div>
            <div className="text-xl font-black text-rose-900 mt-0.5">{counts.cancelled}</div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, phone number or subject..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-white transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all"
        >
          Search
        </button>
      </form>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading appointments from database...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No appointments found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter !== 'all' || searchQuery
              ? 'No appointments matched your search or status filter.'
              : 'Appointments booked by students on the website will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt) => {
            const cleanPhone = apt.student_phone.replace(/\D/g, '');
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
              `Hi ${apt.student_name}, greetings from VEDICX! We have received your booking for 1-on-1 ${apt.counselling_type} on ${apt.appointment_date} at ${apt.appointment_time}.`
            )}`;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {apt.student_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-900">{apt.student_name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {apt.target_class}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`mailto:${apt.student_email}`} className="hover:text-blue-600 underline">
                            {apt.student_email}
                          </a>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{apt.student_phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Quick Message Link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Link</span>
                    </a>

                    {/* Status Dropdown */}
                    <select
                      value={apt.status}
                      disabled={updatingId === apt.id}
                      onChange={(e) =>
                        handleUpdateStatus(
                          apt.id,
                          e.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled'
                        )
                      }
                      className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${
                        apt.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : apt.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 rounded-xl p-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Subject / Focus:</span>
                    <span className="font-bold text-slate-800">{apt.subject}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Schedule:</span>
                    <span className="font-bold text-indigo-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(apt.appointment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}{' '}
                      • {apt.appointment_time}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Session Type:</span>
                    <span className="font-semibold text-slate-700">{apt.counselling_type}</span>
                  </div>
                </div>

                {/* Student's questions/doubts note */}
                {apt.notes && (
                  <div className="text-xs bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-slate-700">
                    <span className="font-bold text-blue-900 block mb-0.5">Student Notes / Doubts:</span>
                    <p className="italic text-slate-600">{apt.notes}</p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="font-mono">ID: {apt.id}</span>
                  <span>Booked: {new Date(apt.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
