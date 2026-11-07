import { db } from '../server/db.ts';

console.log('[Migration] Adding Real Numbers Mock Tests 3, 4, 5, 6 questions from user images...');

// Define the questions for Mock Test 3, 4, 5, 6 + Mock Test 2
const mockTestsData = [
  {
    testId: 'test-math-ch1-slot-2',
    testNumber: 2,
    title: 'Real Numbers – Mock Test 2',
    description: 'Fundamental Theorem of Arithmetic, HCF-LCM relationships & terminating decimals.',
    questions: [
      {
        id: 'q-rn-m2-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The exponent of 2 in the prime factorisation of 144 is:',
        optA: '2',
        optB: '4',
        optC: '3',
        optD: '6',
        ans: 'B',
        exp: '144 = 12² = (2² × 3)² = 2⁴ × 3². The exponent of 2 is 4.'
      },
      {
        id: 'q-rn-m2-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The decimal representation of 11 / (2³ × 5) will terminate after how many decimal places?',
        optA: '1',
        optB: '2',
        optC: '3',
        optD: '4',
        ans: 'C',
        exp: 'Since the highest power of 2 or 5 in the denominator is 3 (2³), the decimal representation terminates after 3 places.'
      },
      {
        id: 'q-rn-m2-3',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If LCM(32, a) = 96 and HCF(32, a) = 4, then the value of a is:',
        optA: '8',
        optB: '12',
        optC: '16',
        optD: '24',
        ans: 'B',
        exp: 'Product of numbers = HCF × LCM => 32 × a = 4 × 96 => a = 384 / 32 = 12.'
      },
      {
        id: 'q-rn-m2-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The LCM of the smallest two-digit composite number and the smallest composite number is:',
        optA: '10',
        optB: '20',
        optC: '40',
        optD: '44',
        ans: 'B',
        exp: 'Smallest composite number = 4. Smallest two-digit composite number = 10. LCM(4, 10) = 20.'
      },
      {
        id: 'q-rn-m2-5',
        difficulty: 'medium',
        type: 'true_false',
        text: 'The product of a non-zero rational number and an irrational number is always irrational.',
        optA: 'True',
        optB: 'False',
        optC: 'Only for square roots',
        optD: 'Cannot be determined',
        ans: 'A',
        exp: 'True. If r is a non-zero rational and x is irrational, assuming rx is rational leads to x = (rx)/r being rational, a contradiction.'
      },
      {
        id: 'q-rn-m2-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If two positive integers p and q can be expressed as p = ab² and q = a³b, where a and b are prime numbers, then LCM(p, q) is:',
        optA: 'ab',
        optB: 'a²b²',
        optC: 'a³b²',
        optD: 'a⁴b³',
        ans: 'C',
        exp: 'LCM is the product of highest powers of each prime involved. LCM(p, q) = a³b².'
      },
      {
        id: 'q-rn-m2-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'The largest number which divides 615 and 963 leaving remainder 6 in each case is:',
        optA: '45',
        optB: '65',
        optC: '87',
        optD: '95',
        ans: 'C',
        exp: 'Required number = HCF(615 - 6, 963 - 6) = HCF(609, 957). 609 = 3 × 7 × 29, 957 = 3 × 11 × 29. HCF = 3 × 29 = 87.'
      },
      {
        id: 'q-rn-m2-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Which of the following numbers has a non-terminating repeating decimal expansion?',
        optA: '17 / 320',
        optB: '77 / 210',
        optC: '15 / 1600',
        optD: '23 / (2³ × 5²)',
        ans: 'B',
        exp: '77 / 210 = 11 / 30 = 11 / (2 × 3 × 5). Since 3 is in the denominator in lowest terms, the decimal expansion is non-terminating repeating.'
      },
      {
        id: 'q-rn-m2-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Two tankers contain 850 litres and 680 litres of petrol respectively. The maximum capacity of a container which can measure the petrol of either tanker in exact number of times is:',
        optA: '150 litres',
        optB: '170 litres',
        optC: '190 litres',
        optD: '210 litres',
        ans: 'B',
        exp: 'Maximum capacity = HCF(850, 680). 850 = 2 × 5² × 17, 680 = 2³ × 5 × 17. HCF = 2 × 5 × 17 = 170 litres.'
      },
      {
        id: 'q-rn-m2-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If n is any natural number, then 6ⁿ - 5ⁿ always ends with which digit?',
        optA: '1',
        optB: '3',
        optC: '5',
        optD: '7',
        ans: 'A',
        exp: 'For any natural number n, 6ⁿ always ends in 6 and 5ⁿ always ends in 5. Therefore, 6ⁿ - 5ⁿ always ends in 6 - 5 = 1.'
      }
    ]
  },
  {
    testId: 'test-math-ch1-slot-3',
    testNumber: 3,
    title: 'Real Numbers – Mock Test 3',
    description: 'Prime factorisation, HCF-LCM properties, square tiles word problems & composite proof.',
    questions: [
      {
        id: 'q-rn-m3-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The prime factorisation of 100 is:',
        optA: '2² × 5²',
        optB: '2 × 5³',
        optC: '2³ × 5',
        optD: '2 × 5²',
        ans: 'A',
        exp: '100 = 10 × 10 = (2 × 5) × (2 × 5) = 2² × 5².'
      },
      {
        id: 'q-rn-m3-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The HCF of 45 and 75 is:',
        optA: '5',
        optB: '15',
        optC: '25',
        optD: '30',
        ans: 'B',
        exp: '45 = 3² × 5 and 75 = 3 × 5². The common factors with smallest powers give HCF = 3 × 5 = 15.'
      },
      {
        id: 'q-rn-m3-3',
        difficulty: 'easy',
        type: 'true_false',
        text: 'The product of two coprime positive integers is equal to their LCM.',
        optA: 'True',
        optB: 'False',
        optC: 'Only for even numbers',
        optD: 'Cannot be determined',
        ans: 'A',
        exp: 'True. HCF × LCM = product. For coprime numbers, HCF = 1, so LCM equals their product.'
      },
      {
        id: 'q-rn-m3-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Which of the following is a perfect square?',
        optA: '2³ × 3²',
        optB: '2² × 3⁴',
        optC: '2 × 5²',
        optD: '3³ × 7',
        ans: 'B',
        exp: 'A number is a perfect square when every exponent in its prime factorisation is even. In 2² × 3⁴, both exponents 2 and 4 are even.'
      },
      {
        id: 'q-rn-m3-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'In the prime factorisation of a perfect cube, every exponent is a multiple of ______.',
        optA: '2',
        optB: '3',
        optC: '4',
        optD: '6',
        ans: 'B',
        exp: '3. A perfect cube is formed when each prime factor occurs with an exponent divisible by 3.'
      },
      {
        id: 'q-rn-m3-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If HCF(18, x) = 6 and LCM(18, x) = 72, then x is:',
        optA: '12',
        optB: '24',
        optC: '36',
        optD: '48',
        ans: 'B',
        exp: 'Using HCF × LCM = product, 6 × 72 = 18 × x. Thus x = 432 / 18 = 24.'
      },
      {
        id: 'q-rn-m3-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A rectangular board is 96 cm long and 144 cm wide. Find the side of the largest square tile that can cover it exactly without cutting.',
        optA: '24 cm',
        optB: '36 cm',
        optC: '48 cm',
        optD: '12 cm',
        ans: 'C',
        exp: '48 cm. The largest possible square tile side is HCF(96, 144). Since 96 = 2⁵ × 3 and 144 = 2⁴ × 3², HCF = 2⁴ × 3 = 48 cm.'
      },
      {
        id: 'q-rn-m3-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Which statement is always true?',
        optA: 'Irrational + irrational is irrational.',
        optB: 'Rational + irrational is irrational.',
        optC: 'Irrational × irrational is irrational.',
        optD: 'Every square root is irrational.',
        ans: 'B',
        exp: 'If a rational number r plus an irrational number x were rational, then subtracting r would make x rational, a contradiction. The other statements have counterexamples.'
      },
      {
        id: 'q-rn-m3-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the HCF of 2³ × 3² × 7 and 2² × 3³ × 5.',
        optA: '18',
        optB: '36',
        optC: '72',
        optD: '108',
        ans: 'B',
        exp: 'Take the smallest exponents of common prime factors. The common primes are 2 and 3. HCF = 2² × 3² = 4 × 9 = 36.'
      },
      {
        id: 'q-rn-m3-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Show that 7 × 11 × 13 + 13 is a composite number because:',
        optA: 'It can be factorised as 13 × (7 × 11 + 1) = 13 × 78, having factors other than 1 and itself',
        optB: '13 is a prime number',
        optC: 'The expression equals a negative number',
        optD: 'It is an odd number',
        ans: 'A',
        exp: 'Take 13 common: 7 × 11 × 13 + 13 = 13(7 × 11 + 1) = 13(77 + 1) = 13 × 78. Since it is a product of two integers greater than 1, it is composite.'
      }
    ]
  },
  {
    testId: 'test-math-ch1-slot-4',
    testNumber: 4,
    title: 'Real Numbers – Mock Test 4',
    description: 'Irrational numbers, coprime HCF, cube multipliers, florist bouquet problem & √5 proof.',
    questions: [
      {
        id: 'q-rn-m4-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Which number is irrational?',
        optA: '√64',
        optB: '√81',
        optC: '√10',
        optD: '0.6',
        ans: 'C',
        exp: '√64 = 8 and √81 = 9, while 0.6 = 3/5. These are rational. Since 10 is not a perfect square, √10 is irrational.'
      },
      {
        id: 'q-rn-m4-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If two positive integers are coprime, their HCF is:',
        optA: '0',
        optB: '1',
        optC: 'their sum',
        optD: 'their product',
        ans: 'B',
        exp: 'Coprime integers have no common positive factor other than 1.'
      },
      {
        id: 'q-rn-m4-3',
        difficulty: 'easy',
        type: 'true_false',
        text: '√49 is irrational.',
        optA: 'True',
        optB: 'False',
        optC: 'Cannot be determined',
        optD: 'True only for negative numbers',
        ans: 'B',
        exp: 'False. √49 = 7, which is an integer and therefore rational.'
      },
      {
        id: 'q-rn-m4-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The least multiplier to make 72 a perfect cube is:',
        optA: '2',
        optB: '3',
        optC: '6',
        optD: '12',
        ans: 'B',
        exp: '72 = 2³ × 3². To make each exponent a multiple of 3, multiply by 3. Then 72 × 3 = 2³ × 3³ = 216 = 6³.'
      },
      {
        id: 'q-rn-m4-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For any two positive integers a and b, HCF(a, b) × LCM(a, b) = ______.',
        optA: 'a + b',
        optB: 'a - b',
        optC: 'a × b',
        optD: 'a / b',
        ans: 'C',
        exp: 'a × b. The product of the HCF and LCM of two positive integers equals the product of the two integers.'
      },
      {
        id: 'q-rn-m4-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The least positive integer that must multiply 500 to make a perfect cube is:',
        optA: '2',
        optB: '5',
        optC: '20',
        optD: '25',
        ans: 'A',
        exp: '500 = 2² × 5³. Multiply by 2 to obtain 2³ × 5³ = 1000 = 10³.'
      },
      {
        id: 'q-rn-m4-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A florist has 96 roses and 120 lilies. She makes the greatest possible number of identical bouquets without leftovers. How many bouquets can she make, and what will each contain?',
        optA: '24 bouquets; 4 roses and 5 lilies each',
        optB: '12 bouquets; 8 roses and 10 lilies each',
        optC: '16 bouquets; 6 roses and 7 lilies each',
        optD: '8 bouquets; 12 roses and 15 lilies each',
        ans: 'A',
        exp: '24 bouquets. HCF(96, 120) = 24. Each bouquet contains 96/24 = 4 roses and 120/24 = 5 lilies.'
      },
      {
        id: 'q-rn-m4-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If √5 is irrational, then 1/√5 is:',
        optA: 'an integer',
        optB: 'rational',
        optC: 'irrational',
        optD: 'natural',
        ans: 'C',
        exp: 'If 1/√5 were rational and non-zero, its reciprocal √5 would also be rational. This contradicts the given fact.'
      },
      {
        id: 'q-rn-m4-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the least positive number divisible by 18, 24 and 30.',
        optA: '180',
        optB: '240',
        optC: '360',
        optD: '720',
        ans: 'C',
        exp: '18 = 2 × 3², 24 = 2³ × 3 and 30 = 2 × 3 × 5. LCM = 2³ × 3² × 5 = 360. Hence the least number is 360.'
      },
      {
        id: 'q-rn-m4-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'In the proof that √5 is irrational using prime factorisation, if a² = 5b² (where a and b are integers in lowest terms), what contradiction arises?',
        optA: 'The exponent of 5 is even in a² but odd in 5b², contradicting the Fundamental Theorem of Arithmetic',
        optB: '5 is an even number',
        optC: 'a and b cannot be multiplied',
        optD: 'b² cannot divide a²',
        ans: 'A',
        exp: 'Assume √5 = a/b in lowest terms, where a and b are integers and b ≠ 0. Then a² = 5b². In the prime factorisation of a², the exponent of 5 must be even. In 5b², it is odd. This contradicts the uniqueness of prime factorisation. Hence √5 is irrational.'
      }
    ]
  },
  {
    testId: 'test-math-ch1-slot-5',
    testNumber: 5,
    title: 'Real Numbers – Mock Test 5',
    description: 'Prime and composite numbers, flashing lights interval problem, notebook bundles & 3+2√5 proof.',
    questions: [
      {
        id: 'q-rn-m5-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The number 1 is:',
        optA: 'prime',
        optB: 'composite',
        optC: 'neither prime nor composite',
        optD: 'even prime',
        ans: 'C',
        exp: 'A prime number has exactly two distinct positive factors, while a composite number has more than two. The number 1 has only one positive factor.'
      },
      {
        id: 'q-rn-m5-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The LCM of 9 and 15 is:',
        optA: '15',
        optB: '30',
        optC: '45',
        optD: '135',
        ans: 'C',
        exp: '9 = 3² and 15 = 3 × 5. LCM = 3² × 5 = 45.'
      },
      {
        id: 'q-rn-m5-3',
        difficulty: 'easy',
        type: 'true_false',
        text: 'The sum of two irrational numbers is always irrational.',
        optA: 'True',
        optB: 'False',
        optC: 'True only for square roots',
        optD: 'Cannot be determined',
        ans: 'B',
        exp: 'False. For example, √2 + (-√2) = 0, which is rational.'
      },
      {
        id: 'q-rn-m5-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If HCF = 12, LCM = 420 and one number is 60, the other number is:',
        optA: '72',
        optB: '84',
        optC: '96',
        optD: '120',
        ans: 'B',
        exp: 'Product of the numbers = 12 × 420 = 5040. The other number = 5040 / 60 = 84.'
      },
      {
        id: 'q-rn-m5-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The prime factorisation of 540 is ______.',
        optA: '2² × 3³ × 5',
        optB: '2³ × 3² × 5',
        optC: '2² × 3² × 5²',
        optD: '2 × 3³ × 5²',
        ans: 'A',
        exp: '540 = 54 × 10 = (2 × 3³) × (2 × 5) = 2² × 3³ × 5.'
      },
      {
        id: 'q-rn-m5-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Which of the following is coprime to 35?',
        optA: '14',
        optB: '21',
        optC: '24',
        optD: '15',
        ans: 'C',
        exp: '35 = 5 × 7. The number 24 = 2³ × 3 has no common prime factor with 35, so their HCF is 1.'
      },
      {
        id: 'q-rn-m5-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Three lights flash every 20, 30 and 45 seconds. If they flash together now, after how many seconds will they next flash together?',
        optA: '90 seconds',
        optB: '120 seconds',
        optC: '180 seconds',
        optD: '360 seconds',
        ans: 'C',
        exp: '180 seconds. 20 = 2² × 5, 30 = 2 × 3 × 5 and 45 = 3² × 5. LCM = 2² × 3² × 5 = 180 seconds.'
      },
      {
        id: 'q-rn-m5-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If p and q are distinct prime numbers, HCF(p, q) is:',
        optA: 'pq',
        optB: 'p + q',
        optC: '1',
        optD: '0',
        ans: 'C',
        exp: 'Distinct prime numbers have no common positive factor other than 1.'
      },
      {
        id: 'q-rn-m5-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A school has 72 notebooks and 96 geometry boxes. It wants the greatest number of identical bundles with no items left over. Find the number of bundles and the contents of each.',
        optA: '24 bundles (3 notebooks, 4 geometry boxes)',
        optB: '12 bundles (6 notebooks, 8 geometry boxes)',
        optC: '16 bundles (4 notebooks, 6 geometry boxes)',
        optD: '8 bundles (9 notebooks, 12 geometry boxes)',
        ans: 'A',
        exp: 'HCF(72, 96) = 24, so 24 bundles can be made. Each bundle contains 72/24 = 3 notebooks and 96/24 = 4 geometry boxes.'
      },
      {
        id: 'q-rn-m5-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Prove that 3 + 2√5 is irrational by noting that if 3 + 2√5 = r (rational), then:',
        optA: '√5 = (r - 3)/2, which is rational, contradicting the irrationality of √5',
        optB: 'r must equal 0',
        optC: '3 and 2 are prime numbers',
        optD: '√5 is a terminating decimal',
        ans: 'A',
        exp: 'Suppose 3 + 2√5 = r, where r is rational. Then √5 = (r - 3)/2. The right-hand side is rational, which contradicts the irrationality of √5. Therefore 3 + 2√5 is irrational.'
      }
    ]
  },
  {
    testId: 'test-math-ch1-slot-6',
    testNumber: 6,
    title: 'Real Numbers – Mock Test 6',
    description: 'Composite numbers, square room tiling problem, √2+√3 proof & circular track meeting time.',
    questions: [
      {
        id: 'q-rn-m6-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Which of the following is a composite number?',
        optA: '2',
        optB: '3',
        optC: '11',
        optD: '15',
        ans: 'D',
        exp: '15 has factors 1, 3, 5 and 15, so it has more than two positive factors and is composite.'
      },
      {
        id: 'q-rn-m6-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The HCF of 26 and 39 is:',
        optA: '13',
        optB: '26',
        optC: '39',
        optD: '1',
        ans: 'A',
        exp: '26 = 2 × 13 and 39 = 3 × 13. Their greatest common factor is 13.'
      },
      {
        id: 'q-rn-m6-3',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A number that has exactly two distinct positive factors is called a ______ number.',
        optA: 'Composite',
        optB: 'Prime',
        optC: 'Odd',
        optD: 'Rational',
        ans: 'B',
        exp: 'Prime number. Its only positive factors are 1 and the number itself.'
      },
      {
        id: 'q-rn-m6-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The least number that must be added to 70 to make it divisible by 8 is:',
        optA: '1',
        optB: '2',
        optC: '6',
        optD: '8',
        ans: 'B',
        exp: '70 leaves remainder 6 when divided by 8. We need 2 more to reach 72, which is divisible by 8.'
      },
      {
        id: 'q-rn-m6-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find the HCF and LCM of 26 and 91 by prime factorisation.',
        optA: 'HCF = 13, LCM = 182',
        optB: 'HCF = 7, LCM = 182',
        optC: 'HCF = 13, LCM = 2366',
        optD: 'HCF = 26, LCM = 91',
        ans: 'A',
        exp: '26 = 2 × 13 and 91 = 7 × 13. HCF = 13. LCM = 2 × 7 × 13 = 182.'
      },
      {
        id: 'q-rn-m6-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Can two numbers have 15 as their HCF and 175 as their LCM? Explain.',
        optA: 'Yes, because 175 > 15',
        optB: 'No, because HCF must divide the LCM for positive integers, and 175 ÷ 15 is not an integer',
        optC: 'Yes, because both numbers end in 5',
        optD: 'Cannot be determined without the numbers',
        ans: 'B',
        exp: 'No. The HCF must divide the LCM for positive integers. But 175 ÷ 15 is not an integer. Therefore, such two positive integers cannot exist.'
      },
      {
        id: 'q-rn-m6-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A room is 8.4 m long and 6 m wide. It is to be covered with the largest possible identical square tiles. Find the side of each tile and the number of tiles required. (Use centimetres.)',
        optA: 'Side = 120 cm, Number of tiles = 35',
        optB: 'Side = 60 cm, Number of tiles = 70',
        optC: 'Side = 140 cm, Number of tiles = 30',
        optD: 'Side = 80 cm, Number of tiles = 45',
        ans: 'A',
        exp: 'Convert dimensions: 8.4 m = 840 cm and 6 m = 600 cm. Largest tile side = HCF(840, 600) = 120 cm. Number of tiles = (840/120) × (600/120) = 7 × 5 = 35 tiles.'
      },
      {
        id: 'q-rn-m6-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Prove that √2 + √3 is irrational by assuming √2 + √3 = r (rational). Then squaring gives:',
        optA: '5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational, contradicting that √6 is irrational',
        optB: '√2 and √3 cancel each other out',
        optC: 'r must equal 0',
        optD: 'Sum of roots is always rational',
        ans: 'A',
        exp: 'Assume √2 + √3 = r, where r is rational. Squaring gives 5 + 2√6 = r², so √6 = (r² - 5)/2 would be rational. But 6 is not a perfect square, so √6 is irrational. This contradiction proves √2 + √3 is irrational.'
      },
      {
        id: 'q-rn-m6-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the least positive integer by which 540 must be divided to obtain a perfect square.',
        optA: '5',
        optB: '6',
        optC: '15',
        optD: '30',
        ans: 'C',
        exp: '540 = 2² × 3³ × 5. To make all exponents even after division, divide by 3 × 5 = 15. Then 540/15 = 36 = 6². The least required divisor is 15.'
      },
      {
        id: 'q-rn-m6-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Three runners take 48 seconds, 60 seconds and 72 seconds to complete one lap of a circular track. If they start together from the starting point, after how many seconds will they all meet at the starting point again?',
        optA: '360 seconds',
        optB: '720 seconds',
        optC: '480 seconds',
        optD: '1440 seconds',
        ans: 'B',
        exp: 'They meet at the starting point after the LCM of 48, 60 and 72 seconds. 48 = 2⁴ × 3, 60 = 2² × 3 × 5, 72 = 2³ × 3². LCM = 2⁴ × 3² × 5 = 720 seconds.'
      }
    ]
  }
];

