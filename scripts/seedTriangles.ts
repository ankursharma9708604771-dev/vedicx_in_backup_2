import Database from 'better-sqlite3';

export function seedTriangles(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 6: Triangles (5 Mock Tests, 50 Questions)...');

  // Ensure 5 mock test slots for math-ch6
  const existingTests = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all('math-ch6') as any[];
  const existingSlotMap = new Map(existingTests.map(t => [t.test_number, t.id]));

  for (let slot = 1; slot <= 5; slot++) {
    const testId = existingSlotMap.get(slot) || `test-math-ch6-slot-${slot}`;
    const title = `Triangles – Mock Test ${slot}`;
    const accessType = slot === 1 ? 'free' : 'premium';

    const testExists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
    if (!testExists) {
      db.prepare(`
        INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
        VALUES (?, ?, 'mathematics', 'math-ch6', ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
      `).run(testId, title, slot, `Class 10 Triangles Mock Test ${slot}`, accessType);
    } else {
      db.prepare(`
        UPDATE mock_tests
        SET title = ?, test_number = ?, total_questions = 10, duration_minutes = 25, max_marks = 20.0, passing_marks = 8.0, access_type = ?, status = 'published'
        WHERE id = ?
      `).run(title, slot, accessType, testId);
    }

    // Clean old questions
    const oldQuestions = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(testId) as any[];
    for (const q of oldQuestions) {
      db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
    }
    db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(testId);
  }

  const testsData = [
    // Mock Test 1
    {
      slot: 1,
      questions: [
        {
          text: 'If in two triangles, corresponding angles are equal, the triangles are:',
          optA: 'Always congruent',
          optB: 'Similar',
          optC: 'Always equilateral',
          optD: 'Unequal in area',
          ans: 'B',
          exp: 'Equality of corresponding angles satisfies the AAA similarity criterion, proving that the two triangles are similar (though not necessarily congruent).'
        },
        {
          text: 'In triangles ABC and DEF, ∠A = ∠D, ∠B = ∠E, AB = 6 cm and DE = 9 cm. Find the ratio of their corresponding sides.',
          optA: '2:3',
          optB: '3:2',
          optC: '4:9',
          optD: '1:3',
          ans: 'A',
          exp: 'By AA similarity, ΔABC ~ ΔDEF. The ratio of corresponding sides is AB/DE = 6/9 = 2/3.'
        },
        {
          text: 'Which criterion states: "Two sides of one triangle are proportional to two sides of another triangle and the included angles are equal"?',
          optA: 'SSS similarity',
          optB: 'AAA similarity',
          optC: 'SAS similarity',
          optD: 'RHS congruence',
          ans: 'C',
          exp: 'The SAS (Side-Angle-Side) similarity criterion states that if two sides of one triangle are proportional to two sides of another and the included angles are equal, the triangles are similar.'
        },
        {
          text: 'In ΔABC, AB = 4, BC = 6, AC = 8. In ΔPQR, PQ = 6, QR = 9, PR = 12. Are the triangles similar?',
          optA: 'No, sides are not equal',
          optB: 'No, angles are unknown',
          optC: 'Cannot be determined',
          optD: 'Yes, by SSS similarity criterion',
          ans: 'D',
          exp: 'AB/PQ = 4/6 = 2/3, BC/QR = 6/9 = 2/3, AC/PR = 8/12 = 2/3. All corresponding side ratios are equal, so ΔABC ~ ΔPQR by SSS.'
        },
        {
          text: 'State whether true or false: "If two triangles are similar, their corresponding sides are always equal."',
          optA: 'True, similarity implies equal sides',
          optB: 'False, corresponding sides are proportional, equal only when scale factor is 1',
          optC: 'True for right-angled triangles only',
          optD: 'False, corresponding sides are always unequal',
          ans: 'B',
          exp: 'False. For similar triangles, corresponding sides are in proportion. They are equal only when the triangles are congruent (ratio 1:1).'
        },
        {
          text: 'The perimeters of two similar triangles are 24 cm and 36 cm. Find the ratio of their corresponding sides.',
          optA: '2:3',
          optB: '4:9',
          optC: '3:2',
          optD: '1:2',
          ans: 'A',
          exp: 'The ratio of perimeters of two similar triangles is equal to the ratio of their corresponding sides: 24/36 = 2/3.'
        },
        {
          text: 'In ΔABC, DE ∥ BC with D on AB and E on AC. If AD = 3 cm, DB = 2 cm and AE = 4.5 cm, find EC.',
          optA: '2.5 cm',
          optB: '3.5 cm',
          optC: '3.0 cm',
          optD: '4.0 cm',
          ans: 'C',
          exp: 'By BPT, AD/DB = AE/EC => 3/2 = 4.5/EC => EC = (2 × 4.5)/3 = 3.0 cm.'
        },
        {
          text: 'A triangle has sides 5 cm, 12 cm and 13 cm. Another has sides 10 cm, 24 cm and 26 cm. What is their similarity relationship?',
          optA: 'Congruent by SSS',
          optB: 'Not similar',
          optC: 'Similar by AA only',
          optD: 'Similar by SSS criterion with side ratio 1:2',
          ans: 'D',
          exp: '5/10 = 12/24 = 13/26 = 1/2. Since all corresponding sides are in the ratio 1:2, the triangles are similar by SSS.'
        },
        {
          text: 'If ΔABC ~ ΔPQR and AB/PQ = 3/5, find the ratio of their areas.',
          optA: '9:25',
          optB: '3:5',
          optC: '6:10',
          optD: '27:125',
          ans: 'A',
          exp: 'The ratio of the areas of two similar triangles is equal to the square of the ratio of their corresponding sides: (3/5)² = 9/25.'
        },
        {
          text: 'In right-angled triangle ABC with ∠B = 90°, AB = 5 cm and BC = 12 cm. Find AC and sin A.',
          optA: 'AC = 13 cm, sin A = 5/13',
          optB: 'AC = 13 cm, sin A = 12/13',
          optC: 'AC = 15 cm, sin A = 12/15',
          optD: 'AC = 17 cm, sin A = 5/17',
          ans: 'B',
          exp: 'AC² = AB² + BC² = 25 + 144 = 169 => AC = 13 cm. sin A = opposite / hypotenuse = BC / AC = 12/13.'
        }
      ]
    },

    // Mock Test 2
    {
      slot: 2,
      questions: [
        {
          text: 'A line drawn parallel to one side of a triangle to intersect the other two sides divides those sides in the same:',
          optA: 'Angle',
          optB: 'Ratio',
          optC: 'Area',
          optD: 'Length',
          ans: 'B',
          exp: 'This is the statement of the Basic Proportionality Theorem (Thales\' Theorem): it divides the other two sides in the same ratio.'
        },
        {
          text: 'In ΔABC, D lies on AB and E on AC. If AD = 4 cm, DB = 6 cm, AE = 5 cm and DE ∥ BC, find EC.',
          optA: '6.5 cm',
          optB: '7.0 cm',
          optC: '7.5 cm',
          optD: '8.0 cm',
          ans: 'C',
          exp: 'By BPT, AD/DB = AE/EC => 4/6 = 5/EC => EC = (6 × 5)/4 = 30/4 = 7.5 cm.'
        },
        {
          text: 'In ΔPQR, X lies on PQ and Y on PR. PX = 3, XQ = 6, PY = 4 and YR = 8. Is XY parallel to QR?',
          optA: 'No, because lengths are unequal',
          optB: 'Cannot be determined without angles',
          optC: 'No, XQ is too long',
          optD: 'Yes, by the converse of BPT (both ratios equal 1/2)',
          ans: 'D',
          exp: 'PX/XQ = 3/6 = 1/2 and PY/YR = 4/8 = 1/2. Since the line divides the two sides in the same ratio, XY ∥ QR by the converse of BPT.'
        },
        {
          text: 'In ΔABC, DE ∥ BC. If AD = 5 cm, AB = 8 cm and AE = 7.5 cm, find AC.',
          optA: '12 cm',
          optB: '10 cm',
          optC: '14 cm',
          optD: '15 cm',
          ans: 'A',
          exp: 'ΔADE ~ ΔABC => AD/AB = AE/AC => 5/8 = 7.5/AC => AC = (8 × 7.5)/5 = 60/5 = 12 cm.'
        },
        {
          text: 'A pole 2 m high casts a shadow 1.5 m long. At the same time, a tree casts a shadow 9 m long. Find the height of the tree.',
          optA: '10 m',
          optB: '12 m',
          optC: '14 m',
          optD: '15 m',
          ans: 'B',
          exp: 'Sun rays make equal angles, forming similar right triangles: Height/Shadow = 2/1.5. Tree height = 9 × (2/1.5) = 18/1.5 = 12 m.'
        },
        {
          text: 'Which theorem states: "If a line divides any two sides of a triangle in the same ratio, then the line is parallel to the third side"?',
          optA: 'Pythagoras theorem',
          optB: 'Midpoint theorem',
          optC: 'Converse of Basic Proportionality Theorem',
          optD: 'Angle bisector theorem',
          ans: 'C',
          exp: 'This is the exact statement of the Converse of the Basic Proportionality Theorem (Converse of Thales\' Theorem).'
        },
        {
          text: 'In ΔABC, DE ∥ BC with D on AB, E on AC. AD = 4 cm, DB = 6 cm and BC = 15 cm. Find the length of DE.',
          optA: '5 cm',
          optB: '7.5 cm',
          optC: '8 cm',
          optD: '6 cm',
          ans: 'D',
          exp: 'AB = AD + DB = 4 + 6 = 10 cm. Since ΔADE ~ ΔABC, DE/BC = AD/AB => DE/15 = 4/10 => DE = 15 × 0.4 = 6 cm.'
        },
        {
          text: 'In ΔABC, AD = 2.4 cm, DB = 3.6 cm, AE = 3 cm and EC = 4.5 cm. What is the relation between DE and BC?',
          optA: 'DE ∥ BC',
          optB: 'DE is perpendicular to BC',
          optC: 'DE intersects BC',
          optD: 'DE = BC',
          ans: 'A',
          exp: 'AD/DB = 2.4/3.6 = 2/3 and AE/EC = 3/4.5 = 2/3. Since AD/DB = AE/EC, DE ∥ BC by the converse of BPT.'
        },
        {
          text: 'A line parallel to BC cuts AB at D and AC at E. If AD:AB = 2:5 and AC = 20 cm, find AE.',
          optA: '6 cm',
          optB: '8 cm',
          optC: '10 cm',
          optD: '12 cm',
          ans: 'B',
          exp: 'ΔADE ~ ΔABC => AE/AC = AD/AB = 2/5 => AE = 20 × (2/5) = 8 cm.'
        },
        {
          text: 'A triangular field is divided by a fence parallel to its base in the ratio 3:2 from the vertex. If the whole corresponding side is 25 m, find the length from vertex to fence.',
          optA: '12 m',
          optB: '10 m',
          optC: '15 m',
          optD: '18 m',
          ans: 'C',
          exp: 'The side is divided in ratio 3:2, total 5 parts. Vertex-to-fence segment = (3/5) × 25 = 15 m.'
        }
      ]
    },

    // Mock Test 3
    {
      slot: 3,
      questions: [
        {
          text: 'In a right-angled triangle, the square of the hypotenuse is equal to:',
          optA: 'Sum of squares of the other two sides',
          optB: 'Difference of the squares of the other two sides',
          optC: 'Twice the product of the other two sides',
          optD: 'Sum of the other two sides',
          ans: 'A',
          exp: 'According to Pythagoras theorem, in a right-angled triangle, Hypotenuse² = Base² + Perpendicular².'
        },
        {
          text: 'A right-angled triangle has perpendicular sides 9 cm and 12 cm. Find its hypotenuse.',
          optA: '14 cm',
          optB: '15 cm',
          optC: '16 cm',
          optD: '17 cm',
          ans: 'B',
          exp: 'h² = 9² + 12² = 81 + 144 = 225 => h = √225 = 15 cm.'
        },
        {
          text: 'Check whether a triangle with sides 7 cm, 24 cm and 25 cm is right-angled.',
          optA: 'No, 7 + 24 ≠ 25',
          optB: 'No, 24² + 25² ≠ 7²',
          optC: 'Yes, because 7² + 24² = 49 + 576 = 625 = 25²',
          optD: 'Cannot be verified without angle measures',
          ans: 'C',
          exp: 'By the converse of Pythagoras theorem, since 7² + 24² = 625 = 25², the triangle is right-angled with hypotenuse 25 cm.'
        },
        {
          text: 'The diagonal of a rectangle is 13 cm and one side is 5 cm. Find the other side.',
          optA: '10 cm',
          optB: '11 cm',
          optC: '14 cm',
          optD: '12 cm',
          ans: 'D',
          exp: 'Diagonal² = length² + breadth² => 13² = 5² + x² => 169 = 25 + x² => x² = 144 => x = 12 cm.'
        },
        {
          text: 'A ladder 10 m long reaches a window 8 m above the ground. How far is the foot of the ladder from the wall?',
          optA: '6 m',
          optB: '5 m',
          optC: '7 m',
          optD: '4 m',
          ans: 'A',
          exp: 'Ladder is hypotenuse: 10² = 8² + d² => 100 = 64 + d² => d² = 36 => d = 6 m.'
        },
        {
          text: 'A triangle has sides 6 cm, 8 cm and 11 cm. Determine the nature of the triangle.',
          optA: 'Right-angled triangle',
          optB: 'Obtuse-angled triangle',
          optC: 'Acute-angled triangle',
          optD: 'Equilateral triangle',
          ans: 'B',
          exp: 'Compare the square of the largest side with the sum of squares of the other two: 11² = 121, while 6² + 8² = 36 + 64 = 100. Since 121 > 100, the angle opposite side 11 is obtuse.'
        },
        {
          text: 'The sides of a triangle are in the ratio 3:4:5 and its perimeter is 48 cm. Find its area.',
          optA: '84 cm²',
          optB: '120 cm²',
          optC: '96 cm²',
          optD: '108 cm²',
          ans: 'C',
          exp: '3k + 4k + 5k = 48 => 12k = 48 => k = 4. Sides are 12, 16, 20 cm (right triangle). Area = 1/2 × 12 × 16 = 96 cm².'
        },
        {
          text: 'A point is 15 cm from one end of a horizontal line and 20 cm from the other end. The ends are 25 cm apart. What angle is formed at the point?',
          optA: '60°',
          optB: '75°',
          optC: '120°',
          optD: '90°',
          ans: 'D',
          exp: '15² + 20² = 225 + 400 = 625 = 25². By the converse of Pythagoras theorem, the triangle is right-angled and the angle opposite 25 cm is 90°.'
        },
        {
          text: 'A kite string is 25 m long. The kite is vertically above a point 7 m away horizontally. Find the height of the kite above the ground.',
          optA: '24 m',
          optB: '22 m',
          optC: '20 m',
          optD: '23 m',
          ans: 'A',
          exp: 'h² = 25² − 7² = 625 − 49 = 576 => h = √576 = 24 m.'
        },
        {
          text: 'A triangle has sides 8 cm, 15 cm and 17 cm. Identify its nature and hypotenuse.',
          optA: 'Scalene acute; no hypotenuse',
          optB: 'Right-angled; hypotenuse = 17 cm',
          optC: 'Right-angled; hypotenuse = 15 cm',
          optD: 'Obtuse-angled; largest side = 17 cm',
          ans: 'B',
          exp: '8² + 15² = 64 + 225 = 289 = 17². Thus it is right-angled and the longest side (17 cm) is the hypotenuse.'
        }
      ]
    },

    // Mock Test 4
    {
      slot: 4,
      questions: [
        {
          text: 'Assertion: Areas of two similar triangles are in the ratio of the squares of their corresponding sides. Reason: If the side ratio is k, linear dimensions scale by k and area scales by k². Which option is correct?',
          optA: 'Both A and R are true, and R is the correct explanation of A',
          optB: 'Both A and R are true, but R does not explain A',
          optC: 'A is true but R is false',
          optD: 'A is false but R is true',
          ans: 'A',
          exp: 'Both statements are correct standard geometric theorems and the reason gives the fundamental geometric proof.'
        },
        {
          text: 'If the areas of two similar triangles are 64 cm² and 121 cm², find the ratio of their corresponding sides.',
          optA: '4:11',
          optB: '8:11',
          optC: '16:25',
          optD: '8:12',
          ans: 'B',
          exp: 'Ratio of sides = √(Ratio of areas) = √(64/121) = 8/11.'
        },
        {
          text: 'In ΔABC and ΔDEF, ∠A = ∠D and ∠B = ∠E. If AB = 8 cm, DE = 12 cm and BC = 10 cm, find EF.',
          optA: '14 cm',
          optB: '16 cm',
          optC: '15 cm',
          optD: '18 cm',
          ans: 'C',
          exp: 'By AA similarity, ΔABC ~ ΔDEF => AB/DE = BC/EF => 8/12 = 10/EF => EF = (12 × 10)/8 = 15 cm.'
        },
        {
          text: 'If ΔABC ~ ΔPQR, which equality is always true regarding side ratios?',
          optA: 'AB/BC = QR/PQ',
          optB: 'AB × PQ = BC × QR',
          optC: 'AB + BC = PQ + QR',
          optD: 'AB/BC = PQ/QR',
          ans: 'D',
          exp: 'Since ΔABC ~ ΔPQR, AB/PQ = BC/QR. Rearranging gives AB/BC = PQ/QR.'
        },
        {
          text: 'A triangle and its similar triangle have perimeters 30 cm and 45 cm. If one side of the smaller triangle is 8 cm, find the corresponding side of the larger triangle.',
          optA: '12 cm',
          optB: '10 cm',
          optC: '15 cm',
          optD: '14 cm',
          ans: 'A',
          exp: 'Ratio of perimeters = 30/45 = 2/3. Thus smaller/larger = 2/3 => 8/x = 2/3 => x = (8 × 3)/2 = 12 cm.'
        },
        {
          text: 'In ΔABC, D lies on AB and E on AC. If AD = 3, AB = 9, AE = 4 and AC = 12, show the relation between DE and BC.',
          optA: 'DE is perpendicular to BC',
          optB: 'DE ∥ BC (since AD/AB = AE/AC = 1/3)',
          optC: 'DE intersects BC at midpoint',
          optD: 'No relation can be determined',
          ans: 'B',
          exp: 'AD/AB = 3/9 = 1/3 and AE/AC = 4/12 = 1/3. By converse of BPT, DE ∥ BC.'
        },
        {
          text: 'The areas of two similar triangles are 25 cm² and 49 cm². If the perimeter of the first is 30 cm, find the perimeter of the second.',
          optA: '36 cm',
          optB: '40 cm',
          optC: '42 cm',
          optD: '45 cm',
          ans: 'C',
          exp: 'Side ratio = √(25/49) = 5/7. Perimeter ratio is also 5/7 => 30/P₂ = 5/7 => P₂ = (30 × 7)/5 = 42 cm.'
        },
        {
          text: 'A right-angled triangle has hypotenuse 26 cm and one leg 10 cm. Find the other leg and its area.',
          optA: '18 cm, Area = 90 cm²',
          optB: '20 cm, Area = 100 cm²',
          optC: '22 cm, Area = 110 cm²',
          optD: '24 cm, Area = 120 cm²',
          ans: 'D',
          exp: 'Other leg = √(26² − 10²) = √(676 − 100) = √576 = 24 cm. Area = 1/2 × 10 × 24 = 120 cm².'
        },
        {
          text: 'In ΔABC, DE ∥ BC. If AD = 3 cm, DB = 5 cm and the area of ΔADE is 18 cm², find the area of trapezium DBCE.',
          optA: '110 cm²',
          optB: '128 cm²',
          optC: '100 cm²',
          optD: '96 cm²',
          ans: 'A',
          exp: 'AB = 3 + 5 = 8 cm. Area(ΔADE)/Area(ΔABC) = (3/8)² = 9/64. Area(ΔABC) = 18 × 64/9 = 128 cm². Area(trapezium) = 128 − 18 = 110 cm².'
        },
        {
          text: 'Two similar triangles have corresponding sides in the ratio 5:8. The difference between their areas is 117 cm². Find the area of the smaller triangle.',
          optA: '65 cm²',
          optB: '75 cm²',
          optC: '85 cm²',
          optD: '90 cm²',
          ans: 'B',
          exp: 'Area ratio = 5²:8² = 25:64. Let areas be 25x and 64x. 64x − 25x = 39x = 117 => x = 3. Smaller area = 25(3) = 75 cm².'
        }
      ]
    },

    // Mock Test 5
    {
      slot: 5,
      questions: [
        {
          text: 'If the ratio of areas of two similar triangles is 16:25, the ratio of their corresponding altitudes is:',
          optA: '16:25',
          optB: '8:5',
          optC: '5:4',
          optD: '4:5',
          ans: 'D',
          exp: 'Altitudes are linear dimensions, so ratio of altitudes = √(ratio of areas) = √(16/25) = 4/5.'
        },
        {
          text: 'A 1.5 m tall student casts a shadow of 2 m. At the same time, a building casts a shadow of 18 m. Find the building\'s height.',
          optA: '13.5 m',
          optB: '14.0 m',
          optC: '12.5 m',
          optD: '15.0 m',
          ans: 'A',
          exp: 'By similarity: height/shadow = 1.5/2 = H/18 => H = 18 × 1.5 / 2 = 13.5 m.'
        },
        {
          text: 'In ΔABC, DE ∥ BC. If AD = 4 cm, AB = 10 cm and area of ΔADE is 24 cm², find the area of ΔABC.',
          optA: '120 cm²',
          optB: '150 cm²',
          optC: '140 cm²',
          optD: '160 cm²',
          ans: 'B',
          exp: 'Area ratio = (AD/AB)² = (4/10)² = 16/100 = 4/25. Area(ΔABC) = 24 × 25 / 4 = 150 cm².'
        },
        {
          text: 'The sides of a triangle are 9 cm, 12 cm and 15 cm. Find its area and determine whether it is right-angled.',
          optA: 'Area = 60 cm²; not right-angled',
          optB: 'Area = 54 cm²; acute triangle',
          optC: 'Area = 54 cm²; right-angled triangle',
          optD: 'Area = 48 cm²; right-angled triangle',
          ans: 'C',
          exp: '9² + 12² = 81 + 144 = 225 = 15². Hence it is right-angled. Area = 1/2 × 9 × 12 = 54 cm².'
        },
        {
          text: 'A triangle has sides 5 cm, 6 cm and 8 cm. Another triangle has sides 10 cm, 12 cm and 16 cm. Find the ratio of their areas.',
          optA: '1:2',
          optB: '1:3',
          optC: '1:8',
          optD: '1:4',
          ans: 'D',
          exp: 'Side ratio = 5/10 = 1/2. Since triangles are similar by SSS, Area ratio = (1/2)² = 1:4.'
        },
        {
          text: 'A 15 m ladder leans against a wall with its foot 9 m from the wall (reaches 12 m high). If the foot is moved 3 m farther away, how high will it reach?',
          optA: '9 m',
          optB: '8 m',
          optC: '10 m',
          optD: '7.5 m',
          ans: 'A',
          exp: 'New horizontal distance = 9 + 3 = 12 m. New height = √(15² − 12²) = √(225 − 144) = √81 = 9 m.'
        },
        {
          text: 'In ΔABC, DE ∥ BC. If AD = 3 cm, DB = 5 cm and AE = 4.5 cm, find EC.',
          optA: '6.5 cm',
          optB: '7.5 cm',
          optC: '8.0 cm',
          optD: '7.0 cm',
          ans: 'B',
          exp: 'By BPT, AD/DB = AE/EC => 3/5 = 4.5/EC => EC = (5 × 4.5)/3 = 7.5 cm.'
        },
        {
          text: 'A right-angled triangle has sides in ratio 5:12:13 and perimeter 90 cm. Find its three sides and area.',
          optA: 'Sides: 10, 24, 26 cm; Area = 120 cm²',
          optB: 'Sides: 15, 36, 39 cm; Area = 270 cm²',
          optC: 'Sides: 12, 28.8, 31.2 cm; Area = 172.8 cm²',
          optD: 'Sides: 15, 30, 45 cm; Area = 225 cm²',
          ans: 'B',
          exp: '5k + 12k + 13k = 30k = 90 => k = 3. Sides are 15 cm, 36 cm, 39 cm. Area = 1/2 × 15 × 36 = 270 cm².'
        },
        {
          text: 'A line parallel to the base of a triangle cuts off a smaller triangle of area 36 cm². The whole triangle area is 100 cm². If the smaller corresponding side is 9 cm, find the whole corresponding side.',
          optA: '12 cm',
          optB: '14 cm',
          optC: '15 cm',
          optD: '18 cm',
          ans: 'C',
          exp: 'Area ratio = 36/100 = 9/25. Side ratio = √(9/25) = 3/5. Smaller/whole = 9/x = 3/5 => x = 15 cm.'
        },
        {
          text: 'A triangular frame has sides 10 cm, 24 cm, 26 cm. A similar frame has shortest side 15 cm. Find the ratio of areas of the second frame to the first.',
          optA: '3:2',
          optB: '2:3',
          optC: '4:9',
          optD: '9:4',
          ans: 'D',
          exp: 'Scale factor = 15/10 = 3/2. Ratio of areas = (3/2)² = 9/4.'
        }
      ]
    }
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', 'math-ch6', 'Triangles', 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    testsData.forEach(t => {
      const testId = `test-math-ch6-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-tri-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-tri-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded 10 questions into Triangles – Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] All 5 Triangles Mock Tests (50 questions) successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedTriangles.ts')) {
  seedTriangles();
}
