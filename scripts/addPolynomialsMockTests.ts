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

// Exactly 25 A, 25 B, 25 C, 25 D evenly distributed across all 10 tests
const mockTestsData: MockTestDef[] = [
  // ==========================================
  // MOCK SET 01: Core concepts (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-1',
    testNumber: 1,
    title: 'Polynomials – Mock Test 1',
    description: 'Core concepts: Zeroes, degrees, factorisation, sum & product relations, and coefficient verification.',
    accessType: 'free',
    questions: [
      {
        id: 'q-poly-m1-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If 2 is a zero of p(x) = x² − 5x + k, find k.',
        optA: '2',
        optB: '4',
        optC: '6',
        optD: '10',
        ans: 'C',
        exp: 'Since 2 is a zero, p(2) = 0. Thus 2² − 5(2) + k = 0, so 4 − 10 + k = 0. Therefore k = 6.'
      },
      {
        id: 'q-poly-m1-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A student says the degree of 5x² + 3x⁷ − 7 is 2 because 5x² is written first. Is the student correct?',
        optA: 'Yes, because the leading term is 5x²',
        optB: 'No, the degree is 7 because it is the greatest exponent',
        optC: 'Yes, because 2 is the smallest exponent',
        optD: 'No, the degree is 9 because exponents add up',
        ans: 'B',
        exp: 'The degree is the greatest exponent of x with a non-zero coefficient. Here the greatest exponent is 7, so the degree is 7.'
      },
      {
        id: 'q-poly-m1-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find the zeros of x² − 9x + 20.',
        optA: '−4 and −5',
        optB: '2 and 10',
        optC: '−4 and 5',
        optD: '4 and 5',
        ans: 'D',
        exp: 'Factorise: x² − 9x + 20 = (x−4)(x−5). Setting each factor equal to zero gives x = 4 or x = 5.'
      },
      {
        id: 'q-poly-m1-4',
        difficulty: 'easy',
        type: 'mcq',
        text: 'How many real zeros can a quadratic polynomial have at most?',
        optA: '2 real zeros',
        optB: '1 real zero',
        optC: '3 real zeros',
        optD: 'Infinitely many',
        ans: 'A',
        exp: 'A non-zero polynomial of degree 2 can have at most 2 real zeros.'
      },
      {
        id: 'q-poly-m1-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A quadratic has zeros −2 and 7. Find its monic polynomial.',
        optA: 'x² + 5x − 14',
        optB: 'x² − 5x + 14',
        optC: 'x² − 5x − 14',
        optD: 'x² + 9x − 14',
        ans: 'C',
        exp: 'Sum of zeros = −2 + 7 = 5 and product = (−2)(7) = −14. The monic quadratic is x² − (sum)x + (product) = x² − 5x − 14.'
      },
      {
        id: 'q-poly-m1-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A rectangular display has area x² + 7x + 12. Its side expressions are x+3 and x+4. What are the zeros of its area polynomial?',
        optA: '3 and 4',
        optB: '−3 and −4',
        optC: '−3 and 4',
        optD: '3 and −4',
        ans: 'B',
        exp: 'x² + 7x + 12 = (x+3)(x+4). Setting each factor to zero gives x = −3 and x = −4.'
      },
      {
        id: 'q-poly-m1-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For p(x) = 3x² − 8x + 4, find the sum and product of its zeros.',
        optA: 'Sum = −8/3; product = 4/3',
        optB: 'Sum = 8/3; product = −4/3',
        optC: 'Sum = 4/3; product = 8/3',
        optD: 'Sum = 8/3; product = 4/3',
        ans: 'D',
        exp: 'For ax² + bx + c, sum of zeros = −b/a and product = c/a. Here a = 3, b = −8, c = 4. Hence sum = 8/3 and product = 4/3.'
      },
      {
        id: 'q-poly-m1-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α and β are zeros of 2x² − 7x + 3, find α² + β² without solving for α and β.',
        optA: '25/4',
        optB: '37/4',
        optC: '49/4',
        optD: '31/4',
        ans: 'B',
        exp: 'Sum α+β = 7/2 and product αβ = 3/2. Use α² + β² = (α+β)² − 2αβ. Therefore α² + β² = (7/2)² − 2(3/2) = 49/4 − 12/4 = 37/4.'
      },
      {
        id: 'q-poly-m1-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 2x² − x − 6 and verify the relationships between zeros and coefficients.',
        optA: '2 and −3/2',
        optB: '−2 and 3/2',
        optC: '3 and −2',
        optD: '1/2 and −6',
        ans: 'A',
        exp: 'Factorise: 2x² − x − 6 = (2x+3)(x−2). Thus the zeros are 2 and −3/2. Their sum is 2 − 3/2 = 1/2 = −b/a = −(−1)/2. Their product is 2(−3/2) = −3 = c/a = −6/2. Both relationships are verified.'
      },
      {
        id: 'q-poly-m1-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If one zero of x² + (k−3)x − 10 is 2, find k and the other zero.',
        optA: 'k = 4; other zero is −5',
        optB: 'k = 6; other zero is 5',
        optC: 'k = 2; other zero is −10',
        optD: 'k = 6; other zero is −5',
        ans: 'D',
        exp: 'Substitute x = 2: 2² + (k−3)(2) − 10 = 0. So 4 + 2k − 6 − 10 = 0, giving 2k − 12 = 0 and k = 6. The product of the zeros is −10. If one zero is 2, the other is −10/2 = −5.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 02: Graphs & translation (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-2',
    testNumber: 2,
    title: 'Polynomials – Mock Test 2',
    description: 'Graphs & translation: x-intercepts, symmetric roots, geometric interpretations, and algebraic constraints.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m2-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A polynomial graph crosses the x-axis at x = −1 and x = 4. State its zeros.',
        optA: '−1 and 4',
        optB: '1 and −4',
        optC: '0 and 3',
        optD: '−1 and 0',
        ans: 'A',
        exp: 'The zeros are the x-coordinates where the graph meets or crosses the x-axis. Hence the zeros are −1 and 4.'
      },
      {
        id: 'q-poly-m2-2',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Which quadratic polynomial has zeros 3 and −2?',
        optA: 'x² + x − 6',
        optB: 'x² − 5x + 6',
        optC: 'x² − x − 6',
        optD: 'x² + 5x + 6',
        ans: 'C',
        exp: 'A monic quadratic with zeros 3 and −2 is (x−3)(x+2) = x² − x − 6.'
      },
      {
        id: 'q-poly-m2-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If the zeros of x² − (m+1)x + 12 are 3 and 4, find m.',
        optA: '5',
        optB: '6',
        optC: '7',
        optD: '8',
        ans: 'B',
        exp: 'The sum of the zeros is 3 + 4 = 7. For x² − (m+1)x + 12, the sum is m+1. Thus m+1 = 7, so m = 6.'
      },
      {
        id: 'q-poly-m2-4',
        difficulty: 'medium',
        type: 'true_false',
        text: 'If the sum and product of zeros of a monic quadratic are 0 and −9, its polynomial is x² − 9.',
        optA: 'True',
        optB: 'False',
        optC: 'Only when x > 0',
        optD: 'Cannot be determined',
        ans: 'A',
        exp: 'True. For a monic quadratic, p(x) = x² − (sum)x + (product). Substituting sum = 0 and product = −9 gives x² − 9.'
      },
      {
        id: 'q-poly-m2-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Two consecutive positive integers have product 72. Form a quadratic equation and find the integers.',
        optA: '7 and 8',
        optB: '6 and 12',
        optC: '9 and 10',
        optD: '8 and 9',
        ans: 'D',
        exp: 'Let the smaller integer be x. Then x(x+1) = 72, so x² + x − 72 = 0. Factorising gives (x−8)(x+9) = 0. Since the integers are positive, x = 8. The integers are 8 and 9.'
      },
      {
        id: 'q-poly-m2-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 6x + 4, find 1/α + 1/β.',
        optA: '2/3',
        optB: '3/2',
        optC: '3/4',
        optD: '4/3',
        ans: 'B',
        exp: 'Use 1/α + 1/β = (α+β)/(αβ). Here α+β = 6 and αβ = 4. Hence the value is 6/4 = 3/2.'
      },
      {
        id: 'q-poly-m2-7',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For x² − 4x + 4, which statements are true? (A) It has two distinct zeros (B) It has a repeated zero (C) Its zero is 2 (D) Sum of zeros is 4.',
        optA: 'A and C only',
        optB: 'A, B and D only',
        optC: 'B, C and D only',
        optD: 'B only',
        ans: 'C',
        exp: 'x² − 4x + 4 = (x−2)², so the repeated zero is 2. Counting multiplicity, the zeros are 2 and 2, and their sum is 4. Hence B, C and D are true.'
      },
      {
        id: 'q-poly-m2-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of 3x² − 5x − 2, find (α−β)².',
        optA: '25/9',
        optB: '37/9',
        optC: '49/9',
        optD: '53/9',
        ans: 'C',
        exp: 'Here α+β = 5/3 and αβ = −2/3. Use (α−β)² = (α+β)² − 4αβ = (5/3)² − 4(−2/3) = 25/9 + 24/9 = 49/9.'
      },
      {
        id: 'q-poly-m2-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find a quadratic polynomial whose zeros are 2 + √3 and 2 − √3.',
        optA: 'x² − 4x + 1',
        optB: 'x² + 4x + 1',
        optC: 'x² − 4x − 1',
        optD: 'x² − 2x + 1',
        ans: 'A',
        exp: 'Sum of zeros = (2+√3) + (2−√3) = 4. Product = (2+√3)(2−√3) = 4 − 3 = 1. Hence the monic polynomial is x² − 4x + 1.'
      },
      {
        id: 'q-poly-m2-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A rectangle has area x² − 2x − 15. Factorise the polynomial and identify its zeros. Explain why the negative zero is not a possible side length.',
        optA: 'Factorisation = (x+5)(x−3); zeros are −5 and 3',
        optB: 'Factorisation = (x−15)(x+1); zeros are 15 and −1',
        optC: 'Factorisation = (x−5)(x−3); zeros are 5 and 3',
        optD: 'Factorisation = (x−5)(x+3); zeros are 5 and −3; a physical length must be positive',
        ans: 'D',
        exp: 'Since x² − 2x − 15 = (x−5)(x+3), setting each factor to zero gives x = 5 and x = −3. If x represents a physical length, it must be positive. Therefore −3 is not a feasible length, even though it is an algebraic zero.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 03: Parameter practice (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-3',
    testNumber: 3,
    title: 'Polynomials – Mock Test 3',
    description: 'Parameter practice: Solving for unknown constants (k, p, m), repeated roots, and Assertion-Reasoning.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m3-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'State the degree of 4x⁷ − 2x² + x.',
        optA: '1',
        optB: '2',
        optC: '7',
        optD: '9',
        ans: 'C',
        exp: 'The highest exponent with a non-zero coefficient is 7. Hence the degree is 7.'
      },
      {
        id: 'q-poly-m3-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A zero of 7x + 21 is:',
        optA: '3',
        optB: '−3',
        optC: '7',
        optD: '−7',
        ans: 'B',
        exp: 'Set 7x + 21 = 0. Then 7x = −21, so x = −3.'
      },
      {
        id: 'q-poly-m3-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 5x² + px + 10, the product of zeros is 2. What is p?',
        optA: '2',
        optB: '5',
        optC: '10',
        optD: 'p cannot be determined from the given information',
        ans: 'D',
        exp: 'For ax² + bx + c, product of zeros = c/a. Here it is 10/5 = 2 for every value of p. So the condition gives no information about p.'
      },
      {
        id: 'q-poly-m3-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A student writes: for ax² + bx + c, sum of zeros is b/a. What is the correct formula?',
        optA: 'Sum of zeros is −b/a',
        optB: 'Sum of zeros is c/a',
        optC: 'Sum of zeros is −c/a',
        optD: 'Sum of zeros is b/(2a)',
        ans: 'A',
        exp: 'For a quadratic ax² + bx + c, the relationship between the zeros α and β is α+β = −b/a. The negative sign is essential.'
      },
      {
        id: 'q-poly-m3-5',
        difficulty: 'medium',
        type: 'mcq',
        text: "A square courtyard's area expression is x² − 12x + 36. Find the zero and explain its multiplicity.",
        optA: '6, a repeated zero (multiplicity 2)',
        optB: '−6, a repeated zero',
        optC: '6 and −6, two distinct zeros',
        optD: '12, a single zero',
        ans: 'A',
        exp: 'x² − 12x + 36 = (x−6)². Thus x = 6 is the only distinct zero and it occurs twice, so it is a repeated zero.'
      },
      {
        id: 'q-poly-m3-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If one zero of 2x² − 5x + k is 2, find k and the other zero.',
        optA: 'k = −2; other zero is 1/2',
        optB: 'k = 2; other zero is −1/2',
        optC: 'k = 4; other zero is 1',
        optD: 'k = 2; other zero is 1/2',
        ans: 'D',
        exp: 'Substitute x = 2: 2(2²) − 5(2) + k = 0 => 8 − 10 + k = 0 => k = 2. The product of zeros is k/2 = 2/2 = 1. Since one zero is 2, the other is 1/2.'
      },
      {
        id: 'q-poly-m3-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Assertion: A quadratic polynomial can have at most two real zeros. Reason: A non-zero polynomial of degree n has at most n zeros.',
        optA: 'Both are true, but the reason does not explain the assertion',
        optB: 'Both are true, and the reason explains the assertion',
        optC: 'Assertion is true, Reason is false',
        optD: 'Assertion is false, Reason is true',
        ans: 'B',
        exp: 'A quadratic has degree 2. The general fundamental theorem says a non-zero polynomial of degree n has at most n zeros. Taking n = 2 proves that a quadratic has at most two real zeros.'
      },
      {
        id: 'q-poly-m3-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² + 3x − 7, evaluate α² + β² + αβ.',
        optA: '14',
        optB: '16',
        optC: '23',
        optD: '30',
        ans: 'B',
        exp: 'Here α+β = −3 and αβ = −7. First, α² + β² = (α+β)² − 2αβ = 9 + 14 = 23. Therefore α² + β² + αβ = 23 − 7 = 16.'
      },
      {
        id: 'q-poly-m3-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 6x² + x − 2 and verify their product.',
        optA: '−1/2 and 2/3',
        optB: '2 and −1/3',
        optC: '1/2 and −2/3',
        optD: '3 and −1/2',
        ans: 'C',
        exp: 'Factorise: 6x² + x − 2 = (3x+2)(2x−1). Thus the zeros are −2/3 and 1/2. Their product is (−2/3)(1/2) = −1/3, which equals c/a = −2/6 = −1/3.'
      },
      {
        id: 'q-poly-m3-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A quadratic polynomial has zeros α, β with α+β = −4 and αβ = −5. Form the polynomial, then find its zeros.',
        optA: 'x² − 4x − 5; zeros are 5 and −1',
        optB: 'x² + 4x + 5; no real zeros',
        optC: 'x² − 5x + 4; zeros are 1 and 4',
        optD: 'x² + 4x − 5; zeros are 1 and −5',
        ans: 'D',
        exp: 'The monic polynomial is x² − (α+β)x + αβ = x² − (−4)x − 5 = x² + 4x − 5. Factorising gives (x+5)(x−1) = 0, so the zeros are −5 and 1.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 04: Reasoning clinic (A:3, B:2, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-4',
    testNumber: 4,
    title: 'Polynomials – Mock Test 4',
    description: 'Reasoning clinic: Error analysis, discriminant conditions, consecutive integer problems, and rational roots.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m4-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'A parabola meets the x-axis at x = −3 and x = 1. What are its zeros?',
        optA: '−3 and 1',
        optB: '3 and −1',
        optC: '0 and −2',
        optD: '−3 and −1',
        ans: 'A',
        exp: 'The x-intercepts of the graph give the zeros of the polynomial. Thus the zeros are −3 and 1.'
      },
      {
        id: 'q-poly-m4-2',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For x² + px + 16 with equal zeros, p can be:',
        optA: '8 only',
        optB: '−8 only',
        optC: '±8',
        optD: '±16',
        ans: 'C',
        exp: 'Equal zeros require the discriminant to be zero: p² − 4(1)(16) = 0 => p² = 64 => p = ±8.'
      },
      {
        id: 'q-poly-m4-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Write a quadratic polynomial with zeros 0 and −6.',
        optA: 'x² − 6x',
        optB: 'x² + 6',
        optC: 'x² − 36',
        optD: 'x² + 6x',
        ans: 'D',
        exp: 'Sum = 0 + (−6) = −6 and product = 0. The monic polynomial is x² − (−6)x + 0 = x² + 6x.'
      },
      {
        id: 'q-poly-m4-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Can a quadratic polynomial have exactly one distinct real zero? Give an example.',
        optA: 'Yes; example: x² − 6x + 9 = (x−3)²',
        optB: 'No; every quadratic must have two distinct real zeros',
        optC: 'No; quadratics only have either 0 or 2 zeros',
        optD: 'Yes; but only x² = 0',
        ans: 'A',
        exp: 'Yes. Example: x² − 6x + 9 = (x−3)². It has one distinct real zero, 3, repeated twice.'
      },
      {
        id: 'q-poly-m4-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'The product of two consecutive integers is 156. Find the integers by forming a polynomial.',
        optA: '11 and 12',
        optB: '12 and 13 (or −13 and −12)',
        optC: '13 and 14',
        optD: '10 and 15',
        ans: 'B',
        exp: 'Let the smaller integer be x. Then x(x+1) = 156 => x² + x − 156 = 0 => (x−12)(x+13) = 0. Thus x = 12 or x = −13. The pairs are (12, 13) and (−13, −12).'
      },
      {
        id: 'q-poly-m4-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of 2x² − 3x − 5, evaluate α²β + αβ².',
        optA: '15/4',
        optB: '−5/2',
        optC: '−15/4',
        optD: '9/4',
        ans: 'C',
        exp: 'Factorise or use relations: α+β = 3/2 and αβ = −5/2. Then α²β + αβ² = αβ(α+β) = (−5/2)(3/2) = −15/4.'
      },
      {
        id: 'q-poly-m4-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A learner claims zeros 2 and 5 give x² + 7x + 10. Identify the mistake and write the correct polynomial.',
        optA: 'The correct polynomial is x² + 7x − 10',
        optB: 'The correct polynomial is x² − 3x + 10',
        optC: 'The learner is completely correct',
        optD: 'The correct polynomial is x² − 7x + 10 (learner used wrong sign for middle term)',
        ans: 'D',
        exp: 'The sum of the zeros is 2 + 5 = 7 and the product is 10. The monic polynomial is x² − (sum)x + (product) = x² − 7x + 10. The learner used +7x instead of −7x.'
      },
      {
        id: 'q-poly-m4-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of 4x² − 4x − 3, find α/β + β/α.',
        optA: '−10/3',
        optB: '10/3',
        optC: '−5/2',
        optD: '5/4',
        ans: 'A',
        exp: 'Here α+β = 1 and αβ = −3/4. Use α/β + β/α = (α² + β²)/(αβ). Also α² + β² = (α+β)² − 2αβ = 1 − 2(−3/4) = 5/2. Hence (5/2)/(−3/4) = −10/3.'
      },
      {
        id: 'q-poly-m4-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of x² − 2√2x + 2 and state their nature.',
        optA: '√2 and −√2',
        optB: '√2, repeated (multiplicity 2)',
        optC: '2 and 1',
        optD: 'No real zeros',
        ans: 'B',
        exp: 'x² − 2√2x + 2 = (x − √2)². Hence the polynomial has one distinct real zero √2 with multiplicity 2.'
      },
      {
        id: 'q-poly-m4-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A quadratic polynomial has one zero 4 and the sum of its zeros is −1. Find its other zero and a monic polynomial.',
        optA: 'Other zero = 5; polynomial = x² − x − 20',
        optB: 'Other zero = −3; polynomial = x² − x − 12',
        optC: 'Other zero = 3; polynomial = x² + x − 12',
        optD: 'Other zero = −5; polynomial = x² + x − 20',
        ans: 'D',
        exp: 'Let the other zero be β. Then 4 + β = −1, so β = −5. The product is 4(−5) = −20. The monic polynomial is x² − (−1)x − 20 = x² + x − 20.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 05: Relations toolbox (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-5',
    testNumber: 5,
    title: 'Polynomials – Mock Test 5',
    description: 'Relations toolbox: Quadratic identification, evaluate p(x), symmetric expressions (α−1)(β−1), and reciprocal zeros.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m5-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Which is a quadratic polynomial?',
        optA: 'x³ + 1',
        optB: '5x² − 2x + 1',
        optC: '4x + 3',
        optD: '7',
        ans: 'B',
        exp: 'A quadratic polynomial has degree 2. Option B (5x² − 2x + 1) has highest exponent 2.'
      },
      {
        id: 'q-poly-m5-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'For p(x) = x² − 1, calculate p(−1). Is −1 a zero?',
        optA: 'p(−1) = 0; Yes, −1 is a zero',
        optB: 'p(−1) = −2; No, −1 is not a zero',
        optC: 'p(−1) = 2; No, −1 is not a zero',
        optD: 'p(−1) = 1; No, −1 is not a zero',
        ans: 'A',
        exp: 'Substitute x = −1: p(−1) = (−1)² − 1 = 1 − 1 = 0. A value is a zero when it makes the polynomial equal to zero.'
      },
      {
        id: 'q-poly-m5-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 2x² + 9x + 4, find sum and product of zeros.',
        optA: 'Sum = 9/2; product = 2',
        optB: 'Sum = −9/2; product = 4',
        optC: 'Sum = −9/2; product = 2',
        optD: 'Sum = −4; product = 9/2',
        ans: 'C',
        exp: 'Here a = 2, b = 9 and c = 4. Sum = −b/a = −9/2; product = c/a = 4/2 = 2.'
      },
      {
        id: 'q-poly-m5-4',
        difficulty: 'medium',
        type: 'true_false',
        text: 'If α+β = 5 and αβ = 6, then x² − 5x + 6 has zeros α and β.',
        optA: 'True',
        optB: 'False',
        optC: 'Only if α, β are integers',
        optD: 'Cannot be determined',
        ans: 'A',
        exp: 'True. The monic polynomial formed from zeros α and β is x² − (α+β)x + αβ. Substituting 5 and 6 gives x² − 5x + 6.'
      },
      {
        id: 'q-poly-m5-5',
        difficulty: 'medium',
        type: 'mcq',
        text: "A rectangular banner's area polynomial is x² − 9x + 20. Its dimensions are x−4 and x−5. Find its zeros and interpret them as boundary values.",
        optA: '−4 and −5; dimensions of banner',
        optB: '2 and 10; side lengths',
        optC: '1 and 20; perimeter values',
        optD: '4 and 5; boundary values where a dimension becomes zero',
        ans: 'D',
        exp: 'x² − 9x + 20 = (x−4)(x−5). Setting each factor to zero gives x = 4 and x = 5. These are boundary values where one dimension expression becomes zero.'
      },
      {
        id: 'q-poly-m5-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 7x + 10, find α² + β².',
        optA: '39',
        optB: '29',
        optC: '49',
        optD: '19',
        ans: 'B',
        exp: 'Sum = 7 and product = 10. Thus α² + β² = (α+β)² − 2αβ = 7² − 2(10) = 49 − 20 = 29.'
      },
      {
        id: 'q-poly-m5-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Assertion: If the product of zeros of ax² + bx + c is zero, at least one zero is zero. Reason: The product of zeros equals c/a.',
        optA: 'Both are true, and the reason explains the assertion',
        optB: 'Both are true, but the reason does not explain the assertion',
        optC: 'Assertion is true, Reason is false',
        optD: 'Assertion is false, Reason is true',
        ans: 'A',
        exp: 'For ax² + bx + c, the product of zeros is c/a. If this product is zero, then αβ = 0, which means at least one of α or β is zero.'
      },
      {
        id: 'q-poly-m5-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 5x + 1, find (α−1)(β−1).',
        optA: '3',
        optB: '−5',
        optC: '−3',
        optD: '7',
        ans: 'C',
        exp: 'Here α+β = 5 and αβ = 1. Expand: (α−1)(β−1) = αβ − (α+β) + 1 = 1 − 5 + 1 = −3.'
      },
      {
        id: 'q-poly-m5-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 3x² − 11x − 4 and verify sum and product.',
        optA: '−4 and 1/3',
        optB: '3 and −4/3',
        optC: '2 and −2/3',
        optD: '4 and −1/3',
        ans: 'D',
        exp: 'Factorise: 3x² − 11x − 4 = (3x+1)(x−4). Thus zeros are −1/3 and 4. Sum = 4 − 1/3 = 11/3 = −b/a. Product = 4(−1/3) = −4/3 = c/a.'
      },
      {
        id: 'q-poly-m5-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find a quadratic polynomial whose zeros are reciprocals of the zeros of 2x² − 5x + 3.',
        optA: '2x² + 5x + 3',
        optB: '3x² + 5x − 2',
        optC: '3x² − 5x + 2',
        optD: '2x² − 3x + 5',
        ans: 'C',
        exp: 'Factorise 2x² − 5x + 3 = (2x−3)(x−1), so its zeros are 3/2 and 1. Their reciprocals are 2/3 and 1. A polynomial with these zeros is (3x−2)(x−1) = 3x² − 5x + 2.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 06: Application & logic (A:3, B:2, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-6',
    testNumber: 6,
    title: 'Polynomials – Mock Test 6',
    description: 'Application & logic: Linear uniqueness, consecutive odd products, α³+β³, and discriminant non-intersection.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m6-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'What is the zero of a polynomial p(x) called?',
        optA: 'A value r for which p(r) = 0',
        optB: 'The coefficient of the highest power of x',
        optC: 'The y-intercept of the polynomial',
        optD: 'Any real number x',
        ans: 'A',
        exp: 'By definition, r is a zero of p(x) if substituting x = r makes p(r) = 0.'
      },
      {
        id: 'q-poly-m6-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The zeros of x² + 2x − 8 are:',
        optA: '−2, 4',
        optB: '1, −8',
        optC: '2, 4',
        optD: '2, −4',
        ans: 'D',
        exp: 'Factorise: x² + 2x − 8 = (x+4)(x−2). Therefore the zeros are −4 and 2.'
      },
      {
        id: 'q-poly-m6-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If 3 is a zero of x² − (k+1)x + 12, find k.',
        optA: '5',
        optB: '4',
        optC: '6',
        optD: '7',
        ans: 'C',
        exp: 'Substitute x = 3: 3² − 3(k+1) + 12 = 0 => 9 − 3k − 3 + 12 = 0 => 18 − 3k = 0 => k = 6.'
      },
      {
        id: 'q-poly-m6-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Explain why a non-zero linear polynomial has exactly one real zero.',
        optA: 'Because its graph is always a parabola',
        optB: 'Solving ax + b = 0 (a ≠ 0) gives x = −b/a, which is a unique real value',
        optC: 'Linear polynomials can have up to two zeros',
        optD: 'Because its degree is 0',
        ans: 'B',
        exp: 'A non-zero linear polynomial ax + b, where a ≠ 0, gives x = −b/a upon setting ax + b = 0. Since a is non-zero, this yields exactly one unique real value.'
      },
      {
        id: 'q-poly-m6-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Two consecutive odd positive integers have product 143. Find them using a quadratic polynomial.',
        optA: '11 and 13',
        optB: '9 and 11',
        optC: '13 and 15',
        optD: '7 and 9',
        ans: 'A',
        exp: 'Let the smaller odd integer be x. Then the next odd integer is x+2. So x(x+2) = 143 => x² + 2x − 143 = 0 => (x−11)(x+13) = 0. Since integers are positive, x = 11. The integers are 11 and 13.'
      },
      {
        id: 'q-poly-m6-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For zeros α, β of 3x² − 2x − 1, evaluate α² + β².',
        optA: '8/9',
        optB: '4/9',
        optC: '2/3',
        optD: '10/9',
        ans: 'D',
        exp: 'Sum = 2/3 and product = −1/3. Therefore α² + β² = (α+β)² − 2αβ = (2/3)² − 2(−1/3) = 4/9 + 2/3 = 4/9 + 6/9 = 10/9.'
      },
      {
        id: 'q-poly-m6-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'For p(x) = x² + 4x + 8, the graph:',
        optA: 'Cuts x-axis twice',
        optB: 'Touches x-axis once',
        optC: 'Has no x-intercept',
        optD: 'Crosses at x = 0',
        ans: 'C',
        exp: 'Complete the square: x² + 4x + 8 = (x+2)² + 4. This is always positive for real x, so the graph never meets or touches the x-axis.'
      },
      {
        id: 'q-poly-m6-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 4x − 1, evaluate α³ + β³.',
        optA: '76',
        optB: '64',
        optC: '52',
        optD: '80',
        ans: 'A',
        exp: 'Here α+β = 4 and αβ = −1. Use α³ + β³ = (α+β)³ − 3αβ(α+β) = 4³ − 3(−1)(4) = 64 + 12 = 76.'
      },
      {
        id: 'q-poly-m6-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 2x² + 5x − 3 and verify the sum relation.',
        optA: '−1/2 and 3',
        optB: '1/2 and −3',
        optC: '2 and −3/2',
        optD: '1 and −3/2',
        ans: 'B',
        exp: 'Factorise: 2x² + 5x − 3 = (2x−1)(x+3). Thus the zeros are 1/2 and −3. Their sum is 1/2 − 3 = −5/2, which equals −b/a = −5/2.'
      },
      {
        id: 'q-poly-m6-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² − px + 12 and α² + β² = 25, find possible p values.',
        optA: 'p = ±5',
        optB: 'p = ±1',
        optC: 'p = ±13',
        optD: 'p = ±7',
        ans: 'D',
        exp: 'Since α+β = p and αβ = 12, α² + β² = (α+β)² − 2αβ = p² − 24. Given p² − 24 = 25, so p² = 49. Therefore p = 7 or p = −7.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 07: Algebraic thinking (A:2, B:3, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-7',
    testNumber: 7,
    title: 'Polynomials – Mock Test 7',
    description: 'Algebraic thinking: No x-intercept polynomials, fast splitting, reciprocal zero sums, and symmetric (α+1)(β+1).',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m7-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The graph of p(x) = x² + 1 has how many x-intercepts?',
        optA: '1',
        optB: '0',
        optC: '2',
        optD: '3',
        ans: 'B',
        exp: 'For every real x, x² ≥ 0, so x² + 1 ≥ 1 > 0. The graph never touches or crosses the x-axis, so it has 0 x-intercepts.'
      },
      {
        id: 'q-poly-m7-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Factorise x² − 13x + 40.',
        optA: '(x+5)(x+8)',
        optB: '(x−5)(x−8)',
        optC: '(x−4)(x−10)',
        optD: '(x−2)(x−20)',
        ans: 'B',
        exp: 'Two numbers with product 40 and sum −13 are −5 and −8. Hence x² − 13x + 40 = (x−5)(x−8).'
      },
      {
        id: 'q-poly-m7-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For 4x² + 4x − 3, calculate sum and product of zeros.',
        optA: 'Sum = 1; product = 3/4',
        optB: 'Sum = −1; product = 3/4',
        optC: 'Sum = −4; product = −3',
        optD: 'Sum = −1; product = −3/4',
        ans: 'D',
        exp: 'Here a = 4, b = 4 and c = −3. Sum = −b/a = −4/4 = −1; product = c/a = −3/4.'
      },
      {
        id: 'q-poly-m7-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A student says x² − 16 has only one zero, 4. Correct the answer.',
        optA: 'The zero is only −4',
        optB: 'The zeros are 16 and −16',
        optC: 'The zeros are 4 and −4',
        optD: 'The zeros are 2 and −2',
        ans: 'C',
        exp: 'x² − 16 = (x−4)(x+4). Setting both factors to zero gives x = 4 and x = −4.'
      },
      {
        id: 'q-poly-m7-5',
        difficulty: 'medium',
        type: 'mcq',
        text: "A square picture's area is modelled by x² − 16. Factorise and state its zeros. Which root may represent a positive side length?",
        optA: 'Factorisation = (x−8)(x+2); zeros = 8 and −2; positive side length = 8',
        optB: 'Factorisation = (x−4)²; zero = 4',
        optC: 'Factorisation = (x−4)(x+4); zeros = 4 and −4; positive side length = 4',
        optD: 'Factorisation = (x+4)²; zero = −4',
        ans: 'C',
        exp: 'Using the difference of two squares, x² − 16 = (x−4)(x+4). The zeros are 4 and −4. A physical side length must be positive, so 4 is the feasible value.'
      },
      {
        id: 'q-poly-m7-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of 5x² − 7x + 2, find 1/α + 1/β.',
        optA: '7/2',
        optB: '2/7',
        optC: '5/2',
        optD: '−7/2',
        ans: 'A',
        exp: 'Sum = 7/5 and product = 2/5. Thus 1/α + 1/β = (α+β)/(αβ) = (7/5)/(2/5) = 7/2.'
      },
      {
        id: 'q-poly-m7-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Assertion: A quadratic can have a repeated zero. Reason: Its graph may touch the x-axis at its vertex.',
        optA: 'Both are true, but the reason does not explain the assertion',
        optB: 'Both are true, and the reason explains the assertion',
        optC: 'Assertion is true, Reason is false',
        optD: 'Assertion is false, Reason is true',
        ans: 'B',
        exp: 'A quadratic can have equal roots when its discriminant is zero. In that case, its parabola touches the x-axis at its vertex rather than crossing it.'
      },
      {
        id: 'q-poly-m7-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of 2x² + x − 4, find (α+1)(β+1).',
        optA: '3/2',
        optB: '−5/2',
        optC: '−3/2',
        optD: '−1/2',
        ans: 'C',
        exp: 'Here α+β = −1/2 and αβ = −2. Expand: (α+1)(β+1) = αβ + (α+β) + 1 = −2 − 1/2 + 1 = −3/2.'
      },
      {
        id: 'q-poly-m7-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 5x² − 13x + 6 and verify the product relation.',
        optA: '2 and 3/5',
        optB: '−2 and −3/5',
        optC: '3 and 2/5',
        optD: '6 and 1/5',
        ans: 'A',
        exp: 'Factorise: 5x² − 13x + 6 = (5x−3)(x−2). Thus the zeros are 3/5 and 2. Their product is (3/5)(2) = 6/5 = c/a = 6/5.'
      },
      {
        id: 'q-poly-m7-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A quadratic polynomial has zeros whose sum is 2 and product is −8. Form the polynomial, solve it, and verify both relations.',
        optA: 'x² + 2x − 8; zeros are −4 and 2',
        optB: 'x² − 2x + 8; no real zeros',
        optC: 'x² + 8x − 2; zeros are 2 and −8',
        optD: 'x² − 2x − 8; zeros are 4 and −2',
        ans: 'D',
        exp: 'The monic polynomial is x² − 2x − 8. Factorise: (x−4)(x+2) = 0, so the zeros are 4 and −2. Their sum is 4 + (−2) = 2 and product is 4(−2) = −8, as required.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 08: Error detection (A:3, B:2, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-8',
    testNumber: 8,
    title: 'Polynomials – Mock Test 8',
    description: 'Error detection: Constant multiples, sign determination from sum/product, α⁴+β⁴, and irrational roots.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m8-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If p(−2) = 0, then −2 is:',
        optA: 'A coefficient',
        optB: 'A zero',
        optC: 'The degree',
        optD: 'The constant term',
        ans: 'B',
        exp: 'A number r is a zero of p(x) when p(r) = 0. Since p(−2) = 0, −2 is a zero.'
      },
      {
        id: 'q-poly-m8-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Find the zeros of x² − 25.',
        optA: '−5 and 5',
        optB: '5 only',
        optC: '25 and −25',
        optD: '0 and 5',
        ans: 'A',
        exp: 'x² − 25 = (x−5)(x+5). Setting each factor to zero gives x = 5 and x = −5.'
      },
      {
        id: 'q-poly-m8-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of 2x² − 3x − 9, find αβ and α+β.',
        optA: 'αβ = 9/2; α+β = −3/2',
        optB: 'αβ = −3/2; α+β = 9/2',
        optC: 'αβ = −9; α+β = 3',
        optD: 'αβ = −9/2; α+β = 3/2',
        ans: 'D',
        exp: 'Here a = 2, b = −3 and c = −9. Product = c/a = −9/2 and sum = −b/a = −(−3)/2 = 3/2.'
      },
      {
        id: 'q-poly-m8-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Can two different quadratic polynomials have the same zeros? Explain briefly.',
        optA: 'No; every quadratic has a unique set of coefficients',
        optB: 'Yes; but only if the degree is different',
        optC: 'Yes; one polynomial can be a non-zero constant multiple of another (e.g. x²−5x+6 and 2x²−10x+12)',
        optD: 'No; only linear polynomials can',
        ans: 'C',
        exp: 'Yes. One polynomial can be a non-zero constant multiple of another. For example, x² − 5x + 6 and 2x² − 10x + 12 have the same zeros, 2 and 3.'
      },
      {
        id: 'q-poly-m8-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A rectangular plot has area x² − x − 12, with side expressions x−4 and x+3. Find its zeros and state the positive boundary root.',
        optA: '−4 and 3; positive boundary root = 3',
        optB: '4 and −3; positive boundary root = 4',
        optC: '6 and −2; positive boundary root = 6',
        optD: '12 and −1; positive boundary root = 12',
        ans: 'B',
        exp: 'x² − x − 12 = (x−4)(x+3). Setting each factor to zero gives x = 4 and x = −3. The positive boundary value is 4.'
      },
      {
        id: 'q-poly-m8-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of x² + 2x − 3, find α²β + αβ².',
        optA: '6',
        optB: '−6',
        optC: '3',
        optD: '−3',
        ans: 'A',
        exp: 'Here α+β = −2 and αβ = −3. Then α²β + αβ² = αβ(α+β) = (−3)(−2) = 6.'
      },
      {
        id: 'q-poly-m8-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A monic quadratic has integer zeros, sum 1 and product −12. Find the zeros and explain how the signs are determined.',
        optA: '−4 and 3; product is positive so roots have same signs',
        optB: '6 and −2',
        optC: '−6 and 2',
        optD: '4 and −3; product is negative so roots have opposite signs',
        ans: 'D',
        exp: 'The product is negative, so the zeros have opposite signs. The integer pair with product −12 and sum 1 is 4 and −3.'
      },
      {
        id: 'q-poly-m8-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 2x − 1, find α⁴ + β⁴.',
        optA: '36',
        optB: '32',
        optC: '34',
        optD: '30',
        ans: 'C',
        exp: 'Here α+β = 2 and αβ = −1. First α² + β² = (α+β)² − 2αβ = 4 + 2 = 6. Then α⁴ + β⁴ = (α² + β²)² − 2(αβ)² = 6² − 2(1) = 36 − 2 = 34.'
      },
      {
        id: 'q-poly-m8-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find zeros of 2x² − 9x + 10 and verify coefficient relations.',
        optA: '2 and 5/2',
        optB: '−2 and −5/2',
        optC: '5 and 1',
        optD: '10 and 1/2',
        ans: 'A',
        exp: 'Factorise: 2x² − 9x + 10 = (2x−5)(x−2). Thus zeros are 5/2 and 2. Sum = 9/2 = −b/a and product = 5 = c/a.'
      },
      {
        id: 'q-poly-m8-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A quadratic polynomial has zeros α, β. If α+β = 3 and α² + β² = 13, form the monic polynomial and find its zeros.',
        optA: 'x² − 3x + 2; zeros are 2 and 1',
        optB: 'x² + 3x − 2; zeros are (−3±√17)/2',
        optC: 'x² − 3x − 2; zeros are (3+√17)/2 and (3−√17)/2',
        optD: 'x² − 3x − 4; zeros are 4 and −1',
        ans: 'C',
        exp: 'Use α² + β² = (α+β)² − 2αβ. Thus 13 = 9 − 2αβ, so αβ = −2. The monic polynomial is x² − 3x − 2. Solving x² − 3x − 2 = 0 using the quadratic formula gives x = (3 ± √17)/2.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 09: Higher-order mix (A:2, B:3, C:3, D:2)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-9',
    testNumber: 9,
    title: 'Polynomials – Mock Test 9',
    description: 'Higher-order mix: Geometric parameters, ratio of roots (one zero twice the other), mural area, and HOTS α³+β³.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m9-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'Which polynomial has a repeated zero?',
        optA: 'x² − 5x + 6',
        optB: 'x² − 10x + 25',
        optC: 'x² − 1',
        optD: 'x² + 3x + 2',
        ans: 'B',
        exp: 'x² − 10x + 25 = (x−5)², so it has the repeated zero 5.'
      },
      {
        id: 'q-poly-m9-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'If a parabola lies completely above the x-axis, what can you say about its real zeros?',
        optA: 'It has no real zeros',
        optB: 'It has 1 real zero',
        optC: 'It has 2 real zeros',
        optD: 'It has infinitely many zeros',
        ans: 'A',
        exp: 'Real zeros are the x-values where the graph intersects the x-axis. A graph completely above the x-axis never intersects it, so it has no real zeros.'
      },
      {
        id: 'q-poly-m9-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'Find a quadratic polynomial with zeros −4 and 1/2 and integer coefficients, choosing the simplest non-zero multiple.',
        optA: '2x² − 7x − 4',
        optB: '2x² + 9x − 4',
        optC: '2x² + 7x − 4',
        optD: 'x² + 7x − 2',
        ans: 'C',
        exp: 'Using the zeros, form (x+4)(x−1/2) = x² + (7/2)x − 2. Multiplying by 2 to obtain integer coefficients gives 2x² + 7x − 4.'
      },
      {
        id: 'q-poly-m9-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'For x² − 6x + q, one zero is twice the other. Find q.',
        optA: '6',
        optB: '9',
        optC: '12',
        optD: '8',
        ans: 'D',
        exp: 'Let the zeros be t and 2t. Their sum is 6, so 3t = 6 and t = 2. The zeros are 2 and 4. The product is q = 2 × 4 = 8.'
      },
      {
        id: 'q-poly-m9-5',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A rectangular mural has area x² − 3x − 10. Its side factors are x−5 and x+2. Find zeros and discuss which values can be valid if x is a positive dimension parameter.',
        optA: 'Zeros are −5 and 2; valid dimensions require x > 2',
        optB: 'Zeros are 5 and −2; valid dimensions require x > 5',
        optC: 'Zeros are 10 and −1; valid dimensions require x > 10',
        optD: 'Zeros are 5 and 2; valid dimensions require x > 5',
        ans: 'B',
        exp: 'x² − 3x − 10 = (x−5)(x+2), so the zeros are 5 and −2. For both dimensions x−5 and x+2 to be positive, x must be greater than 5. The roots mark boundary values.'
      },
      {
        id: 'q-poly-m9-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of 2x² − x − 6, evaluate (1/α) + (1/β).',
        optA: '−1/6',
        optB: '1/6',
        optC: '−1/3',
        optD: '1/12',
        ans: 'A',
        exp: 'Sum = 1/2 and product = −3. Thus 1/α + 1/β = (α+β)/(αβ) = (1/2)/(−3) = −1/6.'
      },
      {
        id: 'q-poly-m9-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of 3x² − 4x − 2, find α³ + β³.',
        optA: '64/27',
        optB: '128/27',
        optC: '136/27',
        optD: '72/27',
        ans: 'C',
        exp: 'Here α+β = 4/3 and αβ = −2/3. Use α³ + β³ = (α+β)³ − 3αβ(α+β) = (4/3)³ − 3(−2/3)(4/3) = 64/27 + 8/3 = 64/27 + 72/27 = 136/27.'
      },
      {
        id: 'q-poly-m9-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A monic quadratic has zeros α, β, with α+β = −2 and αβ = −8. Evaluate α²β² − (α+β)².',
        optA: '64',
        optB: '68',
        optC: '56',
        optD: '60',
        ans: 'D',
        exp: 'Since αβ = −8, α²β² = (αβ)² = 64. Also (α+β)² = (−2)² = 4. Therefore the required value is 64 − 4 = 60.'
      },
      {
        id: 'q-poly-m9-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find zeros of x² − 7x + 12 and verify both coefficient relationships.',
        optA: '−3 and −4',
        optB: '2 and 6',
        optC: '3 and 4',
        optD: '1 and 12',
        ans: 'C',
        exp: 'Factorise: x² − 7x + 12 = (x−3)(x−4). The zeros are 3 and 4. Their sum is 7 = −b/a and their product is 12 = c/a.'
      },
      {
        id: 'q-poly-m9-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'The zeros of a quadratic polynomial are α, β, where α+β = −3 and αβ = −10. (i) Form its monic polynomial. (ii) Find the zeros. (iii) Verify the relations.',
        optA: 'x² − 3x − 10; zeros are 5 and −2',
        optB: 'x² + 3x − 10; zeros are 2 and −5',
        optC: 'x² + 3x + 10; no real zeros',
        optD: 'x² − 10x − 3; zeros are 10 and −3',
        ans: 'B',
        exp: 'The monic polynomial is x² − (−3)x + (−10) = x² + 3x − 10. Factorising gives (x+5)(x−2) = 0, so the zeros are −5 and 2. Their sum is −3 and product is −10, verifying both relations.'
      }
    ]
  },

  // ==========================================
  // MOCK SET 10: Final challenge (A:2, B:3, C:2, D:3)
  // ==========================================
  {
    testId: 'test-math-ch2-slot-10',
    testNumber: 10,
    title: 'Polynomials – Mock Test 10',
    description: 'Final challenge: Board exam simulation, multi-step problem solving, and comprehensive coefficient relations.',
    accessType: 'premium',
    questions: [
      {
        id: 'q-poly-m10-1',
        difficulty: 'easy',
        type: 'mcq',
        text: 'For p(x) = 2x² − 3x + 1, calculate p(1).',
        optA: '0',
        optB: '1',
        optC: '2',
        optD: '−1',
        ans: 'A',
        exp: 'Substitute x = 1: p(1) = 2(1)² − 3(1) + 1 = 2 − 3 + 1 = 0.'
      },
      {
        id: 'q-poly-m10-2',
        difficulty: 'easy',
        type: 'mcq',
        text: 'The zeros of x² + x − 6 are:',
        optA: '−2, 3',
        optB: '1, −6',
        optC: '2, −3',
        optD: '2, 3',
        ans: 'C',
        exp: 'Factorise: x² + x − 6 = (x+3)(x−2). Thus the zeros are −3 and 2.'
      },
      {
        id: 'q-poly-m10-3',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A monic quadratic has zeros −1 and 6. Find its sum, product and polynomial.',
        optA: 'Sum = −5; product = −6; polynomial = x² + 5x − 6',
        optB: 'Sum = 5; product = 6; polynomial = x² − 5x + 6',
        optC: 'Sum = 7; product = −6; polynomial = x² − 7x − 6',
        optD: 'Sum = 5; product = −6; polynomial = x² − 5x − 6',
        ans: 'D',
        exp: 'Sum = −1 + 6 = 5 and product = (−1)(6) = −6. The monic polynomial is x² − 5x − 6.'
      },
      {
        id: 'q-poly-m10-4',
        difficulty: 'medium',
        type: 'mcq',
        text: 'A learner finds the product of zeros of 7x² − 2x − 3 as −3. Correct the answer.',
        optA: '3/7',
        optB: '−3/7',
        optC: '2/7',
        optD: 'The learner is correct',
        ans: 'B',
        exp: 'For ax² + bx + c, product of zeros = c/a. Here c = −3 and a = 7, so the product is −3/7, not −3.'
      },
      {
        id: 'q-poly-m10-5',
        difficulty: 'medium',
        type: 'mcq',
        text: "A community garden's area expression is x² + 3x − 28 and factors as (x+7)(x−4). Find the zeros. Which value is a positive boundary?",
        optA: '−7 and 4; positive boundary = 4',
        optB: '7 and −4; positive boundary = 7',
        optC: '28 and −1; positive boundary = 28',
        optD: '14 and −2; positive boundary = 14',
        ans: 'A',
        exp: 'Set x+7 = 0 and x−4 = 0. The zeros are −7 and 4. The positive boundary value is 4.'
      },
      {
        id: 'q-poly-m10-6',
        difficulty: 'medium',
        type: 'mcq',
        text: 'If α, β are zeros of 4x² − 4x − 3, find (α+β)² − 2αβ.',
        optA: '3/2',
        optB: '5/2',
        optC: '1/2',
        optD: '7/2',
        ans: 'B',
        exp: 'Here α+β = 1 and αβ = −3/4. Thus (α+β)² − 2αβ = 1 − 2(−3/4) = 1 + 3/2 = 5/2.'
      },
      {
        id: 'q-poly-m10-7',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of x² − 3x + 1, find α³ + β³.',
        optA: '27',
        optB: '36',
        optC: '9',
        optD: '18',
        ans: 'D',
        exp: 'Sum = 3 and product = 1. Therefore α³ + β³ = (α+β)³ − 3αβ(α+β) = 27 − 9 = 18.'
      },
      {
        id: 'q-poly-m10-8',
        difficulty: 'hard',
        type: 'mcq',
        text: 'If α, β are zeros of 2x² + 5x − 3, find α²β² + αβ.',
        optA: '−3/4',
        optB: '3/4',
        optC: '9/4',
        optD: '15/4',
        ans: 'B',
        exp: 'Here αβ = c/a = −3/2. Thus α²β² + αβ = (αβ)² + αβ = (−3/2)² − 3/2 = 9/4 − 6/4 = 3/4.'
      },
      {
        id: 'q-poly-m10-9',
        difficulty: 'hard',
        type: 'mcq',
        text: 'Find the zeros of 4x² + 4x − 3 and verify the sum and product relations.',
        optA: '−1/2 and 3/2',
        optB: '3/4 and −1',
        optC: '1 and −3/4',
        optD: '1/2 and −3/2',
        ans: 'D',
        exp: 'Factorise: 4x² + 4x − 3 = (2x−1)(2x+3). Thus zeros are 1/2 and −3/2. Their sum is −1 = −b/a = −4/4, and their product is −3/4 = c/a.'
      },
      {
        id: 'q-poly-m10-10',
        difficulty: 'hard',
        type: 'mcq',
        text: 'A quadratic polynomial has zeros α and β such that α+β = 5 and α² + β² = 13. Find (i) αβ, (ii) the monic polynomial, and (iii) its zeros.',
        optA: 'αβ = −6; polynomial = x² − 5x − 6; zeros are 6 and −1',
        optB: 'αβ = 12; polynomial = x² − 5x + 12; no real zeros',
        optC: 'αβ = 6; polynomial = x² − 5x + 6; zeros are 2 and 3',
        optD: 'αβ = 4; polynomial = x² − 5x + 4; zeros are 1 and 4',
        ans: 'C',
        exp: 'Use α² + β² = (α+β)² − 2αβ. Thus 13 = 25 − 2αβ, giving 2αβ = 12 and αβ = 6. The monic polynomial is x² − 5x + 6 = (x−2)(x−3). Therefore its zeros are 2 and 3.'
      }
    ]
  }
];

export function seedPolynomialsMockTests(targetDb = db) {
  console.log('[Migration] Adding all 10 Polynomials Mock Tests (100 questions) from CBSE Class 10 Solved Practice PDF...');

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
        'math-ch2',
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
          'math-ch2',
          'Polynomials',
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
          'CBSE Class 10 Polynomials Solved Mock Sets'
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
  console.log('[Done] All 10 Polynomials Mock Tests (100 questions) successfully updated with evenly distributed A, B, C, D answers!');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('addPolynomialsMockTests.ts')) {
  seedPolynomialsMockTests();
}
