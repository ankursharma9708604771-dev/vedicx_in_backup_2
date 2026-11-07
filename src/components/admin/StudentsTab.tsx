import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Award,
  Calendar,
  X,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';

interface StudentsTabProps {
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ showNotification }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedTier) params.membership_tier = selectedTier;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getStudents(params);
      setStudents(res.students);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedTier, selectedStatus]);

  const handleToggleStatus = async (s: any) => {
    const nextStatus = !s.is_active;
    try {
      await api.toggleStudentStatus(s.id, nextStatus);
      showNotification('success', `Student account ${nextStatus ? 'activated' : 'deactivated'}.`);
      loadStudents();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleUpgrade = async (s: any) => {
    const nextTier = s.membership_tier === 'premium' ? 'free' : 'premium';
    try {
      await api.upgradeStudentMembership(s.id, nextTier);
      showNotification('success', `Membership upgraded to ${nextTier.toUpperCase()}.`);
      loadStudents();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const viewStudentDetails = async (id: string) => {
    try {
      setLoadingDetail(true);
      const details = await api.getStudentDetails(id);
      setSelectedStudentDetail(details);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const viewAttemptScorecard = async (attemptId: string) => {
    try {
      const res = await api.getAttemptResult(attemptId);
      setSelectedAttemptDetail(res);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load test attempt scorecard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Student Management</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold font-mono">
              {students.length} Registered
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View test history, membership tiers, attempt scorecards & account activation status.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadStudents()}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedTier}
          onChange={e => setSelectedTier(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">All Tiers</option>
          <option value="free">Free Tier</option>
          <option value="premium">Premium (₹49)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">All Account Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="inactive">Deactivated Accounts</option>
        </select>

        <button
          onClick={loadStudents}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading student records...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No students found</div>
            <p className="text-xs text-slate-400">Try modifying your search or tier filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Membership</th>
                  <th className="p-3.5">Tests Completed</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{s.full_name || 'Anonymous Student'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          s.membership_tier === 'premium'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.membership_tier === 'premium' && <Award className="w-3 h-3 text-amber-600" />}
                        <span>{s.membership_tier}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{s.total_attempts}</span>
                      <span className="text-slate-500 text-[11px] ml-1">attempt(s)</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewStudentDetails(s.id)}
                          className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-xs font-bold cursor-pointer"
                        >
                          View History
                        </button>
                        <button
                          onClick={() => handleUpgrade(s)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          {s.membership_tier === 'premium' ? 'Revoke to Free' : 'Grant Premium'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            s.is_active ? 'text-rose-700 bg-rose-50 hover:bg-rose-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT DETAILS & ATTEMPTS MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedStudentDetail.student.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedStudentDetail.student.email} • Tier: {selectedStudentDetail.student.membership_tier.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Examination Attempts History ({selectedStudentDetail.attempts.length})
              </h4>

              {selectedStudentDetail.attempts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  This student has not submitted any mock tests yet.
                </div>
              ) : (
                <div className="divide-y border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {selectedStudentDetail.attempts.map((att: any) => (
                    <div
                      key={att.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{att.test_title}</div>
                        <div className="text-[11px] text-slate-500">
                          {att.subject_name} • Started: {new Date(att.started_at).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.passed ? 'Passed' : 'Needs Practice'}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {att.time_taken_seconds ? `${Math.round(att.time_taken_seconds / 60)} mins` : '--'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-black text-blue-600 text-sm">
                            {att.marks_obtained} / {att.maximum_marks}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold">{att.percentage}% Score</div>
                        </div>

                        <button
                          onClick={() => viewAttemptScorecard(att.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                        >
                          Scorecard
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ATTEMPT SCORECARD MODAL */}
      {selectedAttemptDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedAttemptDetail.attempt?.test_title} – Attempt Scorecard
                </h3>
                <p className="text-xs text-slate-500">
                  Score: {selectedAttemptDetail.attempt?.marks_obtained} / {selectedAttemptDetail.attempt?.maximum_marks} ({selectedAttemptDetail.attempt?.percentage}%)
                </p>
              </div>
              <button
                onClick={() => setSelectedAttemptDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Question Breakdown ({selectedAttemptDetail.answers?.length || 0})
              </h4>

              <div className="space-y-3">
                {selectedAttemptDetail.answers?.map((ans: any, idx: number) => (
                  <div
                    key={ans.question_id || idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      ans.is_correct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-slate-900">
                        Q{idx + 1}. {ans.question_text}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          ans.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ans.is_correct ? `+${ans.marks_awarded} Marks` : '0 Marks'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-1.5 bg-white rounded border">
                        <span className="font-bold">Student Selected:</span>{' '}
                        <span className="font-mono text-blue-700 font-bold">{ans.selected_answer || 'Unanswered'}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border">
                        <span className="font-bold">Correct Key:</span>{' '}
                        <span className="font-mono text-emerald-700 font-bold">{ans.correct_answer}</span>
                      </div>
                    </div>

                    {ans.explanation && (
                      <div className="p-2.5 bg-white rounded-lg border text-slate-600 text-[11px] leading-relaxed">
                        <strong className="text-slate-800">NCERT Explanation:</strong> {ans.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedAttemptDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
