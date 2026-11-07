import Database from 'better-sqlite3';

export function seedTrigonometryChapters(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 8 (6 Tests) and Chapter 9 (3 Tests)...');

  // Helper to ensure mock test slots
  function ensureSlots(chapterId: string, count: number, chapterName: string) {
    const existing = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all(chapterId) as any[];
    const slotMap = new Map(existing.map(t => [t.test_number, t.id]));

    // If there were extra slots (e.g. 5 default slots when we only need 3), delete questions for extras
    for (const t of existing) {
      if (t.test_number > count) {
        const oldQ = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(t.id) as any[];
        for (const q of oldQ) db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
        db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(t.id);
        db.prepare('DELETE FROM mock_tests WHERE id = ?').run(t.id);
      }
    }

    for (let slot = 1; slot <= count; slot++) {
      const testId = slotMap.get(slot) || `test-${chapterId}-slot-${slot}`;
      const title = `${chapterName} – Mock Test ${slot}`;
      const accessType = slot === 1 ? 'free' : 'premium';

      const exists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
      if (!exists) {
        db.prepare(`
          INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
          VALUES (?, ?, 'mathematics', ?, ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
        `).run(testId, title, chapterId, slot, `Class 10 ${chapterName} Mock Test ${slot}`, accessType);
      } else {
        db.prepare(`
          UPDATE mock_tests
          SET title = ?, test_number = ?, total_questions = 10, duration_minutes = 25, max_marks = 20.0, passing_marks = 8.0, access_type = ?, status = 'published'
          WHERE id = ?
        `).run(title, slot, accessType, testId);
      }

      const oldQuestions = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(testId) as any[];
      for (const q of oldQuestions) db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
      db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(testId);
    }
  }

  ensureSlots('math-ch8', 6, 'Introduction to Trigonometry');
  ensureSlots('math-ch9', 3, 'Some Applications of Trigonometry');

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', ?, ?, 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  // Chapter 8: Introduction to Trigonometry (6 Mock Tests, 60 Questions)
  const ch8Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'In right-angled triangle ABC with ∠B = 90°, AC = 13 cm and AB = 5 cm. Find sin A, cos A and tan A.',
          optA: 'sin A = 12/13, cos A = 5/13, tan A = 12/5',
          optB: 'sin A = 5/13, cos A = 12/13, tan A = 5/12',
          optC: 'sin A = 12/13, cos A = 5/12, tan A = 5/13',
          optD: 'sin A = 13/12, cos A = 13/5, tan A = 12/5',
          ans: 'A',
          exp: 'BC = √(13² − 5²) = 12 cm. For angle A: Opposite = 12, Adjacent = 5, Hypotenuse = 13. Thus sin A = 12/13, cos A = 5/13, tan A = 12/5.'
        },
        {
          text: 'Evaluate the expression: 2 sin 30° + 3 cos 60° − tan 45°.',
          optA: '1/2',
          optB: '3/2',
          optC: '5/2',
          optD: '1',
          ans: 'B',
          exp: '2(1/2) + 3(1/2) − 1 = 1 + 1.5 − 1 = 1.5 = 3/2.'
        },
        {
          text: 'If tan θ = 3/4, where θ is acute, find sin θ and cos θ.',
          optA: 'sin θ = 4/5, cos θ = 3/5',
          optB: 'sin θ = 3/5, cos θ = 4/5',
          optC: 'sin θ = 3/7, cos θ = 4/7',
          optD: 'sin θ = 5/3, cos θ = 5/4',
          ans: 'B',
          exp: 'Opposite = 3, Adjacent = 4 => Hypotenuse = √(3² + 4²) = 5. sin θ = 3/5, cos θ = 4/5.'
        },
        {
          text: 'Simplify the trigonometric identity: (1 − cos² A)/sin A, wherever defined.',
          optA: 'cos A',
          optB: 'tan A',
          optC: 'sin A',
          optD: 'sec A',
          ans: 'C',
          exp: 'Since sin² A + cos² A = 1, 1 − cos² A = sin² A. Then sin² A / sin A = sin A.'
        },
        {
          text: 'A pole casts a shadow 10√3 m long when the angle of elevation of the sun is 30°. Find the height of the pole.',
          optA: '15 m',
          optB: '20 m',
          optC: '10√3 m',
          optD: '10 m',
          ans: 'D',
          exp: 'tan 30° = h/(10√3) => 1/√3 = h/(10√3) => h = 10 m.'
        },
        {
          text: 'If sin A = 5/13 and A is acute, find sec A.',
          optA: '13/12',
          optB: '12/13',
          optC: '13/5',
          optD: '5/12',
          ans: 'A',
          exp: 'Adjacent = √(13² − 5²) = 12. cos A = 12/13 => sec A = 13/12.'
        },
        {
          text: 'Find the numerical value of (sin 45° + cos 45°)².',
          optA: '1',
          optB: '2',
          optC: '√2',
          optD: '4',
          ans: 'B',
          exp: 'sin 45° = 1/√2, cos 45° = 1/√2. (1/√2 + 1/√2)² = (2/√2)² = (√2)² = 2.'
        },
        {
          text: 'From a point 20 m away from the foot of a tower on level ground, the angle of elevation of its top is 45°. Find the height of the tower.',
          optA: '10√3 m',
          optB: '20√3 m',
          optC: '20 m',
          optD: '10 m',
          ans: 'C',
          exp: 'tan 45° = h/20 = 1 => h = 20 m.'
        },
        {
          text: 'If sec A = 17/8 and A is an acute angle, find tan A.',
          optA: '8/15',
          optB: '17/15',
          optC: '15/17',
          optD: '15/8',
          ans: 'D',
          exp: 'tan² A = sec² A − 1 = (17/8)² − 1 = 289/64 − 1 = 225/64 => tan A = 15/8.'
        },
        {
          text: 'A 6 m ladder rests against a vertical wall with its foot 3 m from the wall. Find the angle the ladder makes with the ground.',
          optA: '60°',
          optB: '30°',
          optC: '45°',
          optD: '75°',
          ans: 'A',
          exp: 'cos θ = Adjacent / Hypotenuse = 3/6 = 1/2 => θ = 60°.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'In right triangle PQR with ∠Q = 90°, PR = 25 cm and QR = 7 cm. Find cos P and tan P.',
          optA: 'cos P = 7/25, tan P = 24/7',
          optB: 'cos P = 24/25, tan P = 7/24',
          optC: 'cos P = 24/25, tan P = 24/7',
          optD: 'cos P = 7/24, tan P = 24/25',
          ans: 'B',
          exp: 'PQ = √(25² − 7²) = 24 cm. For angle P: Adjacent = 24, Opposite = 7, Hypotenuse = 25. cos P = 24/25, tan P = 7/24.'
        },
        {
          text: 'Simplify the expression: (1 + tan² A) cos² A.',
          optA: 'tan A',
          optB: 'sin² A',
          optC: '1',
          optD: 'sec A',
          ans: 'C',
          exp: '1 + tan² A = sec² A. Then sec² A × cos² A = (1/cos² A) × cos² A = 1.'
        },
        {
          text: 'Evaluate: sin² 30° + cos² 30° + tan² 45°.',
          optA: '3/2',
          optB: '3',
          optC: '5/4',
          optD: '2',
          ans: 'D',
          exp: 'sin² 30° + cos² 30° = 1. tan² 45° = 1² = 1. Sum = 1 + 1 = 2.'
        },
        {
          text: 'If cot A = 7/24 and A is acute, find cosec A.',
          optA: '25/24',
          optB: '24/25',
          optC: '25/7',
          optD: '24/7',
          ans: 'A',
          exp: 'Hypotenuse = √(7² + 24²) = 25. sin A = 24/25 => cosec A = 25/24.'
        },
        {
          text: 'A kite is flying on a 60 m taut string making an angle of 60° with the horizontal. Find its vertical height.',
          optA: '30 m',
          optB: '30√3 m',
          optC: '20√3 m',
          optD: '45 m',
          ans: 'B',
          exp: 'Height = 60 sin 60° = 60 × (√3/2) = 30√3 m.'
        },
        {
          text: 'Show that: (sec² A − 1)/tan A simplifies to:',
          optA: 'cot A',
          optB: 'cos A',
          optC: 'tan A',
          optD: 'sec A',
          ans: 'C',
          exp: 'sec² A − 1 = tan² A. tan² A / tan A = tan A.'
        },
        {
          text: 'Find the value of tan 30° × tan 60° + cos 0°.',
          optA: '1',
          optB: '0',
          optC: '3',
          optD: '2',
          ans: 'D',
          exp: '(1/√3)(√3) + 1 = 1 + 1 = 2.'
        },
        {
          text: 'A tree is observed from a point 12 m away at an angle of elevation of 60°. Find the height of the tree.',
          optA: '12√3 m',
          optB: '6√3 m',
          optC: '12 m',
          optD: '18 m',
          ans: 'A',
          exp: 'tan 60° = h/12 => √3 = h/12 => h = 12√3 m.'
        },
        {
          text: 'If sin A = cos A and A is acute, find the angle A and tan A.',
          optA: 'A = 30°, tan A = 1/√3',
          optB: 'A = 45°, tan A = 1',
          optC: 'A = 60°, tan A = √3',
          optD: 'A = 90°, tan A is undefined',
          ans: 'B',
          exp: 'sin A = cos A => sin A / cos A = 1 => tan A = 1. Since A is acute, A = 45°.'
        },
        {
          text: 'From the top of a tower, the angle of depression of a point 30 m from its foot is 30°. Find the tower height.',
          optA: '30√3 m',
          optB: '15 m',
          optC: '10√3 m',
          optD: '20 m',
          ans: 'C',
          exp: 'Angle of depression = Angle of elevation = 30°. tan 30° = h/30 => h = 30/√3 = 10√3 m.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'If sin A = 12/13 and A is acute, find the value of tan A + cot A.',
          optA: '120/169',
          optB: '60/169',
          optC: '13/12',
          optD: '169/60',
          ans: 'D',
          exp: 'Adjacent = 5. tan A = 12/5, cot A = 5/12. tan A + cot A = 12/5 + 5/12 = (144 + 25)/60 = 169/60.'
        },
        {
          text: 'Evaluate: 2 cos² 30° − 3 sin² 60° + sec² 60°.',
          optA: '13/4',
          optB: '11/4',
          optC: '15/4',
          optD: '3',
          ans: 'A',
          exp: '2(3/4) − 3(3/4) + 4 = 6/4 − 9/4 + 16/4 = 13/4.'
        },
        {
          text: 'Prove that (cosec² A − 1)/cosec² A is identically equal to:',
          optA: 'sin² A',
          optB: 'cos² A',
          optC: 'tan² A',
          optD: 'cot² A',
          ans: 'B',
          exp: 'cosec² A − 1 = cot² A = cos² A / sin² A. Dividing by cosec² A (1/sin² A) gives cos² A.'
        },
        {
          text: 'In a right triangle, the side opposite θ is 8 cm and the hypotenuse is 17 cm. Find cos θ and cot θ.',
          optA: 'cos θ = 8/17, cot θ = 15/8',
          optB: 'cos θ = 15/17, cot θ = 8/15',
          optC: 'cos θ = 15/17, cot θ = 15/8',
          optD: 'cos θ = 17/15, cot θ = 15/8',
          ans: 'C',
          exp: 'Adjacent = √(17² − 8²) = 15 cm. cos θ = 15/17, cot θ = 15/8.'
        },
        {
          text: 'A 1.5 m tall student stands 20 m from a building. The angle of elevation from eye level to the top is 45°. Find the building height.',
          optA: '20 m',
          optB: '21.5 m',
          optC: '22.5 m',
          optD: '23 m',
          ans: 'B',
          exp: 'Height above eye level = 20 tan 45° = 20 m. Total building height = 20 + 1.5 = 21.5 m.'
        },
        {
          text: 'Find the numerical value of (1 − sin 30°)(1 + sin 30°).',
          optA: '1/4',
          optB: '1/2',
          optC: '3/4',
          optD: '1',
          ans: 'C',
          exp: '(1 − sin 30°)(1 + sin 30°) = 1 − sin² 30° = cos² 30° = (√3/2)² = 3/4.'
        },
        {
          text: 'If tan A = 1/√3 and A is acute, find sin A and sec A.',
          optA: 'sin A = √3/2, sec A = 2',
          optB: 'sin A = 1/2, sec A = 2',
          optC: 'sin A = 1/√2, sec A = √2',
          optD: 'sin A = 1/2, sec A = 2/√3',
          ans: 'D',
          exp: 'tan A = 1/√3 => A = 30°. sin 30° = 1/2, sec 30° = 2/√3.'
        },
        {
          text: 'A 10 m wire tied from top of a pole makes an angle of 30° with the ground. Find the height of the pole.',
          optA: '5 m',
          optB: '5√3 m',
          optC: '10√3 m',
          optD: '7.5 m',
          ans: 'A',
          exp: 'sin 30° = h/10 => 1/2 = h/10 => h = 5 m.'
        },
        {
          text: 'If 3 cot A = 4, evaluate (1 + tan² A).',
          optA: '16/9',
          optB: '25/16',
          optC: '25/9',
          optD: '9/16',
          ans: 'B',
          exp: 'cot A = 4/3 => tan A = 3/4. 1 + tan² A = 1 + 9/16 = 25/16.'
        },
        {
          text: 'From the top of a 24 m building, the angle of depression of a car is 45°. Find the horizontal distance of the car.',
          optA: '12√2 m',
          optB: '24√3 m',
          optC: '24 m',
          optD: '48 m',
          ans: 'C',
          exp: 'tan 45° = 24/x => 1 = 24/x => x = 24 m.'
        }
      ]
    },
    {
      slot: 4,
      questions: [
        {
          text: 'In a right-angled triangle, hypotenuse = 10 cm and one acute angle is 30°. Find the side opposite and adjacent to this angle.',
          optA: 'Opposite = 5 cm, Adjacent = 5√3 cm',
          optB: 'Opposite = 5√3 cm, Adjacent = 5 cm',
          optC: 'Opposite = 6 cm, Adjacent = 8 cm',
          optD: 'Opposite = 5 cm, Adjacent = 10 cm',
          ans: 'A',
          exp: 'Opposite = 10 sin 30° = 5 cm. Adjacent = 10 cos 30° = 5√3 cm.'
        },
        {
          text: 'Evaluate: (sin 60°/cos 30°) + (cos 60°/sin 30°).',
          optA: '1',
          optB: '2',
          optC: '√3',
          optD: '4',
          ans: 'B',
          exp: 'sin 60° = cos 30° = √3/2 => ratio is 1. cos 60° = sin 30° = 1/2 => ratio is 1. Sum = 1 + 1 = 2.'
        },
        {
          text: 'Simplify: (1 + tan² A)/(1 + cot² A).',
          optA: 'cot² A',
          optB: 'sec² A',
          optC: 'tan² A',
          optD: '1',
          ans: 'C',
          exp: '(1 + tan² A)/(1 + cot² A) = sec² A / cosec² A = (1/cos² A)/(1/sin² A) = sin² A / cos² A = tan² A.'
        },
        {
          text: 'If cos A = 4/5 and A is acute, find sin A and cosec A.',
          optA: 'sin A = 3/4, cosec A = 4/3',
          optB: 'sin A = 3/5, cosec A = 5/4',
          optC: 'sin A = 4/5, cosec A = 5/4',
          optD: 'sin A = 3/5, cosec A = 5/3',
          ans: 'D',
          exp: 'sin A = √(1 − (4/5)²) = 3/5. cosec A = 1/sin A = 5/3.'
        },
        {
          text: 'A flagstaff is fixed on top of a 20 m building. Angles of elevation to top and bottom from a ground point are 60° and 45°. Find flagstaff height.',
          optA: '20(√3 − 1) m',
          optB: '20√3 m',
          optC: '20(√3 + 1) m',
          optD: '10(√3 − 1) m',
          ans: 'A',
          exp: 'Distance x = 20/tan 45° = 20 m. Total height H = 20 tan 60° = 20√3 m. Flagstaff height = 20√3 − 20 = 20(√3 − 1) m.'
        },
        {
          text: 'Find the value of sin 30° cos 60° + cos 30° sin 60°.',
          optA: '0',
          optB: '1',
          optC: '1/2',
          optD: '√3/2',
          ans: 'B',
          exp: '(1/2)(1/2) + (√3/2)(√3/2) = 1/4 + 3/4 = 1.'
        },
        {
          text: 'If sec A + tan A = 3, find the value of sec A − tan A.',
          optA: '3',
          optB: '−3',
          optC: '1/3',
          optD: '1',
          ans: 'C',
          exp: 'sec² A − tan² A = (sec A + tan A)(sec A − tan A) = 1. Since sec A + tan A = 3, sec A − tan A = 1/3.'
        },
        {
          text: 'A person observes the top of a tower at 30°. After walking 20 m towards it, the angle becomes 60°. Find the tower height.',
          optA: '20√3 m',
          optB: '10 m',
          optC: '15√3 m',
          optD: '10√3 m',
          ans: 'D',
          exp: 'h = x tan 60° = x√3, and h = (x + 20) tan 30° = (x + 20)/√3. 3x = x + 20 => x = 10 m. h = 10√3 m.'
        },
        {
          text: 'If sin A = 3/5, find the value of (1 + cos A)(1 − cos A).',
          optA: '9/25',
          optB: '16/25',
          optC: '4/5',
          optD: '12/25',
          ans: 'A',
          exp: '(1 + cos A)(1 − cos A) = 1 − cos² A = sin² A = (3/5)² = 9/25.'
        },
        {
          text: 'A tower casts a shadow 15 m long. If the sun\'s angle of elevation is 60°, find the tower height.',
          optA: '15 m',
          optB: '15√3 m',
          optC: '5√3 m',
          optD: '30 m',
          ans: 'B',
          exp: 'tan 60° = h/15 => √3 = h/15 => h = 15√3 m.'
        }
      ]
    },
    {
      slot: 5,
      questions: [
        {
          text: 'If tan A = 5/12 and A is acute, find sin A, cos A and sec A.',
          optA: 'sin A = 12/13, cos A = 5/13, sec A = 13/5',
          optB: 'sin A = 5/13, cos A = 12/13, sec A = 13/5',
          optC: 'sin A = 5/13, cos A = 12/13, sec A = 13/12',
          optD: 'sin A = 5/12, cos A = 12/13, sec A = 13/12',
          ans: 'C',
          exp: 'Hypotenuse = √(5² + 12²) = 13. sin A = 5/13, cos A = 12/13, sec A = 13/12.'
        },
        {
          text: 'Evaluate: 4 sin² 30° + 2 cos² 60° + 3 tan² 45°.',
          optA: '7/2',
          optB: '9/4',
          optC: '5',
          optD: '9/2',
          ans: 'D',
          exp: '4(1/4) + 2(1/4) + 3(1) = 1 + 1/2 + 3 = 4.5 = 9/2.'
        },
        {
          text: 'Simplify: (sec A − cos A)/tan A.',
          optA: 'sin A',
          optB: 'cos A',
          optC: 'tan A',
          optD: 'cot A',
          ans: 'A',
          exp: 'sec A − cos A = (1 − cos² A)/cos A = sin² A / cos A. Dividing by tan A (sin A / cos A) gives sin A.'
        },
        {
          text: 'If cosec A = 2 and A is acute, find tan A.',
          optA: '√3',
          optB: '1/√3',
          optC: '1',
          optD: '1/2',
          ans: 'B',
          exp: 'cosec A = 2 => sin A = 1/2 => A = 30°. tan 30° = 1/√3.'
        },
        {
          text: 'A balloon is vertically above a point on the ground. From 50 m away, its angle of elevation is 30°. Find its height.',
          optA: '25 m',
          optB: '50√3 m',
          optC: '50√3/3 m',
          optD: '25√3 m',
          ans: 'C',
          exp: 'tan 30° = h/50 => h = 50/√3 = 50√3/3 m.'
        },
        {
          text: 'Simplify: (sec² A − tan² A) + (cosec² A − cot² A).',
          optA: '0',
          optB: '1',
          optC: '3',
          optD: '2',
          ans: 'D',
          exp: 'By fundamental identities, sec² A − tan² A = 1 and cosec² A − cot² A = 1. Total = 1 + 1 = 2.'
        },
        {
          text: 'If cos A = 1/2 and A is acute, find sin A + tan A.',
          optA: '3√3/2',
          optB: '√3',
          optC: '2√3',
          optD: '√3/2',
          ans: 'A',
          exp: 'cos A = 1/2 => A = 60°. sin 60° = √3/2, tan 60° = √3. Sum = √3/2 + √3 = 3√3/2.'
        },
        {
          text: 'An 8 m ladder reaches a window 4√3 m above the ground. Find the angle the ladder makes with the ground.',
          optA: '30°',
          optB: '60°',
          optC: '45°',
          optD: '75°',
          ans: 'B',
          exp: 'sin θ = 4√3/8 = √3/2 => θ = 60°.'
        },
        {
          text: 'Show that (1 − cos A)/sin A is identically equal to:',
          optA: '(1 + cos A)/sin A',
          optB: 'cos A/(1 + sin A)',
          optC: 'sin A/(1 + cos A)',
          optD: 'tan A/(1 + sec A)',
          ans: 'C',
          exp: '(1 − cos A)/sin A × (1 + cos A)/(1 + cos A) = (1 − cos² A)/[sin A(1 + cos A)] = sin² A / [sin A(1 + cos A)] = sin A / (1 + cos A).'
        },
        {
          text: 'From a point on the ground 30√3 m from a building, the angle of elevation of the top is 30°. Find the building height.',
          optA: '15 m',
          optB: '20 m',
          optC: '45 m',
          optD: '30 m',
          ans: 'D',
          exp: 'tan 30° = h/(30√3) => 1/√3 = h/(30√3) => h = 30 m.'
        }
      ]
    },
    {
      slot: 6,
      questions: [
        {
          text: 'In right triangle XYZ with ∠Y = 90°, XY = 9 cm and XZ = 15 cm. Find sin X, cos X and cot X.',
          optA: 'sin X = 4/5, cos X = 3/5, cot X = 3/4',
          optB: 'sin X = 3/5, cos X = 4/5, cot X = 4/3',
          optC: 'sin X = 4/5, cos X = 3/5, cot X = 4/3',
          optD: 'sin X = 9/15, cos X = 12/15, cot X = 3/4',
          ans: 'A',
          exp: 'YZ = √(15² − 9²) = 12 cm. sin X = 12/15 = 4/5, cos X = 9/15 = 3/5, cot X = 9/12 = 3/4.'
        },
        {
          text: 'Evaluate: (tan 60° − tan 30°) / (tan 60° + tan 30°).',
          optA: '1/3',
          optB: '1/2',
          optC: '1/√3',
          optD: '2/3',
          ans: 'B',
          exp: '(√3 − 1/√3)/(√3 + 1/√3) = ((3 − 1)/√3)/((3 + 1)/√3) = 2/4 = 1/2.'
        },
        {
          text: 'If sin A = 4/5 and A is acute, find (1 + cos A)/(1 − cos A).',
          optA: '3',
          optB: '9',
          optC: '4',
          optD: '16',
          ans: 'C',
          exp: 'cos A = √(1 − 16/25) = 3/5. (1 + 3/5)/(1 − 3/5) = (8/5)/(2/5) = 8/2 = 4.'
        },
        {
          text: 'Prove that: (cosec A − sin A) cos A simplifies to:',
          optA: 'sin² A tan A',
          optB: 'sec² A cot A',
          optC: 'cos A sin A',
          optD: 'cos² A cot A',
          ans: 'D',
          exp: 'cosec A − sin A = (1 − sin² A)/sin A = cos² A / sin A. Multiplying by cos A gives cos³ A / sin A = cos² A cot A.'
        },
        {
          text: 'A 30 m high tower has an angle of elevation of 60° from a point on the ground. Find the distance of the point from the tower foot.',
          optA: '10√3 m',
          optB: '15 m',
          optC: '10 m',
          optD: '15√3 m',
          ans: 'A',
          exp: 'tan 60° = 30/x => √3 = 30/x => x = 30/√3 = 10√3 m.'
        },
        {
          text: 'If tan A = 2, find the value of (1 + tan² A)/sec A, for acute A.',
          optA: '2',
          optB: '√5',
          optC: '5',
          optD: '1/√5',
          ans: 'B',
          exp: '1 + tan² A = 1 + 4 = 5 = sec² A. sec A = √5. (1 + tan² A)/sec A = 5/√5 = √5.'
        },
        {
          text: 'Find the value of sin 0° + cos 90° + tan 0° + cos 0°.',
          optA: '0',
          optB: '2',
          optC: '1',
          optD: '4',
          ans: 'C',
          exp: '0 + 0 + 0 + 1 = 1.'
        },
        {
          text: 'A person standing on a 60 m cliff observes a boat at an angle of depression of 30°. Find the horizontal distance of the boat.',
          optA: '30√3 m',
          optB: '60 m',
          optC: '120 m',
          optD: '60√3 m',
          ans: 'D',
          exp: 'tan 30° = 60/x => 1/√3 = 60/x => x = 60√3 m.'
        },
        {
          text: 'If 5 sin A = 3 and A is acute, find cos A and tan A.',
          optA: 'cos A = 4/5, tan A = 3/4',
          optB: 'cos A = 3/5, tan A = 4/3',
          optC: 'cos A = 4/5, tan A = 4/3',
          optD: 'cos A = 3/4, tan A = 4/5',
          ans: 'A',
          exp: 'sin A = 3/5 => cos A = 4/5, tan A = (3/5)/(4/5) = 3/4.'
        },
        {
          text: 'From the top of a lighthouse, the angle of depression of a ship 40 m from its foot is 60°. Find the lighthouse height.',
          optA: '20√3 m',
          optB: '40√3 m',
          optC: '40 m',
          optD: '80 m',
          ans: 'B',
          exp: 'tan 60° = h/40 => √3 = h/40 => h = 40√3 m.'
        }
      ]
    }
  ];

  // Chapter 9: Some Applications of Trigonometry (3 Mock Tests, 30 Questions)
  const ch9Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'A vertical pole casts a shadow 10√3 m long when the sun\'s angle of elevation is 30°. Find the pole height.',
          optA: '10 m',
          optB: '15 m',
          optC: '20 m',
          optD: '10√3 m',
          ans: 'A',
          exp: 'tan 30° = h/(10√3) = 1/√3 => h = 10 m.'
        },
        {
          text: 'From a point 20 m from a tower\'s foot, its top has an angle of elevation of 45°. Find the tower\'s height.',
          optA: '15 m',
          optB: '20 m',
          optC: '20√3 m',
          optD: '10√3 m',
          ans: 'B',
          exp: 'tan 45° = h/20 = 1 => h = 20 m.'
        },
        {
          text: 'A 10 m ladder has its foot 5 m from a vertical wall. Find the angle it makes with the ground.',
          optA: '30°',
          optB: '45°',
          optC: '60°',
          optD: '75°',
          ans: 'C',
          exp: 'cos θ = 5/10 = 1/2 => θ = 60°.'
        },
        {
          text: 'From the top of a 30 m building, the angle of depression of a car is 30°. Find the car\'s horizontal distance from the building.',
          optA: '30 m',
          optB: '15√3 m',
          optC: '60 m',
          optD: '30√3 m',
          ans: 'D',
          exp: 'tan 30° = 30/x => 1/√3 = 30/x => x = 30√3 m.'
        },
        {
          text: 'A kite string 100 m long makes an angle of 60° with the horizontal. Find the kite\'s height above the hand.',
          optA: '50√3 m',
          optB: '50 m',
          optC: '100√3 m',
          optD: '75 m',
          ans: 'A',
          exp: 'Height = 100 sin 60° = 100 × (√3/2) = 50√3 m.'
        },
        {
          text: 'The angle of elevation of a tree\'s top is 30°. After walking 20 m towards it, the angle becomes 60°. Find the tree\'s height.',
          optA: '20 m',
          optB: '10√3 m',
          optC: '15√3 m',
          optD: '10 m',
          ans: 'B',
          exp: 'h = x√3 and h = (x + 20)/√3 => 3x = x + 20 => x = 10 m, h = 10√3 m.'
        },
        {
          text: 'A tower is 30 m from an observation point. The angle of elevation of its top is 60°. Find its height.',
          optA: '15√3 m',
          optB: '30 m',
          optC: '30√3 m',
          optD: '60 m',
          ans: 'C',
          exp: 'tan 60° = h/30 => √3 = h/30 => h = 30√3 m.'
        },
        {
          text: 'A person 1.5 m tall stands 10 m from a building. The angle of elevation from eye level to top is 45°. Find the building\'s height.',
          optA: '10 m',
          optB: '12.5 m',
          optC: '13 m',
          optD: '11.5 m',
          ans: 'D',
          exp: 'Height above eye level = 10 tan 45° = 10 m. Total height = 10 + 1.5 = 11.5 m.'
        },
        {
          text: 'A lighthouse is 40 m high. The angle of depression of a boat is 45°. Find the boat\'s horizontal distance from the lighthouse foot.',
          optA: '40 m',
          optB: '40√3 m',
          optC: '20√2 m',
          optD: '20 m',
          ans: 'A',
          exp: 'Angle of elevation from boat = 45°. tan 45° = 40/x = 1 => x = 40 m.'
        },
        {
          text: 'A balloon is vertically above a road. From 60 m away, its angle of elevation is 30°. Find its height.',
          optA: '30 m',
          optB: '20√3 m',
          optC: '30√3 m',
          optD: '40 m',
          ans: 'B',
          exp: 'tan 30° = h/60 => 1/√3 = h/60 => h = 60/√3 = 20√3 m.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'A tower is 50 m high. Find the angle of elevation of its top from a point 50 m from its foot.',
          optA: '30°',
          optB: '60°',
          optC: '45°',
          optD: '75°',
          ans: 'C',
          exp: 'tan θ = 50/50 = 1 => θ = 45°.'
        },
        {
          text: 'A flagstaff stands on a 20 m building. Angles of elevation to building top and flagstaff top are 45° and 60°. Find flagstaff height.',
          optA: '20(√3 − 1) m',
          optB: '20√3 m',
          optC: '10(√3 − 1) m',
          optD: '20(√3 + 1) m',
          ans: 'A',
          exp: 'Horizontal distance = 20/tan 45° = 20 m. Total height = 20 tan 60° = 20√3 m. Flagstaff = 20√3 − 20 = 20(√3 − 1) m.'
        },
        {
          text: 'From a point, the angle of elevation of a tower is 30°. After moving 30 m towards it, the angle is 60°. Find the tower\'s height.',
          optA: '10√3 m',
          optB: '15√3 m',
          optC: '20√3 m',
          optD: '30 m',
          ans: 'B',
          exp: 'h = x√3 = (x + 30)/√3 => 3x = x + 30 => x = 15 m. h = 15√3 m.'
        },
        {
          text: 'From the top of a 60 m cliff, the angle of depression of a boat is 30°. Find its horizontal distance from the cliff\'s foot.',
          optA: '60√3 m',
          optB: '30√3 m',
          optC: '60 m',
          optD: '120 m',
          ans: 'A',
          exp: 'tan 30° = 60/x => 1/√3 = 60/x => x = 60√3 m.'
        },
        {
          text: 'A 12 m ladder reaches a window 6√3 m above the ground. Find the angle the ladder makes with the ground.',
          optA: '45°',
          optB: '30°',
          optC: '75°',
          optD: '60°',
          ans: 'D',
          exp: 'sin θ = 6√3/12 = √3/2 => θ = 60°.'
        },
        {
          text: 'A pole casts a shadow 2√3 m long when the sun\'s angle of elevation is 60°. Find the pole\'s height.',
          optA: '4 m',
          optB: '6 m',
          optC: '6√3 m',
          optD: '8 m',
          ans: 'B',
          exp: 'tan 60° = h/(2√3) => √3 = h/(2√3) => h = 2√3 × √3 = 6 m.'
        },
        {
          text: 'A person stands 15 m from a building, eye level 1.5 m. Elevation to top is 60°. Find total building height.',
          optA: '15 m',
          optB: '15√3 m',
          optC: '15√3 + 1.5 m',
          optD: '16.5 m',
          ans: 'C',
          exp: 'Height above eye level = 15 tan 60° = 15√3 m. Total height = 15√3 + 1.5 m.'
        },
        {
          text: 'From the top of a 24 m building, the angle of depression of a ground point is 60°. Find horizontal distance.',
          optA: '8√3 m',
          optB: '12√3 m',
          optC: '8 m',
          optD: '12 m',
          ans: 'A',
          exp: 'tan 60° = 24/x => √3 = 24/x => x = 24/√3 = 8√3 m.'
        },
        {
          text: 'Two points on the same line with a tower foot are 20 m apart. Elevations from nearer and farther are 60° and 30°. Find tower height.',
          optA: '15√3 m',
          optB: '10√3 m',
          optC: '20√3 m',
          optD: '10 m',
          ans: 'B',
          exp: 'h = x√3 = (x + 20)/√3 => 3x = x + 20 => x = 10 m. h = 10√3 m.'
        },
        {
          text: 'A tree is observed at an angle of elevation of 45° from a point 18 m away. Find the line-of-sight distance to the top.',
          optA: '18 m',
          optB: '36 m',
          optC: '18√2 m',
          optD: '18√3 m',
          ans: 'C',
          exp: 'Height = 18 tan 45° = 18 m. Line of sight (hypotenuse) = √(18² + 18²) = 18√2 m.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'A tower is observed at an angle of elevation of 30° from a point 40 m away. Find its height.',
          optA: '40√3/3 m',
          optB: '20√3 m',
          optC: '40 m',
          optD: '20 m',
          ans: 'A',
          exp: 'tan 30° = h/40 => h = 40/√3 = 40√3/3 m.'
        },
        {
          text: 'A person stands 30 m from a building and sees its top at an elevation of 45°. Find the line-of-sight distance.',
          optA: '30 m',
          optB: '30√2 m',
          optC: '30√3 m',
          optD: '60 m',
          ans: 'B',
          exp: 'Height = 30 tan 45° = 30 m. Line of sight = √(30² + 30²) = 30√2 m.'
        },
        {
          text: 'A tree breaks in a storm and its top touches the ground 8 m away at 30°. Find its original height.',
          optA: '8√3/3 m',
          optB: '16√3/3 m',
          optC: '8√3 m',
          optD: '12√3 m',
          ans: 'C',
          exp: 'Stump h = 8 tan 30° = 8/√3 m. Broken length L = 8/cos 30° = 16/√3 m. Original height = h + L = 24/√3 = 8√3 m.'
        },
        {
          text: 'From 15 m from a tower, elevation is 60°. From another point 15 m farther away (30 m total), find the new elevation angle.',
          optA: '30°',
          optB: '45°',
          optC: '50°',
          optD: 'tan⁻¹(√3/2) ≈ 40.9°',
          ans: 'D',
          exp: 'Tower height = 15 tan 60° = 15√3 m. At 30 m: tan θ = 15√3/30 = √3/2 => θ = tan⁻¹(√3/2) ≈ 40.9°.'
        },
        {
          text: 'From the top of a 45 m building, the angle of depression of a car is 45°. Find the car\'s distance from the building\'s foot.',
          optA: '45 m',
          optB: '45√3 m',
          optC: '30 m',
          optD: '22.5 m',
          ans: 'A',
          exp: 'tan 45° = 45/x = 1 => x = 45 m.'
        },
        {
          text: 'A 12 m pole is viewed from a ground point at an angle of elevation of 30°. Find the point\'s distance from the pole.',
          optA: '6√3 m',
          optB: '12√3 m',
          optC: '24 m',
          optD: '12 m',
          ans: 'B',
          exp: 'tan 30° = 12/x => 1/√3 = 12/x => x = 12√3 m.'
        },
        {
          text: 'A balloon is observed from two points 40 m apart on the same side at 60° and 30°. Find the balloon\'s height.',
          optA: '20 m',
          optB: '30√3 m',
          optC: '20√3 m',
          optD: '40√3 m',
          ans: 'C',
          exp: 'h = x√3 = (x + 40)/√3 => 3x = x + 40 => x = 20 m. h = 20√3 m.'
        },
        {
          text: 'A ladder rests against a wall. Its foot is 4 m from the wall and it makes an angle of 60° with the ground. Find the height reached.',
          optA: '4 m',
          optB: '8 m',
          optC: '2√3 m',
          optD: '4√3 m',
          ans: 'D',
          exp: 'tan 60° = h/4 => √3 = h/4 => h = 4√3 m.'
        },
        {
          text: 'From a platform 20 m above ground, the angle of depression of a boat is 30°. Find the horizontal distance of the boat.',
          optA: '20√3 m',
          optB: '10√3 m',
          optC: '20 m',
          optD: '40 m',
          ans: 'A',
          exp: 'tan 30° = 20/x => 1/√3 = 20/x => x = 20√3 m.'
        },
        {
          text: 'Angle of elevation of a tower from point A is 30°. From B, 20 m closer, the angle is 45°. Find the tower height.',
          optA: '10(√3 − 1) m',
          optB: '10(√3 + 1) m',
          optC: '20(√3 + 1) m',
          optD: '10√3 m',
          ans: 'B',
          exp: 'From B: h = x. From A: h = (x + 20)/√3 => √3x = x + 20 => x(√3 − 1) = 20 => x = 20/(√3 − 1) = 10(√3 + 1) m.'
        }
      ]
    }
  ];

  const tx = db.transaction(() => {
    ch8Tests.forEach(t => {
      const testId = `test-math-ch8-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-trig-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch8', 'Trigonometry', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-trig-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Introduction to Trigonometry Mock Test ${t.slot}`);
    });

    ch9Tests.forEach(t => {
      const testId = `test-math-ch9-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-apptrig-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch9', 'Applications of Trigonometry', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-apptrig-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Some Applications of Trigonometry Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] Chapters 8 and 9 mock tests successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedTrigonometryChapters.ts')) {
  seedTrigonometryChapters();
}
