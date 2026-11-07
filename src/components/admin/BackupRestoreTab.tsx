import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Trash2,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  HardDriveDownload,
  Lock
} from 'lucide-react';
import { BackupRecord } from '../../types';
import { api } from '../../services/api';

interface BackupRestoreTabProps {
  showNotification: (type: 'success' | 'error', msg: string) => void;
  onRestored: () => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
  showNotification,
  onRestored
}) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyModal, setVerifyModal] = useState<any>(null);

  const loadBackups = async () => {
    try {
      const res = await api.getBackupsList();
      setBackups(res.backups);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load backups');
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const res = await api.createBackup('manual');
      showNotification('success', res.message || 'Manual backup created successfully.');
      loadBackups();
    } catch (err: any) {
      showNotification('error', err.message || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBeforeRestore = async (filename: string) => {
    try {
      const res = await api.verifyBackup(filename);
      setVerifyModal({ filename, ...res });
    } catch (err: any) {
      showNotification('error', err.message || 'Backup verification failed');
    }
  };

  const handleConfirmRestore = async (filename: string) => {
    if (
      !window.confirm(
        `CONFIRM DATABASE RESTORATION:\nAre you sure you want to restore the entire database from snapshot: ${filename}?\n\nVEDICX will automatically create a pre-restore safety snapshot before applying changes.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.restoreBackup(filename);
      showNotification('success', res.message || 'Database restored successfully!');
      setVerifyModal(null);
      loadBackups();
      onRestored();
    } catch (err: any) {
      showNotification('error', err.message || 'Restoration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm('Delete this backup snapshot from disk?')) return;
    try {
      await api.deleteBackup(id);
      showNotification('success', 'Backup deleted.');
      loadBackups();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete backup');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Database Backup & Restoration</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold font-mono">
              {backups.length} Snapshots
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full ACID transactional exports with SHA256 integrity checksums, automatic pre-restore snapshots, and rollback support.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{loading ? 'Creating Backup...' : 'Create Manual Backup'}</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Zero-Data-Loss Architecture Active</div>
          <div className="text-blue-700 leading-relaxed text-[11px]">
            Every manual or scheduled backup produces an atomic JSON snapshot accompanied by a cryptographic SHA-256 hash.
            Prior to any restore action, a safety snapshot is automatically generated so you can revert at any moment.
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {backups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No database backups available yet</div>
            <p className="text-xs text-slate-400">Click the button above to generate your initial snapshot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">Snapshot Name & Filename</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">File Size</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{b.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{b.filename}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          b.backup_type === 'pre_restore'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {b.backup_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {Math.round(b.file_size_bytes / 1024)} KB
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/backup/download/${b.filename}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1"
                          download
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => handleVerifyBeforeRestore(b.filename)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete Snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* PRE-RESTORE VERIFICATION MODAL */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">Pre-Restoration Verification</h3>
                <p className="text-xs text-slate-500 font-mono">{verifyModal.filename}</p>
              </div>
              <button onClick={() => setVerifyModal(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cryptographic SHA-256 Checksum Verified & Schema Validated</span>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Records Found in Snapshot:
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded-xl p-2 bg-slate-50">
                {verifyModal.table_summary?.map((t: any) => (
                  <div key={t.table} className="flex justify-between py-1 text-slate-700">
                    <span className="font-semibold">{t.table}:</span>
                    <span className="font-mono font-bold text-slate-900">{t.count} records</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Restoration Safety Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Restoring this snapshot will replace current table contents with the snapshot data.
                An automated safety backup will be stored before the restore commences.
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRestore(verifyModal.filename)}
                disabled={loading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Restoring...' : 'Confirm & Restore Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
