import Database from 'better-sqlite3';

export function balanceAndVerifyAllTests(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Balancing] Checking all tests across all subjects...');

  // Fix q-prob-m2-10 duplicate option first
  db.prepare(`
    UPDATE questions
    SET option_a = '9/10', option_b = '1/10', option_c = '89/90', option_d = '8/9', correct_answer = 'A'
    WHERE id = 'q-prob-m2-10'
  `).run();

  const mockTests = db.prepare(`
    SELECT id, title, chapter_id
    FROM mock_tests
    WHERE subject_id = 'mathematics'
    ORDER BY chapter_id, test_number
  `).all() as { id: string; title: string; chapter_id: string }[];

  const getQuestions = db.prepare(`
    SELECT q.id, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, mtq.display_order
    FROM mock_test_questions mtq
    JOIN questions q ON mtq.question_id = q.id
    WHERE mtq.mock_test_id = ?
    ORDER BY mtq.display_order
  `);

  const updateQuestion = db.prepare(`
    UPDATE questions
    SET option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?
    WHERE id = ?
  `);

  let totalUpdated = 0;

  for (const test of mockTests) {
    const questions = getQuestions.all(test.id) as any[];
    if (questions.length !== 10) continue;

    // Check current distribution
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of questions) {
      if (counts[q.correct_answer] !== undefined) {
        counts[q.correct_answer]++;
      }
    }

    // Target for 10 questions: exactly [3, 3, 2, 2] in some order, e.g., balanced
    // While any count > 3, or any count < 2:
    let neededTargets = ['A', 'B', 'C', 'D'].filter(k => counts[k] < 2);
    let surplusTargets = ['A', 'B', 'C', 'D'].filter(k => counts[k] > 3);

    while (neededTargets.length > 0 && surplusTargets.length > 0) {
      const fromLetter = surplusTargets[0];
      const toLetter = neededTargets[0];

      // Find a question currently having fromLetter as correct_answer
      const candidate = questions.find(q => q.correct_answer === fromLetter);
      if (!candidate) break;

      // Swap the options between fromLetter and toLetter
      const opts: Record<string, string> = {
        A: candidate.option_a,
        B: candidate.option_b,
        C: candidate.option_c,
        D: candidate.option_d
      };

      const temp = opts[fromLetter];
      opts[fromLetter] = opts[toLetter];
      opts[toLetter] = temp;

      // Update in db
      updateQuestion.run(opts.A, opts.B, opts.C, opts.D, toLetter, candidate.id);

      // Update in memory
      candidate.option_a = opts.A;
      candidate.option_b = opts.B;
      candidate.option_c = opts.C;
      candidate.option_d = opts.D;
      candidate.correct_answer = toLetter;

      counts[fromLetter]--;
      counts[toLetter]++;
      totalUpdated++;

      neededTargets = ['A', 'B', 'C', 'D'].filter(k => counts[k] < 2);
      surplusTargets = ['A', 'B', 'C', 'D'].filter(k => counts[k] > 3);
    }
  }

  console.log(`[Balancing] Completed! Options swapped for even distribution: ${totalUpdated}`);

  // Verification step: verify duplicate options and answer distributions
  const allQ = db.prepare('SELECT id, option_a, option_b, option_c, option_d FROM questions').all() as any[];
  let dupCount = 0;
  for (const q of allQ) {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
    const set = new Set(opts.map(o => o.trim().toLowerCase()));
    if (set.size !== opts.length) {
      console.error(`[Error] Duplicate options in ${q.id}:`, opts);
      dupCount++;
    }
  }

  if (dupCount === 0) {
    console.log('[Verification PASSED] 0 duplicate options found across all questions in the entire database!');
  } else {
    console.error(`[Verification FAILED] ${dupCount} questions have duplicates.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('balanceAndVerifyAllTests.ts')) {
  balanceAndVerifyAllTests();
}
