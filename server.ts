import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth.ts';
import { subjectsRouter } from './server/routes/subjects.ts';
import { mockTestsRouter } from './server/routes/mockTests.ts';
import { questionsRouter } from './server/routes/questions.ts';
import { testEngineRouter } from './server/routes/testEngine.ts';
import { samplePapersRouter } from './server/routes/samplePapers.ts';
import { pyqsRouter } from './server/routes/pyqs.ts';
import { paymentsRouter } from './server/routes/payments.ts';
import { studentsRouter } from './server/routes/students.ts';
import { backupRouter } from './server/routes/backup.ts';
import { dashboardRouter } from './server/routes/dashboard.ts';
import { settingsRouter } from './server/routes/settings.ts';
import { uploadRouter } from './server/routes/upload.ts';
import { appointmentsRouter } from './server/routes/appointments.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// Server configuration: Supabase is the primary operational database

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory for PDFs and Question diagrams
const UPLOADS_PATH = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

const PUBLIC_DIAGRAMS_PATH = path.resolve(process.cwd(), 'public', 'diagrams');
const DIST_DIAGRAMS_PATH = path.resolve(process.cwd(), 'dist', 'diagrams');
if (!fs.existsSync(PUBLIC_DIAGRAMS_PATH)) {
  fs.mkdirSync(PUBLIC_DIAGRAMS_PATH, { recursive: true });
}

// Diagram fallback SVG for missing diagrams
const FALLBACK_DIAGRAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
  <rect width="100%" height="100%" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="10"/>
  <rect x="20" y="20" width="360" height="180" fill="#ffffff" stroke="#e2e8f0" rx="8" stroke-dasharray="4 4"/>
  <circle cx="200" cy="90" r="32" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
  <path d="M188 95 L196 82 L204 95 Z" fill="#3b82f6"/>
  <circle cx="212" cy="80" r="5" fill="#3b82f6"/>
  <text x="200" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">Geometric Diagram Reference</text>
  <text x="200" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Figure linked with question text</text>
</svg>`;

// Diagram route with multi-directory resolution & fallback SVG (Never returns HTML!)
app.get('/diagrams/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const pubPath = path.join(PUBLIC_DIAGRAMS_PATH, safeFilename);
  const distPath = path.join(DIST_DIAGRAMS_PATH, safeFilename);

  if (fs.existsSync(pubPath)) {
    return res.sendFile(pubPath);
  }
  if (fs.existsSync(distPath)) {
    return res.sendFile(distPath);
  }

  // Safe fallback SVG with appropriate Content-Type
  res.status(200).type('image/svg+xml').send(FALLBACK_DIAGRAM_SVG);
});

// Uploads route with safe error (Never returns HTML!)
app.get('/uploads/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const targetPath = path.join(UPLOADS_PATH, safeFilename);

  if (fs.existsSync(targetPath)) {
    return res.sendFile(targetPath);
  }

  res.status(404).type('image/svg+xml').send(FALLBACK_DIAGRAM_SVG);
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/mock-tests', mockTestsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/test-engine', testEngineRouter);
app.use('/api/sample-papers', samplePapersRouter);
app.use('/api/pyqs', pyqsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/appointments', appointmentsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Safe server-side Supabase connectivity check
// Never logs, exposes, or returns secret values
app.get('/api/supabase-connection-check', async (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const variablesStatus = {
    SUPABASE_URL: Boolean(url && url.trim().length > 0),
    VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.trim().length > 0),
    VITE_SUPABASE_ANON_KEY: Boolean(anonKey && anonKey.trim().length > 0),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey && serviceKey.trim().length > 0)
  };

  const missing: string[] = [];
  if (!variablesStatus.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!variablesStatus.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    return res.status(503).json({
      connected: false,
      variables: variablesStatus,
      error: `Required server environment variables not available in process.env: ${missing.join(', ')}`
    });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Benign check 1: Auth API
    let authStatus = 'unknown';
    try {
      const { data: authData, error: authErr } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
      authStatus = authErr ? `Auth Error: ${authErr.message}` : `Healthy (${authData?.users?.length ?? 0} sample user(s) reachable)`;
    } catch (aErr: any) {
      authStatus = `Auth Exception: ${aErr.message}`;
    }

    // Benign check 2: Read-only table status across the 17 VEDICX tables
    const tableNames = [
      'subjects', 'categories', 'chapters', 'profiles', 'questions',
      'mock_tests', 'mock_test_questions', 'sample_papers', 'pyq_questions',
      'payments', 'memberships', 'test_attempts', 'student_answers',
      'appointments', 'site_settings', 'audit_logs', 'backup_records'
    ];

    const remoteTables: Record<string, { exists: boolean; recordCount?: number; status: string }> = {};
    for (const t of tableNames) {
      const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        remoteTables[t] = { exists: false, status: error.message };
      } else {
        remoteTables[t] = { exists: true, recordCount: count ?? 0, status: 'Active' };
      }
    }

    return res.json({
      connected: true,
      variables: variablesStatus,
      authStatus,
      remoteTables,
      message: 'Supabase server connection successful.'
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      variables: variablesStatus,
      error: err.message || 'Network error attempting to reach Supabase host.'
    });
  }
});

// Read-only inspection of the existing Supabase appointments table
app.get('/api/inspect-supabase-appointments', async (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return res.status(503).json({ error: 'Supabase credentials not available' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await client.from('appointments').select('*');
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ count: data.length, records: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist files
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VEDICX] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[VEDICX] Failed to start server:', err);
});
