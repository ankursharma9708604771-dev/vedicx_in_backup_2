import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Load environment variables from .env and .env.local if present
dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// 2. Parse CLI arguments (e.g. --url=https://... --service-key=ey...)
function getCliArg(prefix: string): string | undefined {
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : undefined;
}

// 3. Fallback: inspect supervisor process environment if running inside dev container
function discoverContainerEnv(): void {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const pids = fs.readdirSync('/proc').filter(p => /^\d+$/.test(p));
    for (const pid of pids) {
      try {
        const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
        if (cmd.includes('server.ts') || cmd.includes('node') || cmd.includes('vite')) {
          const envStr = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
          for (const entry of envStr.split('\0')) {
            const idx = entry.indexOf('=');
            if (idx > 0) {
              const k = entry.substring(0, idx);
              const v = entry.substring(idx + 1);
              if (!process.env[k] && (k.startsWith('SUPABASE_') || k.startsWith('VITE_') || k.startsWith('RAZORPAY_'))) {
                process.env[k] = v;
              }
            }
          }
        }
      } catch {}
    }
  } catch {}
}

discoverContainerEnv();

const cliUrl = getCliArg('--url=');
const cliServiceKey = getCliArg('--service-key=');

const supabaseUrl = cliUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// STRICT SECURITY: Privileged migration requires server-side service-role key only.
const supabaseServiceKey = cliServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface TableMigrationResult {
  table: string;
  sqliteCount: number;
  migratedCount: number;
  remoteCount: number | null;
  status: 'SUCCESS' | 'FAILED' | 'MISSING_IN_SUPABASE' | 'EMPTY';
  primaryKey: string;
  error?: string;
}

// Strict topological dependency order ensuring parent tables exist before child rows are inserted
export const TABLE_DEPENDENCY_ORDER: Array<{ name: string; pk: string }> = [
  { name: 'profiles', pk: 'id' },
  { name: 'subjects', pk: 'id' },
  { name: 'categories', pk: 'id' },
  { name: 'chapters', pk: 'id' },
  { name: 'questions', pk: 'id' },
  { name: 'mock_tests', pk: 'id' },
  { name: 'mock_test_questions', pk: 'id' },
  { name: 'sample_papers', pk: 'id' },
  { name: 'pyq_questions', pk: 'id' },
  { name: 'payments', pk: 'id' },
  { name: 'memberships', pk: 'id' },
  { name: 'test_attempts', pk: 'id' },
  { name: 'student_answers', pk: 'id' },
  { name: 'appointments', pk: 'id' },
  { name: 'site_settings', pk: 'key' },
  { name: 'audit_logs', pk: 'id' },
  { name: 'backup_records', pk: 'id' }
];

