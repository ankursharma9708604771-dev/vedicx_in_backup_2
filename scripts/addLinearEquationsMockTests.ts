import { db } from '../server/db.ts';

interface QuestionDef {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'true_false';
  text: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  ans: 'A' | 'B' | 'C' | 'D';
  exp: string;
}

interface MockTestDef {
  testId: string;
  testNumber: number;
  title: string;
  description: string;
  accessType: 'free' | 'premium';
  questions: QuestionDef[];
}

// Exactly 25 A, 25 B, 25 C, 25 D evenly distributed across all 10 tests, with 4 distinct options per question
const mockTestsData: MockTestDef[] = [
  // ==========================================
  // MOCK SET 01: Core concepts (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-1',
    testNumber: 1,
    title: 'Pair of Linear Equations – Mock Test 1',
    description: 'Core concepts: Number of solutions, parallel & coincident lines, elimination method, and two-digit number problems.',
    accessType: 'free',
    questions: [
      {
        id: 'q-lineq-m1-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'For 2x + 3y = 7 and 4x + 6y = 14, the number of solutions is:',
        optA: '0',
        optB: '1',
        optC: 'infinitely many',
        optD: '2',
        ans: 'C',
        exp: 'Both equations are proportional: 4x + 6y = 14 is twice 2x + 3y = 7. Since a1/a2 = b1/b2 = c1/c2 = 1/2, they represent the same line and have infinitely many solutions.'
      },
      {
        id: 'q-lineq-m1-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The lines 3x + 2y = 8 and 6x + 4y = 19 are:',
        optA: 'coincident',
        optB: 'parallel',
        optC: 'intersecting',
        optD: 'perpendicular',
        ans: 'B',
        exp: 'The coefficient ratios are equal: 3/6 = 2/4 = 1/2, but constant ratio is 8/19 ≠ 1/2. Hence the lines are parallel and distinct.'
      },
      {
        id: 'q-lineq-m1-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For what value of k do kx + 3y = 7 and 4x + 6y = 14 have infinitely many solutions?',
        optA: 'k = 1',
        optB: 'k = 4',
        optC: 'k = 6',
        optD: 'k = 2',
        ans: 'D',
        exp: 'For infinitely many solutions, k/4 = 3/6 = 7/14 = 1/2. Therefore k/4 = 1/2 => k = 2.'
      },
      {
        id: 'q-lineq-m1-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve by elimination: 5x + 3y = 31 and 2x − y = 4.',
        optA: 'x = 43/11, y = 42/11',
        optB: 'x = 41/11, y = 38/11',
        optC: 'x = 39/11, y = 45/11',
        optD: 'x = 4, y = 3',
        ans: 'A',
        exp: 'From 2x − y = 4, y = 2x − 4. Substituting in 5x + 3y = 31 gives 5x + 3(2x − 4) = 31 => 11x − 12 = 31 => 11x = 43, so x = 43/11 and y = 42/11.'
      },
      {
        id: 'q-lineq-m1-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A school sold 120 tickets for its annual function. Adult tickets cost Rs 80 and student tickets Rs 50. The total collection was Rs 7,800. Find the number of each type of ticket.',
        optA: '70 adult tickets and 50 student tickets',
        optB: '50 adult tickets and 70 student tickets',
        optC: '60 adult tickets and 60 student tickets',
        optD: '80 adult tickets and 40 student tickets',
        ans: 'C',
        exp: 'Let a and s be counts: a + s = 120 and 80a + 50s = 7800. Substituting s = 120 − a gives 80a + 50(120 − a) = 7800 => 30a = 1800, so a = 60 and s = 60.'
      },
      {
        id: 'q-lineq-m1-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A two-digit number has digit sum 11. Reversing its digits gives a number 27 greater than the original. Find the number.',
        optA: '38',
        optB: '47',
        optC: '74',
        optD: '56',
        ans: 'B',
        exp: 'Let tens digit be x and units digit be y. x + y = 11 and (10y + x) − (10x + y) = 27 => 9(y − x) = 27 => y − x = 3. Solving x + y = 11 and y − x = 3 gives x = 4, y = 7. The number is 47.'
      },
      {
        id: 'q-lineq-m1-7',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Without solving fully, determine the nature of solutions for 3x + 2y = 8 and 6x + 4y = 17.',
        optA: 'Unique solution (intersecting)',
        optB: 'Infinitely many solutions (coincident)',
        optC: 'Two solutions',
        optD: 'No solution (parallel lines)',
        ans: 'D',
        exp: 'Here a1/a2 = 3/6 = 1/2, b1/b2 = 2/4 = 1/2, and c1/c2 = 8/17. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.'
      },
      {
        id: 'q-lineq-m1-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve the system of equations: 4x − y = 9 and 2x + 3y = 13.',
        optA: 'x = 18/7, y = 19/7',
        optB: 'x = 20/7, y = 17/7',
        optC: 'x = 22/7, y = 15/7',
        optD: 'x = 3, y = 2',
        ans: 'B',
        exp: 'From 4x − y = 9, y = 4x − 9. Substituting in 2x + 3y = 13 gives 2x + 3(4x − 9) = 13 => 14x = 40 => x = 20/7 and y = 17/7.'
      },
      {
        id: 'q-lineq-m1-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find the value of p if (p + 1)x + 2y = 5 and 3x + 6y = 15 have a unique solution.',
        optA: 'p ≠ 0',
        optB: 'p = 0',
        optC: 'p ≠ 1',
        optD: 'p = 1',
        ans: 'A',
        exp: 'A unique solution requires (p + 1)/3 ≠ 2/6 = 1/3. Hence p + 1 ≠ 1, so p ≠ 0.'
      },
      {
        id: 'q-lineq-m1-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'The sum of two numbers is 84. One number is twice the other minus 6. Find both numbers.',
        optA: '50 and 34',
        optB: '60 and 24',
        optC: '48 and 36',
        optD: '54 and 30',
        ans: 'D',
        exp: 'Let numbers be x and y: x + y = 84 and x = 2y − 6. Substituting gives (2y − 6) + y = 84 => 3y = 90 => y = 30 and x = 54.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 02: Consistency & Word Problems (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-2',
    testNumber: 2,
    title: 'Pair of Linear Equations – Mock Test 2',
    description: 'Consistency & Word Problems: Condition for unique solution, age problems, currency notes, and geometry box costs.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m2-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A pair of linear equations has a unique solution when which condition is satisfied?',
        optA: 'a1/a2 ≠ b1/b2',
        optB: 'a1/a2 = b1/b2',
        optC: 'a1/a2 = b1/b2 = c1/c2',
        optD: 'all coefficients are zero',
        ans: 'A',
        exp: 'A pair of linear equations has a unique solution when the ratio of the coefficients of x and y are unequal: a1/a2 ≠ b1/b2.'
      },
      {
        id: 'q-lineq-m2-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If x + y = 13 and x − y = 5, then the value of x is:',
        optA: '4',
        optB: '8',
        optC: '9',
        optD: '13',
        ans: 'C',
        exp: 'Adding both equations: (x + y) + (x − y) = 13 + 5 => 2x = 18 => x = 9.'
      },
      {
        id: 'q-lineq-m2-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Determine whether 4x − 6y = 9 and 8x − 12y = 20 are consistent. Choose the correct analysis.',
        optA: 'Yes, consistent with infinitely many solutions',
        optB: 'No, the pair is inconsistent (parallel lines)',
        optC: 'Yes, consistent with a unique solution',
        optD: 'Cannot be determined without graphing',
        ans: 'B',
        exp: '4/8 = 1/2, (−6)/(−12) = 1/2, but 9/20 ≠ 1/2. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and inconsistent (no solution).'
      },
      {
        id: 'q-lineq-m2-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 3x + 4y = 25 and 2x − y = 4.',
        optA: 'x = 41/11, y = 38/11',
        optB: 'x = 39/11, y = 40/11',
        optC: 'x = 43/11, y = 36/11',
        optD: 'x = 4, y = 3',
        ans: 'A',
        exp: 'From 2x − y = 4, y = 2x − 4. Substituting into 3x + 4y = 25 gives 3x + 4(2x − 4) = 25 => 11x − 16 = 25 => 11x = 41 => x = 41/11, y = 38/11.'
      },
      {
        id: 'q-lineq-m2-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A stationery shop sells 3 geometry boxes and 5 pens for Rs 415. It sells 2 geometry boxes and 7 pens for Rs 370. Find the price of each item.',
        optA: 'Geometry box = Rs 85; pen = Rs 30',
        optB: 'Geometry box = Rs 90; pen = Rs 28',
        optC: 'Geometry box = Rs 100; pen = Rs 22',
        optD: 'Geometry box = Rs 1055/11 (≈ Rs 95.91); pen = Rs 280/11 (≈ Rs 25.45)',
        ans: 'D',
        exp: 'Let prices be g and p: 3g + 5p = 415 and 2g + 7p = 370. Eliminating g: 2(3g+5p) − 3(2g+7p) = 2(415) − 3(370) => −11p = −280 => p = Rs 280/11 and g = Rs 1055/11.'
      },
      {
        id: 'q-lineq-m2-6',
        difficulty: 'hard',
        type: 'mcq',
        text: "The present ages of a mother and daughter add up to 50 years. Five years ago, the mother was four times the daughter's age. Find their present ages.",
        optA: 'Mother = 40 years; daughter = 10 years',
        optB: 'Mother = 37 years; daughter = 13 years',
        optC: 'Mother = 35 years; daughter = 15 years',
        optD: 'Mother = 38 years; daughter = 12 years',
        ans: 'B',
        exp: 'Let present ages be m and d: m + d = 50 and m − 5 = 4(d − 5). Since m = 50 − d, (50 − d) − 5 = 4d − 20 => 45 − d = 4d − 20 => 5d = 65 => d = 13 and m = 37.'
      },
      {
        id: 'q-lineq-m2-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 7x + ky = 14 and 21x + 12y = 42, find k for infinitely many solutions.',
        optA: 'k = 2',
        optB: 'k = 3',
        optC: 'k = 4',
        optD: 'k = 6',
        ans: 'C',
        exp: 'For infinitely many solutions, 7/21 = k/12 = 14/42 = 1/3. Hence k/12 = 1/3 => k = 4.'
      },
      {
        id: 'q-lineq-m2-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 7x + 2y = 24 and 3x − 2y = 6.',
        optA: 'x = 2, y = 5',
        optB: 'x = 3, y = 2',
        optC: 'x = 3, y = 3/2',
        optD: 'x = 4, y = 1/2',
        ans: 'C',
        exp: 'Adding equations: 10x = 30 => x = 3. Substituting into 7(3) + 2y = 24 => 21 + 2y = 24 => 2y = 3 => y = 3/2.'
      },
      {
        id: 'q-lineq-m2-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find the intersection point of the lines 2x − y = 5 and x + 2y = 4.',
        optA: '(14/5, 3/5)',
        optB: '(12/5, 4/5)',
        optC: '(3, 1)',
        optD: '(16/5, 1/5)',
        ans: 'A',
        exp: 'From 2x − y = 5, y = 2x − 5. Substituting in x + 2(2x − 5) = 4 => 5x − 10 = 4 => 5x = 14 => x = 14/5 and y = 3/5.'
      },
      {
        id: 'q-lineq-m2-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A purse contains Rs 10 and Rs 20 notes, 18 notes altogether, worth Rs 260. Find the count of each type.',
        optA: '8 notes of Rs 10 and 10 notes of Rs 20',
        optB: '12 notes of Rs 10 and 6 notes of Rs 20',
        optC: '14 notes of Rs 10 and 4 notes of Rs 20',
        optD: '10 notes of Rs 10 and 8 notes of Rs 20',
        ans: 'D',
        exp: 'Let counts be a and b: a + b = 18 and 10a + 20b = 260 => a + 2b = 26. Subtracting gives b = 8 and a = 10.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 03: Speed, Mixture & Dimensions (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-3',
    testNumber: 3,
    title: 'Pair of Linear Equations – Mock Test 3',
    description: 'Speed, Mixture & Dimensions: Upstream-downstream, grain mixtures, perimeter relations, and coincident conditions.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m3-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The equations 2x + 5y = 9 and 4x + 10y = 18 have:',
        optA: 'no solution',
        optB: 'one solution',
        optC: 'infinitely many solutions',
        optD: 'exactly two solutions',
        ans: 'C',
        exp: 'The second equation is exactly twice the first: 4/2 = 10/5 = 18/9 = 2. So both represent the same line and have infinitely many solutions.'
      },
      {
        id: 'q-lineq-m3-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Which pair of linear equations represents parallel distinct lines?',
        optA: 'x + y = 5, 2x + 2y = 10',
        optB: 'x + 2y = 4, 2x + 4y = 11',
        optC: 'x + y = 3, 2x − y = 1',
        optD: '2x + y = 8, 4x + 2y = 16',
        ans: 'B',
        exp: 'For x + 2y = 4 and 2x + 4y = 11, a1/a2 = 1/2, b1/b2 = 2/4 = 1/2, but c1/c2 = 4/11 ≠ 1/2. Thus the lines are parallel and distinct.'
      },
      {
        id: 'q-lineq-m3-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find k so that 2x + ky = 8 and 6x + 9y = 24 have infinitely many solutions.',
        optA: 'k = 1',
        optB: 'k = 2',
        optC: 'k = 4',
        optD: 'k = 3',
        ans: 'D',
        exp: 'For infinitely many solutions, 2/6 = k/9 = 8/24 = 1/3. Therefore k/9 = 1/3 => k = 3.'
      },
      {
        id: 'q-lineq-m3-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve the system: 7x − 2y = 19 and 3x + 2y = 11.',
        optA: 'x = 3, y = 1',
        optB: 'x = 2, y = 2',
        optC: 'x = 4, y = −1',
        optD: 'x = 1, y = 4',
        ans: 'A',
        exp: 'Adding both equations: 10x = 30 => x = 3. Substituting into 3(3) + 2y = 11 => 9 + 2y = 11 => 2y = 2 => y = 1.'
      },
      {
        id: 'q-lineq-m3-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Two types of grain are mixed. Type A costs Rs 42 per kg and Type B costs Rs 30 per kg. A shopkeeper buys 25 kg of the mixture for Rs 930. Find the quantity of each type.',
        optA: '15 kg of Type A and 10 kg of Type B',
        optB: '10 kg of Type A and 15 kg of Type B',
        optC: '12 kg of Type A and 13 kg of Type B',
        optD: '18 kg of Type A and 7 kg of Type B',
        ans: 'A',
        exp: 'Let quantities be a and b: a + b = 25 and 42a + 30b = 930. Substituting b = 25 − a: 42a + 30(25 − a) = 930 => 12a = 180 => a = 15 kg and b = 10 kg.'
      },
      {
        id: 'q-lineq-m3-6',
        difficulty: 'hard',
        type: 'mcq',
        text: "A cyclist travels 30 km downstream in 2 hours and returns the same distance upstream in 3 hours. Find the cyclist's speed in still conditions and the stream's speed.",
        optA: 'Still-water speed = 10 km/h; stream speed = 5 km/h',
        optB: 'Still-water speed = 15 km/h; stream speed = 3 km/h',
        optC: 'Still-water speed = 11 km/h; stream speed = 4 km/h',
        optD: 'Still-water speed = 12.5 km/h; stream speed = 2.5 km/h',
        ans: 'D',
        exp: 'Downstream speed = 30/2 = 15 km/h, Upstream speed = 30/3 = 10 km/h. Still-water speed = (15 + 10)/2 = 12.5 km/h; stream speed = (15 − 10)/2 = 2.5 km/h.'
      },
      {
        id: 'q-lineq-m3-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For what value of t are 5x + ty = 15 and 10x + 8y = 30 coincident?',
        optA: 't = 2',
        optB: 't = 4',
        optC: 't = 6',
        optD: 't = 8',
        ans: 'B',
        exp: 'For coincident lines: 5/10 = t/8 = 15/30 = 1/2. Hence t/8 = 1/2 => t = 4.'
      },
      {
        id: 'q-lineq-m3-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 4x + 5y = 31 and 2x − y = 1.',
        optA: 'x = 16/7, y = 31/7',
        optB: 'x = 18/7, y = 29/7',
        optC: 'x = 20/7, y = 27/7',
        optD: 'x = 2, y = 4',
        ans: 'B',
        exp: 'From 2x − y = 1, y = 2x − 1. Substituting in 4x + 5(2x − 1) = 31 => 14x − 5 = 31 => 14x = 36 => x = 18/7, y = 29/7.'
      },
      {
        id: 'q-lineq-m3-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The lines 2x + 3y = 7 and 4x + 6y = c coincide. Find c.',
        optA: 'c = 7',
        optB: 'c = 12',
        optC: 'c = 14',
        optD: 'c = 21',
        ans: 'C',
        exp: 'The second equation must be twice the first: 4x + 6y = 14. Hence c = 14.'
      },
      {
        id: 'q-lineq-m3-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A rectangle has perimeter 74 cm. Its length is 5 cm more than its breadth. Find its dimensions.',
        optA: 'Length = 20 cm; breadth = 15 cm',
        optB: 'Length = 22 cm; breadth = 17 cm',
        optC: 'Length = 24 cm; breadth = 19 cm',
        optD: 'Length = 21 cm; breadth = 16 cm',
        ans: 'D',
        exp: '2(l + b) = 74 => l + b = 37 and l − b = 5. Adding gives 2l = 42 => l = 21 cm and b = 16 cm.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 04: Canteen, Cabs & Integers (A:3, B:2, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-4',
    testNumber: 4,
    title: 'Pair of Linear Equations – Mock Test 4',
    description: 'Canteen, Cabs & Integers: Fixed plus variable taxi charges, canteen purchases, intersecting lines, and integer differences.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m4-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'For 5x + ay = 12 and 10x + 6y = 24 to have infinitely many solutions, a equals:',
        optA: '3',
        optB: '2',
        optC: '6',
        optD: '12',
        ans: 'A',
        exp: 'For infinitely many solutions, 5/10 = a/6 = 12/24 = 1/2. Thus a/6 = 1/2 => a = 3.'
      },
      {
        id: 'q-lineq-m4-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If two lines intersect at exactly one point, the corresponding pair has:',
        optA: 'no solution',
        optB: 'infinitely many solutions',
        optC: 'a unique solution',
        optD: 'equal slopes',
        ans: 'C',
        exp: 'Two intersecting lines meet at exactly one point, so the pair has a unique solution.'
      },
      {
        id: 'q-lineq-m4-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Check whether x − 2y = 4 and 3x − 6y = 12 have infinitely many solutions.',
        optA: 'No, unique solution',
        optB: 'No, inconsistent',
        optC: 'Cannot be determined',
        optD: 'Yes, infinitely many solutions (coincident lines)',
        ans: 'D',
        exp: 'Multiplying x − 2y = 4 by 3 gives 3x − 6y = 12, which is identical to the second equation. They represent coincident lines with infinitely many solutions.'
      },
      {
        id: 'q-lineq-m4-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 4x + 7y = 1 and 3x − 2y = 20.',
        optA: 'x = 142/29, y = −77/29',
        optB: 'x = 140/29, y = −75/29',
        optC: 'x = 144/29, y = −79/29',
        optD: 'x = 5, y = −3',
        ans: 'A',
        exp: 'Multiplying 4x + 7y = 1 by 2 and 3x − 2y = 20 by 7: 8x + 14y = 2 and 21x − 14y = 140. Adding gives 29x = 142 => x = 142/29 and y = −77/29.'
      },
      {
        id: 'q-lineq-m4-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'At a school canteen, 4 sandwiches and 3 juices cost Rs 390, while 2 sandwiches and 5 juices cost Rs 370. Find the price of one sandwich and one juice.',
        optA: 'Sandwich = Rs 55; juice = Rs 55',
        optB: 'Sandwich = Rs 60; juice = Rs 50',
        optC: 'Sandwich = Rs 65; juice = Rs 45',
        optD: 'Sandwich = Rs 70; juice = Rs 40',
        ans: 'B',
        exp: '4s + 3j = 390 and 2s + 5j = 370. Multiply second equation by 2: 4s + 10j = 740. Subtracting first: 7j = 350 => j = Rs 50 and s = Rs 60.'
      },
      {
        id: 'q-lineq-m4-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A cab company charges a fixed booking fee plus a charge per kilometre. A 12 km ride costs Rs 196 and a 20 km ride costs Rs 300. Find both charges and the fare for a 35 km ride.',
        optA: 'Fixed fee = Rs 30; charge = Rs 14/km; 35 km fare = Rs 520',
        optB: 'Fixed fee = Rs 50; charge = Rs 12/km; 35 km fare = Rs 470',
        optC: 'Fixed fee = Rs 40; charge = Rs 13/km; 35 km fare = Rs 495',
        optD: 'Fixed fee = Rs 45; charge = Rs 12.5/km; 35 km fare = Rs 482.5',
        ans: 'C',
        exp: 'f + 12r = 196 and f + 20r = 300. Subtracting gives 8r = 104 => r = Rs 13/km and f = Rs 40. For 35 km: 40 + 35(13) = 40 + 455 = Rs 495.'
      },
      {
        id: 'q-lineq-m4-7',
        difficulty: 'easy',
        type: 'mcq',
        text: 'State whether 5x + 2y = 7 and 15x + 6y = 22 have a solution.',
        optA: 'Unique solution',
        optB: 'Infinitely many solutions',
        optC: 'Exactly two solutions',
        optD: 'No solution (parallel lines)',
        ans: 'D',
        exp: 'Coefficient ratios are 5/15 = 2/6 = 1/3, but constant ratio is 7/22 ≠ 1/3. Hence the lines are parallel and distinct, meaning no solution.'
      },
      {
        id: 'q-lineq-m4-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 8x + 3y = 29 and 2x − y = 1.',
        optA: 'x = 16/7, y = 25/7',
        optB: 'x = 15/7, y = 26/7',
        optC: 'x = 18/7, y = 23/7',
        optD: 'x = 2, y = 3',
        ans: 'A',
        exp: 'From 2x − y = 1, y = 2x − 1. Substituting in 8x + 3(2x − 1) = 29 => 14x − 3 = 29 => 14x = 32 => x = 16/7 and y = 25/7.'
      },
      {
        id: 'q-lineq-m4-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If x = 2, y = 3 is a solution of ax + 2y = 11 and 3x + by = 13, find a and b.',
        optA: 'a = 2, b = 3',
        optB: 'a = 5/2, b = 7/3',
        optC: 'a = 3/2, b = 8/3',
        optD: 'a = 5, b = 7',
        ans: 'B',
        exp: 'Substitute x = 2, y = 3: 2a + 6 = 11 => 2a = 5 => a = 5/2; and 3(2) + 3b = 13 => 6 + 3b = 13 => 3b = 7 => b = 7/3.'
      },
      {
        id: 'q-lineq-m4-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Two numbers differ by 8. Three times the smaller plus twice the larger is 76. Find them.',
        optA: 'Smaller number = 10; larger number = 18',
        optB: 'Smaller number = 14; larger number = 22',
        optC: 'Smaller number = 8; larger number = 16',
        optD: 'Smaller number = 12; larger number = 20',
        ans: 'D',
        exp: 'L − S = 8 => L = S + 8. Then 3S + 2(S + 8) = 76 => 5S + 16 = 76 => 5S = 60 => S = 12 and L = 20.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 05: Fractions, Theatres & Ratios (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-5',
    testNumber: 5,
    title: 'Pair of Linear Equations – Mock Test 5',
    description: 'Fractions, Theatres & Ratios: Theater ticket sales, fraction changes on numerator/denominator, and parent-child ages.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m5-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The system of equations x + 2y = 8 and 3x + 6y = 24 has:',
        optA: 'unique solution',
        optB: 'infinitely many solutions',
        optC: 'no solution',
        optD: 'no variables',
        ans: 'B',
        exp: 'The second equation is 3 times the first: 3/1 = 6/2 = 24/8 = 3. Therefore both represent the same line and have infinitely many solutions.'
      },
      {
        id: 'q-lineq-m5-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If 2x + y = 11 and x + y = 7, then y is:',
        optA: '3',
        optB: '2',
        optC: '4',
        optD: '5',
        ans: 'A',
        exp: 'Subtracting (x + y = 7) from (2x + y = 11) gives x = 4. Substituting in x + y = 7 gives y = 3.'
      },
      {
        id: 'q-lineq-m5-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find k if 3x + 6y = 12 and kx + 2y = 7 have no solution.',
        optA: 'k = 2',
        optB: 'k = 3',
        optC: 'k = 1',
        optD: 'k = 4',
        ans: 'C',
        exp: 'For no solution, 3/k = 6/2 = 3 => k = 1, while 12/7 ≠ 3.'
      },
      {
        id: 'q-lineq-m5-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 2x + 3y = 17 and 3x − y = 11.',
        optA: 'x = 50/11, y = 29/11',
        optB: 'x = 48/11, y = 31/11',
        optC: 'x = 52/11, y = 27/11',
        optD: 'x = 5, y = 2',
        ans: 'A',
        exp: 'From 3x − y = 11, y = 3x − 11. Substituting gives 2x + 3(3x − 11) = 17 => 11x − 33 = 17 => 11x = 50 => x = 50/11 and y = 29/11.'
      },
      {
        id: 'q-lineq-m5-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A theatre sold 240 tickets. The price was Rs 150 for balcony seats and Rs 100 for regular seats. The total collection was Rs 29,500. Find the number of each ticket sold.',
        optA: '100 balcony tickets and 140 regular tickets',
        optB: '120 balcony tickets and 120 regular tickets',
        optC: '130 balcony tickets and 110 regular tickets',
        optD: '110 balcony tickets and 130 regular tickets',
        ans: 'D',
        exp: 'b + r = 240 and 150b + 100r = 29500 => 3b + 2r = 590. Multiplying b + r = 240 by 2 gives 2b + 2r = 480. Subtracting gives b = 110 and r = 130.'
      },
      {
        id: 'q-lineq-m5-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A fraction becomes 1/2 when 1 is added to its numerator, and becomes 1/3 when 1 is added to its denominator. Find the fraction.',
        optA: '2/7',
        optB: '3/8',
        optC: '4/9',
        optD: '5/11',
        ans: 'B',
        exp: '(n + 1)/d = 1/2 => d = 2n + 2; and n/(d + 1) = 1/3 => d + 1 = 3n => d = 3n − 1. Equating: 2n + 2 = 3n − 1 => n = 3 and d = 8. Fraction is 3/8.'
      },
      {
        id: 'q-lineq-m5-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find k so that 2x + 5y = 9 and 6x + ky = 27 have infinitely many solutions.',
        optA: 'k = 15',
        optB: 'k = 10',
        optC: 'k = 20',
        optD: 'k = 25',
        ans: 'A',
        exp: 'For infinitely many solutions, 2/6 = 5/k = 9/27 = 1/3. Hence 5/k = 1/3 => k = 15.'
      },
      {
        id: 'q-lineq-m5-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 3x + 7y = 31 and 2x − y = 3.',
        optA: 'x = 50/17, y = 55/17',
        optB: 'x = 54/17, y = 51/17',
        optC: 'x = 52/17, y = 53/17',
        optD: 'x = 3, y = 3',
        ans: 'C',
        exp: 'From 2x − y = 3, y = 2x − 3. Substituting into 3x + 7(2x − 3) = 31 gives 17x − 21 = 31 => 17x = 52 => x = 52/17 and y = 53/17.'
      },
      {
        id: 'q-lineq-m5-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 2x + 3y = 12 and 4x + 6y = 24, which pair of points both represent solutions?',
        optA: '(0, 0) and (2, 2)',
        optB: '(4, 1) and (1, 4)',
        optC: '(5, 1) and (2, 3)',
        optD: '(6, 0) and (3, 2)',
        ans: 'D',
        exp: 'Both points lie on 2x + 3y = 12: for (6,0), 2(6)+3(0)=12; for (3,2), 2(3)+3(2)=6+6=12. Since both equations are coincident, both points are valid solutions.'
      },
      {
        id: 'q-lineq-m5-10',
        difficulty: 'hard',
        type: 'mcq',
        text: "A mother is 24 years older than her daughter. In 4 years, the mother will be twice the daughter's age. Find their present ages.",
        optA: 'Daughter = 18 years; mother = 42 years',
        optB: 'Daughter = 22 years; mother = 46 years',
        optC: 'Daughter = 20 years; mother = 44 years',
        optD: 'Daughter = 16 years; mother = 40 years',
        ans: 'C',
        exp: 'm − d = 24 and m + 4 = 2(d + 4) => m + 4 = 2d + 8 => m = 2d + 4. Substituting in m − d = 24: (2d + 4) − d = 24 => d = 20 years and m = 44 years.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 06: Class Count & Stationery (A:3, B:2, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-6',
    testNumber: 6,
    title: 'Pair of Linear Equations – Mock Test 6',
    description: 'Class Count & Stationery: Boys and girls ratio, boat speed, notebook purchases, and unique solution constraints.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m6-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'For ax + 3y = 7 and 2x + 6y = 14, the pair has infinitely many solutions when a equals:',
        optA: '2',
        optB: '0',
        optC: '1',
        optD: 'every real number',
        ans: 'A',
        exp: 'For infinitely many solutions, a/2 = 3/6 = 7/14 = 1/2. Hence a/2 = 1/2 => a = 2.'
      },
      {
        id: 'q-lineq-m6-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The pair of equations 2x + 3y = 6 and 4x + 6y = 15 is:',
        optA: 'consistent dependent',
        optB: 'unique solution',
        optC: 'identical',
        optD: 'inconsistent (parallel lines)',
        ans: 'D',
        exp: 'Coefficient ratios are 2/4 = 3/6 = 1/2, while constant ratio is 6/15 = 2/5 ≠ 1/2. Thus lines are parallel and inconsistent.'
      },
      {
        id: 'q-lineq-m6-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For what value of p do 2x + py = 5 and 6x + 9y = 15 have infinitely many solutions?',
        optA: 'p = 1',
        optB: 'p = 2',
        optC: 'p = 3',
        optD: 'p = 6',
        ans: 'C',
        exp: 'For infinitely many solutions, 2/6 = p/9 = 5/15 = 1/3. Hence p/9 = 1/3 => p = 3.'
      },
      {
        id: 'q-lineq-m6-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 5x − 2y = 4 and 3x + 2y = 12.',
        optA: '(3, 2)',
        optB: '(2, 3)',
        optC: '(4, 1)',
        optD: '(1, 4)',
        ans: 'B',
        exp: 'Adding both equations: 8x = 16 => x = 2. Substituting into 3(2) + 2y = 12 => 6 + 2y = 12 => 2y = 6 => y = 3.'
      },
      {
        id: 'q-lineq-m6-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A class has 42 students. The number of girls is 6 more than the number of boys. Find the number of boys and girls.',
        optA: '18 boys and 24 girls',
        optB: '20 boys and 22 girls',
        optC: '16 boys and 26 girls',
        optD: '15 boys and 27 girls',
        ans: 'A',
        exp: 'b + g = 42 and g − b = 6. Adding gives 2g = 48 => g = 24 girls and b = 18 boys.'
      },
      {
        id: 'q-lineq-m6-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A boat covers 24 km downstream in 2 hours and 24 km upstream in 3 hours. Find the speed of the boat in still water and the speed of the current.',
        optA: 'Boat speed = 12 km/h; current speed = 3 km/h',
        optB: 'Boat speed = 9 km/h; current speed = 1.5 km/h',
        optC: 'Boat speed = 11 km/h; current speed = 2.5 km/h',
        optD: 'Boat speed = 10 km/h; current speed = 2 km/h',
        ans: 'D',
        exp: 'Downstream speed = 24/2 = 12 km/h; Upstream speed = 24/3 = 8 km/h. Boat speed in still water = (12 + 8)/2 = 10 km/h; current speed = (12 − 8)/2 = 2 km/h.'
      },
      {
        id: 'q-lineq-m6-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find p if 4x + py = 10 and 12x + 9y = 30 have infinitely many solutions.',
        optA: 'p = 1',
        optB: 'p = 2',
        optC: 'p = 3',
        optD: 'p = 4',
        ans: 'C',
        exp: 'For infinitely many solutions, 4/12 = p/9 = 10/30 = 1/3. Hence p/9 = 1/3 => p = 3.'
      },
      {
        id: 'q-lineq-m6-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 9x − 2y = 20 and 3x + y = 10.',
        optA: 'x = 8/3, y = 2',
        optB: 'x = 7/3, y = 3',
        optC: 'x = 3, y = 1',
        optD: 'x = 10/3, y = 0',
        ans: 'A',
        exp: 'From 3x + y = 10, y = 10 − 3x. Substituting in 9x − 2(10 − 3x) = 20 => 15x − 20 = 20 => 15x = 40 => x = 8/3 and y = 10 − 8 = 2.'
      },
      {
        id: 'q-lineq-m6-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For which value of q does 2x + 3y = 7 and 4x + qy = 15 have a unique solution?',
        optA: 'q = 6 only',
        optB: 'Any q ≠ 6',
        optC: 'q = 3 only',
        optD: 'Any q ≠ 3',
        ans: 'B',
        exp: 'A unique solution requires 2/4 ≠ 3/q => 1/2 ≠ 3/q => q ≠ 6. Hence any real value of q except 6 gives a unique solution.'
      },
      {
        id: 'q-lineq-m6-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A school bought 20 items, notebooks at Rs 25 each and files at Rs 40 each, spending Rs 620. Find the number of each.',
        optA: '10 notebooks and 10 files',
        optB: '14 notebooks and 6 files',
        optC: '8 notebooks and 12 files',
        optD: '12 notebooks and 8 files',
        ans: 'D',
        exp: 'n + f = 20 and 25n + 40f = 620. 25(20 − f) + 40f = 620 => 500 + 15f = 620 => 15f = 120 => f = 8 and n = 12.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 07: Data Plans & Farm Animals (A:2, B:3, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-7',
    testNumber: 7,
    title: 'Pair of Linear Equations – Mock Test 7',
    description: 'Data Plans & Farm Animals: Mobile data plan costs, hens and goats legs problem, dependent systems, and ticket costs.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m7-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If a1/a2 and b1/b2 are unequal, what can be concluded about the lines?',
        optA: 'They are parallel',
        optB: 'They intersect at exactly one point',
        optC: 'They are coincident',
        optD: 'They are always perpendicular',
        ans: 'B',
        exp: 'Unequal coefficient ratios (a1/a2 ≠ b1/b2) mean the lines have different slopes and intersect at exactly one unique point.'
      },
      {
        id: 'q-lineq-m7-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The solution of 3x + 2y = 16 and x − y = 2 is:',
        optA: '(3, 1)',
        optB: '(4, 2)',
        optC: '(2, 4)',
        optD: '(5, 3)',
        ans: 'B',
        exp: 'From x − y = 2, x = y + 2. Substituting gives 3(y + 2) + 2y = 16 => 5y = 10 => y = 2 and x = 4.'
      },
      {
        id: 'q-lineq-m7-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Determine the nature of the pair 7x + 5y = 9 and 14x + 10y = 21.',
        optA: 'Unique solution',
        optB: 'Infinitely many solutions',
        optC: 'Exactly two solutions',
        optD: 'No solution (parallel lines)',
        ans: 'D',
        exp: '7/14 = 5/10 = 1/2, but 9/21 = 3/7 ≠ 1/2. Because a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.'
      },
      {
        id: 'q-lineq-m7-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 6x + y = 17 and 2x − y = 3.',
        optA: 'x = 2, y = 5',
        optB: 'x = 3, y = 1',
        optC: 'x = 5/2, y = 2',
        optD: 'x = 7/2, y = −4',
        ans: 'C',
        exp: 'Adding both equations: 8x = 20 => x = 20/8 = 5/2. Then y = 2(5/2) − 3 = 5 − 3 = 2.'
      },
      {
        id: 'q-lineq-m7-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A farmer has 35 animals consisting of hens and goats. There are 94 legs altogether. Find the number of hens and goats.',
        optA: '20 hens and 15 goats',
        optB: '25 hens and 10 goats',
        optC: '23 hens and 12 goats',
        optD: '22 hens and 13 goats',
        ans: 'C',
        exp: 'h + g = 35 and 2h + 4g = 94 => h + 2g = 47. Subtracting gives g = 12 goats and h = 23 hens.'
      },
      {
        id: 'q-lineq-m7-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Two mobile data plans charge a fixed fee plus cost per GB. Plan A costs Rs 180 for 5 GB and Rs 300 for 11 GB. Find the fixed fee and per-GB charge, then calculate the cost for 15 GB.',
        optA: 'Fixed fee = Rs 80; rate = Rs 20/GB; 15 GB costs Rs 380',
        optB: 'Fixed fee = Rs 70; rate = Rs 22/GB; 15 GB costs Rs 400',
        optC: 'Fixed fee = Rs 90; rate = Rs 18/GB; 15 GB costs Rs 360',
        optD: 'Fixed fee = Rs 75; rate = Rs 21/GB; 15 GB costs Rs 390',
        ans: 'A',
        exp: 'f + 5r = 180 and f + 11r = 300. Subtracting gives 6r = 120 => r = Rs 20/GB and f = Rs 80. For 15 GB: 80 + 15(20) = Rs 380.'
      },
      {
        id: 'q-lineq-m7-7',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Are 6x + 9y = 12 and 2x + 3y = 4 dependent, inconsistent, or independent?',
        optA: 'Inconsistent (parallel)',
        optB: 'Dependent (equivalent equations)',
        optC: 'Independent (unique solution)',
        optD: 'None of these',
        ans: 'B',
        exp: '6x + 9y = 12 divided by 3 is 2x + 3y = 4. Since the two equations are multiples of each other, they represent the same line and are dependent.'
      },
      {
        id: 'q-lineq-m7-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 5x + y = 18 and 2x − y = 3.',
        optA: '(2, 8)',
        optB: '(4, −2)',
        optC: '(3, 3)',
        optD: '(1, 13)',
        ans: 'C',
        exp: 'Adding both equations: 7x = 21 => x = 3. Substituting into y = 2(3) − 3 = 3. Hence the solution is (3, 3).'
      },
      {
        id: 'q-lineq-m7-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A pair has equations 3x + 2y = 8 and 6x + 4y = c. State the value of c for infinitely many solutions and the condition for no solution.',
        optA: 'Infinitely many when c = 16; no solution when c ≠ 16',
        optB: 'Infinitely many when c = 8; no solution when c ≠ 8',
        optC: 'Infinitely many when c = 24; no solution when c ≠ 24',
        optD: 'Infinitely many for all c',
        ans: 'A',
        exp: 'Doubling the first equation gives 6x + 4y = 16. Thus c = 16 produces coincident lines (infinitely many solutions), while any c ≠ 16 produces parallel distinct lines (no solution).'
      },
      {
        id: 'q-lineq-m7-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'The cost of 3 adult and 2 child entries is Rs 460. The cost of 2 adult and 5 child entries is Rs 510. Find each entry price.',
        optA: 'Adult entry = Rs 100; child entry = Rs 80',
        optB: 'Adult entry = Rs 110; child entry = Rs 65',
        optC: 'Adult entry = Rs 120; child entry = Rs 50',
        optD: 'Adult entry = Rs 1280/11; child entry = Rs 610/11',
        ans: 'D',
        exp: '3a + 2c = 460 and 2a + 5c = 510. Multiply first by 2 and second by 3: 6a + 4c = 920 and 6a + 15c = 1530. Subtracting gives 11c = 610 => c = Rs 610/11 and a = Rs 1280/11.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 08: Speed, Reversals & Ratios (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-8',
    testNumber: 8,
    title: 'Pair of Linear Equations – Mock Test 8',
    description: 'Speed, Reversals & Ratios: Van speed variation, two-digit number reversals, museum ticket receipts, and ratio impossibilities.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m8-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A pair of linear equations with infinitely many solutions represents which geometric relationship?',
        optA: 'intersecting lines',
        optB: 'same coincident line',
        optC: 'parallel lines',
        optD: 'perpendicular lines',
        ans: 'B',
        exp: 'Infinitely many solutions mean every point on one line is on the other, which occurs when both equations represent the same coincident line.'
      },
      {
        id: 'q-lineq-m8-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If x + y = 9 and 2x − y = 6, then x equals:',
        optA: '5',
        optB: '3',
        optC: '4',
        optD: '6',
        ans: 'A',
        exp: 'Adding both equations: (x + y) + (2x − y) = 9 + 6 => 3x = 15 => x = 5.'
      },
      {
        id: 'q-lineq-m8-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Can any value of k make 4x + ky = 10 and 12x + 9y = 31 have infinitely many solutions? State why.',
        optA: 'Yes, k = 3',
        optB: 'Yes, k = 9',
        optC: 'Yes, k = 6',
        optD: 'No value of k (4/12 = 1/3, but 10/31 ≠ 1/3)',
        ans: 'D',
        exp: 'Infinitely many solutions require 4/12 = k/9 = 10/31. Here 4/12 = 1/3, but 10/31 ≠ 1/3. Hence no value of k can satisfy the equality.'
      },
      {
        id: 'q-lineq-m8-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 2x + 5y = 16 and 3x − y = 5.',
        optA: 'x = 39/17, y = 40/17',
        optB: 'x = 43/17, y = 36/17',
        optC: 'x = 41/17, y = 38/17',
        optD: 'x = 2, y = 2',
        ans: 'C',
        exp: 'From 3x − y = 5, y = 3x − 5. Substituting into 2x + 5(3x − 5) = 16 gives 17x − 25 = 16 => 17x = 41 => x = 41/17 and y = 38/17.'
      },
      {
        id: 'q-lineq-m8-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A museum sold 150 tickets. Adult tickets cost Rs 60 and children tickets Rs 35. The total receipt was Rs 7,000. Find the number of adult and child tickets.',
        optA: '80 adult tickets and 70 child tickets',
        optB: '70 adult tickets and 80 child tickets',
        optC: '60 adult tickets and 90 child tickets',
        optD: '75 adult tickets and 75 child tickets',
        ans: 'B',
        exp: 'a + c = 150 and 60a + 35c = 7000. Substituting c = 150 − a: 60a + 35(150 − a) = 7000 => 25a + 5250 = 7000 => 25a = 1750 => a = 70 and c = 80.'
      },
      {
        id: 'q-lineq-m8-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A number is made of two digits. The sum of its digits is 9. The number is 27 more than the number formed by reversing its digits. Find the number.',
        optA: '63',
        optB: '36',
        optC: '54',
        optD: '72',
        ans: 'A',
        exp: 'Let tens digit be x and units digit be y: x + y = 9 and (10x + y) − (10y + x) = 27 => 9(x − y) = 27 => x − y = 3. Adding gives 2x = 12 => x = 6, y = 3. Number is 63.'
      },
      {
        id: 'q-lineq-m8-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find k so that 5x + ky = 11 and 15x + 12y = 33 have infinitely many solutions.',
        optA: 'k = 2',
        optB: 'k = 3',
        optC: 'k = 6',
        optD: 'k = 4',
        ans: 'D',
        exp: 'For infinitely many solutions, 5/15 = k/12 = 11/33 = 1/3. Thus k/12 = 1/3 => k = 4.'
      },
      {
        id: 'q-lineq-m8-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 7x − y = 17 and 2x + y = 10.',
        optA: '(4, 3)',
        optB: '(2, 6)',
        optC: '(3, 4)',
        optD: '(5, 0)',
        ans: 'C',
        exp: 'Adding both equations: 9x = 27 => x = 3. Substituting into 2(3) + y = 10 gives y = 4. The solution is (3, 4).'
      },
      {
        id: 'q-lineq-m8-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find two consecutive positive integers if their sum is 41, by forming a pair of equations.',
        optA: '20 and 21',
        optB: '19 and 22',
        optC: '18 and 23',
        optD: '21 and 22',
        ans: 'A',
        exp: 'Let integers be n and n + 1: n + (n + 1) = 41 => 2n + 1 = 41 => 2n = 40 => n = 20. The integers are 20 and 21.'
      },
      {
        id: 'q-lineq-m8-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A van travels 180 km. At 15 km/h faster, the same trip takes 1 hour less. Find its original speed.',
        optA: '40 km/h',
        optB: '50 km/h',
        optC: '45 km/h',
        optD: '60 km/h',
        ans: 'C',
        exp: '180/v − 180/(v + 15) = 1 => 180(15) = v(v + 15) => v² + 15v − 2700 = 0. Factoring: (v − 45)(v + 60) = 0. Since speed is positive, v = 45 km/h.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 09: Fleet Transport & Groceries (A:2, B:3, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-9',
    testNumber: 9,
    title: 'Pair of Linear Equations – Mock Test 9',
    description: 'Fleet Transport & Groceries: Car and minibus transport, blended rice purchases, fruit vendor sales, and parameter m.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m9-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If 3x + 4y = 10 and 6x + 8y = 20, then the pair has:',
        optA: 'no solution',
        optB: 'infinitely many solutions',
        optC: 'one solution',
        optD: 'two solutions',
        ans: 'B',
        exp: '6x + 8y = 20 is exactly 2 times 3x + 4y = 10: 6/3 = 8/4 = 20/10 = 2. Hence they represent the same line and have infinitely many solutions.'
      },
      {
        id: 'q-lineq-m9-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If x − y = 3 and 2x + y = 12, then x is:',
        optA: '5',
        optB: '3',
        optC: '4',
        optD: '6',
        ans: 'A',
        exp: 'From x − y = 3, y = x − 3. Substituting into 2x + (x − 3) = 12 => 3x = 15 => x = 5.'
      },
      {
        id: 'q-lineq-m9-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For what value of m are 2x + 4y = 9 and 6x + my = 27 coincident?',
        optA: 'm = 8',
        optB: 'm = 10',
        optC: 'm = 12',
        optD: 'm = 16',
        ans: 'C',
        exp: 'For coincident lines, 2/6 = 4/m = 9/27 = 1/3. Hence 4/m = 1/3 => m = 12.'
      },
      {
        id: 'q-lineq-m9-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 3x + 5y = 1 and 2x − y = 8.',
        optA: 'x = 39/13, y = −20/13',
        optB: 'x = 43/13, y = −24/13',
        optC: 'x = 4, y = 0',
        optD: 'x = 41/13, y = −22/13',
        ans: 'D',
        exp: 'From 2x − y = 8, y = 2x − 8. Substituting into 3x + 5(2x − 8) = 1 gives 13x − 40 = 1 => 13x = 41 => x = 41/13 and y = −22/13.'
      },
      {
        id: 'q-lineq-m9-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A school arranged 18 vehicles, cars and minibuses, to transport 310 students. Each car carries 10 students and each minibus 20 students. Find the number of each vehicle.',
        optA: '6 cars and 12 minibuses',
        optB: '5 cars and 13 minibuses',
        optC: '4 cars and 14 minibuses',
        optD: '7 cars and 11 minibuses',
        ans: 'B',
        exp: 'c + m = 18 and 10c + 20m = 310 => c + 2m = 31. Subtracting the first equation from the second gives m = 13 minibuses and c = 5 cars.'
      },
      {
        id: 'q-lineq-m9-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A retailer buys 40 kg of rice, some at Rs 48/kg and the rest at Rs 60/kg. The total cost is Rs 2,160. Find the quantity bought at each rate.',
        optA: '20 kg at Rs 48/kg and 20 kg at Rs 60/kg',
        optB: '15 kg at Rs 48/kg and 25 kg at Rs 60/kg',
        optC: '25 kg at Rs 48/kg and 15 kg at Rs 60/kg',
        optD: '18 kg at Rs 48/kg and 22 kg at Rs 60/kg',
        ans: 'A',
        exp: 'x + y = 40 and 48x + 60y = 2160. Substituting x = 40 − y gives 48(40 − y) + 60y = 2160 => 1920 + 12y = 2160 => 12y = 240 => y = 20 kg and x = 20 kg.'
      },
      {
        id: 'q-lineq-m9-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Determine the nature of 2x + 4y = 8 and 3x + 6y = 15.',
        optA: 'Unique solution',
        optB: 'Infinitely many solutions',
        optC: 'No solution (parallel lines)',
        optD: 'Dependent',
        ans: 'C',
        exp: '2/3 = 4/6 = 2/3, while 8/15 ≠ 2/3. Since a1/a2 = b1/b2 ≠ c1/c2, the lines are parallel and have no solution.'
      },
      {
        id: 'q-lineq-m9-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 3x + 4y = 18 and 2x − y = 1.',
        optA: '(3, 2)',
        optB: '(4, 1)',
        optC: '(1, 4)',
        optD: '(2, 3)',
        ans: 'D',
        exp: 'From 2x − y = 1, y = 2x − 1. Substituting in 3x + 4(2x − 1) = 18 => 11x − 4 = 18 => 11x = 22 => x = 2 and y = 3.'
      },
      {
        id: 'q-lineq-m9-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find the value of m for which mx + 3y = 6 and 4x + 6y = 12 have infinitely many solutions.',
        optA: 'm = 1',
        optB: 'm = 3',
        optC: 'm = 2',
        optD: 'm = 4',
        ans: 'C',
        exp: 'For infinitely many solutions, m/4 = 3/6 = 6/12 = 1/2. Hence m/4 = 1/2 => m = 2.'
      },
      {
        id: 'q-lineq-m9-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A vendor sells 30 kg of fruit in two varieties. One costs Rs 80/kg and the other Rs 50/kg. The total receipt is Rs 1,950. Find quantities sold.',
        optA: '10 kg of Rs 80 and 20 kg of Rs 50',
        optB: '15 kg of each variety',
        optC: '20 kg of Rs 80 and 10 kg of Rs 50',
        optD: '12 kg of Rs 80 and 18 kg of Rs 50',
        ans: 'B',
        exp: 'a + b = 30 and 80a + 50b = 1950. Substituting b = 30 − a gives 80a + 50(30 − a) = 1950 => 30a + 1500 = 1950 => 30a = 450 => a = 15 kg and b = 15 kg.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 10: Parking Wheels & Contributions (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch3-slot-10',
    testNumber: 10,
    title: 'Pair of Linear Equations – Mock Test 10',
    description: 'Parking Wheels & Contributions: Cars & motorcycle wheel count, perimeter relationships, and currency contributions.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-lineq-m10-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The pair of equations 2x + 3y = 12 and 4x + 6y = 24 has:',
        optA: 'infinitely many solutions',
        optB: 'unique solution',
        optC: 'no solution',
        optD: 'exactly two solutions',
        ans: 'A',
        exp: 'The second equation is 2 times the first equation: 4/2 = 6/3 = 24/12 = 2. Both represent the same coincident line and have infinitely many solutions.'
      },
      {
        id: 'q-lineq-m10-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If 4x + y = 14 and 2x − y = 4, then x equals:',
        optA: '2',
        optB: '4',
        optC: '3',
        optD: '5',
        ans: 'C',
        exp: 'Adding both equations: (4x + y) + (2x − y) = 14 + 4 => 6x = 18 => x = 3.'
      },
      {
        id: 'q-lineq-m10-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For what value of a do ax + 2y = 8 and 3x + 6y = 24 have infinitely many solutions?',
        optA: 'a = 2',
        optB: 'a = 3',
        optC: 'a = 4',
        optD: 'a = 1',
        ans: 'D',
        exp: 'For infinitely many solutions, a/3 = 2/6 = 8/24 = 1/3. Hence a/3 = 1/3 => a = 1.'
      },
      {
        id: 'q-lineq-m10-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 4x + 3y = 24 and 2x − y = 2.',
        optA: '(4, 3)',
        optB: '(3, 4)',
        optC: '(2, 5)',
        optD: '(5, 1)',
        ans: 'B',
        exp: 'From 2x − y = 2, y = 2x − 2. Substituting gives 4x + 3(2x − 2) = 24 => 10x − 6 = 24 => 10x = 30 => x = 3 and y = 4.'
      },
      {
        id: 'q-lineq-m10-5',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A parking lot has 64 vehicles, cars and motorcycles. There are 200 wheels in total. Find the number of cars and motorcycles.',
        optA: '36 cars and 28 motorcycles',
        optB: '32 cars and 32 motorcycles',
        optC: '40 cars and 24 motorcycles',
        optD: '30 cars and 34 motorcycles',
        ans: 'A',
        exp: 'c + m = 64 and 4c + 2m = 200 => 2c + m = 100. Subtracting the first equation gives c = 36 cars and m = 28 motorcycles.'
      },
      {
        id: 'q-lineq-m10-6',
        difficulty: 'hard',
        type: 'mcq',
        text: 'The perimeter of a rectangle is 94 cm. Its length is 7 cm more than twice its breadth. Find its dimensions.',
        optA: 'Length = 35 cm; breadth = 12 cm',
        optB: 'Length = 101/3 cm; breadth = 40/3 cm',
        optC: 'Length = 33 cm; breadth = 14 cm',
        optD: 'Length = 100/3 cm; breadth = 41/3 cm',
        ans: 'B',
        exp: '2(l + b) = 94 => l + b = 47 and l = 2b + 7. Substituting: (2b + 7) + b = 47 => 3b = 40 => b = 40/3 cm and l = 2(40/3) + 7 = 101/3 cm.'
      },
      {
        id: 'q-lineq-m10-7',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Check whether 9x + 6y = 15 and 3x + 2y = 5 represent the same line.',
        optA: 'No, intersecting lines',
        optB: 'No, parallel lines',
        optC: 'Cannot be determined',
        optD: 'Yes, they represent the same line (coincident)',
        ans: 'D',
        exp: 'Multiplying 3x + 2y = 5 by 3 gives 9x + 6y = 15, which is identical to the first equation. Hence they represent the same coincident line.'
      },
      {
        id: 'q-lineq-m10-8',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Solve: 5x + 3y = 19 and x + y = 5.',
        optA: '(3, 2)',
        optB: '(2, 3)',
        optC: '(4, 1)',
        optD: '(1, 4)',
        ans: 'B',
        exp: 'From x + y = 5, y = 5 − x. Substituting into 5x + 3(5 − x) = 19 => 2x + 15 = 19 => 2x = 4 => x = 2 and y = 3.'
      },
      {
        id: 'q-lineq-m10-9',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 3x + 2y = 12 and 6x + ky = 24, find k for infinitely many solutions.',
        optA: 'k = 2',
        optB: 'k = 3',
        optC: 'k = 6',
        optD: 'k = 4',
        ans: 'D',
        exp: 'For infinitely many solutions, 3/6 = 2/k = 12/24 = 1/2. Hence 2/k = 1/2 => k = 4.'
      },
      {
        id: 'q-lineq-m10-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A class collected Rs 1,260 using Rs 20 and Rs 50 contributions. There were 36 contributions altogether. Find the number of each type.',
        optA: '20 of Rs 20 and 16 of Rs 50',
        optB: '16 of Rs 20 and 20 of Rs 50',
        optC: '18 contributions of Rs 20 and 18 contributions of Rs 50',
        optD: '15 of Rs 20 and 21 of Rs 50',
        ans: 'C',
        exp: 'x + y = 36 and 20x + 50y = 1260 => 2x + 5y = 126. Multiplying x + y = 36 by 2 gives 2x + 2y = 72. Subtracting gives 3y = 54 => y = 18 of Rs 50 and x = 18 of Rs 20.'
      }
    ]
  }
];

