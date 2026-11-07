import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedPolynomialsMockTests } from '../scripts/addPolynomialsMockTests.ts';
import { seedQuadraticEquations } from '../scripts/seedQuadraticEquations.ts';
import { seedArithmeticProgressions } from '../scripts/seedArithmeticProgressions.ts';
import { seedTriangles } from '../scripts/seedTriangles.ts';
import { seedCoordinateGeometry } from '../scripts/seedCoordinateGeometry.ts';
import { seedTrigonometryChapters } from '../scripts/seedTrigonometryChapters.ts';
import { seedCirclesChapters } from '../scripts/seedCirclesChapters.ts';
import { seedMensurationStatsProb } from '../scripts/seedMensurationStatsProb.ts';
import { randomizeAllMockTestsOptions } from '../scripts/randomizeAllMockTestsOptions.ts';
import { generateQuestionDiagrams } from '../scripts/generateQuestionDiagrams.ts';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'vedicx.db');
export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  console.log('[DB] Initializing VEDICX SQLite Database schema...');

  db.exec(`
    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
      free_test_used INTEGER NOT NULL DEFAULT 0,
      membership_tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'premium'
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Categories (for Social Science: History, Geography, Political Science, Economics)
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    -- Chapters
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      category_id TEXT,
      chapter_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    -- Questions
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      class TEXT NOT NULL DEFAULT '10',
      subject_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
      question_type TEXT NOT NULL DEFAULT 'mcq', -- 'mcq' | 'multiple_select' | 'true_false'
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT NOT NULL, -- 'A', 'B', 'C', 'D' or 'A,B' or 'True'/'False'
      explanation TEXT,
      image_url TEXT,
      marks REAL NOT NULL DEFAULT 1.0,
      negative_marks REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
      source TEXT NOT NULL DEFAULT 'NCERT',
      source_year INTEGER,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    -- Mock Tests
    CREATE TABLE IF NOT EXISTS mock_tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      test_number INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      total_questions INTEGER NOT NULL DEFAULT 0,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      max_marks REAL NOT NULL DEFAULT 20.0,
      passing_marks REAL NOT NULL DEFAULT 8.0,
      access_type TEXT NOT NULL DEFAULT 'premium', -- 'free' | 'premium'
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    -- Mock Test Questions (Mapping / assignment)
    CREATE TABLE IF NOT EXISTS mock_test_questions (
      id TEXT PRIMARY KEY,
      mock_test_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE(mock_test_id, question_id)
    );

    -- Test Attempts
    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      mock_test_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'submitted' | 'expired'
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT,
      time_taken_seconds INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      incorrect_answers INTEGER DEFAULT 0,
      unanswered_questions INTEGER DEFAULT 0,
      marks_obtained REAL DEFAULT 0.0,
      maximum_marks REAL DEFAULT 0.0,
      percentage REAL DEFAULT 0.0,
      passed INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
    );

    -- Student Answers
    CREATE TABLE IF NOT EXISTS student_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      marks_awarded REAL DEFAULT 0.0,
      FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE(attempt_id, question_id)
    );

    -- Sample Papers
    CREATE TABLE IF NOT EXISTS sample_papers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      year_set TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_size TEXT NOT NULL DEFAULT '1.2 MB',
      access_type TEXT NOT NULL DEFAULT 'free', -- 'free' | 'premium'
      status TEXT NOT NULL DEFAULT 'published',
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    -- PYQs (Previous Year Questions)
    CREATE TABLE IF NOT EXISTS pyq_questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      chapter_id TEXT,
      topic TEXT,
      question_type TEXT NOT NULL DEFAULT 'Subjective/Short',
      question_text TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 3,
      solution_text TEXT NOT NULL,
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      transaction_id TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 49.0,
      currency TEXT NOT NULL DEFAULT 'INR',
      gateway TEXT NOT NULL DEFAULT 'Razorpay',
      status TEXT NOT NULL DEFAULT 'success', -- 'pending' | 'success' | 'failed'
      payment_signature TEXT,
      payment_method TEXT DEFAULT 'UPI / Card',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Memberships
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'premium',
      payment_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      activated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Backup Records
    CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      backup_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'scheduled' | 'pre_restore'
      status TEXT NOT NULL DEFAULT 'completed',
      tables_included TEXT NOT NULL,
      record_counts TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Site Settings
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Appointments Table (1-on-1 Academic Mentorship & Doubt Clearing)
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      student_phone TEXT NOT NULL,
      target_class TEXT NOT NULL DEFAULT 'Class 10',
      subject TEXT NOT NULL DEFAULT 'Mathematics',
      counselling_type TEXT NOT NULL DEFAULT '1-on-1 Doubt Clearing',
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_mock_tests_chapter ON mock_tests(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON test_attempts(student_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON test_attempts(mock_test_id);
  `);

  // Run safe schema migrations for new features
  try {
    const samplePaperCols = db.prepare("PRAGMA table_info(sample_papers)").all() as any[];
    if (!samplePaperCols.some(c => c.name === 'paper_type')) {
      db.exec("ALTER TABLE sample_papers ADD COLUMN paper_type TEXT NOT NULL DEFAULT 'pdf'");
    }
    if (!samplePaperCols.some(c => c.name === 'sections_json')) {
      db.exec("ALTER TABLE sample_papers ADD COLUMN sections_json TEXT");
    }
  } catch (err) {
    console.warn('sample_papers migration notice:', err);
  }

  try {
    const pyqCols = db.prepare("PRAGMA table_info(pyq_questions)").all() as any[];
    if (!pyqCols.some(c => c.name === 'option_a')) {
      db.exec("ALTER TABLE pyq_questions ADD COLUMN option_a TEXT");
      db.exec("ALTER TABLE pyq_questions ADD COLUMN option_b TEXT");
      db.exec("ALTER TABLE pyq_questions ADD COLUMN option_c TEXT");
      db.exec("ALTER TABLE pyq_questions ADD COLUMN option_d TEXT");
      db.exec("ALTER TABLE pyq_questions ADD COLUMN correct_answer TEXT");
    }
  } catch (err) {
    console.warn('pyq_questions migration notice:', err);
  }

  seedInitialData();
  ensureMockTestsIntegrity();
}

function ensureMockTestsIntegrity() {
  try {
    const polyCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch2'").get() as { count: number };
    const polyQCount = db.prepare("SELECT count(*) as count FROM questions WHERE chapter_id = 'math-ch2'").get() as { count: number };
    if (polyCount.count < 10 || polyQCount.count < 100) {
      console.log('[DB] Ensuring Polynomials 10 mock test sets & 100 questions...');
      seedPolynomialsMockTests(db);
    }

    const qeCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch4'").get() as { count: number };
    if (qeCount.count < 10) {
      console.log('[DB] Ensuring Quadratic Equations 10 mock test sets...');
      seedQuadraticEquations(db);
    }

    const apCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch5'").get() as { count: number };
    if (apCount.count < 8) {
      console.log('[DB] Ensuring Arithmetic Progressions 8 mock test sets...');
      seedArithmeticProgressions(db);
    }

    const triCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch6'").get() as { count: number };
    if (triCount.count < 5) {
      console.log('[DB] Ensuring Triangles 5 mock test sets...');
      seedTriangles(db);
    }

    const cgCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch7'").get() as { count: number };
    if (cgCount.count < 5) {
      console.log('[DB] Ensuring Coordinate Geometry 5 mock test sets...');
      seedCoordinateGeometry(db);
    }

    const trigCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch8'").get() as { count: number };
    if (trigCount.count < 6) {
      console.log('[DB] Ensuring Trigonometry mock test sets...');
      seedTrigonometryChapters(db);
    }

    const circCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch10'").get() as { count: number };
    if (circCount.count < 3) {
      console.log('[DB] Ensuring Circles mock test sets...');
      seedCirclesChapters(db);
    }

    const mensCount = db.prepare("SELECT count(*) as count FROM mock_tests WHERE chapter_id = 'math-ch12'").get() as { count: number };
    if (mensCount.count < 6) {
      console.log('[DB] Ensuring Surface Areas, Stats & Probability mock test sets...');
      seedMensurationStatsProb(db);
    }

    // Auto-check for repetitive ABCD sequential patterns
    const sampleSeq = db.prepare(`
      SELECT group_concat(q.correct_answer, '') as seq
      FROM (SELECT correct_answer FROM mock_test_questions mtq JOIN questions q ON mtq.question_id = q.id WHERE mtq.mock_test_id = 'test-math-ch10-slot-2' ORDER BY mtq.display_order) q
    `).get() as { seq: string } | undefined;

    if (sampleSeq && (sampleSeq.seq.includes('ABCD') || sampleSeq.seq.includes('CDAB'))) {
      console.log('[DB] Repetitive sequential pattern detected. Randomizing mock test answer options...');
      randomizeAllMockTestsOptions(db);
    }

    // Ensure question diagrams exist and are linked
    const diagramCheck = db.prepare("SELECT count(*) as count FROM questions WHERE image_url IS NOT NULL AND image_url != ''").get() as { count: number };
    if (diagramCheck.count < 10) {
      console.log('[DB] Ensuring question diagrams are generated and linked...');
      generateQuestionDiagrams(db);
    }
  } catch (err) {
    console.warn('[DB] Mock tests integrity notice:', err);
  }
}



