import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SQLITE_DB_PATH = path.resolve(process.cwd(), 'data', 'vedicx.db');
const SEED_SQL_PATH = path.resolve(process.cwd(), 'supabase', 'seed.sql');

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error(`[MIGRATION ERROR] SQLite database not found at ${SQLITE_DB_PATH}`);
  process.exit(1);
}

const sqliteDb = new Database(SQLITE_DB_PATH, { readonly: true });

// Topological order respecting foreign key dependencies
const TABLE_ORDER = [
  'profiles',
  'subjects',
  'categories',
  'chapters',
  'questions',
  'mock_tests',
  'mock_test_questions',
  'sample_papers',
  'pyq_questions',
  'payments',
  'memberships',
  'test_attempts',
  'student_answers',
  'appointments',
  'site_settings',
  'audit_logs',
  'backup_records'
];

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function generateSeedSql() {
  console.log('Generating complete Supabase seed.sql dump...');

  const statements = [
    '-- ============================================================================',
    '-- VEDICX Educational Platform - Full PostgreSQL Seed Data Dump',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Target: Supabase PostgreSQL (Project tuxxcwbwleqnrnmxuhkj)',
    '-- ============================================================================\n',
    '-- Temporarily disable foreign key triggers for bulk insertion',
    'SET session_replication_role = replica;\n'
  ];

  let totalRecords = 0;

  for (const tableName of TABLE_ORDER) {
    let rows = [];
    try {
      rows = sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
    } catch (e) {
      console.log(`[SKIP] Table "${tableName}" not in SQLite.`);
      continue;
    }

    totalRecords += rows.length;
    console.log(`[SEED] Table: ${tableName.padEnd(22)} (${rows.length} rows)`);

    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const colListStr = columns.map(c => `"${c}"`).join(', ');
    const pkConflict = tableName === 'site_settings' ? '("key")' : '("id")';

    statements.push(`-- ------------------------------------------------------------`);
    statements.push(`-- Data for public."${tableName}" (${rows.length} records)`);
    statements.push(`-- ------------------------------------------------------------`);

    const CHUNK_SIZE = 50;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const valuesStr = chunk.map(row => {
        const valArr = columns.map(col => {
          let val = row[col];
          // Boolean conversions
          if (['is_active', 'is_deleted', 'passed', 'is_correct'].includes(col) && typeof val === 'number') {
            val = val === 1;
          }
          // Date formatting for appointments
          if (tableName === 'appointments' && col === 'appointment_date' && typeof val === 'string' && val.includes('T')) {
            val = val.split('T')[0];
          }
          return escapeSqlValue(val);
        });
        return `  (${valArr.join(', ')})`;
      }).join(',\n');

      statements.push(
        `INSERT INTO public."${tableName}" (${colListStr})\nVALUES\n${valuesStr}\nON CONFLICT ${pkConflict} DO NOTHING;\n`
      );
    }
  }

  statements.push('\n-- Re-enable foreign key constraints and triggers');
  statements.push('SET session_replication_role = DEFAULT;\n');

  fs.writeFileSync(SEED_SQL_PATH, statements.join('\n'), 'utf8');
  console.log(`\n[SUCCESS] Generated ${SEED_SQL_PATH}`);
  console.log(`Total records structured: ${totalRecords}`);
  console.log(`Seed File Size: ${(fs.statSync(SEED_SQL_PATH).size / 1024).toFixed(1)} KB`);
}

generateSeedSql();
