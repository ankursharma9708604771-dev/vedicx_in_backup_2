import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  HelpCircle,
  PlusCircle,
  Upload,
  FileText,
  Users,
  CreditCard,
  Database,
  Settings,
  LogOut,
  RefreshCw,
  BookOpen,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Calendar
} from 'lucide-react';
import {
  UserProfile,
  Subject,
  DashboardStats
} from '../../types';
import { api } from '../../services/api';

// Modular Admin Tabs
import { QuestionBankTab } from './QuestionBankTab';
import { AddQuestionTab } from './AddQuestionTab';
import { BulkUploadTab } from './BulkUploadTab';
import { MockTestsTab } from './MockTestsTab';
import { SubjectsChaptersTab } from './SubjectsChaptersTab';
import { SamplePapersTab } from './SamplePapersTab';
import { PyqsTab } from './PyqsTab';
import { StudentsTab } from './StudentsTab';
import { AppointmentsTab } from './AppointmentsTab';
import { PaymentsTab } from './PaymentsTab';
import { BackupRestoreTab } from './BackupRestoreTab';
import { SiteSettingsTab } from './SiteSettingsTab';

interface AdminDashboardProps {
  currentUser: UserProfile | null;
  onExitAdmin: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'question_bank'
  | 'add_question'
  | 'bulk_upload'
  | 'mock_tests'
  | 'chapters'
  | 'sample_papers'
  | 'pyqs'
  | 'students'
  | 'appointments'
  | 'payments'
  | 'backup_restore'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global state across dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load initial dashboard stats & subjects
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setStats(res.stats);
      setDashboardData(res);
      const subsRes = await api.getSubjects();
      setSubjects(subsRes.subjects);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">VX</div>
          <span className="font-bold text-base">VEDICX Admin</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 cursor-pointer"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between z-40 transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 overflow-y-auto">
          {/* Admin Branding */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-md">
              VX
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight">VEDICX ADMIN</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
                Class 10 Management
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'question_bank', label: 'Question Bank', icon: HelpCircle },
              { id: 'add_question', label: 'Add Questions', icon: PlusCircle },
              { id: 'bulk_upload', label: 'Bulk CSV Import', icon: Upload },
              { id: 'mock_tests', label: 'Mock Test Slots', icon: Layers },
              { id: 'chapters', label: 'Subjects & Chapters', icon: BookOpen },
              { id: 'sample_papers', label: 'Sample Papers', icon: FileText },
              { id: 'pyqs', label: 'Previous Year Qs', icon: FileCheck },
              { id: 'students', label: 'Student Management', icon: Users },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'payments', label: 'Payment Records', icon: CreditCard },
              { id: 'backup_restore', label: 'Backup & Restore', icon: Database },
              { id: 'settings', label: 'Website Content', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 rounded-lg bg-slate-800/60 mb-2 text-xs">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Administrator</div>
            <div className="font-bold text-white truncate">{currentUser?.email || 'admin@vedicx.in'}</div>
          </div>
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit to Student Site</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-35 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-4 duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-rose-600 text-white shadow-rose-600/30'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight break-words">
                  Platform Overview
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Real-time database aggregated metrics & examination activity.
                </p>
              </div>
              <button
                onClick={loadStats}
                disabled={loading}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase truncate">Questions Bank</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">{stats.total_questions}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{stats.published_questions} Published</div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase truncate">Mock Tests Slots</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">{stats.total_mock_tests}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{stats.published_mock_tests} Live Tests</div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase truncate">Students</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">{stats.total_students}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
                  {stats.premium_users} Prem • {stats.free_users} Free
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase truncate">Total Revenue</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">₹{stats.total_revenue}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{stats.total_payments} Completed</div>
              </div>
            </div>

            {/* Recent Activity and Question Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent Audit Activity */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Recent Audit Activity</span>
                  <span className="text-xs text-slate-400 font-mono">Live Logs</span>
                </h3>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {dashboardData?.recent_activities?.map((log: any) => (
                    <div key={log.id} className="py-2.5 text-xs flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800">{log.action}:</span>{' '}
                        <span className="text-slate-600">{log.details || log.entity_type}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.user_email}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Question Bank by Subject
                </h3>
                <div className="space-y-4">
                  {dashboardData?.subject_distribution?.map((sub: any) => (
                    <div key={sub.name}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{sub.name}</span>
                        <span className="font-bold text-slate-900">{sub.question_count} Questions</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, (sub.question_count / Math.max(1, stats.total_questions)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED QUESTION BANK */}
        {activeTab === 'question_bank' && (
          <QuestionBankTab
            subjects={subjects}
            onAddNew={() => setActiveTab('add_question')}
            showNotification={showNotification}
          />
        )}

        {/* TAB 3: ADD QUESTION */}
        {activeTab === 'add_question' && (
          <AddQuestionTab
            subjects={subjects}
            onSaved={() => {
              showNotification('success', 'Question created successfully!');
              loadStats();
              setActiveTab('question_bank');
            }}
            showNotification={showNotification}
          />
        )}

        {/* TAB 4: BULK CSV IMPORT */}
        {activeTab === 'bulk_upload' && (
          <BulkUploadTab
            subjects={subjects}
            onSuccess={() => {
              showNotification('success', 'Bulk import executed successfully!');
              loadStats();
              setActiveTab('question_bank');
            }}
            showNotification={showNotification}
          />
        )}

        {/* TAB 5: MOCK TEST SLOTS MANAGEMENT */}
        {activeTab === 'mock_tests' && (
          <MockTestsTab
            subjects={subjects}
            showNotification={showNotification}
          />
        )}

        {/* TAB 6: SUBJECTS & CHAPTERS */}
        {activeTab === 'chapters' && (
          <SubjectsChaptersTab
            subjects={subjects}
            onRefreshSubjects={loadStats}
            showNotification={showNotification}
          />
        )}

        {/* TAB 7: SAMPLE PAPERS */}
        {activeTab === 'sample_papers' && (
          <SamplePapersTab
            subjects={subjects}
            showNotification={showNotification}
          />
        )}

        {/* TAB 8: PREVIOUS YEAR QUESTIONS */}
        {activeTab === 'pyqs' && (
          <PyqsTab
            subjects={subjects}
            showNotification={showNotification}
          />
        )}

        {/* TAB 9: STUDENT MANAGEMENT */}
        {activeTab === 'students' && (
          <StudentsTab showNotification={showNotification} />
        )}

        {/* TAB: APPOINTMENTS (SUPABASE) */}
        {activeTab === 'appointments' && (
          <AppointmentsTab showNotification={showNotification} />
        )}

        {/* TAB 10: PAYMENTS */}
        {activeTab === 'payments' && (
          <PaymentsTab showNotification={showNotification} />
        )}

        {/* TAB 11: BACKUP & RESTORE */}
        {activeTab === 'backup_restore' && (
          <BackupRestoreTab showNotification={showNotification} onRestored={loadStats} />
        )}

        {/* TAB 12: SITE SETTINGS / CMS */}
        {activeTab === 'settings' && (
          <SiteSettingsTab showNotification={showNotification} />
        )}
      </main>
    </div>
  );
};
