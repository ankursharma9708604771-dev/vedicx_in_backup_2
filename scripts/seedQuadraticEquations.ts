import Database from 'better-sqlite3';

export function seedQuadraticEquations(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 4: Quadratic Equations (10 Mock Tests, 100 Questions)...');

  // Ensure 10 mock test slots for math-ch4
  const existingTests = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all('math-ch4') as any[];
  const existingSlotMap = new Map(existingTests.map(t => [t.test_number, t.id]));

  for (let slot = 1; slot <= 10; slot++) {
    const testId = existingSlotMap.get(slot) || `test-math-ch4-slot-${slot}`;
    const title = `Quadratic Equations – Mock Test ${slot}`;
    const accessType = slot === 1 ? 'free' : 'premium';

    const testExists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
    if (!testExists) {
      db.prepare(`
        INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
        VALUES (?, ?, 'mathematics', 'math-ch4', ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
      `).run(testId, title, slot, `Class 10 Quadratic Equations Mock Test ${slot}`, accessType);
    } else {
      db.prepare(`
        UPDATE mock_tests
        SET title = ?, test_number = ?, total_questions = 10, duration_minutes = 25, max_marks = 20.0, passing_marks = 8.0, access_type = ?, status = 'published'
        WHERE id = ?
      `).run(title, slot, accessType, testId);
    }

    // Clean old questions linked to this test
    const oldQuestions = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(testId) as any[];
    for (const q of oldQuestions) {
      db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
    }
    db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(testId);
  }

  // 10 Sets with 10 Questions each. Random, balanced options (A, B, C, D) without duplicates.
  const testsData = [
    // Mock Test 1
    {
      slot: 1,
      questions: [
        {
          text: 'Which of the following is a quadratic equation in x?',
          optA: 'x(x + 2) = x² + 3',
          optB: '(x − 1)² = 2x + 3',
          optC: '1/x + x = 2',
          optD: 'x³ − 1 = 0',
          ans: 'B',
          exp: 'Expand each: in B, (x − 1)² = x² − 2x + 1 = 2x + 3 => x² − 4x − 2 = 0, which is of the form ax² + bx + c = 0 with a = 1 ≠ 0. In A, x² cancels out leaving 2x = 3 (linear).'
        },
        {
          text: 'The discriminant of 2x² − 7x + 3 = 0 is:',
          optA: '25',
          optB: '49',
          optC: '1',
          optD: '73',
          ans: 'A',
          exp: 'For ax² + bx + c = 0, D = b² − 4ac. Here a = 2, b = −7, c = 3. D = (−7)² − 4(2)(3) = 49 − 24 = 25.'
        },
        {
          text: 'Find the value of k for which x² − 6x + k = 0 has equal real roots.',
          optA: 'k = 6',
          optB: 'k = −9',
          optC: 'k = 9',
          optD: 'k = 36',
          ans: 'C',
          exp: 'For equal real roots, D = 0. Here b² − 4ac = (−6)² − 4(1)(k) = 36 − 4k = 0 => 4k = 36 => k = 9.'
        },
        {
          text: 'Solve the quadratic equation by factorisation: x² − 7x + 12 = 0.',
          optA: 'x = 2, 6',
          optB: 'x = −3, −4',
          optC: 'x = 1, 12',
          optD: 'x = 3, 4',
          ans: 'D',
          exp: 'Factorise: x² − 7x + 12 = (x − 3)(x − 4) = 0. Setting each factor to zero gives x = 3 or x = 4.'
        },
        {
          text: 'Determine the nature of the roots of 3x² − 2√6x + 2 = 0.',
          optA: 'Real and equal roots',
          optB: 'Real and distinct roots',
          optC: 'No real roots',
          optD: 'Cannot be determined',
          ans: 'A',
          exp: 'D = b² − 4ac = (−2√6)² − 4(3)(2) = 24 − 24 = 0. Since D = 0, the equation has two real and equal roots.'
        },
        {
          text: 'Solve using the quadratic formula: 2x² − 5x − 3 = 0.',
          optA: 'x = 3, 1/2',
          optB: 'x = 3, −1/2',
          optC: 'x = −3, 1/2',
          optD: 'x = 2, −3/2',
          ans: 'B',
          exp: 'a = 2, b = −5, c = −3. D = (−5)² − 4(2)(−3) = 25 + 24 = 49. x = (−b ± √D)/(2a) = (5 ± 7)/4 => x = 12/4 = 3 or x = −2/4 = −1/2.'
        },
        {
          text: 'Find the value(s) of p if 2x² + px + 8 = 0 has equal roots.',
          optA: 'p = 8 only',
          optB: 'p = −8 only',
          optC: 'p = ±8',
          optD: 'p = ±4',
          ans: 'C',
          exp: 'Equal roots require D = 0: p² − 4(2)(8) = 0 => p² − 64 = 0 => p² = 64 => p = ±8.'
        },
        {
          text: 'The product of two consecutive positive integers is 306. Find the integers.',
          optA: '16 and 17',
          optB: '15 and 16',
          optC: '18 and 19',
          optD: '17 and 18',
          ans: 'D',
          exp: 'Let the integers be n and n + 1. n(n + 1) = 306 => n² + n − 306 = 0 => (n + 18)(n − 17) = 0. Since n is positive, n = 17. The integers are 17 and 18.'
        },
        {
          text: 'The area of a rectangular field is 504 m². Its length is 10 m more than its breadth. Find its dimensions.',
          optA: 'Breadth = 18 m, Length = 28 m',
          optB: 'Breadth = 16 m, Length = 26 m',
          optC: 'Breadth = 14 m, Length = 24 m',
          optD: 'Breadth = 20 m, Length = 30 m',
          ans: 'A',
          exp: 'Let breadth = b. Length = b + 10. Area = b(b + 10) = 504 => b² + 10b − 504 = 0 => (b + 28)(b − 18) = 0. Since breadth > 0, b = 18 m and length = 28 m.'
        },
        {
          text: 'A train travels 360 km at a uniform speed. If its speed were 5 km/h more, it would take 1 hour less. Find its original speed.',
          optA: '45 km/h',
          optB: '40 km/h',
          optC: '50 km/h',
          optD: '35 km/h',
          ans: 'B',
          exp: 'Time = distance / speed. 360/v − 360/(v + 5) = 1 => 360(5) = v(v + 5) => v² + 5v − 1800 = 0 => (v + 45)(v − 40) = 0. Since speed is positive, v = 40 km/h.'
        }
      ]
    },

    // Mock Test 2
    {
      slot: 2,
      questions: [
        {
          text: 'The roots of the equation x² − 9 = 0 are:',
          optA: '0, 9',
          optB: '3, −3',
          optC: '9, −9',
          optD: '3, 3',
          ans: 'B',
          exp: 'x² = 9 => x = ±√9 = ±3. Thus the roots are 3 and −3.'
        },
        {
          text: 'If the discriminant of a quadratic equation is negative (D < 0), its roots are:',
          optA: 'Real and equal',
          optB: 'Real and distinct',
          optC: 'Not real',
          optD: 'Rational and equal',
          ans: 'C',
          exp: 'When D < 0, the square root of D is not a real number, meaning the quadratic equation has no real roots.'
        },
        {
          text: 'Find the value of m for which 4x² + 4mx + 9 = 0 has equal roots.',
          optA: 'm = ±3',
          optB: 'm = 3 only',
          optC: 'm = ±6',
          optD: 'm = ±9',
          ans: 'A',
          exp: 'D = (4m)² − 4(4)(9) = 16m² − 144 = 0 => 16m² = 144 => m² = 9 => m = ±3.'
        },
        {
          text: 'Solve: 3x² − 10x + 8 = 0.',
          optA: 'x = 3, 4/3',
          optB: 'x = 2, 3/4',
          optC: 'x = 2, 4/3',
          optD: 'x = −2, −4/3',
          ans: 'C',
          exp: '3x² − 6x − 4x + 8 = 3x(x − 2) − 4(x − 2) = (3x − 4)(x − 2) = 0 => x = 2, 4/3.'
        },
        {
          text: 'Without solving, state the nature of roots of 5x² + 2x + 1 = 0.',
          optA: 'Real and equal',
          optB: 'Real and distinct',
          optC: 'Rational roots',
          optD: 'No real roots',
          ans: 'D',
          exp: 'D = b² − 4ac = 2² − 4(5)(1) = 4 − 20 = −16 < 0. Hence, there are no real roots.'
        },
        {
          text: 'Solve by factorisation: 6x² − x − 2 = 0.',
          optA: 'x = 2/3, −1/2',
          optB: 'x = −2/3, 1/2',
          optC: 'x = 3/2, −1',
          optD: 'x = 2, −1/3',
          ans: 'A',
          exp: '6x² − 4x + 3x − 2 = 2x(3x − 2) + 1(3x − 2) = (2x + 1)(3x − 2) = 0 => x = 2/3, −1/2.'
        },
        {
          text: 'For what value(s) of k does x² + (k − 2)x + 9 = 0 have real and equal roots?',
          optA: 'k = 6 or −6',
          optB: 'k = 8 or −4',
          optC: 'k = 4 or −8',
          optD: 'k = 5 or −3',
          ans: 'B',
          exp: 'D = (k − 2)² − 4(1)(9) = 0 => (k − 2)² = 36 => k − 2 = ±6 => k = 8 or k = −4.'
        },
        {
          text: 'The sum of the squares of two consecutive positive integers is 365. Find the integers.',
          optA: '11, 12',
          optB: '12, 13',
          optC: '13, 14',
          optD: '14, 15',
          ans: 'C',
          exp: 'n² + (n + 1)² = 365 => 2n² + 2n + 1 = 365 => 2n² + 2n − 364 = 0 => n² + n − 182 = 0 => (n + 14)(n − 13) = 0. Positive integer n = 13; integers are 13 and 14.'
        },
        {
          text: 'The product of the ages of two sisters is 320. The elder sister is 4 years older than the younger. Find their ages.',
          optA: '14 and 18 years',
          optB: '12 and 16 years',
          optC: '15 and 19 years',
          optD: '16 and 20 years',
          ans: 'D',
          exp: 'Let younger sister = x years. Elder = x + 4. x(x + 4) = 320 => x² + 4x − 320 = 0 => (x + 20)(x − 16) = 0. x = 16, so ages are 16 and 20 years.'
        },
        {
          text: 'A boat travels 24 km downstream and 18 km upstream in 5 hours. Its speed in still water is 9 km/h. Find the speed of the current.',
          optA: '3 km/h',
          optB: '2 km/h',
          optC: '4 km/h',
          optD: '1.5 km/h',
          ans: 'A',
          exp: 'Downstream speed = 9 + v, Upstream speed = 9 − v. 24/(9 + v) + 18/(9 − v) = 5. Substituting v = 3: 24/12 + 18/6 = 2 + 3 = 5 hours. Speed of current = 3 km/h.'
        }
      ]
    },

    // Mock Test 3
    {
      slot: 3,
      questions: [
        {
          text: 'Which of the following equations has equal real roots?',
          optA: 'x² − 4x + 4 = 0',
          optB: 'x² + 1 = 0',
          optC: 'x² − 5x + 6 = 0',
          optD: '2x² + x + 1 = 0',
          ans: 'A',
          exp: 'For x² − 4x + 4 = 0, D = (−4)² − 4(1)(4) = 16 − 16 = 0. Hence it has equal real roots (x = 2).'
        },
        {
          text: 'The standard form of a quadratic equation in variable x is:',
          optA: 'ax + b = 0',
          optB: 'ax² + bx + c = 0, where a ≠ 0',
          optC: 'ax³ + bx + c = 0',
          optD: 'ax² + c = 0 only',
          ans: 'B',
          exp: 'A quadratic equation is of degree 2: ax² + bx + c = 0, where a, b, c are real numbers and the leading coefficient a ≠ 0.'
        },
        {
          text: 'Find the condition on k such that x² − 4x + k = 0 has two distinct real roots.',
          optA: 'k > 4',
          optB: 'k = 4',
          optC: 'k < 4',
          optD: 'k ≤ 4',
          ans: 'C',
          exp: 'For two distinct real roots, D > 0 => (−4)² − 4(1)(k) > 0 => 16 − 4k > 0 => 4k < 16 => k < 4.'
        },
        {
          text: 'Solve: 2x² + x − 6 = 0.',
          optA: 'x = 3/2, 2',
          optB: 'x = −3/2, 2',
          optC: 'x = 1, −3',
          optD: 'x = 3/2, −2',
          ans: 'D',
          exp: '2x² + 4x − 3x − 6 = 2x(x + 2) − 3(x + 2) = (2x − 3)(x + 2) = 0 => x = 3/2, −2.'
        },
        {
          text: 'Find the discriminant of 7x² − 6x + 2 = 0 and state the nature of roots.',
          optA: 'D = −20; no real roots',
          optB: 'D = 20; two distinct real roots',
          optC: 'D = 0; two equal real roots',
          optD: 'D = −16; no real roots',
          ans: 'A',
          exp: 'D = b² − 4ac = (−6)² − 4(7)(2) = 36 − 56 = −20 < 0. Therefore, the equation has no real roots.'
        },
        {
          text: 'Solve using the quadratic formula: 3x² − 2x − 1 = 0.',
          optA: 'x = 1, 1/3',
          optB: 'x = 1, −1/3',
          optC: 'x = −1, 1/3',
          optD: 'x = 2, −1/2',
          ans: 'B',
          exp: 'a = 3, b = −2, c = −1. D = 4 − 4(3)(−1) = 16. x = (2 ± 4)/6 => x = 6/6 = 1 or x = −2/6 = −1/3.'
        },
        {
          text: 'Find the value of a for which ax² − 6x + 3 = 0 has equal roots.',
          optA: 'a = 1',
          optB: 'a = 2',
          optC: 'a = 3',
          optD: 'a = 4',
          ans: 'C',
          exp: 'For equal roots, D = 0 => (−6)² − 4(a)(3) = 0 => 36 − 12a = 0 => 12a = 36 => a = 3.'
        },
        {
          text: 'The sum of two positive integers is 25 and their product is 144. Find the integers.',
          optA: '8 and 18',
          optB: '10 and 15',
          optC: '12 and 12',
          optD: '9 and 16',
          ans: 'D',
          exp: 'Let integers be x and 25 − x. x(25 − x) = 144 => x² − 25x + 144 = 0 => (x − 9)(x − 16) = 0. The numbers are 9 and 16.'
        },
        {
          text: 'A rectangular garden has area 300 m². Its length is 5 m more than its breadth. Find its dimensions.',
          optA: 'Length = 20 m, Breadth = 15 m',
          optB: 'Length = 25 m, Breadth = 12 m',
          optC: 'Length = 30 m, Breadth = 10 m',
          optD: 'Length = 22 m, Breadth = 17 m',
          ans: 'A',
          exp: 'b(b + 5) = 300 => b² + 5b − 300 = 0 => (b + 20)(b − 15) = 0. Since b > 0, breadth = 15 m and length = 20 m.'
        },
        {
          text: 'A car covers 210 km at a constant speed. If its speed is increased by 5 km/h, the journey takes 1 hour less. Find its original speed.',
          optA: '35 km/h',
          optB: '30 km/h',
          optC: '25 km/h',
          optD: '40 km/h',
          ans: 'B',
          exp: '210/v − 210/(v + 5) = 1 => 210(5) = v(v + 5) => v² + 5v − 1050 = 0 => (v + 35)(v − 30) = 0 => v = 30 km/h.'
        }
      ]
    },

    // Mock Test 4
    {
      slot: 4,
      questions: [
        {
          text: 'If x = 2 is a root of x² − 5x + k = 0, then the value of k is:',
          optA: '4',
          optB: '6',
          optC: '8',
          optD: '10',
          ans: 'B',
          exp: 'Substitute x = 2: 2² − 5(2) + k = 0 => 4 − 10 + k = 0 => −6 + k = 0 => k = 6.'
        },
        {
          text: 'The discriminant formula for ax² + bx + c = 0 is:',
          optA: 'b² − 4ac',
          optB: 'b² + 4ac',
          optC: '4ac − b²',
          optD: 'a² − 4bc',
          ans: 'A',
          exp: 'The discriminant of ax² + bx + c = 0 is defined as D = b² − 4ac.'
        },
        {
          text: 'Find k if 2x² + 5x + k = 0 has equal roots.',
          optA: 'k = 25/4',
          optB: 'k = 5/2',
          optC: 'k = 25/8',
          optD: 'k = 8/25',
          ans: 'C',
          exp: 'Equal roots require D = 0 => 5² − 4(2)(k) = 0 => 25 − 8k = 0 => 8k = 25 => k = 25/8.'
        },
        {
          text: 'Solve by factorisation: x² + x − 20 = 0.',
          optA: 'x = 4, 5',
          optB: 'x = −4, 5',
          optC: 'x = 2, −10',
          optD: 'x = 4, −5',
          ans: 'D',
          exp: 'x² + x − 20 = (x + 5)(x − 4) = 0 => x = 4 or x = −5.'
        },
        {
          text: 'Check whether 2x² − 4x + 5 = 0 has real roots.',
          optA: 'No real roots (D = −24)',
          optB: 'Two real and equal roots',
          optC: 'Two real and distinct roots',
          optD: 'Infinitely many roots',
          ans: 'A',
          exp: 'D = (−4)² − 4(2)(5) = 16 − 40 = −24 < 0. Hence the equation has no real roots.'
        },
        {
          text: 'Solve: 5x² − 13x + 6 = 0.',
          optA: 'x = 3, 2/5',
          optB: 'x = 2, 3/5',
          optC: 'x = −2, −3/5',
          optD: 'x = 1, 6/5',
          ans: 'B',
          exp: '5x² − 10x − 3x + 6 = 5x(x − 2) − 3(x − 2) = (5x − 3)(x − 2) = 0 => x = 2, 3/5.'
        },
        {
          text: 'Find the values of k for which x² + 2(k + 1)x + 9 = 0 has equal roots.',
          optA: 'k = 3 or −3',
          optB: 'k = 4 or −2',
          optC: 'k = 2 or −4',
          optD: 'k = 1 or −5',
          ans: 'C',
          exp: 'D = [2(k + 1)]² − 4(1)(9) = 0 => 4(k + 1)² = 36 => (k + 1)² = 9 => k + 1 = ±3 => k = 2 or k = −4.'
        },
        {
          text: 'The product of two consecutive positive odd integers is 195. Find them.',
          optA: '11, 13',
          optB: '15, 17',
          optC: '17, 19',
          optD: '13, 15',
          ans: 'D',
          exp: 'Let odd integers be n and n + 2. n(n + 2) = 195 => n² + 2n − 195 = 0 => (n + 15)(n − 13) = 0. Positive integer n = 13. The integers are 13 and 15.'
        },
        {
          text: 'The area of a right-angled triangular plot is 150 m². The perpendicular sides differ by 5 m. Find the sides.',
          optA: 'Sides are 15 m and 20 m',
          optB: 'Sides are 10 m and 30 m',
          optC: 'Sides are 12 m and 25 m',
          optD: 'Sides are 18 m and 23 m',
          ans: 'A',
          exp: '1/2 × x × (x + 5) = 150 => x² + 5x = 300 => x² + 5x − 300 = 0 => (x + 20)(x − 15) = 0. x = 15 m, so perpendicular sides are 15 m and 20 m.'
        },
        {
          text: 'A person covers 48 km partly on foot at 4 km/h and partly by bicycle at 12 km/h. Total time is 5 hours. Find the distance covered on foot and bicycle.',
          optA: '8 km on foot, 40 km on bicycle',
          optB: '6 km on foot, 42 km on bicycle',
          optC: '10 km on foot, 38 km on bicycle',
          optD: '12 km on foot, 36 km on bicycle',
          ans: 'B',
          exp: 'x/4 + (48 − x)/12 = 5 => 3x + 48 − x = 60 => 2x = 12 => x = 6 km on foot, and 48 − 6 = 42 km on bicycle.'
        }
      ]
    },

    // Mock Test 5
    {
      slot: 5,
      questions: [
        {
          text: 'The equation 4x² − 12x + 9 = 0 has:',
          optA: 'Two distinct real roots',
          optB: 'Equal real roots',
          optC: 'No real roots',
          optD: 'One zero root',
          ans: 'B',
          exp: 'D = (−12)² − 4(4)(9) = 144 − 144 = 0. Thus the equation has two equal real roots.'
        },
        {
          text: 'Which is a correct factorised form of x² − x − 12 = 0?',
          optA: '(x − 4)(x + 3) = 0',
          optB: '(x + 4)(x − 3) = 0',
          optC: '(x − 6)(x + 2) = 0',
          optD: '(x − 4)(x − 3) = 0',
          ans: 'A',
          exp: 'Product is −12 and sum is −1. The numbers are −4 and 3, so (x − 4)(x + 3) = 0.'
        },
        {
          text: 'Find the value(s) of p for which x² + px + 16 = 0 has equal roots.',
          optA: 'p = 8 only',
          optB: 'p = −8 only',
          optC: 'p = ±8',
          optD: 'p = ±4',
          ans: 'C',
          exp: 'D = p² − 4(1)(16) = p² − 64 = 0 => p² = 64 => p = ±8.'
        },
        {
          text: 'Solve: 4x² − 4x − 3 = 0.',
          optA: 'x = 3, −1/4',
          optB: 'x = 1/2, −3/2',
          optC: 'x = 2, −3/4',
          optD: 'x = 3/2, −1/2',
          ans: 'D',
          exp: '4x² − 6x + 2x − 3 = 2x(2x − 3) + 1(2x − 3) = (2x + 1)(2x − 3) = 0 => x = 3/2, −1/2.'
        },
        {
          text: 'Determine the nature of roots of 9x² + 6x + 1 = 0.',
          optA: 'Real and equal roots',
          optB: 'Real and distinct roots',
          optC: 'No real roots',
          optD: 'Cannot be determined',
          ans: 'A',
          exp: 'D = 6² − 4(9)(1) = 36 − 36 = 0. Real and equal roots.'
        },
        {
          text: 'Solve using the quadratic formula: 2x² + 3x − 7 = 0.',
          optA: 'x = (−3 ± √61)/4',
          optB: 'x = (−3 ± √65)/4',
          optC: 'x = (3 ± √65)/4',
          optD: 'x = (−3 ± √65)/2',
          ans: 'B',
          exp: 'D = 3² − 4(2)(−7) = 9 + 56 = 65. x = (−3 ± √65)/(2 × 2) = (−3 ± √65)/4.'
        },
        {
          text: 'For what values of k does 3x² − 2x + k = 0 have no real roots?',
          optA: 'k < 1/3',
          optB: 'k = 1/3',
          optC: 'k > 1/3',
          optD: 'k ≥ 1/3',
          ans: 'C',
          exp: 'No real roots requires D < 0 => (−2)² − 4(3)(k) < 0 => 4 − 12k < 0 => 12k > 4 => k > 1/3.'
        },
        {
          text: 'Two positive numbers differ by 3 and their product is 180. Find the numbers.',
          optA: '10 and 18',
          optB: '9 and 20',
          optC: '15 and 18',
          optD: '12 and 15',
          ans: 'D',
          exp: 'x(x + 3) = 180 => x² + 3x − 180 = 0 => (x + 15)(x − 12) = 0. Positive number x = 12; numbers are 12 and 15.'
        },
        {
          text: 'A rectangular park has perimeter 74 m and area 330 m². Find its length and breadth.',
          optA: 'Length = 22 m, Breadth = 15 m',
          optB: 'Length = 25 m, Breadth = 12 m',
          optC: 'Length = 30 m, Breadth = 11 m',
          optD: 'Length = 24 m, Breadth = 13 m',
          ans: 'A',
          exp: '2(l + b) = 74 => l + b = 37. lb = 330. Equation: t² − 37t + 330 = 0 => (t − 22)(t − 15) = 0. Dimensions are 22 m and 15 m.'
        },
        {
          text: 'A bus covers 300 km at a uniform speed. If it had travelled 5 km/h faster, it would have taken 2 hours less. Find its original speed.',
          optA: '30 km/h',
          optB: '25 km/h',
          optC: '20 km/h',
          optD: '35 km/h',
          ans: 'B',
          exp: '300/v − 300/(v + 5) = 2 => 150(5) = v(v + 5) => v² + 5v − 750 = 0 => (v + 30)(v − 25) = 0 => v = 25 km/h.'
        }
      ]
    },

    // Mock Test 6
    {
      slot: 6,
      questions: [
        {
          text: 'The roots of x² − 6x + 9 = 0 are:',
          optA: '3, 3',
          optB: '−3, −3',
          optC: '3, −3',
          optD: '6, 9',
          ans: 'A',
          exp: '(x − 3)² = 0 => x = 3, 3 (equal real roots).'
        },
        {
          text: 'A quadratic equation has real and distinct roots when:',
          optA: 'D = 0',
          optB: 'D < 0',
          optC: 'D > 0',
          optD: 'a = 0',
          ans: 'C',
          exp: 'A quadratic equation ax² + bx + c = 0 has two distinct real roots if and only if its discriminant D > 0.'
        },
        {
          text: 'Find k if 3x² − 12x + k = 0 has equal roots.',
          optA: 'k = 4',
          optB: 'k = 6',
          optC: 'k = 16',
          optD: 'k = 12',
          ans: 'D',
          exp: 'D = (−12)² − 4(3)(k) = 144 − 12k = 0 => 12k = 144 => k = 12.'
        },
        {
          text: 'Solve: 2x² − 9x + 10 = 0.',
          optA: 'x = 2, 5/2',
          optB: 'x = −2, −5/2',
          optC: 'x = 1, 5',
          optD: 'x = 3, 4/3',
          ans: 'A',
          exp: '2x² − 4x − 5x + 10 = 2x(x − 2) − 5(x − 2) = (2x − 5)(x − 2) = 0 => x = 2, 5/2.'
        },
        {
          text: 'Find the discriminant of 4x² + 4x + 5 = 0 and state the nature of roots.',
          optA: 'D = 64; real distinct',
          optB: 'D = −64; no real roots',
          optC: 'D = 0; real equal',
          optD: 'D = −16; no real roots',
          ans: 'B',
          exp: 'D = 4² − 4(4)(5) = 16 − 80 = −64 < 0. No real roots.'
        },
        {
          text: 'Solve by factorisation: 3x² + 2x − 8 = 0.',
          optA: 'x = −4/3, 2',
          optB: 'x = 1, −8/3',
          optC: 'x = 4/3, −2',
          optD: 'x = 2/3, −4',
          ans: 'C',
          exp: '3x² + 6x − 4x − 8 = 3x(x + 2) − 4(x + 2) = (3x − 4)(x + 2) = 0 => x = 4/3, −2.'
        },
        {
          text: 'Determine the values of m for which 2x² + mx + 8 = 0 has real roots.',
          optA: 'm = ±8 only',
          optB: '−8 < m < 8',
          optC: 'm ≥ 8 only',
          optD: 'm ≤ −8 or m ≥ 8',
          ans: 'D',
          exp: 'Real roots require D ≥ 0 => m² − 4(2)(8) ≥ 0 => m² − 64 ≥ 0 => m² ≥ 64 => m ≤ −8 or m ≥ 8.'
        },
        {
          text: 'The sum of the squares of two consecutive positive integers is 421. Find them.',
          optA: '14, 15',
          optB: '13, 14',
          optC: '15, 16',
          optD: '12, 13',
          ans: 'A',
          exp: 'n² + (n + 1)² = 421 => 2n² + 2n − 420 = 0 => n² + n − 210 = 0 => (n + 15)(n − 14) = 0. Positive integer n = 14; integers are 14 and 15.'
        },
        {
          text: 'A two-digit number is 4 times the sum of its digits. The number formed by reversing the digits is 27 more than the original. Find the number.',
          optA: '24',
          optB: '36',
          optC: '48',
          optD: '18',
          ans: 'B',
          exp: 'Let number = 10a + b. 10a + b = 4(a + b) => 6a = 3b => b = 2a. Reversing gives 10b + a = (10a + b) + 27 => 9(b − a) = 27 => b − a = 3. 2a − a = 3 => a = 3, b = 6. Number = 36.'
        },
        {
          text: 'A boat travels 30 km downstream and 18 km upstream in 4 hours. Its speed in still water is 12 km/h. Find the speed of the current.',
          optA: '2 km/h',
          optB: '4 km/h',
          optC: '3 km/h',
          optD: '2.5 km/h',
          ans: 'C',
          exp: '30/(12 + v) + 18/(12 − v) = 4. For v = 3: 30/15 + 18/9 = 2 + 2 = 4 hours. The current speed is 3 km/h.'
        }
      ]
    },

    // Mock Test 7
    {
      slot: 7,
      questions: [
        {
          text: 'Which of the following is not a quadratic equation?',
          optA: 'x² − 4 = 0',
          optB: '(x + 1)(x − 2) = 0',
          optC: 'x² + x = x² + 3',
          optD: '2x² − x + 1 = 0',
          ans: 'C',
          exp: 'In x² + x = x² + 3, x² cancels on both sides leaving x = 3, which is a linear equation (degree 1), not quadratic.'
        },
        {
          text: 'If D = 0 for a quadratic equation, its roots are:',
          optA: 'Real and equal',
          optB: 'Real and distinct',
          optC: 'Non-real',
          optD: 'Irrational only',
          ans: 'A',
          exp: 'When discriminant D = 0, x = (−b ± 0)/(2a) = −b/(2a), meaning there are two real and equal roots.'
        },
        {
          text: 'Find the value of c for which x² + 10x + c = 0 has equal roots.',
          optA: 'c = 10',
          optB: 'c = 25',
          optC: 'c = 50',
          optD: 'c = 100',
          ans: 'B',
          exp: 'Equal roots require D = 0 => 10² − 4(1)(c) = 0 => 100 − 4c = 0 => 4c = 100 => c = 25.'
        },
        {
          text: 'Solve: 5x² − 11x + 2 = 0.',
          optA: 'x = 1, 2/5',
          optB: 'x = −2, −1/5',
          optC: 'x = 3, 1/5',
          optD: 'x = 2, 1/5',
          ans: 'D',
          exp: '5x² − 10x − x + 2 = 5x(x − 2) − 1(x − 2) = (5x − 1)(x − 2) = 0 => x = 2, 1/5.'
        },
        {
          text: 'Determine whether x² − 2√2x + 3 = 0 has real roots.',
          optA: 'No real roots (D = −4)',
          optB: 'Two equal real roots (D = 0)',
          optC: 'Two distinct real roots (D = 4)',
          optD: 'Infinitely many roots',
          ans: 'A',
          exp: 'D = (−2√2)² − 4(1)(3) = 8 − 12 = −4 < 0. Since D < 0, it has no real roots.'
        },
        {
          text: 'Solve: 3x² − 7x + 2 = 0.',
          optA: 'x = 1, 2/3',
          optB: 'x = 2, 1/3',
          optC: 'x = −2, −1/3',
          optD: 'x = 3, 1/2',
          ans: 'B',
          exp: '3x² − 6x − x + 2 = 3x(x − 2) − 1(x − 2) = (3x − 1)(x − 2) = 0 => x = 2, 1/3.'
        },
        {
          text: 'Find k if (k + 1)x² − 6x + 2 = 0 has equal roots.',
          optA: 'k = 5/2',
          optB: 'k = 3',
          optC: 'k = 7/2',
          optD: 'k = 4',
          ans: 'C',
          exp: 'D = (−6)² − 4(k + 1)(2) = 36 − 8(k + 1) = 0 => 8(k + 1) = 36 => k + 1 = 9/2 => k = 7/2.'
        },
        {
          text: 'The product of two consecutive even positive integers is 224. Find them.',
          optA: '12 and 14',
          optB: '16 and 18',
          optC: '10 and 12',
          optD: '14 and 16',
          ans: 'D',
          exp: 'Let integers be 2n and 2n + 2. n(n + 1) = 56 => n² + n − 56 = 0 => (n + 8)(n − 7) = 0 => n = 7. The integers are 14 and 16.'
        },
        {
          text: 'The length of a rectangle is 7 m more than its breadth. Its area is 330 m². Find its dimensions.',
          optA: 'Length = 22 m, Breadth = 15 m',
          optB: 'Length = 20 m, Breadth = 13 m',
          optC: 'Length = 25 m, Breadth = 18 m',
          optD: 'Length = 24 m, Breadth = 17 m',
          ans: 'A',
          exp: 'b(b + 7) = 330 => b² + 7b − 330 = 0 => (b + 22)(b − 15) = 0 => b = 15 m, length = 22 m.'
        },
        {
          text: 'A cyclist covers 60 km at a certain speed. If the speed were 3 km/h more, the journey would take 1 hour less. Find the original speed.',
          optA: '15 km/h',
          optB: '12 km/h',
          optC: '10 km/h',
          optD: '9 km/h',
          ans: 'B',
          exp: '60/v − 60/(v + 3) = 1 => 60(3) = v(v + 3) => v² + 3v − 180 = 0 => (v + 15)(v − 12) = 0 => v = 12 km/h.'
        }
      ]
    },

    // Mock Test 8
    {
      slot: 8,
      questions: [
        {
          text: 'The roots of x² + 5x + 6 = 0 are:',
          optA: '2, 3',
          optB: '−2, −3',
          optC: '2, −3',
          optD: '−2, 3',
          ans: 'B',
          exp: '(x + 2)(x + 3) = 0 => x = −2, −3.'
        },
        {
          text: 'For ax² + bx + c = 0, if c = 0, one root is always:',
          optA: '1',
          optB: '−1',
          optC: '0',
          optD: 'a',
          ans: 'C',
          exp: 'When c = 0, ax² + bx = 0 => x(ax + b) = 0 => x = 0 is always a root.'
        },
        {
          text: 'Find k so that 2x² − 4x + k = 0 has no real roots.',
          optA: 'k < 2',
          optB: 'k = 2',
          optC: 'k ≤ 2',
          optD: 'k > 2',
          ans: 'D',
          exp: 'D = (−4)² − 4(2)(k) < 0 => 16 − 8k < 0 => 8k > 16 => k > 2.'
        },
        {
          text: 'Solve: 3x² + 5x − 2 = 0.',
          optA: 'x = 1/3, −2',
          optB: 'x = −1/3, 2',
          optC: 'x = 1/2, −3',
          optD: 'x = 2/3, −1',
          ans: 'A',
          exp: '3x² + 6x − x − 2 = 3x(x + 2) − 1(x + 2) = (3x − 1)(x + 2) = 0 => x = 1/3, −2.'
        },
        {
          text: 'Find the discriminant and nature of roots of 2x² − 4√2x + 4 = 0.',
          optA: 'D = 32; distinct real roots',
          optB: 'D = 0; real and equal roots',
          optC: 'D = −32; no real roots',
          optD: 'D = 16; distinct rational roots',
          ans: 'B',
          exp: 'D = (−4√2)² − 4(2)(4) = 32 − 32 = 0. Real and equal roots.'
        },
        {
          text: 'Solve using quadratic formula: 5x² + 6x − 2 = 0.',
          optA: 'x = (−3 ± √19)/10',
          optB: 'x = (3 ± √19)/5',
          optC: 'x = (−3 ± √19)/5',
          optD: 'x = (−6 ± √19)/5',
          ans: 'C',
          exp: 'D = 6² − 4(5)(−2) = 36 + 40 = 76 = 4 × 19. x = (−6 ± 2√19)/10 = (−3 ± √19)/5.'
        },
        {
          text: 'Find the value(s) of p for which x² − 2px + 25 = 0 has real roots.',
          optA: '−5 ≤ p ≤ 5',
          optB: 'p = ±5 only',
          optC: 'p ≥ 5 only',
          optD: 'p ≤ −5 or p ≥ 5',
          ans: 'D',
          exp: 'Real roots require D ≥ 0 => (−2p)² − 4(1)(25) ≥ 0 => 4p² − 100 ≥ 0 => p² ≥ 25 => p ≤ −5 or p ≥ 5.'
        },
        {
          text: 'The square of a positive integer is 56 more than 5 times the integer. Find the integer.',
          optA: '8',
          optB: '7',
          optC: '9',
          optD: '6',
          ans: 'A',
          exp: 'n² = 5n + 56 => n² − 5n − 56 = 0 => (n − 8)(n + 7) = 0. Positive integer n = 8.'
        },
        {
          text: 'A rectangular floor has area 384 m². Its length is 8 m more than its breadth. Find its dimensions.',
          optA: 'Length = 20 m, Breadth = 12 m',
          optB: 'Length = 24 m, Breadth = 16 m',
          optC: 'Length = 26 m, Breadth = 18 m',
          optD: 'Length = 32 m, Breadth = 12 m',
          ans: 'B',
          exp: 'b(b + 8) = 384 => b² + 8b − 384 = 0 => (b + 24)(b − 16) = 0 => b = 16 m, length = 24 m.'
        },
        {
          text: 'A car travels 150 km at a uniform speed. If its speed were 5 km/h less, it would take 1 hour more. Find its original speed.',
          optA: '25 km/h',
          optB: '35 km/h',
          optC: '30 km/h',
          optD: '40 km/h',
          ans: 'C',
          exp: '150/(v − 5) − 150/v = 1 => 150(5) = v(v − 5) => v² − 5v − 750 = 0 => (v − 30)(v + 25) = 0 => v = 30 km/h.'
        }
      ]
    },

    // Mock Test 9
    {
      slot: 9,
      questions: [
        {
          text: 'The roots of x² − 2x + 5 = 0 are:',
          optA: 'Real and equal',
          optB: 'Real and distinct',
          optC: 'No real roots',
          optD: 'One zero root',
          ans: 'C',
          exp: 'D = (−2)² − 4(1)(5) = 4 − 20 = −16 < 0. Hence there are no real roots.'
        },
        {
          text: 'Which value of k makes x² + 8x + k = 0 have equal roots?',
          optA: '8',
          optB: '16',
          optC: '32',
          optD: '64',
          ans: 'B',
          exp: 'D = 8² − 4(1)(k) = 64 − 4k = 0 => 4k = 64 => k = 16.'
        },
        {
          text: 'Find the range of k for which x² − 4x + k = 0 has real roots.',
          optA: 'k ≤ 4',
          optB: 'k ≥ 4',
          optC: 'k < 4',
          optD: 'k > 4',
          ans: 'A',
          exp: 'Real roots require D ≥ 0 => (−4)² − 4(1)(k) ≥ 0 => 16 − 4k ≥ 0 => 4k ≤ 16 => k ≤ 4.'
        },
        {
          text: 'Solve: 2x² − 7x + 3 = 0.',
          optA: 'x = 2, 1/3',
          optB: 'x = −3, −1/2',
          optC: 'x = 3, −1/2',
          optD: 'x = 3, 1/2',
          ans: 'D',
          exp: '2x² − 6x − x + 3 = 2x(x − 3) − 1(x − 3) = (2x − 1)(x − 3) = 0 => x = 3, 1/2.'
        },
        {
          text: 'Check whether 4x² + 4x + 1 = 0 has equal roots.',
          optA: 'Yes, D = 0 so equal real roots',
          optB: 'No, D > 0 so distinct real roots',
          optC: 'No, D < 0 so no real roots',
          optD: 'Cannot be determined',
          ans: 'A',
          exp: 'D = 4² − 4(4)(1) = 16 − 16 = 0. Since D = 0, the equation has real and equal roots (x = −1/2).'
        },
        {
          text: 'Solve: 4x² − 4x − 15 = 0.',
          optA: 'x = 3, −5/4',
          optB: 'x = 5/2, −3/2',
          optC: 'x = −5/2, 3/2',
          optD: 'x = 5, −3',
          ans: 'B',
          exp: '4x² − 10x + 6x − 15 = 2x(2x − 5) + 3(2x − 5) = (2x + 3)(2x − 5) = 0 => x = 5/2, −3/2.'
        },
        {
          text: 'Find k if 2x² + (k − 1)x + 2 = 0 has equal roots.',
          optA: 'k = 4 or −4',
          optB: 'k = 3 or −5',
          optC: 'k = 5 or −3',
          optD: 'k = 2 or −2',
          ans: 'C',
          exp: 'D = (k − 1)² − 4(2)(2) = (k − 1)² − 16 = 0 => (k − 1)² = 16 => k − 1 = ±4 => k = 5 or k = −3.'
        },
        {
          text: 'Two consecutive positive integers have a product of 420. Find them.',
          optA: '19, 20',
          optB: '21, 22',
          optC: '22, 23',
          optD: '20, 21',
          ans: 'D',
          exp: 'n(n + 1) = 420 => n² + n − 420 = 0 => (n + 21)(n − 20) = 0 => n = 20. The integers are 20 and 21.'
        },
        {
          text: 'The sum of the areas of two squares is 500 cm². The side of the larger square is 10 cm more than the smaller. Find their sides.',
          optA: '10 cm and 20 cm',
          optB: '12 cm and 22 cm',
          optC: '15 cm and 25 cm',
          optD: '8 cm and 18 cm',
          ans: 'A',
          exp: 'x² + (x + 10)² = 500 => 2x² + 20x + 100 = 500 => 2x² + 20x − 400 = 0 => x² + 10x − 200 = 0 => (x + 20)(x − 10) = 0. x = 10 cm; sides are 10 cm and 20 cm.'
        },
        {
          text: 'A boat travels 24 km downstream and 18 km upstream in 5 hours. The speed of the boat in still water is 9 km/h. Find the speed of the current.',
          optA: '2 km/h',
          optB: '3 km/h',
          optC: '4 km/h',
          optD: '1.5 km/h',
          ans: 'B',
          exp: '24/(9 + v) + 18/(9 − v) = 5. Substituting v = 3: 24/12 + 18/6 = 2 + 3 = 5. Current speed = 3 km/h.'
        }
      ]
    },

    // Mock Test 10
    {
      slot: 10,
      questions: [
        {
          text: 'Which of the following equations has no real roots?',
          optA: 'x² − 4x + 4 = 0',
          optB: 'x² − 5x + 6 = 0',
          optC: 'x² + 2x + 5 = 0',
          optD: 'x² − 9 = 0',
          ans: 'C',
          exp: 'For x² + 2x + 5 = 0, D = 2² − 4(1)(5) = 4 − 20 = −16 < 0. Hence it has no real roots.'
        },
        {
          text: 'If α is a root of x² − 7x + 10 = 0 and α = 5, the other root is:',
          optA: '1',
          optB: '2',
          optC: '5',
          optD: '7',
          ans: 'B',
          exp: 'Product of roots = c/a = 10/1 = 10. Since one root is 5, other root = 10/5 = 2 (or factorise as (x − 5)(x − 2) = 0).'
        },
        {
          text: 'Find the value(s) of k for which 4x² + kx + 1 = 0 has equal roots.',
          optA: 'k = ±2',
          optB: 'k = ±16',
          optC: 'k = ±4',
          optD: 'k = 4 only',
          ans: 'C',
          exp: 'Equal roots require D = 0 => k² − 4(4)(1) = 0 => k² − 16 = 0 => k² = 16 => k = ±4.'
        },
        {
          text: 'Solve: 6x² + x − 2 = 0.',
          optA: 'x = −1/2, 2/3',
          optB: 'x = 1/3, −1',
          optC: 'x = 2, −1/6',
          optD: 'x = 1/2, −2/3',
          ans: 'D',
          exp: '6x² + 4x − 3x − 2 = 2x(3x + 2) − 1(3x + 2) = (2x − 1)(3x + 2) = 0 => x = 1/2, −2/3.'
        },
        {
          text: 'Determine the nature of roots of 2x² − 4x + 2 = 0.',
          optA: 'Real and equal roots',
          optB: 'Real and distinct roots',
          optC: 'No real roots',
          optD: 'Cannot be determined',
          ans: 'A',
          exp: 'Dividing by 2 gives x² − 2x + 1 = (x − 1)² = 0. D = (−4)² − 4(2)(2) = 16 − 16 = 0. Real and equal roots.'
        },
        {
          text: 'Solve using the quadratic formula: 2x² − 4x − 1 = 0.',
          optA: 'x = 1 ± √6',
          optB: 'x = (2 ± √6)/2',
          optC: 'x = (4 ± √6)/2',
          optD: 'x = 2 ± √3',
          ans: 'B',
          exp: 'D = (−4)² − 4(2)(−1) = 16 + 8 = 24 = 4 × 6. x = (4 ± 2√6)/4 = (2 ± √6)/2.'
        },
        {
          text: 'Find the range of k for which 5x² + 2x + k = 0 has no real roots.',
          optA: 'k < 1/5',
          optB: 'k = 1/5',
          optC: 'k > 1/5',
          optD: 'k ≥ 1/5',
          ans: 'C',
          exp: 'No real roots requires D < 0 => 2² − 4(5)(k) < 0 => 4 − 20k < 0 => 20k > 4 => k > 1/5.'
        },
        {
          text: 'The product of two consecutive positive integers is 552. Find the integers.',
          optA: '22, 23',
          optB: '24, 25',
          optC: '21, 22',
          optD: '23, 24',
          ans: 'D',
          exp: 'n(n + 1) = 552 => n² + n − 552 = 0 => (n + 24)(n − 23) = 0 => n = 23. The integers are 23 and 24.'
        },
        {
          text: 'The length of a rectangular hall is 6 m more than its breadth. Its area is 432 m². Find its dimensions.',
          optA: 'Length = 24 m, Breadth = 18 m',
          optB: 'Length = 26 m, Breadth = 16 m',
          optC: 'Length = 28 m, Breadth = 14 m',
          optD: 'Length = 30 m, Breadth = 12 m',
          ans: 'A',
          exp: 'b(b + 6) = 432 => b² + 6b − 432 = 0 => (b + 24)(b − 18) = 0 => b = 18 m, length = 24 m.'
        },
        {
          text: 'A car travels 150 km at a uniform speed. If its speed were 5 km/h less, it would take 1 hour more. Find its original speed.',
          optA: '25 km/h',
          optB: '30 km/h',
          optC: '35 km/h',
          optD: '40 km/h',
          ans: 'B',
          exp: '150/(v − 5) − 150/v = 1 => v² − 5v − 750 = 0 => (v − 30)(v + 25) = 0 => v = 30 km/h.'
        }
      ]
    }
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', 'math-ch4', 'Quadratic Equations', 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    testsData.forEach(t => {
      const testId = `test-math-ch4-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-quad-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-quad-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded 10 questions into Quadratic Equations – Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] All 10 Quadratic Equations Mock Tests (100 questions) successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedQuadraticEquations.ts')) {
  seedQuadraticEquations();
}
