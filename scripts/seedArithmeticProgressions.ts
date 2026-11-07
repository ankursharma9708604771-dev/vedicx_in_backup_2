import Database from 'better-sqlite3';

export function seedArithmeticProgressions(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 5: Arithmetic Progressions (8 Mock Tests, 80 Questions)...');

  // Ensure 8 mock test slots for math-ch5
  const existingTests = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all('math-ch5') as any[];
  const existingSlotMap = new Map(existingTests.map(t => [t.test_number, t.id]));

  for (let slot = 1; slot <= 8; slot++) {
    const testId = existingSlotMap.get(slot) || `test-math-ch5-slot-${slot}`;
    const title = `Arithmetic Progressions – Mock Test ${slot}`;
    const accessType = slot === 1 ? 'free' : 'premium';

    const testExists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
    if (!testExists) {
      db.prepare(`
        INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
        VALUES (?, ?, 'mathematics', 'math-ch5', ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
      `).run(testId, title, slot, `Class 10 Arithmetic Progressions Mock Test ${slot}`, accessType);
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
          text: 'Which sequence is an arithmetic progression (AP)?',
          optA: '2, 4, 8, 16, ...',
          optB: '1, 4, 9, 16, ...',
          optC: '7, 11, 15, 19, ...',
          optD: '1, 2, 4, 7, ...',
          ans: 'C',
          exp: 'In 7, 11, 15, 19, ... each consecutive difference is 11 − 7 = 15 − 11 = 19 − 15 = 4 (constant common difference). The others do not have a constant difference.'
        },
        {
          text: 'Find the common difference d and the 12th term of the AP 18, 13, 8, 3, ...',
          optA: 'd = −5, a₁₂ = −37',
          optB: 'd = 5, a₁₂ = 73',
          optC: 'd = −5, a₁₂ = −42',
          optD: 'd = −4, a₁₂ = −26',
          ans: 'A',
          exp: 'First term a = 18, d = 13 − 18 = −5. a₁₂ = a + 11d = 18 + 11(−5) = 18 − 55 = −37.'
        },
        {
          text: 'A sequence begins 5, x, 17, ... and is an AP. Find the value of x.',
          optA: '10',
          optB: '11',
          optC: '12',
          optD: '13',
          ans: 'B',
          exp: 'In an AP, consecutive differences are equal: x − 5 = 17 − x => 2x = 22 => x = 11.'
        },
        {
          text: 'State whether true or false: "Every sequence whose terms strictly increase is an arithmetic progression."',
          optA: 'True, increasing terms guarantee an AP',
          optB: 'True only for positive integers',
          optC: 'False, the difference between consecutive terms must be constant',
          optD: 'False, increasing sequences are geometric progressions only',
          ans: 'C',
          exp: 'False. An AP requires a constant common difference d. For example, 1, 2, 4, 8 increases, but the differences are 1, 2, 4 (not constant).'
        },
        {
          text: 'Which term of the AP 3, 8, 13, 18, ... is 78?',
          optA: '14th term',
          optB: '15th term',
          optC: '17th term',
          optD: '16th term',
          ans: 'D',
          exp: 'a = 3, d = 5. aₙ = a + (n − 1)d => 78 = 3 + 5(n − 1) => 75 = 5(n − 1) => n − 1 = 15 => n = 16.'
        },
        {
          text: 'Insert three arithmetic means between 4 and 20.',
          optA: '8, 12, 16',
          optB: '7, 11, 15',
          optC: '6, 10, 14',
          optD: '8, 13, 17',
          ans: 'A',
          exp: 'Let the means be A₁, A₂, A₃. The AP is 4, A₁, A₂, A₃, 20 with 5 terms. a₅ = 4 + 4d = 20 => 4d = 16 => d = 4. The means are 8, 12, 16.'
        },
        {
          text: 'A student writes the 20th term of an AP as a + 20d. Identify the correct expression.',
          optA: 'a + 21d',
          optB: 'a + 19d',
          optC: '20a + d',
          optD: 'a + 20d − 1',
          ans: 'B',
          exp: 'The formula for the nth term is aₙ = a + (n − 1)d. For n = 20, a₂₀ = a + (20 − 1)d = a + 19d.'
        },
        {
          text: 'A hall has 15 rows of seats. The first row has 18 seats and each next row has 2 more seats. How many seats are in the 15th row?',
          optA: '44 seats',
          optB: '48 seats',
          optC: '46 seats',
          optD: '50 seats',
          ans: 'C',
          exp: 'a = 18, d = 2, n = 15. a₁₅ = a + 14d = 18 + 14(2) = 18 + 28 = 46 seats.'
        },
        {
          text: 'Find the sum of the first 20 terms of the AP 6, 10, 14, 18, ...',
          optA: '840',
          optB: '860',
          optC: '900',
          optD: '880',
          ans: 'D',
          exp: 'a = 6, d = 4, n = 20. S₂₀ = (20/2)[2(6) + 19(4)] = 10[12 + 76] = 10(88) = 880.'
        },
        {
          text: 'The 7th term of an AP is 24 and its 13th term is 48. Find the first term a and common difference d.',
          optA: 'a = 0, d = 4',
          optB: 'a = 2, d = 3',
          optC: 'a = 4, d = 4',
          optD: 'a = −4, d = 5',
          ans: 'A',
          exp: 'a + 6d = 24 and a + 12d = 48. Subtracting gives 6d = 24 => d = 4. Then a = 24 − 6(4) = 0.'
        }
      ]
    },

    // Mock Test 2
    {
      slot: 2,
      questions: [
        {
          text: 'The formula for the nth term of an AP with first term a and common difference d is:',
          optA: 'aₙ = an + d',
          optB: 'aₙ = a + (n − 1)d',
          optC: 'aₙ = a + nd',
          optD: 'aₙ = (a + d)(n − 1)',
          ans: 'B',
          exp: 'The standard formula is aₙ = a + (n − 1)d.'
        },
        {
          text: 'The 5th term of an AP is 17 and the 11th term is 41. Find its first term a.',
          optA: 'a = 1',
          optB: 'a = 2',
          optC: 'a = 3',
          optD: 'a = 4',
          ans: 'A',
          exp: 'a + 4d = 17 and a + 10d = 41 => 6d = 24 => d = 4. Then a = 17 − 4(4) = 1.'
        },
        {
          text: 'Is 301 a term of the AP 5, 11, 17, 23, ...? Justify.',
          optA: 'Yes, it is the 50th term',
          optB: 'Yes, it is the 51st term',
          optC: 'No, because n evaluates to 151/3 which is not an integer',
          optD: 'No, because 301 is an odd number',
          ans: 'C',
          exp: 'a = 5, d = 6. 301 = 5 + (n − 1)6 => 296 = 6(n − 1) => n − 1 = 148/3, which is not an integer. Hence 301 is not a term.'
        },
        {
          text: 'Assertion: The sequence 2, 5, 8, 11, ... is an AP. Reason: Its common difference is 3. Which option is correct?',
          optA: 'Both A and R are true, and R is the correct explanation of A',
          optB: 'Both A and R are true, but R is not the correct explanation',
          optC: 'A is true but R is false',
          optD: 'A is false but R is true',
          ans: 'A',
          exp: 'Consecutive differences are 5 − 2 = 3, 8 − 5 = 3, 11 − 8 = 3. A constant difference between consecutive terms defines an AP, so reason explains assertion.'
        },
        {
          text: 'The 8th term of an AP is 31 and the 15th term is 59. Find the 25th term.',
          optA: '95',
          optB: '97',
          optC: '101',
          optD: '99',
          ans: 'D',
          exp: 'a₁₅ − a₈ = 7d = 59 − 31 = 28 => d = 4. a = 31 − 7(4) = 3. a₂₅ = 3 + 24(4) = 3 + 96 = 99.'
        },
        {
          text: 'Three numbers are in AP. Their sum is 27 and their product is 585. Find the numbers.',
          optA: '3, 9, 15',
          optB: '5, 9, 13',
          optC: '4, 9, 14',
          optD: '6, 9, 12',
          ans: 'B',
          exp: 'Let numbers be 9 − d, 9, 9 + d. Product = 9(81 − d²) = 585 => 81 − d² = 65 => d² = 16 => d = ±4. Numbers are 5, 9, 13.'
        },
        {
          text: 'A person saves ₹500 in the first month and increases savings by ₹75 every month. How much does the person save in the 12th month?',
          optA: '₹1,325',
          optB: '₹1,400',
          optC: '₹1,250',
          optD: '₹1,350',
          ans: 'A',
          exp: 'a = 500, d = 75, n = 12. a₁₂ = 500 + 11(75) = 500 + 825 = ₹1,325.'
        },
        {
          text: 'Find the 18th term from the end of the AP 4, 9, 14, ..., 124.',
          optA: '44',
          optB: '34',
          optC: '39',
          optD: '41',
          ans: 'C',
          exp: 'Reversing the AP from 124 with d = −5: 18th term from end = 124 + 17(−5) = 124 − 85 = 39.'
        },
        {
          text: 'If the 4th term of an AP is 0, what is the relation between the 10th term and the 6th term?',
          optA: 'a₁₀ = 2a₆',
          optB: 'a₁₀ = 3a₆',
          optC: 'a₁₀ = 4a₆',
          optD: 'a₁₀ = a₆ + 10',
          ans: 'B',
          exp: 'a₄ = a + 3d = 0 => a = −3d. a₁₀ = a + 9d = −3d + 9d = 6d. a₆ = a + 5d = −3d + 5d = 2d. Hence a₁₀ = 3(2d) = 3a₆.'
        },
        {
          text: 'The sum of the first n terms of an AP is Sₙ = 3n² + 2n. Find the 10th term a₁₀.',
          optA: '55',
          optB: '61',
          optC: '53',
          optD: '57',
          ans: 'D',
          exp: 'aₙ = Sₙ − Sₙ₋₁ = (3n² + 2n) − [3(n − 1)² + 2(n − 1)] = 6n − 1. For n = 10, a₁₀ = 6(10) − 3 = 57.'
        }
      ]
    },

    // Mock Test 3
    {
      slot: 3,
      questions: [
        {
          text: 'Find the sum of the first 15 positive odd numbers (1, 3, 5, ...).',
          optA: '225',
          optB: '210',
          optC: '240',
          optD: '196',
          ans: 'A',
          exp: 'Sum of first n odd numbers is n². For n = 15, S₁₅ = 15² = 225.'
        },
        {
          text: 'Find S₂₅ for the AP 12, 9, 6, 3, ...',
          optA: '−550',
          optB: '−600',
          optC: '−625',
          optD: '−575',
          ans: 'B',
          exp: 'a = 12, d = −3, n = 25. S₂₅ = (25/2)[2(12) + 24(−3)] = (25/2)[24 − 72] = (25/2)(−48) = −600.'
        },
        {
          text: 'A sequence has first term 7 and common difference 4. Can the sum of n terms be 315?',
          optA: 'Yes, n = 12',
          optB: 'Yes, n = 15',
          optC: 'No positive integer n gives sum 315',
          optD: 'Yes, n = 14',
          ans: 'C',
          exp: 'Sₙ = (n/2)[14 + 4(n − 1)] = n(2n + 5) = 315 => 2n² + 5n − 315 = 0. D = 25 + 2520 = 2545, which is not a perfect square. Thus n is not an integer.'
        },
        {
          text: 'In the sum formula Sₙ = n/2[2a + (n − 1)d], what does the symbol n represent?',
          optA: 'The last term of the AP',
          optB: 'The common difference',
          optC: 'The first term',
          optD: 'The number of terms being added',
          ans: 'D',
          exp: 'n denotes the number of terms whose sum is being calculated.'
        },
        {
          text: 'Find the sum of all multiples of 7 between 1 and 100.',
          optA: '735',
          optB: '700',
          optC: '750',
          optD: '728',
          ans: 'A',
          exp: 'Multiples are 7, 14, ..., 98. a = 7, d = 7, l = 98. n = 98/7 = 14. S = (14/2)(7 + 98) = 7(105) = 735.'
        },
        {
          text: 'A theatre has 20 rows. The first row has 25 seats and each successive row has 3 more seats. Find the total number of seats.',
          optA: '1,050 seats',
          optB: '1,070 seats',
          optC: '1,100 seats',
          optD: '1,040 seats',
          ans: 'B',
          exp: 'a = 25, d = 3, n = 20. S₂₀ = (20/2)[2(25) + 19(3)] = 10[50 + 57] = 10(107) = 1,070 seats.'
        },
        {
          text: 'The sum of the first 10 terms of an AP is 150 and the first term is 6. Find the common difference d.',
          optA: 'd = 1.5',
          optB: 'd = 3',
          optC: 'd = 2',
          optD: 'd = 2.5',
          ans: 'C',
          exp: 'S₁₀ = 5[2(6) + 9d] = 150 => 12 + 9d = 30 => 9d = 18 => d = 2.'
        },
        {
          text: 'Find the sum of the first 30 terms of an AP whose 3rd term is 12 and 8th term is 27.',
          optA: '1,450',
          optB: '1,500',
          optC: '1,425',
          optD: '1,485',
          ans: 'D',
          exp: 'a + 2d = 12 and a + 7d = 27 => 5d = 15 => d = 3, a = 6. S₃₀ = 15[2(6) + 29(3)] = 15[12 + 87] = 15(99) = 1,485.'
        },
        {
          text: 'A stack of logs has 20 logs in the bottom row, 19 in the next, and so on until 1 log at the top. How many logs are there in total?',
          optA: '210 logs',
          optB: '200 logs',
          optC: '220 logs',
          optD: '190 logs',
          ans: 'A',
          exp: 'Sum of natural numbers from 1 to 20: S = 20(21)/2 = 210 logs.'
        },
        {
          text: 'If Sₙ = n(4n + 1), find the 12th term a₁₂.',
          optA: '91',
          optB: '93',
          optC: '95',
          optD: '89',
          ans: 'B',
          exp: 'Sₙ = 4n² + n. Sₙ₋₁ = 4(n − 1)² + (n − 1) = 4n² − 7n + 3. aₙ = Sₙ − Sₙ₋₁ = 8n − 3. a₁₂ = 8(12) − 3 = 96 − 3 = 93.'
        }
      ]
    },

    // Mock Test 4
    {
      slot: 4,
      questions: [
        {
          text: 'A staircase has 12 steps. The first step is 10 cm high and each next step is 1.5 cm higher than the previous one. Find the height of the 12th step.',
          optA: '25.0 cm',
          optB: '28.0 cm',
          optC: '26.5 cm',
          optD: '27.5 cm',
          ans: 'C',
          exp: 'a = 10, d = 1.5, n = 12. a₁₂ = a + 11d = 10 + 11(1.5) = 10 + 16.5 = 26.5 cm.'
        },
        {
          text: 'A student reads 8 pages on day 1 and 5 more pages each following day than the previous day. How many pages does the student read on day 14?',
          optA: '78 pages',
          optB: '70 pages',
          optC: '75 pages',
          optD: '73 pages',
          ans: 'D',
          exp: 'a = 8, d = 5, n = 14. a₁₄ = 8 + 13(5) = 8 + 65 = 73 pages.'
        },
        {
          text: 'A loan is repaid in 20 monthly instalments. The first instalment is ₹2,000 and each instalment increases by ₹100. Find the total amount repaid.',
          optA: '₹59,000',
          optB: '₹58,000',
          optC: '₹60,000',
          optD: '₹56,500',
          ans: 'A',
          exp: 'a = 2000, d = 100, n = 20. S₂₀ = 10[2(2000) + 19(100)] = 10[4000 + 1900] = 10(5900) = ₹59,000.'
        },
        {
          text: 'Find the number of terms in the finite AP 8, 13, 18, ..., 103.',
          optA: '19',
          optB: '20',
          optC: '21',
          optD: '22',
          ans: 'B',
          exp: '103 = 8 + (n − 1)5 => 95 = 5(n − 1) => n − 1 = 19 => n = 20.'
        },
        {
          text: 'A factory produces 1,200 units in the first week and increases production by 80 units every week. Find the total production in 15 weeks.',
          optA: '25,200 units',
          optB: '27,000 units',
          optC: '26,400 units',
          optD: '24,800 units',
          ans: 'C',
          exp: 'a = 1200, d = 80, n = 15. S₁₅ = (15/2)[2400 + 14(80)] = 7.5[2400 + 1120] = 7.5(3520) = 26,400 units.'
        },
        {
          text: 'A ball is dropped from a height of 100 m and rebounds to 3/4 of the previous height each time. Is the sequence of rebound heights an AP?',
          optA: 'Yes, because the heights decrease systematically',
          optB: 'Yes, with common difference −25',
          optC: 'No, because the consecutive ratio is constant, making it a geometric progression',
          optD: 'Cannot be determined without calculating all terms',
          ans: 'C',
          exp: 'Each height is obtained by multiplying the previous by 3/4 (constant ratio, not constant difference). This is a GP, not an AP.'
        },
        {
          text: 'The sum of the first n terms of an AP is 4n² − n. Find the 5th term a₅.',
          optA: '31',
          optB: '39',
          optC: '43',
          optD: '35',
          ans: 'D',
          exp: 'aₙ = Sₙ − Sₙ₋₁ = (4n² − n) − [4(n − 1)² − (n − 1)] = 8n − 5. For n = 5: a₅ = 8(5) − 5 = 35.'
        },
        {
          text: 'A person deposits ₹100 in week 1, ₹150 in week 2, ₹200 in week 3, and so on. In which week will the deposit be ₹600?',
          optA: 'Week 11',
          optB: 'Week 10',
          optC: 'Week 12',
          optD: 'Week 13',
          ans: 'A',
          exp: '600 = 100 + (n − 1)50 => 500 = 50(n − 1) => n − 1 = 10 => n = 11.'
        },
        {
          text: 'A farmer plants 17 trees in the first row, 20 in the second, 23 in the third, and so on across 12 rows. How many trees are planted in total?',
          optA: '380 trees',
          optB: '402 trees',
          optC: '420 trees',
          optD: '396 trees',
          ans: 'B',
          exp: 'a = 17, d = 3, n = 12. S₁₂ = 6[2(17) + 11(3)] = 6[34 + 33] = 6(67) = 402 trees.'
        },
        {
          text: 'A cyclist covers 24 km on day 1 and increases distance by 2 km each day. On which day will the cyclist cover 50 km, and what is the total distance covered up to that day?',
          optA: 'Day 13, Total = 480 km',
          optB: 'Day 15, Total = 550 km',
          optC: 'Day 14, Total = 518 km',
          optD: 'Day 14, Total = 500 km',
          ans: 'C',
          exp: '50 = 24 + (n − 1)2 => 26 = 2(n − 1) => n = 14. S₁₄ = (14/2)[24 + 50] = 7(74) = 518 km.'
        }
      ]
    },

    // Mock Test 5
    {
      slot: 5,
      questions: [
        {
          text: 'Can the number 100 be a term of the AP 4, 9, 14, 19, ...?',
          optA: 'No, because n = 101/5 which is not an integer',
          optB: 'Yes, it is the 20th term',
          optC: 'Yes, it is the 21st term',
          optD: 'No, because 100 is an even number',
          ans: 'A',
          exp: '100 = 4 + (n − 1)5 => 96 = 5(n − 1) => n − 1 = 96/5 = 19.2 (not an integer). So 100 cannot be a term.'
        },
        {
          text: 'If a, b, c are three consecutive terms of an AP, which relation is always true?',
          optA: 'b² = ac',
          optB: '2b = a + c',
          optC: 'b = a + c',
          optD: 'a + b + c = 0',
          ans: 'B',
          exp: 'Since consecutive differences are equal, b − a = c − b => 2b = a + c (b is the arithmetic mean of a and c).'
        },
        {
          text: 'The 6th term of an AP is 4 and the 10th term is −8. Find the 20th term.',
          optA: '−35',
          optB: '−40',
          optC: '−38',
          optD: '−42',
          ans: 'C',
          exp: 'a₁₀ − a₆ = 4d = −8 − 4 = −12 => d = −3. a = 4 − 5(−3) = 19. a₂₀ = 19 + 19(−3) = 19 − 57 = −38.'
        },
        {
          text: 'Assertion: The sum of the first 10 terms of 2, 4, 6, ... is 110. Reason: Sₙ = n/2(first term + last term). Which option is correct?',
          optA: 'A is true but R is false',
          optB: 'Both A and R are true, but R does not explain A',
          optC: 'A is false but R is true',
          optD: 'Both A and R are true, and R is the correct explanation of A',
          ans: 'D',
          exp: '10th term = 2 + 9(2) = 20. S₁₀ = (10/2)(2 + 20) = 5(22) = 110. Both are true and formula explains the sum.'
        },
        {
          text: 'If the sum of the first n terms is Sₙ = 2n² + 5n, find the 15th term a₁₅.',
          optA: '63',
          optB: '59',
          optC: '67',
          optD: '61',
          ans: 'A',
          exp: 'aₙ = Sₙ − Sₙ₋₁ = (2n² + 5n) − [2(n − 1)² + 5(n − 1)] = 4n + 3. For n = 15: a₁₅ = 4(15) + 3 = 63.'
        },
        {
          text: 'How many terms of the AP 9, 17, 25, ... must be taken so that their sum is 636?',
          optA: '14 terms',
          optB: '12 terms',
          optC: '10 terms',
          optD: '16 terms',
          ans: 'B',
          exp: 'a = 9, d = 8. (n/2)[18 + 8(n − 1)] = 636 => n(4n + 5) = 636 => 4n² + 5n − 636 = 0 => (4n + 53)(n − 12) = 0 => n = 12.'
        },
        {
          text: 'A student claims that 2, 5, 9, 14, 20 is an AP because it increases. Is the claim correct?',
          optA: 'Yes, any sequence that increases by adding numbers is an AP',
          optB: 'Yes, because the differences form an AP',
          optC: 'No, because the consecutive differences (3, 4, 5, 6) are not constant',
          optD: 'Cannot be determined',
          ans: 'C',
          exp: 'An AP strictly requires the consecutive difference to remain constant. Here differences are 3, 4, 5, 6, so it is not an AP.'
        },
        {
          text: 'The 4th term of an AP is 10 and its 9th term is 25. Find the sum of the first 20 terms.',
          optA: '580',
          optB: '600',
          optC: '610',
          optD: '590',
          ans: 'D',
          exp: '5d = 15 => d = 3. a = 10 − 3(3) = 1. S₂₀ = 10[2(1) + 19(3)] = 10[2 + 57] = 590.'
        },
        {
          text: 'Find the sum of all two-digit numbers divisible by 6.',
          optA: '810',
          optB: '840',
          optC: '780',
          optD: '825',
          ans: 'A',
          exp: 'Numbers are 12, 18, ..., 96. a = 12, d = 6, l = 96. n = (96 − 12)/6 + 1 = 15. S = (15/2)(12 + 96) = (15/2)(108) = 810.'
        },
        {
          text: 'If the 7th term of an AP is 4 more than its 5th term, find the common difference d.',
          optA: 'd = 1',
          optB: 'd = 2',
          optC: 'd = 3',
          optD: 'd = 4',
          ans: 'B',
          exp: 'a₇ − a₅ = (a + 6d) − (a + 4d) = 2d = 4 => d = 2.'
        }
      ]
    },

    // Mock Test 6
    {
      slot: 6,
      questions: [
        {
          text: 'Choose the INCORRECT statement about an Arithmetic Progression (AP):',
          optA: 'Consecutive differences between terms are equal',
          optB: 'The nth term expression is linear in n',
          optC: 'The common difference may be zero',
          optD: 'The common difference must always be positive',
          ans: 'D',
          exp: 'The common difference d can be positive, negative (decreasing AP), or zero (constant AP). It does not have to be positive.'
        },
        {
          text: 'If aₙ = 7 − 3n, identify the first term a and the common difference d.',
          optA: 'a = 4, d = −3',
          optB: 'a = 7, d = −3',
          optC: 'a = 4, d = 3',
          optD: 'a = 1, d = −3',
          ans: 'A',
          exp: 'a₁ = 7 − 3(1) = 4, a₂ = 7 − 3(2) = 1 => d = 1 − 4 = −3.'
        },
        {
          text: 'The 3rd and 7th terms of an AP are 16 and 32. Which term of this AP is equal to 68?',
          optA: '14th term',
          optB: '16th term',
          optC: '15th term',
          optD: '17th term',
          ans: 'B',
          exp: '4d = 16 => d = 4. a = 16 − 2(4) = 8. 68 = 8 + (n − 1)4 => 60 = 4(n − 1) => n − 1 = 15 => n = 16.'
        },
        {
          text: 'Find two numbers between 10 and 40 such that all four numbers form an AP.',
          optA: '15 and 30',
          optB: '18 and 32',
          optC: '20 and 30',
          optD: '22 and 34',
          ans: 'C',
          exp: 'Terms are 10, a₂, a₃, 40 (4 terms). a₄ = 10 + 3d = 40 => 3d = 30 => d = 10. The numbers are 20 and 30.'
        },
        {
          text: 'A theatre\'s first row has 30 seats, and each following row has 4 additional seats. If there are 18 rows, find the total number of seats.',
          optA: '1,100 seats',
          optB: '1,120 seats',
          optC: '1,180 seats',
          optD: '1,152 seats',
          ans: 'D',
          exp: 'a = 30, d = 4, n = 18. S₁₈ = 9[2(30) + 17(4)] = 9[60 + 68] = 9(128) = 1,152 seats.'
        },
        {
          text: 'If Sₙ = 5n² − 2n, determine the first term a and common difference d.',
          optA: 'a = 3, d = 10',
          optB: 'a = 5, d = 10',
          optC: 'a = 3, d = 5',
          optD: 'a = 2, d = 8',
          ans: 'A',
          exp: 'a₁ = S₁ = 5(1)² − 2(1) = 3. aₙ = Sₙ − Sₙ₋₁ = 10n − 7. a₂ = 13 => d = 13 − 3 = 10.'
        },
        {
          text: 'The sum of first 5 terms is 55 and sum of first 10 terms is 210. Find the 6th term a₆.',
          optA: '21',
          optB: '23',
          optC: '25',
          optD: '27',
          ans: 'B',
          exp: 'S₅ = 55 => 5/2[2a + 4d] = 55 => a + 2d = 11. S₁₀ = 210 => 5[2a + 9d] = 210 => 2a + 9d = 42. Solving: d = 4, a = 3. a₆ = a + 5d = 3 + 20 = 23.'
        },
        {
          text: 'A sequence has first term 2 and common difference 0. What is the sum of its first 50 terms?',
          optA: '50',
          optB: '0',
          optC: '100',
          optD: '200',
          ans: 'C',
          exp: 'Since d = 0, every term is 2. S₅₀ = 50 × 2 = 100.'
        },
        {
          text: 'In an AP of 23 terms, the 12th term from beginning is 37 and 12th term from end is 82. What can be concluded?',
          optA: 'The AP has sum 1,368.5',
          optB: 'The data are consistent with d = 2',
          optC: 'The common difference is negative',
          optD: 'The data are inconsistent; no such AP exists because both refer to the same 12th term',
          ans: 'D',
          exp: 'In a 23-term AP, the 12th term from the start and the 12th term from the end are the exact same middle term. A single term cannot simultaneously be 37 and 82. The data are inconsistent.'
        },
        {
          text: 'A student writes Sₙ = n/2[2a + nd]. State the error and give the correct formula.',
          optA: 'The coefficient of d must be (n − 1); Sₙ = n/2[2a + (n − 1)d]',
          optB: 'The formula should divide by n instead of 2',
          optC: 'The term 2a should be a²',
          optD: 'The coefficient of a should be n',
          ans: 'A',
          exp: 'Because the nth term is a + (n − 1)d, the coefficient of d is (n − 1), not n.'
        }
      ]
    },

    // Mock Test 7
    {
      slot: 7,
      questions: [
        {
          text: 'A school auditorium has 22 seats in the first row. Each next row has 2 extra seats. There are 25 rows. Find the seats in the last row.',
          optA: '68 seats',
          optB: '70 seats',
          optC: '72 seats',
          optD: '74 seats',
          ans: 'B',
          exp: 'a = 22, d = 2, n = 25. a₂₅ = 22 + 24(2) = 22 + 48 = 70 seats.'
        },
        {
          text: 'Using the same auditorium data (25 rows, row 1 = 22, row 25 = 70), calculate the total number of seats in the auditorium.',
          optA: '1,100 seats',
          optB: '1,200 seats',
          optC: '1,150 seats',
          optD: '1,175 seats',
          ans: 'C',
          exp: 'S₂₅ = (25/2)(22 + 70) = (25/2)(92) = 25 × 46 = 1,150 seats.'
        },
        {
          text: 'A savings plan starts at ₹250 in month 1 and increases by ₹50 each month. Find the total saved in 12 months.',
          optA: '₹6,000',
          optB: '₹6,500',
          optC: '₹6,200',
          optD: '₹6,300',
          ans: 'D',
          exp: 'a = 250, d = 50, n = 12. S₁₂ = 6[2(250) + 11(50)] = 6[500 + 550] = 6(1050) = ₹6,300.'
        },
        {
          text: 'A runner completes 400 m in session 1 and increases distance by 75 m per session. In which session will the runner first reach 1,000 m?',
          optA: '9th session',
          optB: '8th session',
          optC: '10th session',
          optD: '11th session',
          ans: 'A',
          exp: '1000 = 400 + (n − 1)75 => 600 = 75(n − 1) => n − 1 = 8 => n = 9.'
        },
        {
          text: 'Find the sum of the first 18 terms of the AP 11, 8, 5, 2, ...',
          optA: '−252',
          optB: '−261',
          optC: '−270',
          optD: '−240',
          ans: 'B',
          exp: 'a = 11, d = −3, n = 18. S₁₈ = 9[2(11) + 17(−3)] = 9[22 − 51] = 9(−29) = −261.'
        },
        {
          text: 'The sum of the first n terms of an AP is 6n − n². Find the first term a₁ and 6th term a₆.',
          optA: 'a₁ = 5, a₆ = 0',
          optB: 'a₁ = 6, a₆ = −6',
          optC: 'a₁ = 5, a₆ = −5',
          optD: 'a₁ = 4, a₆ = −4',
          ans: 'C',
          exp: 'a₁ = S₁ = 6(1) − 1² = 5. aₙ = Sₙ − Sₙ₋₁ = 7 − 2n. a₆ = 7 − 2(6) = −5.'
        },
        {
          text: 'A gardener plants 5 saplings in row 1, 8 in row 2, 11 in row 3, and continues. How many saplings are planted in the first 16 rows?',
          optA: '420 saplings',
          optB: '460 saplings',
          optC: '430 saplings',
          optD: '440 saplings',
          ans: 'D',
          exp: 'a = 5, d = 3, n = 16. S₁₆ = 8[2(5) + 15(3)] = 8[10 + 45] = 8(55) = 440 saplings.'
        },
        {
          text: 'A person pays off a debt in 15 instalments: ₹3,000 in first and ₹200 more each time. Find the final instalment and total paid.',
          optA: 'Final = ₹5,800, Total = ₹66,000',
          optB: 'Final = ₹6,000, Total = ₹67,500',
          optC: 'Final = ₹5,600, Total = ₹64,500',
          optD: 'Final = ₹5,800, Total = ₹65,000',
          ans: 'A',
          exp: 'a₁₅ = 3000 + 14(200) = ₹5,800. S₁₅ = (15/2)(3000 + 5800) = 7.5(8800) = ₹66,000.'
        },
        {
          text: 'A library arranges books: 9 in first row, 13 in second, 17 in third. How many rows are needed to arrange 225 books?',
          optA: '8 rows',
          optB: '9 rows',
          optC: '10 rows',
          optD: '11 rows',
          ans: 'B',
          exp: 'a = 9, d = 4. (n/2)[18 + 4(n − 1)] = 225 => n(2n + 7) = 225 => 2n² + 7n − 225 = 0 => (2n + 25)(n − 9) = 0 => n = 9 rows.'
        },
        {
          text: 'A stadium tier 1 has 120 seats, each next tier has 15 more seats. If there are 10 tiers, find the total seats in tiers 8 to 10.',
          optA: '690 seats',
          optB: '705 seats',
          optC: '720 seats',
          optD: '735 seats',
          ans: 'C',
          exp: 'a₈ = 120 + 7(15) = 225; a₉ = 240; a₁₀ = 255. Total in tiers 8 to 10 = 225 + 240 + 255 = 720 seats.'
        }
      ]
    },

    // Mock Test 8
    {
      slot: 8,
      questions: [
        {
          text: 'The 20th term of the AP −4, 1, 6, 11, ... is:',
          optA: '86',
          optB: '89',
          optC: '91',
          optD: '96',
          ans: 'C',
          exp: 'a = −4, d = 5. a₂₀ = −4 + 19(5) = −4 + 95 = 91.'
        },
        {
          text: 'If the 9th term of an AP is 0, what is the relation between the 19th term and 14th term?',
          optA: 'a₁₉ = 3a₁₄',
          optB: 'a₁₉ = 2a₁₄',
          optC: 'a₁₉ = a₁₄ + 5',
          optD: 'a₁₉ = 4a₁₄',
          ans: 'B',
          exp: 'a₉ = a + 8d = 0 => a = −8d. a₁₉ = a + 18d = 10d. a₁₄ = a + 13d = 5d. Hence a₁₉ = 2a₁₄.'
        },
        {
          text: 'Find the value of k for which 2k − 1, 3k + 2, 5k + 8 are consecutive terms of an AP.',
          optA: 'k = 3',
          optB: 'k = −2',
          optC: 'k = 2',
          optD: 'k = −3',
          ans: 'D',
          exp: '2(3k + 2) = (2k − 1) + (5k + 8) => 6k + 4 = 7k + 7 => k = −3.'
        },
        {
          text: 'The 7th term of an AP is 19 and its 13th term is 43. Find the 30th term.',
          optA: '111',
          optB: '115',
          optC: '107',
          optD: '119',
          ans: 'A',
          exp: '6d = 24 => d = 4. a = 19 − 6(4) = −5. a₃₀ = −5 + 29(4) = −5 + 116 = 111.'
        },
        {
          text: 'Find the sum of all integers between 100 and 300 that are divisible by 9.',
          optA: '4,500',
          optB: '4,455',
          optC: '4,365',
          optD: '4,545',
          ans: 'B',
          exp: 'First is 108, last is 297, d = 9. n = (297 − 108)/9 + 1 = 22. S = (22/2)(108 + 297) = 11(405) = 4,455.'
        },
        {
          text: 'The sum of first n terms is Sₙ = 2n² + 7n. Find the common difference d and 20th term a₂₀.',
          optA: 'd = 4, a₂₀ = 85',
          optB: 'd = 2, a₂₀ = 87',
          optC: 'd = 4, a₂₀ = 89',
          optD: 'd = 7, a₂₀ = 95',
          ans: 'A',
          exp: 'aₙ = Sₙ − Sₙ₋₁ = 4n + 5. Thus d = 4. a₂₀ = 4(20) + 5 = 85.'
        },
        {
          text: 'Find 5 arithmetic means between 8 and 50.',
          optA: '14, 21, 28, 35, 42',
          optB: '15, 22, 29, 36, 43',
          optC: '16, 23, 30, 37, 44',
          optD: '15, 23, 31, 39, 47',
          ans: 'B',
          exp: '7 terms total: 8, A₁, A₂, A₃, A₄, A₅, 50. a₇ = 8 + 6d = 50 => 6d = 42 => d = 7. Means are 15, 22, 29, 36, 43.'
        },
        {
          text: 'How many terms of the AP 18, 15, 12, ... must be added to obtain a sum of 0?',
          optA: '12 terms',
          optB: '14 terms',
          optC: '13 terms',
          optD: '15 terms',
          ans: 'C',
          exp: 'a = 18, d = −3. Sₙ = (n/2)[36 + (n − 1)(−3)] = (n/2)(39 − 3n) = 0. Since n > 0, 39 − 3n = 0 => n = 13.'
        },
        {
          text: 'An AP has a = −7 and d = 3. Find the least value of n for which aₙ is positive.',
          optA: 'n = 3',
          optB: 'n = 5',
          optC: 'n = 6',
          optD: 'n = 4',
          ans: 'D',
          exp: 'aₙ = −7 + (n − 1)3 = 3n − 10 > 0 => 3n > 10 => n > 3.33. The least positive integer is n = 4 (where a₄ = 2).'
        },
        {
          text: 'A school buys 12 computers in year 1 and increases purchases by 3 computers every year. How many computers will it buy in total over 8 years?',
          optA: '180 computers',
          optB: '175 computers',
          optC: '190 computers',
          optD: '165 computers',
          ans: 'A',
          exp: 'a = 12, d = 3, n = 8. S₈ = 4[2(12) + 7(3)] = 4[24 + 21] = 4(45) = 180 computers.'
        }
      ]
    }
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', 'math-ch5', 'Arithmetic Progressions', 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    testsData.forEach(t => {
      const testId = `test-math-ch5-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-ap-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-ap-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded 10 questions into Arithmetic Progressions – Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] All 8 Arithmetic Progressions Mock Tests (80 questions) successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedArithmeticProgressions.ts')) {
  seedArithmeticProgressions();
}