function seedInitialData() {
  const profileCount = db.prepare('SELECT count(*) as count FROM profiles').get() as { count: number };
  if (profileCount.count > 0) {
    console.log('[DB] Database already seeded.');
    return;
  }

  console.log('[DB] Seeding official NCERT Class 10 subjects, chapters, test slots and default accounts...');

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, email, full_name, role, free_test_used, membership_tier, password_hash, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  // Default Administrator & Demo Student
  insertProfile.run('usr-admin-1', 'admin@vedicx.in', 'VEDICX Administrator', 'admin', 0, 'premium', 'admin123');
  insertProfile.run('usr-student-1', 'student@vedicx.in', 'Aarav Sharma', 'student', 0, 'free', 'student123');
  insertProfile.run('usr-student-2', 'priya.singh@gmail.com', 'Priya Singh', 'student', 1, 'premium', 'student123');

  // Insert Site Settings
  const insertSetting = db.prepare(`INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)`);
  insertSetting.run('hero_heading', 'Prepare Smarter. Score Better.');
  insertSetting.run('hero_subheading', 'Practice Class 10 chapter-wise mock tests, solve sample papers and prepare with previous year questions.');
  insertSetting.run('brand_tagline', 'Learn. Practice. Perform.');
  insertSetting.run('premium_price', '49');
  insertSetting.run('contact_email', 'supportvedicx@gmail.com');
  insertSetting.run('announcement_banner', 'CBSE Class 10 Board Exam Series 2025-26 is now live! Start with Free Mock Tests.');

  // Insert Subjects
  const insertSubject = db.prepare(`
    INSERT INTO subjects (id, name, code, description, icon, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertSubject.run('science', 'Science', 'SCI-10', 'Physics, Chemistry, and Biology syllabus based on latest NCERT Class 10.', 'Atom', 1);
  insertSubject.run('mathematics', 'Mathematics', 'MATH-10', 'Number systems, Algebra, Geometry, Trigonometry, Statistics & Probability.', 'Calculator', 2);
  insertSubject.run('social-science', 'Social Science', 'SST-10', 'History, Geography, Political Science (Civics), and Economics.', 'Globe', 3);

  // Insert Social Science Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, subject_id, name, display_order)
    VALUES (?, ?, ?, ?)
  `);

  insertCategory.run('history', 'social-science', 'History (India & the Contemporary World - II)', 1);
  insertCategory.run('geography', 'social-science', 'Geography (Contemporary India - II)', 2);
  insertCategory.run('political-science', 'social-science', 'Political Science (Democratic Politics - II)', 3);
  insertCategory.run('economics', 'social-science', 'Economics (Understanding Economic Development)', 4);

  // Chapters list based on NCERT Class 10
  const chaptersData = [
    // Mathematics
    { id: 'math-ch1', sub: 'mathematics', cat: null, num: 1, name: 'Real Numbers', desc: 'Fundamental Theorem of Arithmetic, irrationality proofs.' },
    { id: 'math-ch2', sub: 'mathematics', cat: null, num: 2, name: 'Polynomials', desc: 'Geometrical meaning of zeroes, relationship between zeroes and coefficients.' },
    { id: 'math-ch3', sub: 'mathematics', cat: null, num: 3, name: 'Pair of Linear Equations in Two Variables', desc: 'Graphical & algebraic solutions, elimination, substitution.' },
    { id: 'math-ch4', sub: 'mathematics', cat: null, num: 4, name: 'Quadratic Equations', desc: 'Standard form, factorization, quadratic formula, nature of roots.' },
    { id: 'math-ch5', sub: 'mathematics', cat: null, num: 5, name: 'Arithmetic Progressions', desc: 'nth term, sum of first n terms of an AP, daily life applications.' },
    { id: 'math-ch6', sub: 'mathematics', cat: null, num: 6, name: 'Triangles', desc: 'Similarity criteria, Basic Proportionality Theorem (Thales theorem).' },
    { id: 'math-ch7', sub: 'mathematics', cat: null, num: 7, name: 'Coordinate Geometry', desc: 'Distance formula, Section formula.' },
    { id: 'math-ch8', sub: 'mathematics', cat: null, num: 8, name: 'Introduction to Trigonometry', desc: 'Trigonometric ratios, values for specific angles, identities.' },
    { id: 'math-ch9', sub: 'mathematics', cat: null, num: 9, name: 'Some Applications of Trigonometry', desc: 'Heights and distances, angles of elevation and depression.' },
    { id: 'math-ch10', sub: 'mathematics', cat: null, num: 10, name: 'Circles', desc: 'Tangent to a circle, number of tangents from a point to a circle.' },
    { id: 'math-ch11', sub: 'mathematics', cat: null, num: 11, name: 'Areas Related to Circles', desc: 'Perimeter and area of sector and segment of a circle.' },
    { id: 'math-ch12', sub: 'mathematics', cat: null, num: 12, name: 'Surface Areas and Volumes', desc: 'Surface areas and volumes of combinations of solids.' },
    { id: 'math-ch13', sub: 'mathematics', cat: null, num: 13, name: 'Statistics', desc: 'Mean, Median, and Mode of grouped data.' },
    { id: 'math-ch14', sub: 'mathematics', cat: null, num: 14, name: 'Probability', desc: 'Classical definition of probability, simple problems.' },

    // Science
    { id: 'sci-ch1', sub: 'science', cat: null, num: 1, name: 'Chemical Reactions and Equations', desc: 'Balanced chemical equations, types of reactions, oxidation & reduction.' },
    { id: 'sci-ch2', sub: 'science', cat: null, num: 2, name: 'Acids, Bases and Salts', desc: 'Indicators, pH scale, chemical properties of salts.' },
    { id: 'sci-ch3', sub: 'science', cat: null, num: 3, name: 'Metals and Non-Metals', desc: 'Physical and chemical properties, reactivity series, ionic compounds.' },
    { id: 'sci-ch4', sub: 'science', cat: null, num: 4, name: 'Carbon and its Compounds', desc: 'Covalent bonding, homologous series, functional groups, hydrocarbons.' },
    { id: 'sci-ch5', sub: 'science', cat: null, num: 5, name: 'Life Processes', desc: 'Nutrition, respiration, transportation, and excretion in plants and animals.' },
    { id: 'sci-ch6', sub: 'science', cat: null, num: 6, name: 'Control and Coordination', desc: 'Nervous system, reflex arc, human brain, hormones in animals & plants.' },
    { id: 'sci-ch7', sub: 'science', cat: null, num: 7, name: 'How do Organisms Reproduce?', desc: 'Asexual & sexual reproduction, reproductive health, plant reproduction.' },
    { id: 'sci-ch8', sub: 'science', cat: null, num: 8, name: 'Heredity', desc: 'Mendel laws of inheritance, sex determination.' },
    { id: 'sci-ch9', sub: 'science', cat: null, num: 9, name: 'Light – Reflection and Refraction', desc: 'Spherical mirrors, lens formula, magnification, refraction laws.' },
    { id: 'sci-ch10', sub: 'science', cat: null, num: 10, name: 'The Human Eye and the Colourful World', desc: 'Human eye defect corrections, prism refraction, dispersion, scattering.' },
    { id: 'sci-ch11', sub: 'science', cat: null, num: 11, name: 'Electricity', desc: 'Ohm law, resistance, series/parallel combinations, Joule heating.' },
    { id: 'sci-ch12', sub: 'science', cat: null, num: 12, name: 'Magnetic Effects of Electric Current', desc: 'Magnetic field lines, solenoid, Fleming left-hand rule, domestic circuits.' },
    { id: 'sci-ch13', sub: 'science', cat: null, num: 13, name: 'Our Environment', desc: 'Ecosystem, food chains & webs, ozone depletion, waste management.' },

    // Social Science: History
    { id: 'sst-hist-1', sub: 'social-science', cat: 'history', num: 1, name: 'The Rise of Nationalism in Europe', desc: 'French Revolution, Romanticism, unification of Germany & Italy.' },
    { id: 'sst-hist-2', sub: 'social-science', cat: 'history', num: 2, name: 'Nationalism in India', desc: 'Non-Cooperation, Civil Disobedience, Salt March, collective belonging.' },
    { id: 'sst-hist-3', sub: 'social-science', cat: 'history', num: 3, name: 'The Making of a Global World', desc: 'Silk routes, colonialism, trade, inter-war economy.' },
    { id: 'sst-hist-4', sub: 'social-science', cat: 'history', num: 4, name: 'The Age of Industrialisation', desc: 'Before Industrial Revolution, hand labour, factories in colonies.' },
    { id: 'sst-hist-5', sub: 'social-science', cat: 'history', num: 5, name: 'Print Culture and the Modern World', desc: 'First printed books, print revolution in Europe & India.' },

    // Social Science: Geography
    { id: 'sst-geo-1', sub: 'social-science', cat: 'geography', num: 1, name: 'Resources and Development', desc: 'Types of resources, resource planning, land degradation, soil types.' },
    { id: 'sst-geo-2', sub: 'social-science', cat: 'geography', num: 2, name: 'Forest and Wildlife Resources', desc: 'Biodiversity, flora and fauna classification, conservation projects.' },
    { id: 'sst-geo-3', sub: 'social-science', cat: 'geography', num: 3, name: 'Water Resources', desc: 'Water scarcity, multi-purpose river valley projects, rainwater harvesting.' },
    { id: 'sst-geo-4', sub: 'social-science', cat: 'geography', num: 4, name: 'Agriculture', desc: 'Types of farming, cropping patterns, major food & cash crops.' },
    { id: 'sst-geo-5', sub: 'social-science', cat: 'geography', num: 5, name: 'Minerals and Energy Resources', desc: 'Mode of mineral occurrence, ferrous/non-ferrous, conventional/non-conventional.' },
    { id: 'sst-geo-6', sub: 'social-science', cat: null, num: 6, name: 'Manufacturing Industries', desc: 'Agro-based, mineral-based, industrial pollution & environmental degradation.' },
    { id: 'sst-geo-7', sub: 'social-science', cat: 'geography', num: 7, name: 'Lifelines of National Economy', desc: 'Transport systems: roadways, railways, waterways, airways, ports.' },

    // Social Science: Political Science
    { id: 'sst-pol-1', sub: 'social-science', cat: 'political-science', num: 1, name: 'Power Sharing', desc: 'Case studies of Belgium and Sri Lanka, majoritarianism, forms of power sharing.' },
    { id: 'sst-pol-2', sub: 'social-science', cat: 'political-science', num: 2, name: 'Federalism', desc: 'Features of federalism, decentralisation in India, Union/State lists.' },
    { id: 'sst-pol-3', sub: 'social-science', cat: 'political-science', num: 3, name: 'Gender, Religion and Caste', desc: 'Gender and politics, communalism, secular state, caste inequalities.' },
    { id: 'sst-pol-4', sub: 'social-science', cat: 'political-science', num: 4, name: 'Political Parties', desc: 'Functions of political parties, national & state parties, electoral reforms.' },
    { id: 'sst-pol-5', sub: 'social-science', cat: 'political-science', num: 5, name: 'Outcomes of Democracy', desc: 'Accountable, responsive and legitimate government, economic growth.' },

    // Social Science: Economics
    { id: 'sst-eco-1', sub: 'social-science', cat: 'economics', num: 1, name: 'Development', desc: 'National development, per capita income, HDI, sustainable development.' },
    { id: 'sst-eco-2', sub: 'social-science', cat: 'economics', num: 2, name: 'Sectors of the Indian Economy', desc: 'Primary, Secondary, Tertiary sectors, organised vs unorganised.' },
    { id: 'sst-eco-3', sub: 'social-science', cat: 'economics', num: 3, name: 'Money and Credit', desc: 'Barter system, modern forms of money, formal and informal credit.' },
    { id: 'sst-eco-4', sub: 'social-science', cat: 'economics', num: 4, name: 'Globalisation and the Indian Economy', desc: 'MNCs, foreign trade integration, WTO, impact on workers.' },
    { id: 'sst-eco-5', sub: 'social-science', cat: 'economics', num: 5, name: 'Consumer Rights', desc: 'Consumer movement, Consumer Protection Act (COPRA), consumer rights.' }
  ];

  const insertChapter = db.prepare(`
    INSERT INTO chapters (id, subject_id, category_id, chapter_number, name, description, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMockTest = db.prepare(`
    INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, class, subject_id, chapter_id, topic, difficulty, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, negative_marks, status, source, source_year)
    VALUES (?, '10', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTestQuestion = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  chaptersData.forEach((ch, idx) => {
    insertChapter.run(ch.id, ch.sub, ch.cat, ch.num, ch.name, ch.desc, idx + 1);

    // CRITICAL REQUIREMENT (Part 4): Every chapter must have at least FIVE separate mock test slots!
    // Tests 1 to 5:
    for (let slot = 1; slot <= 5; slot++) {
      const testId = `test-${ch.id}-slot-${slot}`;
      const title = `${ch.name} – Mock Test ${slot}`;
      const desc = `Class 10 ${ch.name} official practice test slot ${slot}. Covers key NCERT concepts, definitions and numericals.`;
      
      // Make Mock Test 1 published for first chapters so students have immediate free & premium tests to try!
      const isInitialPublished = (slot === 1 && (ch.id === 'math-ch1' || ch.id === 'sci-ch1' || ch.id === 'sst-hist-1'));
      const status = isInitialPublished ? 'published' : 'draft';
      const accessType = (slot === 1 && ch.id === 'math-ch1') ? 'free' : 'premium';

      insertMockTest.run(
        testId,
        title,
        ch.sub,
        ch.id,
        slot,
        desc,
        0, // updated when questions attached
        25, // duration in mins
        20.0, // max marks
        8.0, // passing marks
        accessType,
        status
      );
    }
  });

  // Seed authentic Class 10 NCERT questions for Mathematics Chapter 1: Real Numbers
  const realNumbersQuestions = [
    {
      id: 'q-math-1',
      topic: 'Fundamental Theorem of Arithmetic',
      diff: 'easy',
      type: 'mcq',
      text: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x and y are prime numbers, then HCF(a, b) is:',
      a: 'xy',
      b: 'xy²',
      c: 'x³y³',
      d: 'x²y²',
      ans: 'B',
      exp: 'HCF is the product of the smallest power of each common prime factor involved in the numbers. Common factors are x (smallest power 1) and y (smallest power 2). Therefore, HCF(a, b) = xy².',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2023
    },
    {
      id: 'q-math-2',
      topic: 'Irrational Numbers',
      diff: 'medium',
      type: 'mcq',
      text: 'The decimal expansion of the rational number 14587 / 1250 will terminate after how many decimal places?',
      a: 'One decimal place',
      b: 'Two decimal places',
      c: 'Three decimal places',
      d: 'Four decimal places',
      ans: 'D',
      exp: 'The denominator is 1250 = 2¹ × 5⁴. Since the highest power of 2 or 5 in prime factorization of denominator is 4, the decimal expansion terminates after 4 decimal places.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Exemplar',
      year: 2022
    },
    {
      id: 'q-math-3',
      topic: 'HCF and LCM relation',
      diff: 'medium',
      type: 'mcq',
      text: 'If LCM(a, 18) = 36 and HCF(a, 18) = 2, then the value of a is:',
      a: '2',
      b: '3',
      c: '4',
      d: '1',
      ans: 'C',
      exp: 'For any two positive integers, Product of numbers = HCF × LCM. Hence a × 18 = 2 × 36 => a × 18 = 72 => a = 72 / 18 = 4.',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2021
    },
    {
      id: 'q-math-4',
      topic: 'Prime Factorisation',
      diff: 'hard',
      type: 'mcq',
      text: 'The largest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:',
      a: '13',
      b: '65',
      c: '875',
      d: '1750',
      ans: 'A',
      exp: 'Required number is HCF of (70 - 5) and (125 - 8), which is HCF(65, 117). 65 = 5 × 13 and 117 = 3² × 13. Common prime factor is 13. Therefore, the required number is 13.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Exemplar',
      year: 2020
    },
    {
      id: 'q-math-5',
      topic: 'Nature of Numbers',
      diff: 'easy',
      type: 'true_false',
      text: 'The sum of a rational number and an irrational number is always an irrational number.',
      a: 'True',
      b: 'False',
      c: '',
      d: '',
      ans: 'True',
      exp: 'If r is rational and s is irrational, then r + s is always irrational. If r + s were rational (say q), then s = q - r would be rational, which contradicts the fact that s is irrational.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Textbook',
      year: 2023
    }
  ];

  realNumbersQuestions.forEach((q, qIdx) => {
    insertQuestion.run(
      q.id,
      'mathematics',
      'math-ch1',
      q.topic,
      q.diff,
      q.type,
      q.text,
      q.a,
      q.b,
      q.c,
      q.d,
      q.ans,
      q.exp,
      q.marks,
      q.neg,
      'published',
      q.source,
      q.year
    );

    // Link to Mock Test 1 of Real Numbers
    insertTestQuestion.run(`mtq-math1-${qIdx + 1}`, 'test-math-ch1-slot-1', q.id, qIdx + 1);
  });

  // Update total questions count for test-math-ch1-slot-1
  db.prepare(`UPDATE mock_tests SET total_questions = 5, max_marks = 5.0, passing_marks = 2.0 WHERE id = 'test-math-ch1-slot-1'`).run();

  // Seed authentic Class 10 Real Numbers Mock Tests 2, 3, 4, 5, 6 from official CBSE solved question series
  const realNumbersSeries = [
    {
      testId: 'test-math-ch1-slot-2',
      testNum: 2,
      title: 'Real Numbers – Mock Test 2',
      desc: 'Fundamental Theorem of Arithmetic, HCF-LCM relationships & terminating decimals.',
      questions: [
        { id: 'q-rn-m2-1', diff: 'easy', type: 'mcq', text: 'The exponent of 2 in the prime factorisation of 144 is:', a: '2', b: '4', c: '3', d: '6', ans: 'B', exp: '144 = 12² = (2² × 3)² = 2⁴ × 3². The exponent of 2 is 4.' },
        { id: 'q-rn-m2-2', diff: 'easy', type: 'mcq', text: 'The decimal representation of 11 / (2³ × 5) will terminate after how many decimal places?', a: '1', b: '2', c: '3', d: '4', ans: 'C', exp: 'Since the highest power of 2 or 5 in the denominator is 3 (2³), the decimal representation terminates after 3 places.' },
        { id: 'q-rn-m2-3', diff: 'easy', type: 'mcq', text: 'If LCM(32, a) = 96 and HCF(32, a) = 4, then the value of a is:', a: '8', b: '12', c: '16', d: '24', ans: 'B', exp: 'Product of numbers = HCF × LCM => 32 × a = 4 × 96 => a = 384 / 32 = 12.' },
        { id: 'q-rn-m2-4', diff: 'medium', type: 'mcq', text: 'The LCM of the smallest two-digit composite number and the smallest composite number is:', a: '10', b: '20', c: '40', d: '44', ans: 'B', exp: 'Smallest composite number = 4. Smallest two-digit composite number = 10. LCM(4, 10) = 20.' },
        { id: 'q-rn-m2-5', diff: 'medium', type: 'true_false', text: 'The product of a non-zero rational number and an irrational number is always irrational.', a: 'True', b: 'False', c: 'Only for square roots', d: 'Cannot be determined', ans: 'A', exp: 'True. If r is a non-zero rational and x is irrational, assuming rx is rational leads to x = (rx)/r being rational, a contradiction.' },
        { id: 'q-rn-m2-6', diff: 'medium', type: 'mcq', text: 'If two positive integers p and q can be expressed as p = ab² and q = a³b, where a and b are prime numbers, then LCM(p, q) is:', a: 'ab', b: 'a²b²', c: 'a³b²', d: 'a⁴b³', ans: 'C', exp: 'LCM is the product of highest powers of each prime involved. LCM(p, q) = a³b².' },
        { id: 'q-rn-m2-7', diff: 'hard', type: 'mcq', text: 'The largest number which divides 615 and 963 leaving remainder 6 in each case is:', a: '45', b: '65', c: '87', d: '95', ans: 'C', exp: 'Required number = HCF(615 - 6, 963 - 6) = HCF(609, 957). 609 = 3 × 7 × 29, 957 = 3 × 11 × 29. HCF = 3 × 29 = 87.' },
        { id: 'q-rn-m2-8', diff: 'hard', type: 'mcq', text: 'Which of the following numbers has a non-terminating repeating decimal expansion?', a: '17 / 320', b: '77 / 210', c: '15 / 1600', d: '23 / (2³ × 5²)', ans: 'B', exp: '77 / 210 = 11 / 30 = 11 / (2 × 3 × 5). Since 3 is in the denominator in lowest terms, the decimal expansion is non-terminating repeating.' },
        { id: 'q-rn-m2-9', diff: 'hard', type: 'mcq', text: 'Two tankers contain 850 litres and 680 litres of petrol respectively. The maximum capacity of a container which can measure the petrol of either tanker in exact number of times is:', a: '150 litres', b: '170 litres', c: '190 litres', d: '210 litres', ans: 'B', exp: 'Maximum capacity = HCF(850, 680). 850 = 2 × 5² × 17, 680 = 2³ × 5 × 17. HCF = 2 × 5 × 17 = 170 litres.' },
        { id: 'q-rn-m2-10', diff: 'hard', type: 'mcq', text: 'If n is any natural number, then 6ⁿ - 5ⁿ always ends with which digit?', a: '1', b: '3', c: '5', d: '7', ans: 'A', exp: 'For any natural number n, 6ⁿ always ends in 6 and 5ⁿ always ends in 5. Therefore, 6ⁿ - 5ⁿ always ends in 6 - 5 = 1.' }
      ]
    },
    {
      testId: 'test-math-ch1-slot-3',
      testNum: 3,
      title: 'Real Numbers – Mock Test 3',
      desc: 'Prime factorisation, HCF-LCM properties, square tiles word problems & composite proof.',
      questions: [
        { id: 'q-rn-m3-1', diff: 'easy', type: 'mcq', text: 'The prime factorisation of 100 is:', a: '2² × 5²', b: '2 × 5³', c: '2³ × 5', d: '2 × 5²', ans: 'A', exp: '100 = 10 × 10 = (2 × 5) × (2 × 5) = 2² × 5².' },
        { id: 'q-rn-m3-2', diff: 'easy', type: 'mcq', text: 'The HCF of 45 and 75 is:', a: '5', b: '15', c: '25', d: '30', ans: 'B', exp: '45 = 3² × 5 and 75 = 3 × 5². The common factors with smallest powers give HCF = 3 × 5 = 15.' },
        { id: 'q-rn-m3-3', diff: 'easy', type: 'true_false', text: 'The product of two coprime positive integers is equal to their LCM.', a: 'True', b: 'False', c: 'Only for even numbers', d: 'Cannot be determined', ans: 'A', exp: 'True. HCF × LCM = product. For coprime numbers, HCF = 1, so LCM equals their product.' },
        { id: 'q-rn-m3-4', diff: 'medium', type: 'mcq', text: 'Which of the following is a perfect square?', a: '2³ × 3²', b: '2² × 3⁴', c: '2 × 5²', d: '3³ × 7', ans: 'B', exp: 'A number is a perfect square when every exponent in its prime factorisation is even. In 2² × 3⁴, both exponents 2 and 4 are even.' },
        { id: 'q-rn-m3-5', diff: 'medium', type: 'mcq', text: 'In the prime factorisation of a perfect cube, every exponent is a multiple of ______.', a: '2', b: '3', c: '4', d: '6', ans: 'B', exp: '3. A perfect cube is formed when each prime factor occurs with an exponent divisible by 3.' },
        { id: 'q-rn-m3-6', diff: 'medium', type: 'mcq', text: 'If HCF(18, x) = 6 and LCM(18, x) = 72, then x is:', a: '12', b: '24', c: '36', d: '48', ans: 'B', exp: 'Using HCF × LCM = product, 6 × 72 = 18 × x. Thus x = 432 / 18 = 24.' },
        { id: 'q-rn-m3-7', diff: 'hard', type: 'mcq', text: 'A rectangular board is 96 cm long and 144 cm wide. Find the side of the largest square tile that can cover it exactly without cutting.', a: '24 cm', b: '36 cm', c: '48 cm', d: '12 cm', ans: 'C', exp: '48 cm. The largest possible square tile side is HCF(96, 144). Since 96 = 2⁵ × 3 and 144 = 2⁴ × 3², HCF = 2⁴ × 3 = 48 cm.' },
        { id: 'q-rn-m3-8', diff: 'hard', type: 'mcq', text: 'Which statement is always true?', a: 'Irrational + irrational is irrational.', b: 'Rational + irrational is irrational.', c: 'Irrational × irrational is irrational.', d: 'Every square root is irrational.', ans: 'B', exp: 'If a rational number r plus an irrational number x were rational, then subtracting r would make x rational, a contradiction. The other statements have counterexamples.' },
        { id: 'q-rn-m3-9', diff: 'hard', type: 'mcq', text: 'Find the HCF of 2³ × 3² × 7 and 2² × 3³ × 5.', a: '18', b: '36', c: '72', d: '108', ans: 'B', exp: 'Take the smallest exponents of common prime factors. The common primes are 2 and 3. HCF = 2² × 3² = 4 × 9 = 36.' },
        { id: 'q-rn-m3-10', diff: 'hard', type: 'mcq', text: 'Show that 7 × 11 × 13 + 13 is a composite number because:', a: 'It can be factorised as 13 × (7 × 11 + 1) = 13 × 78, having factors other than 1 and itself', b: '13 is a prime number', c: 'The expression equals a negative number', d: 'It is an odd number', ans: 'A', exp: 'Take 13 common: 7 × 11 × 13 + 13 = 13(7 × 11 + 1) = 13(77 + 1) = 13 × 78. Since it is a product of two integers greater than 1, it is composite.' }
      ]
    },
    {
      testId: 'test-math-ch1-slot-4',
      testNum: 4,
      title: 'Real Numbers – Mock Test 4',
      desc: 'Irrational numbers, coprime HCF, cube multipliers, florist bouquet problem & √5 proof.',
      questions: [
        { id: 'q-rn-m4-1', diff: 'easy', type: 'mcq', text: 'Which number is irrational?', a: '√64', b: '√81', c: '√10', d: '0.6', ans: 'C', exp: '√64 = 8 and √81 = 9, while 0.6 = 3/5. These are rational. Since 10 is not a perfect square, √10 is irrational.' },
        { id: 'q-rn-m4-2', diff: 'easy', type: 'mcq', text: 'If two positive integers are coprime, their HCF is:', a: '0', b: '1', c: 'their sum', d: 'their product', ans: 'B', exp: 'Coprime integers have no common positive factor other than 1.' },
        { id: 'q-rn-m4-3', diff: 'easy', type: 'true_false', text: '√49 is irrational.', a: 'True', b: 'False', c: 'Cannot be determined', d: 'True only for negative numbers', ans: 'B', exp: 'False. √49 = 7, which is an integer and therefore rational.' },
        { id: 'q-rn-m4-4', diff: 'medium', type: 'mcq', text: 'The least multiplier to make 72 a perfect cube is:', a: '2', b: '3', c: '6', d: '12', ans: 'B', exp: '72 = 2³ × 3². To make each exponent a multiple of 3, multiply by 3. Then 72 × 3 = 2³ × 3³ = 216 = 6³.' },
        { id: 'q-rn-m4-5', diff: 'medium', type: 'mcq', text: 'For any two positive integers a and b, HCF(a, b) × LCM(a, b) = ______.', a: 'a + b', b: 'a - b', c: 'a × b', d: 'a / b', ans: 'C', exp: 'a × b. The product of the HCF and LCM of two positive integers equals the product of the two integers.' },
        { id: 'q-rn-m4-6', diff: 'medium', type: 'mcq', text: 'The least positive integer that must multiply 500 to make a perfect cube is:', a: '2', b: '5', c: '20', d: '25', ans: 'A', exp: '500 = 2² × 5³. Multiply by 2 to obtain 2³ × 5³ = 1000 = 10³.' },
        { id: 'q-rn-m4-7', diff: 'hard', type: 'mcq', text: 'A florist has 96 roses and 120 lilies. She makes the greatest possible number of identical bouquets without leftovers. How many bouquets can she make, and what will each contain?', a: '24 bouquets; 4 roses and 5 lilies each', b: '12 bouquets; 8 roses and 10 lilies each', c: '16 bouquets; 6 roses and 7 lilies each', d: '8 bouquets; 12 roses and 15 lilies each', ans: 'A', exp: '24 bouquets. HCF(96, 120) = 24. Each bouquet contains 96/24 = 4 roses and 120/24 = 5 lilies.' },
        { id: 'q-rn-m4-8', diff: 'hard', type: 'mcq', text: 'If √5 is irrational, then 1/√5 is:', a: 'an integer', b: 'rational', c: 'irrational', d: 'natural', ans: 'C', exp: 'If 1/√5 were rational and non-zero, its reciprocal √5 would also be rational. This contradicts the given fact.' },
        { id: 'q-rn-m4-9', diff: 'hard', type: 'mcq', text: 'Find the least positive number divisible by 18, 24 and 30.', a: '180', b: '240', c: '360', d: '720', ans: 'C', exp: '18 = 2 × 3², 24 = 2³ × 3 and 30 = 2 × 3 × 5. LCM = 2³ × 3² × 5 = 360. Hence the least number is 360.' },
        { id: 'q-rn-m4-10', diff: 'hard', type: 'mcq', text: 'In the proof that √5 is irrational using prime factorisation, if a² = 5b² (where a and b are integers in lowest terms), what contradiction arises?', a: 'The exponent of 5 is even in a² but odd in 5b², contradicting the Fundamental Theorem of Arithmetic', b: '5 is an even number', c: 'a and b cannot be multiplied', d: 'b² cannot divide a²', ans: 'A', exp: 'Assume √5 = a/b in lowest terms, where a and b are integers and b ≠ 0. Then a² = 5b². In the prime factorisation of a², the exponent of 5 must be even. In 5b², it is odd. This contradicts the uniqueness of prime factorisation. Hence √5 is irrational.' }
      ]
    },
    {
      testId: 'test-math-ch1-slot-5',
      testNum: 5,
      title: 'Real Numbers – Mock Test 5',
      desc: 'Prime and composite numbers, flashing lights interval problem, notebook bundles & 3+2√5 proof.',
      questions: [
        { id: 'q-rn-m5-1', diff: 'easy', type: 'mcq', text: 'The number 1 is:', a: 'prime', b: 'composite', c: 'neither prime nor composite', d: 'even prime', ans: 'C', exp: 'A prime number has exactly two distinct positive factors, while a composite number has more than two. The number 1 has only one positive factor.' },
        { id: 'q-rn-m5-2', diff: 'easy', type: 'mcq', text: 'The LCM of 9 and 15 is:', a: '15', b: '30', c: '45', d: '135', ans: 'C', exp: '9 = 3² and 15 = 3 × 5. LCM = 3² × 5 = 45.' },
        { id: 'q-rn-m5-3', diff: 'easy', type: 'true_false', text: 'The sum of two irrational numbers is always irrational.', a: 'True', b: 'False', c: 'True only for square roots', d: 'Cannot be determined', ans: 'B', exp: 'False. For example, √2 + (-√2) = 0, which is rational.' },
        { id: 'q-rn-m5-4', diff: 'medium', type: 'mcq', text: 'If HCF = 12, LCM = 420 and one number is 60, the other number is:', a: '72', b: '84', c: '96', d: '120', ans: 'B', exp: 'Product of the numbers = 12 × 420 = 5040. The other number = 5040 / 60 = 84.' },
        { id: 'q-rn-m5-5', diff: 'medium', type: 'mcq', text: 'The prime factorisation of 540 is ______.', a: '2² × 3³ × 5', b: '2³ × 3² × 5', c: '2² × 3² × 5²', d: '2 × 3³ × 5²', ans: 'A', exp: '540 = 54 × 10 = (2 × 3³) × (2 × 5) = 2² × 3³ × 5.' },
        { id: 'q-rn-m5-6', diff: 'medium', type: 'mcq', text: 'Which of the following is coprime to 35?', a: '14', b: '21', c: '24', d: '15', ans: 'C', exp: '35 = 5 × 7. The number 24 = 2³ × 3 has no common prime factor with 35, so their HCF is 1.' },
        { id: 'q-rn-m5-7', diff: 'hard', type: 'mcq', text: 'Three lights flash every 20, 30 and 45 seconds. If they flash together now, after how many seconds will they next flash together?', a: '90 seconds', b: '120 seconds', c: '180 seconds', d: '360 seconds', ans: 'C', exp: '180 seconds. 20 = 2² × 5, 30 = 2 × 3 × 5 and 45 = 3² × 5. LCM = 2² × 3² × 5 = 180 seconds.' },
        { id: 'q-rn-m5-8', diff: 'hard', type: 'mcq', text: 'If p and q are distinct prime numbers, HCF(p, q) is:', a: 'pq', b: 'p + q', c: '1', d: '0', ans: 'C', exp: 'Distinct prime numbers have no common positive factor other than 1.' },
        { id: 'q-rn-m5-9', diff: 'hard', type: 'mcq', text: 'A school has 72 notebooks and 96 geometry boxes. It wants the greatest number of identical bundles with no items left over. Find the number of bundles and the contents of each.', a: '24 bundles (3 notebooks, 4 geometry boxes)', b: '12 bundles (6 notebooks, 8 geometry boxes)', c: '16 bundles (4 notebooks, 6 geometry boxes)', d: '8 bundles (9 notebooks, 12 geometry boxes)', ans: 'A', exp: 'HCF(72, 96) = 24, so 24 bundles can be made. Each bundle contains 72/24 = 3 notebooks and 96/24 = 4 geometry boxes.' },
        { id: 'q-rn-m5-10', diff: 'hard', type: 'mcq', text: 'Prove that 3 + 2√5 is irrational by noting that if 3 + 2√5 = r (rational), then:', a: '√5 = (r - 3)/2, which is rational, contradicting the irrationality of √5', b: 'r must equal 0', c: '3 and 2 are prime numbers', d: '√5 is a terminating decimal', ans: 'A', exp: 'Suppose 3 + 2√5 = r, where r is rational. Then √5 = (r - 3)/2. The right-hand side is rational, which contradicts the irrationality of √5. Therefore 3 + 2√5 is irrational.' }
      ]
    },
    {
      testId: 'test-math-ch1-slot-6',
      testNum: 6,
      title: 'Real Numbers – Mock Test 6',
      desc: 'Composite numbers, square room tiling problem, √2+√3 proof & circular track meeting time.',
      questions: [
        { id: 'q-rn-m6-1', diff: 'easy', type: 'mcq', text: 'Which of the following is a composite number?', a: '2', b: '3', c: '11', d: '15', ans: 'D', exp: '15 has factors 1, 3, 5 and 15, so it has more than two positive factors and is composite.' },
        { id: 'q-rn-m6-2', diff: 'easy', type: 'mcq', text: 'The HCF of 26 and 39 is:', a: '13', b: '26', c: '39', d: '1', ans: 'A', exp: '26 = 2 × 13 and 39 = 3 × 13. Their greatest common factor is 13.' },
        { id: 'q-rn-m6-3', diff: 'easy', type: 'mcq', text: 'A number that has exactly two distinct positive factors is called a ______ number.', a: 'Composite', b: 'Prime', c: 'Odd', d: 'Rational', ans: 'B', exp: 'Prime number. Its only positive factors are 1 and the number itself.' },
        { id: 'q-rn-m6-4', diff: 'medium', type: 'mcq', text: 'The least number that must be added to 70 to make it divisible by 8 is:', a: '1', b: '2', c: '6', d: '8', ans: 'B', exp: '70 leaves remainder 6 when divided by 8. We need 2 more to reach 72, which is divisible by 8.' },
        { id: 'q-rn-m6-5', diff: 'medium', type: 'mcq', text: 'Find the HCF and LCM of 26 and 91 by prime factorisation.', a: 'HCF = 13, LCM = 182', b: 'HCF = 7, LCM = 182', c: 'HCF = 13, LCM = 2366', d: 'HCF = 26, LCM = 91', ans: 'A', exp: '26 = 2 × 13 and 91 = 7 × 13. HCF = 13. LCM = 2 × 7 × 13 = 182.' },
        { id: 'q-rn-m6-6', diff: 'medium', type: 'mcq', text: 'Can two numbers have 15 as their HCF and 175 as their LCM? Explain.', a: 'Yes, because 175 > 15', b: 'No, because HCF must divide the LCM for positive integers, and 175 ÷ 15 is not an integer', c: 'Yes, because both numbers end in 5', d: 'Cannot be determined without the numbers', ans: 'B', exp: 'No. The HCF must divide the LCM for positive integers. But 175 ÷ 15 is not an integer. Therefore, such two positive integers cannot exist.' },
        { id: 'q-rn-m6-7', diff: 'hard', type: 'mcq', text: 'A room is 8.4 m long and 6 m wide. It is to be covered with the largest possible identical square tiles. Find the side of each tile and the number of tiles required. (Use centimetres.)', a: 'Side = 120 cm, Number of tiles = 35', b: 'Side = 60 cm, Number of tiles = 70', c: 'Side = 140 cm, Number of tiles = 30', d: 'Side = 80 cm, Number of tiles = 45', ans: 'A', exp: 'Convert dimensions: 8.4 m = 840 cm and 6 m = 600 cm. Largest tile side = HCF(840, 600) = 120 cm. Number of tiles = (840/120) × (600/120) = 7 × 5 = 35 tiles.' },
        { id: 'q-rn-m6-8', diff: 'hard', type: 'mcq', text: 'Prove that √2 + √3 is irrational by assuming √2 + √3 = r (rational). Then squaring gives:', a: '5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational, contradicting that √6 is irrational', b: '√2 and √3 cancel each other out', c: 'r must equal 0', d: 'Sum of roots is always rational', ans: 'A', exp: 'Assume √2 + √3 = r, where r is rational. Squaring gives 5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational. But 6 is not a perfect square, so √6 is irrational. This contradiction proves √2 + √3 is irrational.' },
        { id: 'q-rn-m6-9', diff: 'hard', type: 'mcq', text: 'Find the least positive integer by which 540 must be divided to obtain a perfect square.', a: '5', b: '6', c: '15', d: '30', ans: 'C', exp: '540 = 2² × 3³ × 5. To make all exponents even after division, divide by 3 × 5 = 15. Then 540/15 = 36 = 6². The least required divisor is 15.' },
        { id: 'q-rn-m6-10', diff: 'hard', type: 'mcq', text: 'Three runners take 48 seconds, 60 seconds and 72 seconds to complete one lap of a circular track. If they start together from the starting point, after how many seconds will they all meet at the starting point again?', a: '360 seconds', b: '720 seconds', c: '480 seconds', d: '1440 seconds', ans: 'B', exp: 'They meet at the starting point after the LCM of 48, 60 and 72 seconds. 48 = 2⁴ × 3, 60 = 2² × 3 × 5, 72 = 2³ × 3². LCM = 2⁴ × 3² × 5 = 720 seconds.' }
      ]
    }
  ];

  for (const s of realNumbersSeries) {
    db.prepare(`
      INSERT OR REPLACE INTO mock_tests (
        id, title, subject_id, chapter_id, test_number, description,
        total_questions, duration_minutes, max_marks, passing_marks, access_type, status
      ) VALUES (?, ?, 'mathematics', 'math-ch1', ?, ?, ?, 25, 10.0, 4.0, 'premium', 'published')
    `).run(s.testId, s.title, s.testNum, s.desc, s.questions.length);

    s.questions.forEach((q, qIdx) => {
      insertQuestion.run(
        q.id,
        'mathematics',
        'math-ch1',
        'Real Numbers',
        q.diff,
        q.type,
        q.text,
        q.a,
        q.b,
        q.c,
        q.d,
        q.ans,
        q.exp,
        1.0,
        0.0,
        'published',
        'CBSE Class 10 Real Numbers Solved Mock Tests',
        2024
      );

      insertTestQuestion.run(`mtq-${s.testId}-${q.id}`, s.testId, q.id, qIdx + 1);
    });
  }

  // Seed authentic Class 10 NCERT questions for Science Chapter 1: Chemical Reactions and Equations
  const scienceQuestions = [
    {
      id: 'q-sci-1',
      topic: 'Types of Chemical Reactions',
      diff: 'easy',
      type: 'mcq',
      text: 'Which of the following is a displacement reaction?',
      a: 'MgCO₃ → MgO + CO₂',
      b: '2Na + 2H₂O → 2NaOH + H₂',
      c: '2H₂ + O₂ → 2H₂O',
      d: '2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂',
      ans: 'B',
      exp: 'In 2Na + 2H₂O → 2NaOH + H₂, sodium (more reactive) displaces hydrogen from water. Hence, it is a single displacement reaction. A and D are decomposition reactions, and C is a combination reaction.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Exemplar',
      year: 2023
    },
    {
      id: 'q-sci-2',
      topic: 'Oxidation and Reduction',
      diff: 'medium',
      type: 'mcq',
      text: 'In the reaction: CuO + H₂ → Cu + H₂O, the oxidizing agent is:',
      a: 'H₂',
      b: 'Cu',
      c: 'CuO',
      d: 'H₂O',
      ans: 'C',
      exp: 'CuO loses oxygen and gets reduced to Cu. The substance that gets reduced acts as the oxidizing agent. Therefore, CuO is the oxidizing agent.',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2022
    },
    {
      id: 'q-sci-3',
      topic: 'Precipitation Reaction',
      diff: 'medium',
      type: 'mcq',
      text: 'When aqueous solutions of barium chloride and sodium sulphate react, an insoluble precipitate of barium sulphate is formed. What is the colour of this precipitate?',
      a: 'Yellow',
      b: 'White',
      c: 'Blue',
      d: 'Brown',
      ans: 'B',
      exp: 'BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s)↓ + 2NaCl(aq). Barium sulphate (BaSO₄) forms a white insoluble precipitate.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Textbook',
      year: 2023
    },
    {
      id: 'q-sci-4',
      topic: 'Corrosion and Rancidity',
      diff: 'easy',
      type: 'mcq',
      text: 'Chips manufacturers usually flush bags of chips with which gas to prevent the oil from getting oxidized?',
      a: 'Oxygen',
      b: 'Hydrogen',
      c: 'Nitrogen',
      d: 'Carbon dioxide',
      ans: 'C',
      exp: 'Nitrogen is an unreactive (inert) gas under normal conditions. Flushing chips bags with nitrogen replaces atmospheric oxygen, preventing oxidative rancidity of fats and oils.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Textbook',
      year: 2021
    },
    {
      id: 'q-sci-5',
      topic: 'Balanced Chemical Equations',
      diff: 'medium',
      type: 'mcq',
      text: 'When ferrous sulphate crystals (FeSO₄·7H₂O) are heated in a dry boiling tube, the pungent smelling gases evolved are:',
      a: 'SO₂ only',
      b: 'SO₃ only',
      c: 'SO₂ and SO₃',
      d: 'H₂S and SO₂',
      ans: 'C',
      exp: 'Thermal decomposition of anhydrous ferrous sulphate: 2FeSO₄(s) → Fe₂O₃(s) + SO₂(g) + SO₃(g). Both sulphur dioxide and sulphur trioxide gases with burning sulphur smell are evolved.',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2023
    }
  ];

  scienceQuestions.forEach((q, qIdx) => {
    insertQuestion.run(
      q.id,
      'science',
      'sci-ch1',
      q.topic,
      q.diff,
      q.type,
      q.text,
      q.a,
      q.b,
      q.c,
      q.d,
      q.ans,
      q.exp,
      q.marks,
      q.neg,
      'published',
      q.source,
      q.year
    );

    insertTestQuestion.run(`mtq-sci1-${qIdx + 1}`, 'test-sci-ch1-slot-1', q.id, qIdx + 1);
  });

  db.prepare(`UPDATE mock_tests SET total_questions = 5, max_marks = 5.0, passing_marks = 2.0 WHERE id = 'test-sci-ch1-slot-1'`).run();

  // Seed authentic Class 10 NCERT questions for Social Science: History Ch 1
  const sstQuestions = [
    {
      id: 'q-sst-1',
      topic: 'The French Revolution',
      diff: 'easy',
      type: 'mcq',
      text: 'Who was proclaimed the German Emperor in a ceremony held at Versailles in January 1871?',
      a: 'Kaiser William I',
      b: 'Otto von Bismarck',
      c: 'Victor Emmanuel II',
      d: 'Giuseppe Mazzini',
      ans: 'A',
      exp: 'In January 1871, the Prussian King William I was proclaimed German Emperor in the Hall of Mirrors at the Palace of Versailles.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Textbook',
      year: 2023
    },
    {
      id: 'q-sst-2',
      topic: 'Romanticism and National Feeling',
      diff: 'medium',
      type: 'mcq',
      text: 'Which treaty recognized Greece as an independent nation in 1832?',
      a: 'Treaty of Vienna (1815)',
      b: 'Treaty of Constantinople (1832)',
      c: 'Treaty of Versailles',
      d: 'Treaty of Paris',
      ans: 'B',
      exp: 'The Treaty of Constantinople of 1832 recognized Greece as an independent nation after the Greek War of Independence.',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2022
    },
    {
      id: 'q-sst-3',
      topic: 'Liberal Nationalism',
      diff: 'medium',
      type: 'mcq',
      text: 'A customs union known as Zollverein was formed in 1834 at the initiative of:',
      a: 'France',
      b: 'Austria',
      c: 'Prussia',
      d: 'Russia',
      ans: 'C',
      exp: 'In 1834, a customs union or Zollverein was formed at the initiative of Prussia and joined by most of the German states. It abolished tariff barriers.',
      marks: 1.0,
      neg: 0.0,
      source: 'CBSE Board Exam',
      year: 2021
    },
    {
      id: 'q-sst-4',
      topic: 'Giuseppe Mazzini',
      diff: 'easy',
      type: 'mcq',
      text: 'Which secret society was founded by Giuseppe Mazzini in Marseilles?',
      a: 'Young Italy',
      b: 'Young Europe',
      c: 'Carbonari',
      d: 'Jacobin Club',
      ans: 'A',
      exp: 'Giuseppe Mazzini founded two secret underground societies: first, Young Italy in Marseilles, and then Young Europe in Berne.',
      marks: 1.0,
      neg: 0.0,
      source: 'NCERT Textbook',
      year: 2023
    }
  ];

  sstQuestions.forEach((q, qIdx) => {
    insertQuestion.run(
      q.id,
      'social-science',
      'sst-hist-1',
      q.topic,
      q.diff,
      q.type,
      q.text,
      q.a,
      q.b,
      q.c,
      q.d,
      q.ans,
      q.exp,
      q.marks,
      q.neg,
      'published',
      q.source,
      q.year
    );

    insertTestQuestion.run(`mtq-sst1-${qIdx + 1}`, 'test-sst-hist-1-slot-1', q.id, qIdx + 1);
  });

  db.prepare(`UPDATE mock_tests SET total_questions = 4, max_marks = 4.0, passing_marks = 2.0 WHERE id = 'test-sst-hist-1-slot-1'`).run();

  // Seed Sample Papers
  const insertSamplePaper = db.prepare(`
    INSERT INTO sample_papers (id, title, subject_id, year_set, description, file_url, file_size, access_type, status, download_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `);

  insertSamplePaper.run('sp-math-2024', 'CBSE Class 10 Mathematics Standard Official Sample Question Paper', 'mathematics', '2024-25 SQP', 'Official CBSE SQP with complete Marking Scheme & solutions for board exam 2025.', '/sample-papers/cbse-class10-maths-standard-sqp-2025.pdf', '2.4 MB', 'free', 1420);
  insertSamplePaper.run('sp-sci-2024', 'CBSE Class 10 Science Official Sample Paper with Marking Scheme', 'science', '2024-25 SQP', 'Latest CBSE board pattern, Section A MCQs, Section B-E detailed structured questions.', '/sample-papers/cbse-class10-science-sqp-2025.pdf', '1.8 MB', 'free', 980);
  insertSamplePaper.run('sp-sst-2024', 'CBSE Class 10 Social Science Board Sample Question Paper', 'social-science', '2024-25 SQP', 'Complete History, Geography, Civics, Economics model paper with map work questions.', '/sample-papers/cbse-class10-sst-sqp-2025.pdf', '3.1 MB', 'premium', 760);
  insertSamplePaper.run('sp-math-practice-set1', 'VEDICX High-Yield Expected Board Paper – Mathematics', 'mathematics', 'Practice Set 1', 'Curated by senior CBSE evaluators covering all standard 3-mark & 5-mark proofs.', '/sample-papers/vedicx-maths-high-yield-set1.pdf', '1.5 MB', 'premium', 540);

  // Seed Authentic Previous Year Questions (PYQs)
  const insertPyq = db.prepare(`
    INSERT INTO pyq_questions (id, subject_id, year, chapter_id, topic, question_type, question_text, marks, solution_text, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `);

  insertPyq.run(
    'pyq-math-2023-1',
    'mathematics',
    2023,
    'math-ch1',
    'Irrationality Proof',
    'Subjective (3 Marks)',
    'Prove that √5 is an irrational number. [CBSE Board 2023, 3 Marks]',
    3,
    'Solution: Let us assume to the contrary that √5 is rational. Then √5 = a/b where a and b are co-prime integers and b ≠ 0. Squaring both sides: 5 = a²/b² => 5b² = a². Therefore 5 divides a², which implies 5 divides a. Let a = 5c for some integer c. Then 5b² = (5c)² = 25c² => b² = 5c². Thus 5 divides b², so 5 divides b. Hence a and b have at least 5 as a common factor, which contradicts that a and b are co-prime. Therefore √5 is irrational.'
  );

  insertPyq.run(
    'pyq-sci-2023-1',
    'science',
    2023,
    'sci-ch1',
    'Thermal Decomposition',
    'Subjective (3 Marks)',
    'Write balanced chemical equations for the following reactions and identify the type of reaction: (a) Potassium chlorate on heating in presence of MnO₂ produces potassium chloride and oxygen. (b) Lead nitrate crystals heated strongly in a dry test tube. [CBSE Board 2023, 3 Marks]',
    3,
    'Solution: (a) 2KClO₃(s) --[MnO₂, Δ]--> 2KCl(s) + 3O₂(g). Type: Thermal Decomposition reaction. (b) 2Pb(NO₃)₂(s) --[Δ]--> 2PbO(s) + 4NO₂(g) + O₂(g). Type: Thermal Decomposition reaction (Brown fumes of nitrogen dioxide NO₂ are observed).'
  );

  insertPyq.run(
    'pyq-sst-2023-1',
    'social-science',
    2023,
    'sst-hist-2',
    'Non-Cooperation Movement',
    'Subjective (5 Marks)',
    'Explain the reasons why Mahatma Gandhi decided to withdraw the Non-Cooperation Movement in February 1922. [CBSE Board 2023, 5 Marks]',
    5,
    'Solution: In February 1922, Mahatma Gandhi decided to withdraw the Non-Cooperation Movement because: 1. Violence at Chauri Chaura: At Chauri Chaura in Gorakhpur (UP), a peaceful demonstration in a bazaar turned into a violent clash with police. An enraged crowd set a police station on fire, killing 22 policemen. 2. Need for mass training: Gandhiji felt the movement was turning violent in many places and satyagrahis needed to be properly trained before they would be ready for mass struggles. 3. Fatigue and internal conflicts: Within the Congress, some leaders were tired of mass struggles and wanted to participate in elections to provincial councils.'
  );

  // Seed a sample payment record & membership
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, student_id, transaction_id, order_id, amount, currency, gateway, status, payment_signature, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))
  `);

  insertPayment.run('pay-demo-1', 'usr-student-2', 'pay_Ox78219HqZk', 'order_Kj9821Lmq', 49.0, 'INR', 'Razorpay', 'success', 'sig_9128301823901', 'UPI (Google Pay)');

  const insertMembership = db.prepare(`
    INSERT INTO memberships (id, student_id, tier, payment_id, is_active, activated_at)
    VALUES (?, ?, 'premium', ?, 1, datetime('now', '-2 days'))
  `);

  insertMembership.run('mem-demo-1', 'usr-student-2', 'pay-demo-1');

  // Insert initial audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details)
    VALUES ('log-init-1', 'usr-admin-1', 'admin@vedicx.in', 'SYSTEM_INIT', 'DATABASE', 'ALL', 'Initialized NCERT Class 10 subjects, chapters, 5 mock test slots per chapter, questions, and site settings.')
  `).run();

  console.log('[DB] Seeding completed successfully!');
}
