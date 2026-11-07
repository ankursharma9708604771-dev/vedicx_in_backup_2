import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseServerClient } from './supabase.ts';
import { logAuditEvent } from './supabaseDb.ts';

const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const BACKUP_TABLES = [
  'site_settings',
  'profiles',
  'subjects',
  'categories',
  'chapters',
  'questions',
  'mock_tests',
  'mock_test_questions',
  'test_attempts',
  'student_answers',
  'sample_papers',
  'pyq_questions',
  'payments',
  'memberships',
  'audit_logs'
];

export interface BackupData {
  version: string;
  metadata: {
    createdAt: string;
    backupType: 'manual' | 'scheduled' | 'pre_restore';
    recordCounts: Record<string, number>;
    checksum: string;
  };
  tables: Record<string, any[]>;
}

export async function createDatabaseBackup(backupType: 'manual' | 'scheduled' | 'pre_restore' = 'manual', adminEmail = 'admin@vedicx.in'): Promise<{
  id: string;
  name: string;
  filename: string;
  fileSizeBytes: number;
  recordCounts: Record<string, number>;
}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `bkp-${Date.now()}`;
  const filename = `vedicx_backup_${backupType}_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  const tablesData: Record<string, any[]> = {};
  const recordCounts: Record<string, number> = {};

  const sb = supabaseServerClient;
  if (!sb) {
    throw new Error('Supabase client is not available.');
  }

  for (const table of BACKUP_TABLES) {
    try {
      const { data, error } = await sb.from(table).select('*');
      if (error) {
        console.error(`Error reading table ${table} for backup:`, error.message);
        tablesData[table] = [];
        recordCounts[table] = 0;
      } else {
        tablesData[table] = data || [];
        recordCounts[table] = (data || []).length;
      }
    } catch (err: any) {
      console.error(`Error reading table ${table} for backup:`, err);
      tablesData[table] = [];
      recordCounts[table] = 0;
    }
  }

  // Calculate content hash for integrity verification
  const payloadString = JSON.stringify(tablesData);
  const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

  const backupPayload: BackupData = {
    version: '1.0.0',
    metadata: {
      createdAt: new Date().toISOString(),
      backupType,
      recordCounts,
      checksum
    },
    tables: tablesData
  };

  const fileContent = JSON.stringify(backupPayload, null, 2);
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  const fileStats = fs.statSync(filePath);

  const backupName = `VEDICX ${backupType.toUpperCase()} Backup - ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  // Record in backup_records table in Supabase
  await sb.from('backup_records').insert([{
    id: backupId,
    name: backupName,
    filename,
    file_size_bytes: fileStats.size,
    backup_type: backupType,
    status: 'completed',
    tables_included: JSON.stringify(BACKUP_TABLES),
    record_counts: JSON.stringify(recordCounts)
  }]);

  await logAuditEvent(
    'CREATE_BACKUP',
    'BACKUP',
    backupId,
    `Created ${backupType} backup with ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} total records.`
  );

  return {
    id: backupId,
    name: backupName,
    filename,
    fileSizeBytes: fileStats.size,
    recordCounts
  };
}

export function verifyBackupFile(filePath: string): { valid: boolean; error?: string; data?: BackupData } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Backup file does not exist on disk.' };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: BackupData = JSON.parse(raw);

    if (!parsed.version || !parsed.metadata || !parsed.tables) {
      return { valid: false, error: 'Invalid backup structure. Missing version, metadata or tables.' };
    }

    // Verify sha256 checksum
    const computedChecksum = crypto.createHash('sha256').update(JSON.stringify(parsed.tables)).digest('hex');
    if (computedChecksum !== parsed.metadata.checksum) {
      return { valid: false, error: 'Backup checksum mismatch! File may be corrupted or altered.' };
    }

    // Verify essential tables exist
    for (const reqTable of ['profiles', 'subjects', 'chapters', 'mock_tests']) {
      if (!Array.isArray(parsed.tables[reqTable])) {
        return { valid: false, error: `Corrupt backup: missing mandatory table '${reqTable}'.` };
      }
    }

    return { valid: true, data: parsed };
  } catch (err: any) {
    return { valid: false, error: `Failed to parse backup JSON: ${err.message}` };
  }
}

export async function restoreDatabaseFromBackup(filename: string, adminEmail = 'admin@vedicx.in'): Promise<{
  success: boolean;
  message: string;
  preRestoreBackupId?: string;
  restoredCounts?: Record<string, number>;
}> {
  const filePath = path.join(BACKUP_DIR, filename);
  const verification = verifyBackupFile(filePath);

  if (!verification.valid || !verification.data) {
    return {
      success: false,
      message: verification.error || 'Backup verification failed.'
    };
  }

  const backupData = verification.data;
  const sb = supabaseServerClient;
  if (!sb) {
    return { success: false, message: 'Supabase client not available' };
  }

  // Safe precautionary pre-restore backup
  console.log('[BACKUP] Creating pre-restore snapshot before restoration...');
  const preRestore = await createDatabaseBackup('pre_restore', adminEmail);

  try {
    for (const table of BACKUP_TABLES) {
      const rows = backupData.tables[table] || [];
      if (rows.length === 0) continue;
      // Upsert rows in batches to Supabase
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await sb.from(table).upsert(batch);
        if (error) {
          console.warn(`[RESTORE] Warning upserting to ${table}:`, error.message);
        }
      }
    }

    await logAuditEvent(
      'RESTORE_BACKUP',
      'BACKUP',
      filename,
      `Restored database tables from ${filename}. Pre-restore backup ID: ${preRestore.id}.`
    );

    return {
      success: true,
      message: `Database restored successfully. Restored ${Object.keys(backupData.tables).length} tables. Pre-restore snapshot created.`,
      preRestoreBackupId: preRestore.id,
      restoredCounts: backupData.metadata.recordCounts
    };
  } catch (err: any) {
    console.error('[BACKUP] Restoration failed:', err);
    return {
      success: false,
      message: `Restoration failed: ${err.message}.`
    };
  }
}

export async function listBackups() {
  const sb = supabaseServerClient;
  if (sb) {
    const { data, error } = await sb.from('backup_records').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((r: any) => ({
        ...r,
        record_counts: typeof r.record_counts === 'string' ? JSON.parse(r.record_counts || '{}') : (r.record_counts || {}),
        tables_included: typeof r.tables_included === 'string' ? JSON.parse(r.tables_included || '[]') : (r.tables_included || [])
      }));
    }
  }
  return [];
}

export async function deleteBackup(id: string, adminEmail = 'admin@vedicx.in'): Promise<boolean> {
  const sb = supabaseServerClient;
  if (!sb) return false;

  const { data: record } = await sb.from('backup_records').select('*').eq('id', id).maybeSingle();
  if (!record) return false;

  const filePath = path.join(BACKUP_DIR, record.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not unlink backup file:', err);
    }
  }

  await sb.from('backup_records').delete().eq('id', id);

  await logAuditEvent(
    'DELETE_BACKUP',
    'BACKUP',
    id,
    `Deleted backup record and file: ${record.filename}`
  );

  return true;
}

export function getBackupFilePath(filename: string): string | null {
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
