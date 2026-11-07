import Database from 'better-sqlite3';

export function seedCirclesChapters(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 10 (3 Tests) and Chapter 11 (5 Tests)...');

  function ensureSlots(chapterId: string, count: number, chapterName: string) {
    const existing = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all(chapterId) as any[];
    const slotMap = new Map(existing.map(t => [t.test_number, t.id]));

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

  ensureSlots('math-ch10', 3, 'Circles');
  ensureSlots('math-ch11', 5, 'Areas Related to Circles');

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

  // Chapter 10: Circles (3 Mock Tests, 30 Questions)
  const ch10Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'How many tangents can be drawn to a circle from a point lying strictly outside it?',
          optA: 'Exactly one',
          optB: 'Exactly two',
          optC: 'Infinitely many',
          optD: 'Zero',
          ans: 'B',
          exp: 'From any point outside a circle, exactly two tangents can be drawn to the circle.'
        },
        {
          text: 'A tangent PT touches a circle with centre O at T. If OT = 5 cm and OP = 13 cm, find PT.',
          optA: '12 cm',
          optB: '10 cm',
          optC: '8 cm',
          optD: '14 cm',
          ans: 'A',
          exp: 'Radius OT is perpendicular to tangent PT at T (∠OTP = 90°). By Pythagoras, PT² = OP² − OT² = 13² − 5² = 144 => PT = 12 cm.'
        },
        {
          text: 'A point P is 10 cm from the centre of a circle of radius 6 cm. Find the length of each tangent drawn from P.',
          optA: '6 cm',
          optB: '7 cm',
          optC: '8 cm',
          optD: '9 cm',
          ans: 'C',
          exp: 'Tangent length = √(10² − 6²) = √(100 − 36) = √64 = 8 cm. Tangents from an external point are equal, so each is 8 cm.'
        },
        {
          text: 'State the geometric relationship between the radius and the tangent at the point of contact.',
          optA: 'They are parallel',
          optB: 'They make an angle of 45°',
          optC: 'They make an angle of 60°',
          optD: 'The tangent is perpendicular to the radius through the point of contact',
          ans: 'D',
          exp: 'By standard theorem: The tangent at any point of a circle is perpendicular to the radius through the point of contact.'
        },
        {
          text: 'Two tangents PA and PB are drawn from an external point P to a circle. If PA = 7.5 cm, find PB.',
          optA: '7.5 cm',
          optB: '15 cm',
          optC: '5.0 cm',
          optD: '3.75 cm',
          ans: 'A',
          exp: 'Tangents drawn from an external point to a circle are equal in length. Therefore, PB = PA = 7.5 cm.'
        },
        {
          text: 'A circle has centre O and radius 9 cm. A tangent from an external point P has length 12 cm. Find OP.',
          optA: '14 cm',
          optB: '15 cm',
          optC: '16 cm',
          optD: '21 cm',
          ans: 'B',
          exp: 'In right triangle OPT: OP² = OT² + PT² = 9² + 12² = 81 + 144 = 225 => OP = 15 cm.'
        },
        {
          text: 'Can a tangent be drawn to a circle from a point inside the circle? Give the reason.',
          optA: 'Yes, exactly one tangent',
          optB: 'Yes, two tangents',
          optC: 'No, every line through an interior point is a secant intersecting the circle in two points',
          optD: 'Yes, if the point is the centre',
          ans: 'C',
          exp: 'A point inside the circle has distance < radius from the centre. Any line through an interior point cuts the circle twice (secant), so no tangent can be drawn.'
        },
        {
          text: 'A quadrilateral ABCD has an incircle touching AB, BC, CD, DA at P, Q, R, S. If AP = 4 cm, BQ = 6 cm, CR = 5 cm, what can be concluded about its perimeter?',
          optA: 'Perimeter is 30 cm',
          optB: 'Perimeter is 36 cm',
          optC: 'Perimeter is 32 cm',
          optD: 'The perimeter cannot be uniquely determined without the length of DR (or DS)',
          ans: 'D',
          exp: 'AP = AS = 4, BP = BQ = 6, CQ = CR = 5, DR = DS = x. Perimeter = 2(4 + 6 + 5 + x) = 30 + 2x, which depends on x and cannot be uniquely determined.'
        },
        {
          text: 'A circle touches all four sides of a square of side 10 cm. Find the radius of the circle.',
          optA: '5 cm',
          optB: '10 cm',
          optC: '5√2 cm',
          optD: '2.5 cm',
          ans: 'A',
          exp: 'For an inscribed circle in a square, the diameter equals the side of the square: 2r = 10 => r = 5 cm.'
        },
        {
          text: 'A tangent at point A to a circle with centre O meets a line through O at P. If OA = 8 cm and OP = 17 cm, find PA.',
          optA: '12 cm',
          optB: '15 cm',
          optC: '13 cm',
          optD: '16 cm',
          ans: 'B',
          exp: 'OA ⊥ PA. By Pythagoras, PA² = OP² − OA² = 17² − 8² = 289 − 64 = 225 => PA = 15 cm.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'Two tangents PA and PB are drawn from an external point P. If ∠APB = 70°, find ∠AOB, where O is the centre.',
          optA: '100°',
          optB: '120°',
          optC: '110°',
          optD: '140°',
          ans: 'C',
          exp: 'In quadrilateral AOBP, ∠OAP = ∠OBP = 90°. Since opposite angles are supplementary: ∠AOB + ∠APB = 180° => ∠AOB = 180° − 70° = 110°.'
        },
        {
          text: 'A tangent AB at point A to a circle of radius 7 cm is 24 cm long. Find the distance from the centre to point B.',
          optA: '26 cm',
          optB: '23 cm',
          optC: '24 cm',
          optD: '25 cm',
          ans: 'D',
          exp: 'OB² = OA² + AB² = 7² + 24² = 49 + 576 = 625 => OB = 25 cm.'
        },
        {
          text: 'Which congruence criterion proves that tangents drawn from an external point to a circle are equal in length?',
          optA: 'RHS congruence criterion',
          optB: 'SSS congruence criterion',
          optC: 'ASA congruence criterion',
          optD: 'AAS congruence criterion',
          ans: 'A',
          exp: 'In right triangles OAP and OBP, OA = OB (radii), OP is common hypotenuse, and ∠OAP = ∠OBP = 90°. By RHS, ΔOAP ≅ ΔOBP, hence PA = PB (CPCT).'
        },
        {
          text: 'A circle touches the sides of ΔABC at D, E, F on AB, BC, CA respectively. If AD = 5 cm, BD = 7 cm, CE = 4 cm, find the perimeter of ΔABC.',
          optA: '30 cm',
          optB: '32 cm',
          optC: '34 cm',
          optD: '36 cm',
          ans: 'B',
          exp: 'AF = AD = 5, BE = BD = 7, CF = CE = 4. Perimeter = 2(AD + BD + CE) = 2(5 + 7 + 4) = 2(16) = 32 cm.'
        },
        {
          text: 'From an external point P, tangents PA and PB are drawn. If PA = 3x + 2 and PB = 5x − 6, find x and the tangent length.',
          optA: 'x = 3, length = 11',
          optB: 'x = 4, length = 12',
          optC: 'x = 4, length = 14 units',
          optD: 'x = 5, length = 17',
          ans: 'C',
          exp: 'PA = PB => 3x + 2 = 5x − 6 => 2x = 8 => x = 4. Tangent length = 3(4) + 2 = 14 units.'
        },
        {
          text: 'A circle has radius 8 cm. The distance of an external point from the centre is 17 cm. Find the tangent length.',
          optA: '14 cm',
          optB: '16 cm',
          optC: '13 cm',
          optD: '15 cm',
          ans: 'D',
          exp: 'Tangent length = √(17² − 8²) = √(289 − 64) = √225 = 15 cm.'
        },
        {
          text: 'A tangent PT at T to a circle with centre O has PT = 15 cm and OT = 8 cm. Find the perimeter of triangle OPT.',
          optA: '40 cm',
          optB: '38 cm',
          optC: '42 cm',
          optD: '45 cm',
          ans: 'A',
          exp: 'OP = √(15² + 8²) = 17 cm. Perimeter = OT + PT + OP = 8 + 15 + 17 = 40 cm.'
        },
        {
          text: 'Two tangents PA and PB are drawn to a circle with centre O. If ∠AOB = 120°, find ∠APB.',
          optA: '50°',
          optB: '60°',
          optC: '70°',
          optD: '80°',
          ans: 'B',
          exp: '∠APB and ∠AOB are supplementary: ∠APB = 180° − 120° = 60°.'
        },
        {
          text: 'A circle is inscribed in a quadrilateral ABCD touching all four sides. Which relationship holds true?',
          optA: 'AB + BC = CD + DA',
          optB: 'AB × CD = BC × DA',
          optC: 'AB + CD = AD + BC',
          optD: 'AC = BD',
          ans: 'C',
          exp: 'Sum of opposite sides are equal: AB + CD = (AP + PB) + (CR + RD) = (AS + BQ) + (CQ + DS) = (AS + DS) + (BQ + CQ) = AD + BC.'
        },
        {
          text: 'A circle touches the sides of a triangle. Tangents from vertex A are 6 cm each, from B are 8 cm each, from C are 5 cm each. Find the perimeter of the triangle.',
          optA: '36 cm',
          optB: '40 cm',
          optC: '42 cm',
          optD: '38 cm',
          ans: 'D',
          exp: 'Perimeter = 2(6 + 8 + 5) = 2(19) = 38 cm.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'A circle has centre O and radius 5 cm. From an external point P, tangent PT is drawn. If OP = 13 cm, find PT.',
          optA: '12 cm',
          optB: '10 cm',
          optC: '11 cm',
          optD: '8 cm',
          ans: 'A',
          exp: 'PT = √(13² − 5²) = 12 cm.'
        },
        {
          text: 'Two tangents PA and PB are drawn from P to a circle. If ∠APB = 90°, find ∠AOB.',
          optA: '60°',
          optB: '90°',
          optC: '120°',
          optD: '100°',
          ans: 'B',
          exp: '∠AOB = 180° − ∠APB = 180° − 90° = 90°.'
        },
        {
          text: 'A circle touches the sides of ΔPQR. Tangent lengths from P, Q, R are 4 cm, 6 cm and 5 cm. Find the perimeter of ΔPQR.',
          optA: '25 cm',
          optB: '32 cm',
          optC: '30 cm',
          optD: '35 cm',
          ans: 'C',
          exp: 'PQ = 4 + 6 = 10 cm, QR = 6 + 5 = 11 cm, RP = 5 + 4 = 9 cm. Perimeter = 10 + 11 + 9 = 30 cm.'
        },
        {
          text: 'A tangent from a point 25 cm away from the centre is 24 cm long. Find the radius of the circle.',
          optA: '8 cm',
          optB: '9 cm',
          optC: '6 cm',
          optD: '7 cm',
          ans: 'D',
          exp: 'r² = 25² − 24² = 625 − 576 = 49 => r = 7 cm.'
        },
        {
          text: 'Two tangents PA and PB are drawn from P. If PA = 2y + 5 and PB = 4y − 9, find y and tangent length.',
          optA: 'y = 7, tangent length = 19 units',
          optB: 'y = 6, tangent length = 17 units',
          optC: 'y = 8, tangent length = 21 units',
          optD: 'y = 7, tangent length = 18 units',
          ans: 'A',
          exp: '2y + 5 = 4y − 9 => 2y = 14 => y = 7. Tangent length = 2(7) + 5 = 19 units.'
        },
        {
          text: 'A circle is inscribed in a square of perimeter 48 cm. Find the radius of the circle.',
          optA: '12 cm',
          optB: '6 cm',
          optC: '8 cm',
          optD: '4 cm',
          ans: 'B',
          exp: 'Side of square = 48/4 = 12 cm. Diameter of circle = 12 cm => radius = 12/2 = 6 cm.'
        },
        {
          text: 'The angle between two tangents from an external point is 50°. Find the angle subtended by the points of contact at the centre.',
          optA: '140°',
          optB: '120°',
          optC: '130°',
          optD: '100°',
          ans: 'C',
          exp: '∠AOB = 180° − 50° = 130°.'
        },
        {
          text: 'A tangent at A to a circle of radius 10 cm meets a line through centre O at P. If OP = 26 cm, find PA.',
          optA: '20 cm',
          optB: '22 cm',
          optC: '25 cm',
          optD: '24 cm',
          ans: 'D',
          exp: 'PA = √(26² − 10²) = √(676 − 100) = √576 = 24 cm.'
        },
        {
          text: 'Prove that the line joining the centre of a circle to an external point bisects the angle between the two tangents drawn from that point.',
          optA: 'True, by RHS congruence of ΔOAP and ΔOBP giving ∠APO = ∠BPO',
          optB: 'False, it only bisects the radius',
          optC: 'True only when tangents are perpendicular',
          optD: 'False, the line bisects the chords only',
          ans: 'A',
          exp: 'Triangles OAP and OBP are congruent by RHS (OA=OB, OP common, ∠OAP=∠OBP=90°). Thus ∠APO = ∠BPO, meaning OP bisects ∠APB.'
        },
        {
          text: 'A circle touches all four sides of a rhombus. The tangent lengths from one vertex are 5 cm and from the adjacent vertex are 7 cm. Find the side length of the rhombus.',
          optA: '10 cm',
          optB: '12 cm',
          optC: '14 cm',
          optD: '15 cm',
          ans: 'B',
          exp: 'Side of rhombus = sum of tangent segments from adjacent vertices = 5 + 7 = 12 cm.'
        }
      ]
    }
  ];

  // Chapter 11: Areas Related to Circles (5 Mock Tests, 50 Questions)
  const ch11Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'Find the area of a circle of radius 7 cm. (Use π = 22/7)',
          optA: '154 cm²',
          optB: '144 cm²',
          optC: '176 cm²',
          optD: '132 cm²',
          ans: 'A',
          exp: 'Area = πr² = (22/7) × 7² = 22 × 7 = 154 cm².'
        },
        {
          text: 'The circumference of a circle is 44 cm. Find its radius and area. (Use π = 22/7)',
          optA: 'r = 14 cm, Area = 616 cm²',
          optB: 'r = 7 cm, Area = 154 cm²',
          optC: 'r = 7 cm, Area = 308 cm²',
          optD: 'r = 3.5 cm, Area = 38.5 cm²',
          ans: 'B',
          exp: '2πr = 44 => 2(22/7)r = 44 => r = 7 cm. Area = (22/7) × 49 = 154 cm².'
        },
        {
          text: 'Find the length of an arc subtending an angle of 90° at the centre of a circle of radius 14 cm.',
          optA: '11 cm',
          optB: '44 cm',
          optC: '22 cm',
          optD: '33 cm',
          ans: 'C',
          exp: 'Arc length = (θ/360) × 2πr = (90/360) × 2 × (22/7) × 14 = 1/4 × 88 = 22 cm.'
        },
        {
          text: 'Find the area of a sector of angle 60° in a circle of radius 21 cm.',
          optA: '220 cm²',
          optB: '240 cm²',
          optC: '210 cm²',
          optD: '231 cm²',
          ans: 'D',
          exp: 'Area = (60/360) × π × 21² = 1/6 × (22/7) × 441 = 1/6 × 1386 = 231 cm².'
        },
        {
          text: 'A wheel has radius 35 cm. How far does it travel in 20 complete revolutions?',
          optA: '44 m',
          optB: '40 m',
          optC: '48 m',
          optD: '50 m',
          ans: 'A',
          exp: 'Circumference = 2 × (22/7) × 35 = 220 cm = 2.2 m. In 20 revolutions = 20 × 2.2 = 44 m.'
        },
        {
          text: 'A sector has radius 10.5 cm and central angle 120°. Find its perimeter. (Use π = 22/7)',
          optA: '41 cm',
          optB: '43 cm',
          optC: '45 cm',
          optD: '47 cm',
          ans: 'B',
          exp: 'Arc length = (120/360) × 2 × (22/7) × 10.5 = 1/3 × 66 = 22 cm. Perimeter = 2r + arc = 2(10.5) + 22 = 21 + 22 = 43 cm.'
        },
        {
          text: 'Find the area of a semicircle whose diameter is 14 cm.',
          optA: '154 cm²',
          optB: '88 cm²',
          optC: '77 cm²',
          optD: '66 cm²',
          ans: 'C',
          exp: 'Radius = 7 cm. Area = 1/2 × πr² = 1/2 × 154 = 77 cm².'
        },
        {
          text: 'A circular garden has radius 14 m. Find the cost of laying grass at ₹12 per m².',
          optA: '₹7,200',
          optB: '₹7,500',
          optC: '₹6,160',
          optD: '₹7,392',
          ans: 'D',
          exp: 'Area = (22/7) × 14² = 616 m². Cost = 616 × 12 = ₹7,392.'
        },
        {
          text: 'A sector of radius 14 cm has area 154 cm². Find its central angle.',
          optA: '90°',
          optB: '60°',
          optC: '45°',
          optD: '120°',
          ans: 'A',
          exp: '(θ/360) × (22/7) × 14² = 154 => (θ/360) × 616 = 154 => θ/360 = 1/4 => θ = 90°.'
        },
        {
          text: 'Find the area of a quadrant of a circle of radius 28 cm.',
          optA: '308 cm²',
          optB: '616 cm²',
          optC: '462 cm²',
          optD: '154 cm²',
          ans: 'B',
          exp: 'Quadrant area = 1/4 × πr² = 1/4 × (22/7) × 28² = 1/4 × 2464 = 616 cm².'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'A circular track has inner radius 28 m and outer radius 35 m. Find the area of the track.',
          optA: '1,250 m²',
          optB: '1,400 m²',
          optC: '1,386 m²',
          optD: '1,450 m²',
          ans: 'C',
          exp: 'Area = π(R² − r²) = (22/7)(35² − 28²) = (22/7)(1225 − 784) = (22/7) × 441 = 1,386 m².'
        },
        {
          text: 'Find the area of a 90° sector of a circle of radius 14 cm and the length of its arc.',
          optA: 'Area = 154 cm², Arc = 44 cm',
          optB: 'Area = 308 cm², Arc = 22 cm',
          optC: 'Area = 144 cm², Arc = 20 cm',
          optD: 'Area = 154 cm², Arc = 22 cm',
          ans: 'D',
          exp: 'Sector area = 1/4 × (22/7) × 196 = 154 cm². Arc length = 1/4 × 2 × (22/7) × 14 = 22 cm.'
        },
        {
          text: 'The area of a circle is 616 cm². Find its radius and circumference. (Use π = 22/7)',
          optA: 'r = 14 cm, Circumference = 88 cm',
          optB: 'r = 7 cm, Circumference = 44 cm',
          optC: 'r = 14 cm, Circumference = 44 cm',
          optD: 'r = 21 cm, Circumference = 132 cm',
          ans: 'A',
          exp: 'πr² = 616 => (22/7)r² = 616 => r² = 196 => r = 14 cm. Circumference = 2 × (22/7) × 14 = 88 cm.'
        },
        {
          text: 'A wire is bent into a circle of radius 21 cm. It is then reshaped into a square. Find the side of the square.',
          optA: '30 cm',
          optB: '33 cm',
          optC: '35 cm',
          optD: '44 cm',
          ans: 'B',
          exp: 'Wire length = 2πr = 2 × (22/7) × 21 = 132 cm. Side of square = 132 / 4 = 33 cm.'
        },
        {
          text: 'Find the area of the minor segment formed by a 90° sector in a circle of radius 14 cm.',
          optA: '50 cm²',
          optB: '60 cm²',
          optC: '56 cm²',
          optD: '48 cm²',
          ans: 'C',
          exp: 'Sector area = 154 cm². Triangle area = 1/2 × 14 × 14 = 98 cm². Minor segment = 154 − 98 = 56 cm².'
        },
        {
          text: 'A circular table top has diameter 1.4 m. Find the cost of polishing it at ₹50 per m².',
          optA: '₹70',
          optB: '₹84',
          optC: '₹75',
          optD: '₹77',
          ans: 'D',
          exp: 'Radius = 0.7 m. Area = (22/7) × 0.49 = 1.54 m². Cost = 1.54 × 50 = ₹77.'
        },
        {
          text: 'The minute hand of a clock is 14 cm long. Find the area swept in 15 minutes.',
          optA: '154 cm²',
          optB: '144 cm²',
          optC: '160 cm²',
          optD: '77 cm²',
          ans: 'A',
          exp: 'In 15 minutes, the minute hand covers 90° (quadrant). Area = 1/4 × (22/7) × 14² = 154 cm².'
        },
        {
          text: 'A horse is tied at a corner of a square field with a rope 7 m long. Find the maximum grazing area.',
          optA: '40 m²',
          optB: '38.5 m²',
          optC: '42 m²',
          optD: '49 m²',
          ans: 'B',
          exp: 'Grazing region is a quadrant of radius 7 m: Area = 1/4 × (22/7) × 49 = 154/4 = 38.5 m².'
        },
        {
          text: 'A circular pond of radius 7 m is surrounded by a path 3.5 m wide. Find the area of the path.',
          optA: '185 m²',
          optB: '190 m²',
          optC: '192.5 m²',
          optD: '200 m²',
          ans: 'C',
          exp: 'Outer radius = 7 + 3.5 = 10.5 m. Path area = (22/7)(10.5² − 7²) = (22/7)(110.25 − 49) = (22/7)(61.25) = 192.5 m².'
        },
        {
          text: 'A sector has arc length 11 cm and radius 7 cm. Find its central angle.',
          optA: '60°',
          optB: '45°',
          optC: '120°',
          optD: '90°',
          ans: 'D',
          exp: 'Arc length = (θ/360) × 2 × (22/7) × 7 = (θ/360) × 44 = 11 => θ/360 = 1/4 => θ = 90°.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'A circular ring has outer radius 14 cm and inner radius 7 cm. Find its area.',
          optA: '462 cm²',
          optB: '450 cm²',
          optC: '484 cm²',
          optD: '500 cm²',
          ans: 'A',
          exp: 'Area = π(R² − r²) = (22/7)(196 − 49) = (22/7) × 147 = 462 cm².'
        },
        {
          text: 'A sector of radius 21 cm has perimeter 75 cm. Find the angle of the sector. (Use π = 22/7)',
          optA: '60°',
          optB: '90°',
          optC: '45°',
          optD: '120°',
          ans: 'B',
          exp: 'Perimeter = 2r + arc => 75 = 42 + arc => arc = 33 cm. 33 = (θ/360) × 2 × (22/7) × 21 = (θ/360) × 132 => θ/360 = 1/4 => θ = 90°.'
        },
        {
          text: 'A circular lawn has diameter 28 m. A path 7 m wide runs around it outside. Find the area of the path.',
          optA: '700 m²',
          optB: '750 m²',
          optC: '770 m²',
          optD: '784 m²',
          ans: 'C',
          exp: 'Inner radius = 14 m, outer radius = 21 m. Path area = (22/7)(21² − 14²) = (22/7)(441 − 196) = (22/7)(245) = 770 m².'
        },
        {
          text: 'Find the area of the major sector of a circle of radius 7 cm if the minor sector angle is 90°.',
          optA: '120.5 cm²',
          optB: '110 cm²',
          optC: '112.5 cm²',
          optD: '115.5 cm²',
          ans: 'D',
          exp: 'Major angle = 360° − 90° = 270°. Area = (270/360) × (22/7) × 49 = 3/4 × 154 = 115.5 cm².'
        },
        {
          text: 'A cow is tied at the midpoint of one side of a square field with rope length 14 m. Find the grazing area inside the field.',
          optA: '308 m²',
          optB: '154 m²',
          optC: '616 m²',
          optD: '462 m²',
          ans: 'A',
          exp: 'Tied at the edge midpoint, the cow grazes a semicircle inside the field. Area = 1/2 × πr² = 1/2 × (22/7) × 196 = 308 m².'
        },
        {
          text: 'The circumference of a circular sheet is 132 cm. Find the area of the sheet.',
          optA: '1,200 cm²',
          optB: '1,386 cm²',
          optC: '1,450 cm²',
          optD: '1,350 cm²',
          ans: 'B',
          exp: '2πr = 132 => r = 21 cm. Area = (22/7) × 21² = 1,386 cm².'
        },
        {
          text: 'A sector of angle 150° has area 231 cm². Find the radius of the circle.',
          optA: '14.0 cm',
          optB: '12.5 cm',
          optC: '√176.4 cm ≈ 13.28 cm',
          optD: '15.0 cm',
          ans: 'C',
          exp: '(150/360) × (22/7) × r² = 231 => (5/12) × (22/7)r² = 231 => r² = 231 × 84 / 110 = 176.4 => r = √176.4 ≈ 13.28 cm.'
        },
        {
          text: 'Find the sum of the area of a quadrant of radius 14 cm and a semicircle of radius 7 cm.',
          optA: '220 cm²',
          optB: '240 cm²',
          optC: '210 cm²',
          optD: '231 cm²',
          ans: 'D',
          exp: 'Quadrant area = 1/4 × (22/7) × 196 = 154 cm². Semicircle area = 1/2 × (22/7) × 49 = 77 cm². Total = 154 + 77 = 231 cm².'
        },
        {
          text: 'A circular flower bed of radius 3.5 m is enclosed by a border of width 0.5 m. Find the approximate area of the border.',
          optA: '11.79 m²',
          optB: '12.50 m²',
          optC: '10.85 m²',
          optD: '13.20 m²',
          ans: 'A',
          exp: 'Outer radius = 4.0 m. Area = (22/7)(4² − 3.5²) = (22/7)(16 − 12.25) = (22/7)(3.75) ≈ 11.79 m².'
        },
        {
          text: 'A fan blade sweeps a sector of 72° in a circle of radius 35 cm. Find the area swept.',
          optA: '750 cm²',
          optB: '770 cm²',
          optC: '800 cm²',
          optD: '720 cm²',
          ans: 'B',
          exp: 'Area = (72/360) × (22/7) × 35² = 1/5 × 3850 = 770 cm².'
        }
      ]
    },
    {
      slot: 4,
      questions: [
        {
          text: 'A square of side 14 cm has a circle inscribed in it. Find the area of the portion of the square outside the circle.',
          optA: '40 cm²',
          optB: '48 cm²',
          optC: '42 cm²',
          optD: '36 cm²',
          ans: 'C',
          exp: 'Square area = 14² = 196 cm². Circle radius = 7 cm, area = (22/7) × 49 = 154 cm². Remaining = 196 − 154 = 42 cm².'
        },
        {
          text: 'A circle is inscribed in a square of side 10 cm. Find the area between the square and the circle.',
          optA: '(100 − 50π) cm²',
          optB: '(100 − 20π) cm²',
          optC: '25π cm²',
          optD: '(100 − 25π) cm²',
          ans: 'D',
          exp: 'Square area = 10² = 100 cm². Radius = 5 cm, circle area = 25π cm². Area difference = (100 − 25π) cm².'
        },
        {
          text: 'A circular disc of radius 10 cm is cut from a square sheet of side 20 cm. Find the remaining area.',
          optA: '400 − 100π ≈ 85.84 cm²',
          optB: '400 − 50π ≈ 243 cm²',
          optC: '100π ≈ 314.16 cm²',
          optD: '200 cm²',
          ans: 'A',
          exp: 'Square area = 400 cm². Disc area = 100π cm². Remaining area = 400 − 100π ≈ 400 − 314.16 = 85.84 cm².'
        },
        {
          text: 'Four identical circles of radius 3.5 cm are cut from a square of side 14 cm. Find the area left in the square.',
          optA: '36 cm²',
          optB: '42 cm²',
          optC: '48 cm²',
          optD: '50 cm²',
          ans: 'B',
          exp: 'Square area = 196 cm². Area of 4 circles = 4 × [(22/7) × 3.5²] = 4 × 38.5 = 154 cm². Area left = 196 − 154 = 42 cm².'
        },
        {
          text: 'A circular running track has radius 70 m. How many metres does a runner cover in 5 rounds? (Use π = 22/7)',
          optA: '2,000 m',
          optB: '2,100 m',
          optC: '2,200 m',
          optD: '2,400 m',
          ans: 'C',
          exp: 'One round = 2πr = 2 × (22/7) × 70 = 440 m. 5 rounds = 5 × 440 = 2,200 m.'
        },
        {
          text: 'Find the area of a 120° sector of radius 7 cm, and the remaining major sector.',
          optA: 'Minor = 150/3 cm², Major = 300/3 cm²',
          optB: 'Minor = 154 cm², Major = 308 cm²',
          optC: 'Minor = 77 cm², Major = 77 cm²',
          optD: 'Minor = 154/3 cm², Major = 308/3 cm²',
          ans: 'D',
          exp: 'Total circle = 154 cm². Minor sector (120°) = (120/360) × 154 = 154/3 cm². Major sector = 154 − 154/3 = 308/3 cm².'
        },
        {
          text: 'A circular sheet of radius 14 cm is divided into 8 equal sectors. Find the area and arc length of each sector.',
          optA: 'Area = 77 cm², Arc length = 11 cm',
          optB: 'Area = 66 cm², Arc length = 10 cm',
          optC: 'Area = 88 cm², Arc length = 12 cm',
          optD: 'Area = 154 cm², Arc length = 22 cm',
          ans: 'A',
          exp: 'Total area = (22/7) × 196 = 616 cm². Each sector area = 616/8 = 77 cm². Circumference = 88 cm, each arc = 88/8 = 11 cm.'
        },
        {
          text: 'A semicircular window has radius 21 cm. Find its total perimeter including the diameter boundary.',
          optA: '100 cm',
          optB: '108 cm',
          optC: '112 cm',
          optD: '96 cm',
          ans: 'B',
          exp: 'Curved boundary = πr = (22/7) × 21 = 66 cm. Diameter = 2r = 42 cm. Total perimeter = 66 + 42 = 108 cm.'
        },
        {
          text: 'A circular park has radius 21 m. A 3 m wide path is made inside along its boundary. Find the path area.',
          optA: '350 m²',
          optB: '380 m²',
          optC: '368.14 m² (approximately)',
          optD: '360 m²',
          ans: 'C',
          exp: 'Outer radius = 21 m, inner radius = 18 m. Path area = (22/7)(21² − 18²) = (22/7)(441 − 324) = (22/7)(117) ≈ 368.14 m².'
        },
        {
          text: 'The area of a sector is 1/6 of the area of its circle. Find its central angle and the ratio of its arc to circumference.',
          optA: '45° and 1:8',
          optB: '90° and 1:4',
          optC: '30° and 1:12',
          optD: '60° and 1:6',
          ans: 'D',
          exp: 'θ/360 = 1/6 => θ = 60°. Arc length / Circumference = θ/360 = 1:6.'
        }
      ]
    },
    {
      slot: 5,
      questions: [
        {
          text: 'A circular track has radii 42 m and 35 m. Find the cost of paving it at ₹8 per m².',
          optA: '₹13,552',
          optB: '₹12,800',
          optC: '₹14,000',
          optD: '₹13,200',
          ans: 'A',
          exp: 'Track area = (22/7)(42² − 35²) = (22/7)(1764 − 1225) = (22/7) × 539 = 1,694 m². Cost = 1694 × 8 = ₹13,552.'
        },
        {
          text: 'A sector has radius 14 cm and arc length 22 cm. Find its area.',
          optA: '144 cm²',
          optB: '154 cm²',
          optC: '164 cm²',
          optD: '176 cm²',
          ans: 'B',
          exp: 'Area of sector = 1/2 × r × arc length = 1/2 × 14 × 22 = 154 cm².'
        },
        {
          text: 'A circular sheet of radius 21 cm has a sector of angle 120° removed. Find the area remaining.',
          optA: '880 cm²',
          optB: '900 cm²',
          optC: '924 cm²',
          optD: '950 cm²',
          ans: 'C',
          exp: 'Total area = (22/7) × 441 = 1,386 cm². Removed sector (120°) = 1/3 × 1386 = 462 cm². Remaining = 1386 − 462 = 924 cm².'
        },
        {
          text: 'A bicycle wheel makes 500 revolutions while travelling 1.1 km. Find the radius of the wheel.',
          optA: '30 cm',
          optB: '40 cm',
          optC: '28 cm',
          optD: '35 cm',
          ans: 'D',
          exp: 'Distance per revolution = 1100 m / 500 = 2.2 m = 220 cm. 2πr = 220 => 2(22/7)r = 220 => r = 35 cm.'
        },
        {
          text: 'A circular pond has radius 14 m. A path of width 7 m surrounds it. Find the path area and its outer circumference.',
          optA: 'Area = 770 m², Outer circumference = 132 m',
          optB: 'Area = 750 m², Outer circumference = 130 m',
          optC: 'Area = 800 m², Outer circumference = 140 m',
          optD: 'Area = 770 m², Outer circumference = 120 m',
          ans: 'A',
          exp: 'Outer radius = 14 + 7 = 21 m. Path area = (22/7)(21² − 14²) = 770 m². Outer circumference = 2 × (22/7) × 21 = 132 m.'
        },
        {
          text: 'A sector of a circle has angle 45° and area 38.5 cm². Find the radius of the circle.',
          optA: '7 cm',
          optB: '7√2 cm',
          optC: '14 cm',
          optD: '10 cm',
          ans: 'B',
          exp: '(45/360) × (22/7)r² = 38.5 => 1/8 × (22/7)r² = 38.5 => r² = (38.5 × 56)/22 = 98 => r = √98 = 7√2 cm.'
        },
        {
          text: 'A wire of length 88 cm is bent to form (i) a circle and (ii) a square. Which encloses greater area and by how much?',
          optA: 'Square encloses 132 cm² more',
          optB: 'Circle and square enclose equal area',
          optC: 'Circle encloses 132 cm² more',
          optD: 'Circle encloses 144 cm² more',
          ans: 'C',
          exp: 'Circle: 2πr = 88 => r = 14 cm, Area = 616 cm². Square: 4s = 88 => s = 22 cm, Area = 484 cm². Circle encloses 616 − 484 = 132 cm² more.'
        },
        {
          text: 'A circular field of radius 28 m is divided into 4 equal sectors. Find the area and arc length of each sector.',
          optA: 'Area = 550 m², Arc = 40 m',
          optB: 'Area = 600 m², Arc = 42 m',
          optC: 'Area = 616 m², Arc = 40 m',
          optD: 'Area = 616 m², Arc = 44 m',
          ans: 'D',
          exp: 'Total area = (22/7) × 28² = 2464 m² => each sector = 2464/4 = 616 m². Circumference = 2 × (22/7) × 28 = 176 m => each arc = 176/4 = 44 m.'
        },
        {
          text: 'A circular sheet has radius 7 cm. A square of side 7 cm is cut from it. Find the remaining area.',
          optA: '105 cm²',
          optB: '95 cm²',
          optC: '110 cm²',
          optD: '100 cm²',
          ans: 'A',
          exp: 'Circle area = (22/7) × 49 = 154 cm². Square area = 7² = 49 cm². Remaining area = 154 − 49 = 105 cm².'
        },
        {
          text: 'A sector of radius 21 cm has perimeter 86 cm. Find its area.',
          optA: '440 cm²',
          optB: '462 cm²',
          optC: '480 cm²',
          optD: '450 cm²',
          ans: 'B',
          exp: 'Arc length = 86 − 2(21) = 86 − 42 = 44 cm. Area = 1/2 × r × arc length = 1/2 × 21 × 44 = 462 cm².'
        }
      ]
    }
  ];

  const tx = db.transaction(() => {
    ch10Tests.forEach(t => {
      const testId = `test-math-ch10-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-circ-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch10', 'Circles', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-circ-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Circles Mock Test ${t.slot}`);
    });

    ch11Tests.forEach(t => {
      const testId = `test-math-ch11-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-areacirc-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch11', 'Areas Related to Circles', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-areacirc-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Areas Related to Circles Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] Chapters 10 and 11 mock tests successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedCirclesChapters.ts')) {
  seedCirclesChapters();
}
