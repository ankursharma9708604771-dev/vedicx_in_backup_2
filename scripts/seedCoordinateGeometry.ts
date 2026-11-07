import Database from 'better-sqlite3';

export function seedCoordinateGeometry(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 7: Coordinate Geometry (5 Mock Tests, 50 Questions)...');

  const existingTests = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all('math-ch7') as any[];
  const existingSlotMap = new Map(existingTests.map(t => [t.test_number, t.id]));

  for (let slot = 1; slot <= 5; slot++) {
    const testId = existingSlotMap.get(slot) || `test-math-ch7-slot-${slot}`;
    const title = `Coordinate Geometry – Mock Test ${slot}`;
    const accessType = slot === 1 ? 'free' : 'premium';

    const testExists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
    if (!testExists) {
      db.prepare(`
        INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
        VALUES (?, ?, 'mathematics', 'math-ch7', ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
      `).run(testId, title, slot, `Class 10 Coordinate Geometry Mock Test ${slot}`, accessType);
    } else {
      db.prepare(`
        UPDATE mock_tests
        SET title = ?, test_number = ?, total_questions = 10, duration_minutes = 25, max_marks = 20.0, passing_marks = 8.0, access_type = ?, status = 'published'
        WHERE id = ?
      `).run(title, slot, accessType, testId);
    }

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
          text: 'The point (−6, 0) lies on which of the following?',
          optA: 'Positive x-axis',
          optB: 'Negative x-axis',
          optC: 'Positive y-axis',
          optD: 'Quadrant III',
          ans: 'B',
          exp: 'Its y-coordinate is 0, so it lies on the x-axis. Because its x-coordinate is −6 (negative), it lies on the negative x-axis.'
        },
        {
          text: 'Find the length of the line segment joining A(−1, 2) and B(5, 10).',
          optA: '10 units',
          optB: '8 units',
          optC: '12 units',
          optD: '14 units',
          ans: 'A',
          exp: 'AB = √[(5 − (−1))² + (10 − 2)²] = √[6² + 8²] = √[36 + 64] = √100 = 10 units.'
        },
        {
          text: 'Find the midpoint of the line segment joining (−4, 7) and (6, −3).',
          optA: '(2, 2)',
          optB: '(1, 4)',
          optC: '(1, 2)',
          optD: '(2, 4)',
          ans: 'C',
          exp: 'Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2) = ((−4 + 6)/2, (7 + (−3))/2) = (2/2, 4/2) = (1, 2).'
        },
        {
          text: 'The plotted points are A(−3, 1), B(2, 1), C(2, −3). Calculate AB and BC, then state the angle at B.',
          optA: 'AB = 6, BC = 4, ∠B = 60°',
          optB: 'AB = 5, BC = 3, ∠B = 45°',
          optC: 'AB = 4, BC = 5, ∠B = 90°',
          optD: 'AB = 5, BC = 4, ∠B = 90°',
          ans: 'D',
          exp: 'AB is horizontal: 2 − (−3) = 5 units. BC is vertical: 1 − (−3) = 4 units. Horizontal and vertical lines are perpendicular, so ∠B = 90°.'
        },
        {
          text: 'Assertion: The point (0, −5) lies on the y-axis. Reason: Every point on the y-axis has x-coordinate zero. Which option is correct?',
          optA: 'Both A and R are true, and R is the correct explanation of A',
          optB: 'Both A and R are true, but R does not explain A',
          optC: 'A is true but R is false',
          optD: 'A is false but R is true',
          ans: 'A',
          exp: 'By definition, every point on the y-axis has x = 0. Since the point has x = 0, it lies on the y-axis.'
        },
        {
          text: 'A point P(x, 2) is 5 units from Q(1, −1). Find all possible values of x.',
          optA: 'x = 4 or −2',
          optB: 'x = 5 or −3',
          optC: 'x = 6 or −4',
          optD: 'x = 5 only',
          ans: 'B',
          exp: 'PQ² = (x − 1)² + (2 − (−1))² = 25 => (x − 1)² + 9 = 25 => (x − 1)² = 16 => x − 1 = ±4 => x = 5 or x = −3.'
        },
        {
          text: 'A point divides the segment joining A(−2, 3) and B(8, −2) in the ratio 2:3 internally. Find its coordinates.',
          optA: '(1, 2)',
          optB: '(3, 1)',
          optC: '(2, 1)',
          optD: '(2, 0)',
          ans: 'C',
          exp: 'P = ((2×8 + 3×(−2))/5, (2×(−2) + 3×3)/5) = ((16 − 6)/5, (−4 + 9)/5) = (10/5, 5/5) = (2, 1).'
        },
        {
          text: 'A rectangular park has corners P(−4, −2), Q(4, −2), R(4, 3), S(−4, 3). Find its perimeter.',
          optA: '24 units',
          optB: '28 units',
          optC: '30 units',
          optD: '26 units',
          ans: 'D',
          exp: 'Length PQ = 4 − (−4) = 8 units. Breadth QR = 3 − (−2) = 5 units. Perimeter = 2(8 + 5) = 26 units.'
        },
        {
          text: 'Points M(−2, 3) and N(3, 3) lie on the same horizontal line. Find the distance MN.',
          optA: '5 units',
          optB: '4 units',
          optC: '6 units',
          optD: '√13 units',
          ans: 'A',
          exp: 'Since y-coordinates are equal, MN = |3 − (−2)| = 5 units.'
        },
        {
          text: 'Find the point which divides A(−3, 5) and B(9, −1) internally in the ratio 1:2, and find its distance from the origin.',
          optA: 'Point (2, 3), Distance = √13 units',
          optB: 'Point (1, 3), Distance = √10 units',
          optC: 'Point (1, 2), Distance = √5 units',
          optD: 'Point (3, 1), Distance = √10 units',
          ans: 'B',
          exp: 'P = ((1×9 + 2×(−3))/3, (1×(−1) + 2×5)/3) = (3/3, 9/3) = (1, 3). Distance from origin = √(1² + 3²) = √10 units.'
        }
      ]
    },

    // Mock Test 2
    {
      slot: 2,
      questions: [
        {
          text: 'If two points have the same y-coordinate, the line segment joining them is:',
          optA: 'Perpendicular to the x-axis',
          optB: 'Parallel to the x-axis',
          optC: 'Parallel to the y-axis',
          optD: 'Passing through the origin',
          ans: 'B',
          exp: 'Equal y-coordinates mean y = constant, which is a horizontal line parallel to the x-axis.'
        },
        {
          text: 'The distance between (k, 4) and (−2, 4) is 9 units. Find the possible values of k.',
          optA: 'k = 7 or −11',
          optB: 'k = 11 or −7',
          optC: 'k = 9 or −9',
          optD: 'k = 5 or −13',
          ans: 'A',
          exp: 'y-coordinates are equal: |k − (−2)| = 9 => |k + 2| = 9 => k + 2 = ±9 => k = 7 or k = −11.'
        },
        {
          text: 'In what ratio does the point P(2, 0) divide the segment joining A(−4, 3) and B(5, −6)?',
          optA: '2:1 internally',
          optB: '1:2 internally',
          optC: '3:2 externally',
          optD: 'No such ratio exists because P does not lie on line segment AB',
          ans: 'D',
          exp: 'From x-coordinate: (5m − 4n)/(m + n) = 2 => 3m = 6n => m:n = 2:1. But for y-coordinate: (−6(2) + 3(1))/3 = −9/3 = −3 ≠ 0. Hence P is not collinear with A and B.'
        },
        {
          text: 'The midpoint of A(−5, 4) and B(3, −2) is:',
          optA: '(−1, 1)',
          optB: '(1, −1)',
          optC: '(−4, 2)',
          optD: '(−1, −1)',
          ans: 'A',
          exp: 'M = ((−5 + 3)/2, (4 + (−2))/2) = (−2/2, 2/2) = (−1, 1).'
        },
        {
          text: 'A is (2, −3) and the midpoint of AB is (−1, 4). Find the coordinates of point B.',
          optA: '(−3, 7)',
          optB: '(−4, 11)',
          optC: '(0, 1)',
          optD: '(−2, 8)',
          ans: 'B',
          exp: '(2 + x)/2 = −1 => x = −4. (−3 + y)/2 = 4 => y = 11. Point B is (−4, 11).'
        },
        {
          text: 'Determine whether P(1, 2), Q(4, 6), R(7, 10) lie on one straight line.',
          optA: 'No, they form a scalene triangle',
          optB: 'No, PQ + QR ≠ PR',
          optC: 'Yes, PQ = 5, QR = 5, PR = 10, so PQ + QR = PR confirms collinearity',
          optD: 'Cannot be determined without slope formula',
          ans: 'C',
          exp: 'PQ = √[(4−1)² + (6−2)²] = √25 = 5. QR = √[(7−4)² + (10−6)²] = 5. PR = √[(7−1)² + (10−2)²] = √100 = 10. PQ + QR = PR, so points are collinear.'
        },
        {
          text: 'A coordinate grid marks U(−4, −1), V(2, −1), W(2, 3). Find UV, VW and the perimeter of triangle UVW.',
          optA: 'UV = 6, VW = 4, Perimeter = 10 + 2√13 units',
          optB: 'UV = 6, VW = 4, Perimeter = 20 units',
          optC: 'UV = 5, VW = 3, Perimeter = 8 + √34 units',
          optD: 'UV = 6, VW = 3, Perimeter = 9 + 3√5 units',
          ans: 'A',
          exp: 'UV = 2 − (−4) = 6. VW = 3 − (−1) = 4. UW = √(6² + 4²) = √52 = 2√13. Perimeter = 6 + 4 + 2√13 = 10 + 2√13 units.'
        },
        {
          text: 'Why is the distance of a point (x, y) from the origin always equal to √(x² + y²)?',
          optA: 'Because the origin is (0, 0), so √[(x − 0)² + (y − 0)²] simplifies to √(x² + y²)',
          optB: 'Because x and y are always positive',
          optC: 'Because it is an equilateral triangle',
          optD: 'Because the slope from the origin is 1',
          ans: 'A',
          exp: 'Applying distance formula with (0,0) yields √[(x − 0)² + (y − 0)²] = √(x² + y²).'
        },
        {
          text: 'A point P lies on the x-axis and is equidistant from A(−2, 4) and B(6, 2). Find the coordinates of P.',
          optA: '(1, 0)',
          optB: '(5/4, 0)',
          optC: '(3/2, 0)',
          optD: '(2, 0)',
          ans: 'B',
          exp: 'P = (x, 0). PA² = (x + 2)² + 16 = x² + 4x + 20. PB² = (x − 6)² + 4 = x² − 12x + 40. x² + 4x + 20 = x² − 12x + 40 => 16x = 20 => x = 5/4. P = (5/4, 0).'
        },
        {
          text: 'Points A(−3, 2), B(1, 2), C(1, −2), D(−3, −2) form a quadrilateral. Name the quadrilateral and find its diagonal length.',
          optA: 'Rectangle with diagonal 6 units',
          optB: 'Parallelogram with diagonal 5 units',
          optC: 'Square with diagonal 4√2 units',
          optD: 'Rhombus with diagonal 8 units',
          ans: 'C',
          exp: 'Sides AB = 4, BC = 4, CD = 4, DA = 4. Adjacent sides are perpendicular. It is a square. Diagonal = √(4² + 4²) = √32 = 4√2 units.'
        }
      ]
    },

    // Mock Test 3
    {
      slot: 3,
      questions: [
        {
          text: 'If the distance between (x, −1) and (2, 5) is 10 units, find x.',
          optA: 'x = 8 or −4',
          optB: 'x = 10 or −6',
          optC: 'x = 12 or −8',
          optD: 'x = 10 only',
          ans: 'B',
          exp: '(x − 2)² + (5 − (−1))² = 100 => (x − 2)² + 36 = 100 => (x − 2)² = 64 => x − 2 = ±8 => x = 10 or x = −6.'
        },
        {
          text: 'A point P divides A(−8, 7) and B(7, −3) internally in the ratio 2:3. Find P.',
          optA: '(−1, 2)',
          optB: '(0, 1)',
          optC: '(−2, 3)',
          optD: '(−3, 4)',
          ans: 'C',
          exp: 'P = ((2×7 + 3×(−8))/5, (2×(−3) + 3×7)/5) = ((14 − 24)/5, (−6 + 21)/5) = (−10/5, 15/5) = (−2, 3).'
        },
        {
          text: 'For points A(0, 0), B(3, 4), C(6, 0), which statement is correct?',
          optA: 'AB = AC',
          optB: 'AB = BC (ΔABC is isosceles)',
          optC: 'BC = AC',
          optD: 'All three sides are equal',
          ans: 'B',
          exp: 'AB = √(3² + 4²) = 5. BC = √[(6 − 3)² + (0 − 4)²] = 5. AC = 6. Since AB = BC = 5, the triangle is isosceles.'
        },
        {
          text: 'For vertices A(−4, 0), B(0, 3), C(4, 0), find lengths AB, BC, AC and identify the triangle.',
          optA: 'AB = 5, BC = 5, AC = 8; Isosceles triangle',
          optB: 'AB = 4, BC = 4, AC = 6; Isosceles triangle',
          optC: 'AB = 5, BC = 5, AC = 5; Equilateral triangle',
          optD: 'AB = 3, BC = 4, AC = 5; Right-angled triangle',
          ans: 'A',
          exp: 'AB = √[4² + 3²] = 5. BC = √[4² + 3²] = 5. AC = 4 − (−4) = 8. Triangle is isosceles.'
        },
        {
          text: 'The midpoint of (a, 7) and (5, −1) is (1, 3). Find the value of a.',
          optA: 'a = −1',
          optB: 'a = −2',
          optC: 'a = −3',
          optD: 'a = −4',
          ans: 'C',
          exp: '(a + 5)/2 = 1 => a + 5 = 2 => a = −3.'
        },
        {
          text: 'A point P(k, k) is equidistant from the origin (0, 0) and the point (4, 0). Find k.',
          optA: 'k = 1',
          optB: 'k = 3',
          optC: 'k = 4',
          optD: 'k = 2',
          ans: 'D',
          exp: 'OP² = k² + k² = 2k². Distance to (4, 0) squared = (k − 4)² + k². Equating: 2k² = k² − 8k + 16 + k² => 8k = 16 => k = 2.'
        },
        {
          text: 'A line segment joins A(−5, 2) and B(7, −4). Find the point one-third of the way from A to B.',
          optA: '(−1, 0)',
          optB: '(0, −1)',
          optC: '(1, −2)',
          optD: '(−2, 1)',
          ans: 'A',
          exp: 'One-third of the way from A means AP:PB = 1:2. P = ((1×7 + 2×(−5))/3, (1×(−4) + 2×2)/3) = (−3/3, 0/3) = (−1, 0).'
        },
        {
          text: 'State whether true or false: "Every point on the x-axis is equidistant from the points (0, 4) and (0, −4)."',
          optA: 'False, only the origin is equidistant',
          optB: 'True, for any point (x, 0), distance squared to both points is x² + 16',
          optC: 'False, the points lie on opposite sides',
          optD: 'True only for positive x',
          ans: 'B',
          exp: 'Distance from (x, 0) to (0, 4) is √(x² + 16). Distance to (0, −4) is √(x² + 16). They are identical for all real values of x.'
        },
        {
          text: 'The points E(−2, −3), F(−2, 2), G(3, 2) are plotted. Calculate EF and FG, and the angle at F.',
          optA: 'EF = 4, FG = 5, ∠F = 45°',
          optB: 'EF = 5, FG = 4, ∠F = 60°',
          optC: 'EF = 5, FG = 5, ∠F = 90°',
          optD: 'EF = 6, FG = 6, ∠F = 90°',
          ans: 'C',
          exp: 'EF is vertical: 2 − (−3) = 5. FG is horizontal: 3 − (−2) = 5. Vertical and horizontal lines meet at 90°, so ∠F = 90°.'
        },
        {
          text: 'Points A(−1, 1), B(3, 4), C(6, 0), D(2, −3) form which type of quadrilateral?',
          optA: 'Rectangle (non-square)',
          optB: 'Rhombus (non-square)',
          optC: 'Parallelogram',
          optD: 'Square (all 4 sides = 5 and diagonals = 5√2)',
          ans: 'D',
          exp: 'AB = √[4² + 3²] = 5, BC = √[3² + (−4)²] = 5, CD = √[(−4)² + (−3)²] = 5, DA = √[(−3)² + 4²] = 5. Diagonals AC = √[7² + (−1)²] = √50 = 5√2, BD = √[(−1)² + (−7)²] = √50 = 5√2. All sides and diagonals are equal => Square.'
        }
      ]
    },

    // Mock Test 4
    {
      slot: 4,
      questions: [
        {
          text: 'What is the ordinate (y-coordinate) of any point lying on the x-axis?',
          optA: '0',
          optB: '1',
          optC: '−1',
          optD: 'Any real number',
          ans: 'A',
          exp: 'The equation of the x-axis is y = 0. Therefore, the ordinate of every point on the x-axis is always 0.'
        },
        {
          text: 'In what ratio does the y-axis divide the line segment joining A(−8, 6) and B(4, −3)?',
          optA: '1:2',
          optB: '2:1 internally',
          optC: '3:1',
          optD: '2:3',
          ans: 'B',
          exp: 'Points on y-axis have x = 0: (4m − 8n)/(m + n) = 0 => 4m = 8n => m:n = 2:1.'
        },
        {
          text: 'A point P(3, y) is 13 units from Q(8, 1). Find the possible values of y.',
          optA: 'y = 12 or −10',
          optB: 'y = 14 or −12',
          optC: 'y = 13 or −11',
          optD: 'y = 11 or −13',
          ans: 'C',
          exp: '(8 − 3)² + (1 − y)² = 169 => 25 + (y − 1)² = 169 => (y − 1)² = 144 => y − 1 = ±12 => y = 13 or y = −11.'
        },
        {
          text: 'If P divides the join of A(x₁, y₁) and B(x₂, y₂) internally in ratio m:n, its x-coordinate is:',
          optA: '(mx₁ + nx₂)/(m + n)',
          optB: '(mx₂ + nx₁)/(2)',
          optC: '(nx₂ − mx₁)/(m + n)',
          optD: '(mx₂ + nx₁)/(m + n)',
          ans: 'D',
          exp: 'By the section formula for internal division, x = (mx₂ + nx₁)/(m + n).'
        },
        {
          text: 'The points A(−2, 0), B(2, 0), C(0, 3) are vertices of a triangle. Find its perimeter.',
          optA: '4 + 2√13 units',
          optB: '4 + √13 units',
          optC: '6 + 2√13 units',
          optD: '10 units',
          ans: 'A',
          exp: 'AB = 2 − (−2) = 4. AC = √[2² + 3²] = √13. BC = √[2² + 3²] = √13. Perimeter = 4 + 2√13 units.'
        },
        {
          text: 'Points P(−3, 4), Q(2, 4), R(2, −1) are plotted. Identify the right angle and length of the third side PR.',
          optA: '∠P = 90°, PR = 10 units',
          optB: '∠Q = 90°, PR = 5√2 units',
          optC: '∠R = 90°, PR = 5 units',
          optD: '∠Q = 90°, PR = 7 units',
          ans: 'B',
          exp: 'PQ is horizontal (length 5), QR is vertical (length 5). Hence ∠Q = 90°. By Pythagoras, PR = √(5² + 5²) = 5√2 units.'
        },
        {
          text: 'A(−3, 5) and B(x, y) have midpoint (2, −1). Determine the coordinates of B.',
          optA: '(5, −6)',
          optB: '(7, −5)',
          optC: '(7, −7)',
          optD: '(6, −7)',
          ans: 'C',
          exp: '(−3 + x)/2 = 2 => x = 7. (5 + y)/2 = −1 => y = −7. B = (7, −7).'
        },
        {
          text: 'A point P divides A(1, 2) and B(7, 8) in the ratio 1:2 internally. Find the coordinates of P.',
          optA: '(2, 3)',
          optB: '(4, 5)',
          optC: '(3, 5)',
          optD: '(3, 4)',
          ans: 'D',
          exp: 'P = ((1×7 + 2×1)/3, (1×8 + 2×2)/3) = (9/3, 12/3) = (3, 4).'
        },
        {
          text: 'On the grid, X(−4, 2), Y(0, 2), Z(0, −3). Find XY and YZ, then calculate the distance XZ.',
          optA: 'XY = 4, YZ = 5, XZ = √41 units',
          optB: 'XY = 4, YZ = 5, XZ = 7 units',
          optC: 'XY = 3, YZ = 4, XZ = 5 units',
          optD: 'XY = 5, YZ = 4, XZ = √41 units',
          ans: 'A',
          exp: 'XY = 0 − (−4) = 4. YZ = 2 − (−3) = 5. In right triangle XYZ with ∠Y = 90°, XZ = √(4² + 5²) = √41 units.'
        },
        {
          text: 'Can three distinct collinear points have all three pairwise distances equal? Justify.',
          optA: 'Yes, if they form an equilateral line',
          optB: 'No, because one point lies between the other two, so the largest distance equals the sum of the other two',
          optC: 'Yes, if one point is the origin',
          optD: 'Cannot be determined',
          ans: 'B',
          exp: 'For collinear points A, B, C with B between A and C, AC = AB + BC. Since distances are positive, AC must be strictly greater than AB and BC, so all three cannot be equal.'
        }
      ]
    },

    // Mock Test 5
    {
      slot: 5,
      questions: [
        {
          text: 'The distance between (0, 0) and (−8, 15) is:',
          optA: '7 units',
          optB: '17 units',
          optC: '23 units',
          optD: '289 units',
          ans: 'B',
          exp: 'Distance = √[(−8)² + 15²] = √(64 + 225) = √289 = 17 units.'
        },
        {
          text: 'A(−4, 7) and B(6, −3) are endpoints of a segment. Find the point that divides AB internally in the ratio 3:2.',
          optA: '(1, 2)',
          optB: '(3, 0)',
          optC: '(2, 1)',
          optD: '(2, 2)',
          ans: 'C',
          exp: 'P = ((3×6 + 2×(−4))/5, (3×(−3) + 2×7)/5) = ((18 − 8)/5, (−9 + 14)/5) = (10/5, 5/5) = (2, 1).'
        },
        {
          text: 'The points (2, 3), (4, k), and (6, 7) are collinear. Determine the value of k.',
          optA: 'k = 4',
          optB: 'k = 6',
          optC: 'k = 4.5',
          optD: 'k = 5',
          ans: 'D',
          exp: 'Equal horizontal spacing: x increases by 2. Thus y must increase by equal amounts: k − 3 = 7 − k => 2k = 10 => k = 5.'
        },
        {
          text: 'A delivery route connects A(−2, 1), B(4, 1), and C(4, 9). Find the total route length A→B→C and direct distance A→C.',
          optA: 'Route = 14 units, Direct AC = 10 units',
          optB: 'Route = 12 units, Direct AC = 8 units',
          optC: 'Route = 15 units, Direct AC = 10 units',
          optD: 'Route = 14 units, Direct AC = 12 units',
          ans: 'A',
          exp: 'AB = 4 − (−2) = 6. BC = 9 − 1 = 8. Route = 6 + 8 = 14 units. Direct AC = √(6² + 8²) = 10 units.'
        },
        {
          text: 'Which point is closer to the origin: P(−5, 12) or Q(8, −6)?',
          optA: 'P is closer (OP = 12, OQ = 14)',
          optB: 'Q is closer (OQ = 10 units, while OP = 13 units)',
          optC: 'Both are at equal distance of 10 units',
          optD: 'Cannot be determined without quadrant positions',
          ans: 'B',
          exp: 'OP = √[(−5)² + 12²] = √169 = 13 units. OQ = √[8² + (−6)²] = √100 = 10 units. Since 10 < 13, Q is closer to the origin.'
        },
        {
          text: 'The points A(−2, −2), B(3, −2), C(3, 2), D(−2, 2) are plotted. Find the perimeter and area of the rectangle.',
          optA: 'Perimeter = 20 units, Area = 18 sq units',
          optB: 'Perimeter = 16 units, Area = 20 sq units',
          optC: 'Perimeter = 18 units, Area = 20 sq units',
          optD: 'Perimeter = 18 units, Area = 24 sq units',
          ans: 'C',
          exp: 'Length = 3 − (−2) = 5. Breadth = 2 − (−2) = 4. Perimeter = 2(5 + 4) = 18 units. Area = 5 × 4 = 20 sq units.'
        },
        {
          text: 'A point P lies on the y-axis and is 5 units from (3, 0). Find its possible coordinates.',
          optA: '(0, 5) or (0, −5)',
          optB: '(0, 3) or (0, −3)',
          optC: '(4, 0) or (−4, 0)',
          optD: '(0, 4) or (0, −4)',
          ans: 'D',
          exp: 'P = (0, y). (0 − 3)² + (y − 0)² = 25 => 9 + y² = 25 => y² = 16 => y = ±4. P = (0, 4) or (0, −4).'
        },
        {
          text: 'A point P divides A(−1, 4) and B(5, −2) internally in the ratio 2:1. In which quadrant or axis does P lie?',
          optA: 'P(3, 0) lies on the positive x-axis (not in any quadrant)',
          optB: 'Quadrant I',
          optC: 'Quadrant IV',
          optD: 'Positive y-axis',
          ans: 'A',
          exp: 'P = ((2×5 + 1×(−1))/3, (2×(−2) + 1×4)/3) = (9/3, 0/3) = (3, 0). Its y-coordinate is 0, so it lies on the x-axis, not in any quadrant.'
        },
        {
          text: 'For points M(−3, 0), N(0, 4), and O(3, 0), what type of triangle is MNO and what is its perimeter?',
          optA: 'Equilateral triangle with perimeter 18 units',
          optB: 'Isosceles triangle with perimeter 16 units',
          optC: 'Right-angled triangle with perimeter 15 units',
          optD: 'Scalene triangle with perimeter 16 units',
          ans: 'B',
          exp: 'MN = √(3² + 4²) = 5, NO = √(3² + 4²) = 5, MO = 3 − (−3) = 6. Since MN = NO = 5, it is isosceles. Perimeter = 5 + 5 + 6 = 16 units.'
        },
        {
          text: 'The midpoint of A(−2, 5) and B is (3, −1). Find B and the length of segment AB.',
          optA: 'B = (8, −6), AB = 15 units',
          optB: 'B = (7, −7), AB = 2√60 units',
          optC: 'B = (8, −7), AB = 2√61 units',
          optD: 'B = (8, −7), AB = 16 units',
          ans: 'C',
          exp: '(−2 + x)/2 = 3 => x = 8. (5 + y)/2 = −1 => y = −7. B = (8, −7). AB = √[(8 − (−2))² + (−7 − 5)²] = √[100 + 144] = √244 = 2√61 units.'
        }
      ]
    }
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', 'math-ch7', 'Coordinate Geometry', 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    testsData.forEach(t => {
      const testId = `test-math-ch7-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-coord-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-coord-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded 10 questions into Coordinate Geometry – Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] All 5 Coordinate Geometry Mock Tests (50 questions) successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedCoordinateGeometry.ts')) {
  seedCoordinateGeometry();
}