export function seedLinearEquationsMockTests(targetDb = db) {
  console.log('[Migration] Adding all 10 Linear Equations Mock Tests (100 questions) from CBSE Class 10 Solved Practice PDF...');

  const upsertMockTestStmt = targetDb.prepare(`
    INSERT INTO mock_tests (
      id, title, subject_id, chapter_id, test_number, description, 
      total_questions, duration_minutes, max_marks, passing_marks, access_type, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      total_questions = excluded.total_questions,
      duration_minutes = excluded.duration_minutes,
      max_marks = excluded.max_marks,
      passing_marks = excluded.passing_marks,
      access_type = excluded.access_type,
      status = excluded.status,
      updated_at = datetime('now')
  `);

  const insertQuestionStmt = targetDb.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d, correct_answer,
      explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      question_text = excluded.question_text,
      option_a = excluded.option_a,
      option_b = excluded.option_b,
      option_c = excluded.option_c,
      option_d = excluded.option_d,
      correct_answer = excluded.correct_answer,
      explanation = excluded.explanation,
      difficulty = excluded.difficulty,
      question_type = excluded.question_type,
      status = excluded.status,
      source = excluded.source,
      updated_at = datetime('now')
  `);

  const deleteExistingMappingStmt = targetDb.prepare(`
    DELETE FROM mock_test_questions WHERE mock_test_id = ?
  `);

  const insertMappingStmt = targetDb.prepare(`
    INSERT OR REPLACE INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertTx = targetDb.transaction(() => {
    for (const test of mockTestsData) {
      // 1. Upsert mock test
      upsertMockTestStmt.run(
        test.testId,
        test.title,
        'mathematics',
        'math-ch3',
        test.testNumber,
        test.description,
        test.questions.length,
        25,
        test.questions.length * 1.0,
        Math.ceil(test.questions.length * 0.4),
        test.accessType,
        'published'
      );

      // 2. Remove old mappings
      deleteExistingMappingStmt.run(test.testId);

      // 3. Insert questions and mappings
      test.questions.forEach((q, index) => {
        insertQuestionStmt.run(
          q.id,
          'mathematics',
          'math-ch3',
          'Pair of Linear Equations in Two Variables',
          q.difficulty,
          q.type,
          q.text,
          q.optA,
          q.optB,
          q.optC,
          q.optD,
          q.ans,
          q.exp,
          1.0,
          0.0,
          'published',
          'CBSE Class 10 Linear Equations Solved Practice Sets'
        );

        insertMappingStmt.run(
          `mtq-${test.testId}-${q.id}`,
          test.testId,
          q.id,
          index + 1
        );
      });

      console.log(`[Success] Seeded ${test.questions.length} questions into ${test.title} (${test.testId})`);
    }
  });

  insertTx();
  console.log('[Done] All 10 Linear Equations Mock Tests (100 questions) successfully updated with evenly distributed A, B, C, D answers!');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('addLinearEquationsMockTests.ts')) {
  seedLinearEquationsMockTests();
}