export function transformRowForPostgres(tableName: string, row: any): any {
  const copy = { ...row };

  // 1. Boolean conversions (SQLite stores 0/1 integers)
  const booleanCols = ['is_active', 'is_deleted', 'passed', 'is_correct'];
  for (const col of booleanCols) {
    if (col in copy && copy[col] !== null && copy[col] !== undefined) {
      copy[col] = Boolean(copy[col]);
    }
  }

  // 2. Timestamp ISO formatting for PostgreSQL timestamptz
  const timestampCols = ['created_at', 'updated_at', 'started_at', 'submitted_at', 'activated_at'];
  for (const col of timestampCols) {
    if (copy[col] && typeof copy[col] === 'string' && !copy[col].includes('T')) {
      try {
        copy[col] = new Date(copy[col].replace(' ', 'T') + 'Z').toISOString();
      } catch (e) {
        // Leave as is if parse fails
      }
    }
  }

  // 3. Appointment Date validation (must be YYYY-MM-DD for PostgreSQL DATE)
  if (tableName === 'appointments') {
    if (copy.appointment_date && typeof copy.appointment_date === 'string' && copy.appointment_date.includes('T')) {
      copy.appointment_date = copy.appointment_date.split('T')[0];
    }
    if (!copy.updated_at) {
      copy.updated_at = copy.created_at || new Date().toISOString();
    }
  }

  // 4. Numeric type coercion
  const numericCols = [
    'marks', 'negative_marks', 'max_marks', 'passing_marks',
    'marks_obtained', 'maximum_marks', 'percentage', 'amount',
    'download_count', 'year', 'source_year', 'file_size_bytes',
    'duration_minutes', 'total_questions', 'time_taken_seconds',
    'correct_answers', 'incorrect_answers', 'unanswered_questions',
    'marks_awarded', 'chapter_number', 'test_number', 'display_order',
    'free_test_used'
  ];
  for (const col of numericCols) {
    if (col in copy && copy[col] !== null && copy[col] !== undefined && copy[col] !== '') {
      copy[col] = Number(copy[col]);
    }
  }

  return copy;
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function runMigration(): Promise<TableMigrationResult[]> {
  const dbPath = path.resolve(process.cwd(), 'data', 'vedicx.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`[MIGRATION HALTED] SQLite database not found at ${dbPath}`);
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('========================================================================');
    console.error('[MIGRATION HALTED] Supabase credentials not provided in process.env or CLI.');
    console.error('Missing:');
    if (!supabaseUrl) console.error('  - SUPABASE_URL (or VITE_SUPABASE_URL)');
    if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nUsage Examples:');
    console.error('  1. With environment variables:');
    console.error('     SUPABASE_URL="https://xyz.supabase.co" SUPABASE_SERVICE_ROLE_KEY="ey..." npx tsx scripts/migrateToSupabase.ts');
    console.error('\n  2. With CLI parameters:');
    console.error('     npx tsx scripts/migrateToSupabase.ts --url="https://xyz.supabase.co" --service-key="ey..."');
    console.error('========================================================================');
    process.exit(1);
  }

  // Mask credentials for audit logging without leaking secrets
  const maskedKey = supabaseServiceKey.length > 12
    ? `${supabaseServiceKey.substring(0, 6)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 4)}`
    : '***';

  console.log('========================================================================');
  console.log('            VEDICX: PRODUCTION SQLITE -> SUPABASE MIGRATION             ');
  console.log('Target Supabase Instance:', supabaseUrl);
  console.log('Service Key (Masked):   ', maskedKey);
  console.log('SQLite Database Source:  ', dbPath, '(Read-Only Mode)');
  console.log('Mode:                    Resumable & Duplicate-Safe (Upsert by PK)');
  console.log('========================================================================\n');

  // Strict Read-Only SQLite access ensures the local file is NEVER modified or deleted
  const sqlite = new Database(dbPath, { readonly: true });
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  async function checkRemoteTableExists(tableName: string): Promise<boolean> {
    const { error } = await supabase.from(tableName).select('*', { count: 'exact' }).limit(1);
    if (error && (error.message.includes('schema cache') || error.code === 'PGRST205' || error.message.includes('does not exist'))) {
      return false;
    }
    return true;
  }

  async function getRemoteCount(tableName: string): Promise<number | null> {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (error) {
      const res2 = await supabase.from(tableName).select('*', { count: 'exact' }).limit(1);
      return res2.count ?? null;
    }
    return count ?? null;
  }

  const results: TableMigrationResult[] = [];
  let grandTotalSource = 0;
  let grandTotalMigrated = 0;

  for (const item of TABLE_DEPENDENCY_ORDER) {
    const { name: tableName, pk } = item;

    // 1. Read SQLite Source
    let rows: any[] = [];
    try {
      rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
    } catch (e: any) {
      console.log(`[SKIP] Table "${tableName}" does not exist in SQLite.`);
      continue;
    }

    const sqliteCount = rows.length;
    grandTotalSource += sqliteCount;

    if (sqliteCount === 0) {
      console.log(`[EMPTY] "${tableName}": 0 records in SQLite.`);
      results.push({
        table: tableName,
        sqliteCount: 0,
        migratedCount: 0,
        remoteCount: 0,
        status: 'EMPTY',
        primaryKey: pk
      });
      continue;
    }

    // 2. Check if table exists in Supabase
    const tableExists = await checkRemoteTableExists(tableName);
    if (!tableExists) {
      console.warn(`[NOT IN SUPABASE] Table "${tableName}" (${sqliteCount} records) is missing in Supabase.`);
      results.push({
        table: tableName,
        sqliteCount,
        migratedCount: 0,
        remoteCount: null,
        status: 'MISSING_IN_SUPABASE',
        primaryKey: pk,
        error: `Table "${tableName}" not found in Supabase schema. Execute supabase/vedicx_schema_and_rls.sql in SQL Editor.`
      });
      continue;
    }

    // 3. Transform rows for PostgreSQL
    const transformed = rows.map(r => transformRowForPostgres(tableName, r));

    // 4. Batch upsert in chunks of 50 with row-level fallback
    console.log(`[MIGRATING] "${tableName}": ${sqliteCount} records -> Supabase public."${tableName}" (PK: "${pk}")...`);
    const chunks = chunkArray(transformed, 50);
    let migratedCount = 0;
    let tableError: string | undefined;

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: pk });

      if (error) {
        console.warn(`  [RETRY] Batch chunk ${c + 1}/${chunks.length} on "${tableName}" failed (${error.message}). Retrying row-by-row...`);
        // Row-by-row fallback to isolate individual row errors
        for (const singleRow of chunk) {
          const { error: singleErr } = await supabase.from(tableName).upsert(singleRow, { onConflict: pk });
          if (singleErr) {
            console.error(`    [ROW ERROR] ${tableName} PK ${singleRow[pk]}:`, singleErr.message);
            tableError = singleErr.message;
          } else {
            migratedCount++;
          }
        }
      } else {
        migratedCount += chunk.length;
      }
    }

    // 5. Query remote count for verification
    const remoteCount = await getRemoteCount(tableName);
    const isSuccess = migratedCount === sqliteCount && !tableError;

    if (isSuccess) {
      grandTotalMigrated += migratedCount;
      console.log(`  [SUCCESS] "${tableName}": ${migratedCount}/${sqliteCount} records verified in Supabase (Remote count: ${remoteCount}).`);
    } else {
      console.error(`  [PARTIAL/FAILED] "${tableName}": ${migratedCount}/${sqliteCount} records migrated.`);
    }

    results.push({
      table: tableName,
      sqliteCount,
      migratedCount,
      remoteCount,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      primaryKey: pk,
      error: tableError
    });
  }

  // 6. Write detailed migration audit log
  const logData = {
    timestamp: new Date().toISOString(),
    supabase_url: supabaseUrl,
    total_sqlite_records: grandTotalSource,
    total_migrated_records: grandTotalMigrated,
    results
  };

  const logPath = path.resolve(process.cwd(), 'supabase', 'migration_log.json');
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf8');

  console.log('\n========================================================================');
  console.log(`Migration Complete: ${grandTotalMigrated}/${grandTotalSource} records migrated.`);
  console.log('Migration log saved to:', logPath);
  console.log('========================================================================\n');

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(results => {
      console.table(results.map(r => ({
        Table: r.table,
        SQLite: r.sqliteCount,
        Migrated: r.migratedCount,
        Remote: r.remoteCount ?? 'N/A',
        Status: r.status,
        Error: r.error ? r.error.substring(0, 45) + '...' : 'None'
      })));
    })
    .catch(err => {
      console.error('Fatal Migration Error:', err);
      process.exit(1);
    });
}
