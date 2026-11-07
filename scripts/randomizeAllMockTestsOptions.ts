import Database from 'better-sqlite3';

export function randomizeAllMockTestsOptions(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Randomization] Starting comprehensive randomization of mock test answers...');

  // Helper to generate a natural, randomized, balanced sequence for 10 questions
  function generateRandomBalancedSequence(): string[] {
    const letters = ['A', 'B', 'C', 'D'];
    const forbiddenSubstrings = [
      'ABCD', 'BCDA', 'CDAB', 'DABC',
      'DCBA', 'CBAD', 'BADC', 'ADCB',
      'AAA', 'BBB', 'CCC', 'DDD'
    ];

    for (let attempt = 0; attempt < 1000; attempt++) {
      // Pick two letters to have count 3, two letters to have count 2
      const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);
      const bag = [
        shuffledLetters[0], shuffledLetters[0], shuffledLetters[0],
        shuffledLetters[1], shuffledLetters[1], shuffledLetters[1],
        shuffledLetters[2], shuffledLetters[2],
        shuffledLetters[3], shuffledLetters[3]
      ];

      // Fisher-Yates shuffle
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }

      const str = bag.join('');

      let hasForbidden = false;
      for (const f of forbiddenSubstrings) {
        if (str.includes(f)) {
          hasForbidden = true;
          break;
        }
      }
      if (hasForbidden) continue;

      // Ensure no 3 consecutive ascending (e.g. ABC, BCD) or descending (e.g. CBA, DCB)
      let hasConsecutiveRun = false;
      for (let i = 0; i < str.length - 2; i++) {
        const c1 = str.charCodeAt(i);
        const c2 = str.charCodeAt(i + 1);
        const c3 = str.charCodeAt(i + 2);
        if (c2 === c1 + 1 && c3 === c2 + 1) {
          hasConsecutiveRun = true;
          break;
        }
        if (c2 === c1 - 1 && c3 === c2 - 1) {
          hasConsecutiveRun = true;
          break;
        }
      }
      if (hasConsecutiveRun) continue;

      // Valid balanced random sequence found!
      return bag;
    }

    // Fallback if loop exceeded
    return ['C', 'A', 'B', 'D', 'B', 'A', 'D', 'C', 'B', 'A'];
  }

  // Get all mock tests
  const tests = db.prepare(`
    SELECT id, title, chapter_id
    FROM mock_tests
    ORDER BY chapter_id, test_number
  `).all() as { id: string; title: string; chapter_id: string }[];

  const getTestQuestions = db.prepare(`
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

  let modifiedCount = 0;
  let testModifiedCount = 0;

  const tx = db.transaction(() => {
    for (const test of tests) {
      const questions = getTestQuestions.all(test.id) as any[];
      if (questions.length !== 10) continue;

      // Generate a new random balanced sequence
      const targetAnswers = generateRandomBalancedSequence();

      let testChanged = false;
      for (let i = 0; i < 10; i++) {
        const q = questions[i];
        const currentAns = q.correct_answer;
        const targetAns = targetAnswers[i];

        if (currentAns !== targetAns) {
          // Map options
          const currentOptions: Record<string, string> = {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d
          };

          // The correct option text is at currentOptions[currentAns]
          // Swap option at currentAns and option at targetAns
          const temp = currentOptions[targetAns];
          currentOptions[targetAns] = currentOptions[currentAns];
          currentOptions[currentAns] = temp;

          updateQuestion.run(
            currentOptions.A,
            currentOptions.B,
            currentOptions.C,
            currentOptions.D,
            targetAns,
            q.id
          );

          modifiedCount++;
          testChanged = true;
        }
      }

      if (testChanged) {
        testModifiedCount++;
      }
    }
  });

  tx();

  console.log(`[Randomization] Randomization complete! Updated ${modifiedCount} questions across ${testModifiedCount} tests.`);

  // Audit results
  const sampleTests = db.prepare(`
    SELECT id, title
    FROM mock_tests
    WHERE subject_id = 'mathematics'
    ORDER BY chapter_id, test_number
  `).all() as any[];

  console.log('\n--- Sample Randomized Sequences ---');
  for (const t of sampleTests.slice(0, 15)) {
    const qs = db.prepare('SELECT q.correct_answer FROM mock_test_questions mtq JOIN questions q ON mtq.question_id = q.id WHERE mtq.mock_test_id = ? ORDER BY mtq.display_order').all(t.id) as any[];
    const seq = qs.map(q => q.correct_answer).join('');
    console.log(t.id.padEnd(25), seq);
  }

  // Verify no duplicate options exist anywhere
  const allQ = db.prepare('SELECT id, option_a, option_b, option_c, option_d FROM questions').all() as any[];
  let dups = 0;
  for (const q of allQ) {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
    const set = new Set(opts.map(o => o.trim().toLowerCase()));
    if (set.size !== opts.length) {
      dups++;
    }
  }

  if (dups === 0) {
    console.log('\n[Verification PASSED] 0 duplicate choices across entire database!');
  } else {
    console.error(`\n[Verification FAILED] ${dups} questions contain duplicate options.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('randomizeAllMockTestsOptions.ts')) {
  randomizeAllMockTestsOptions();
}