// Execute database insertions inside a transaction
const insertTx = db.transaction(() => {
  const insertQuestionStmt = db.prepare(`
    INSERT OR REPLACE INTO questions (
      id, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMockTestStmt = db.prepare(`
    INSERT OR REPLACE INTO mock_tests (
      id, title, subject_id, chapter_id, test_number, description,
      total_questions, duration_minutes, max_marks, passing_marks, access_type, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteExistingMappingStmt = db.prepare(`
    DELETE FROM mock_test_questions WHERE mock_test_id = ?
  `);

  const insertMappingStmt = db.prepare(`
    INSERT OR REPLACE INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  for (const test of mockTestsData) {
    // 1. Ensure mock test record is inserted or updated
    insertMockTestStmt.run(
      test.testId,
      test.title,
      'mathematics',
      'math-ch1',
      test.testNumber,
      test.description,
      test.questions.length,
      25,
      test.questions.length * 1.0,
      Math.ceil(test.questions.length * 0.4),
      'premium',
      'published'
    );

    // 2. Remove old mappings if any
    deleteExistingMappingStmt.run(test.testId);

    // 3. Insert questions and mappings
    test.questions.forEach((q, index) => {
      insertQuestionStmt.run(
        q.id,
        'mathematics',
        'math-ch1',
        'Real Numbers',
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
        'CBSE Class 10 Real Numbers Solved Mock Tests'
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
console.log('[Done] All Real Numbers Mock Tests successfully updated in database!');
