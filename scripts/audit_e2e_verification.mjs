import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name}`);
  if (details) console.log(`   -> ${details}`);
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 VEDICX PRODUCTION-READINESS AUDIT EXECUTION SUITE');
  console.log('====================================================\n');

  let adminToken = null;
  let studentToken = null;
  let student2Token = null;
  let createdMockTestId = null;
  let attemptId = null;
  let registeredStudentId = null;
  let registeredAuthUserId = null;

  // ----------------------------------------------------
  // TEST 1: Admin Authentication via Dedicated Admin Portal
  // ----------------------------------------------------
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vedicx.in', password: 'admin123' })
    });
    const adminData = await adminRes.json();
    if (adminRes.status === 200 && adminData.token && adminData.user.role === 'admin') {
      adminToken = adminData.token;
      recordTest('Admin Login & Authorization Token Generation', true, `Admin role: ${adminData.user.role}`);
    } else {
      recordTest('Admin Login & Authorization Token Generation', false, `Status ${adminRes.status}: ${JSON.stringify(adminData)}`);
    }
  } catch (e) {
    recordTest('Admin Login & Authorization Token Generation', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Student Registration & Email Confirmation Requirement
  // ----------------------------------------------------
  const testStudentEmail = `audit_student_${Date.now()}@vedicx.test`;
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'Password123!',
        full_name: 'Audit Student Tester'
      })
    });
    const regData = await regRes.json();

    if (regRes.status === 201 && regData.requires_email_confirmation === true) {
      registeredStudentId = regData.user.id;
      registeredAuthUserId = regData.user.auth_user_id || regData.user.id;
      recordTest('Student Registration with Mandatory Email Confirmation', true, `User created: ${testStudentEmail}, requires_confirmation: true`);
    } else {
      recordTest('Student Registration with Mandatory Email Confirmation', false, `Status ${regRes.status}: ${JSON.stringify(regData)}`);
    }

    // Try logging in before email confirmation -> MUST return 403
    const unconfirmedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'Password123!' })
    });
    const unconfirmedData = await unconfirmedLoginRes.json();

    if (unconfirmedLoginRes.status === 403 && unconfirmedData.requires_email_confirmation === true) {
      recordTest('Enforce Unconfirmed Email Login Rejection (HTTP 403)', true, `Correctly blocked with 403: ${unconfirmedData.error}`);
    } else {
      recordTest('Enforce Unconfirmed Email Login Rejection (HTTP 403)', false, `Status ${unconfirmedLoginRes.status}: ${JSON.stringify(unconfirmedData)}`);
    }

    // Confirm email in Supabase directly (simulating user clicking verification link)
    if (registeredAuthUserId) {
      const { error: confErr } = await supabase.auth.admin.updateUserById(registeredAuthUserId, { email_confirm: true });
      if (confErr) {
        console.warn('Could not confirm user via auth.admin:', confErr.message);
      }
    }

    // Login again after confirmation
    const confirmedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'Password123!' })
    });
    const confirmedData = await confirmedLoginRes.json();

    if (confirmedLoginRes.status === 200 && confirmedData.token) {
      studentToken = confirmedData.token;
      recordTest('Confirmed Student Login & Token Generation', true, `Successfully authenticated confirmed student: ${testStudentEmail}`);
    } else {
      recordTest('Confirmed Student Login & Token Generation', false, `Status ${confirmedLoginRes.status}: ${JSON.stringify(confirmedData)}`);
    }
  } catch (e) {
    recordTest('Student Registration & Confirmation Flow', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Pre-existing Student Account Login (student@vedicx.in)
  // ----------------------------------------------------
  try {
    const student2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@vedicx.in', password: 'student123' })
    });
    const student2Data = await student2Res.json();
    if (student2Res.status === 200 && student2Data.token) {
      student2Token = student2Data.token;
      recordTest('Pre-existing Student Login (student@vedicx.in)', true, `Role: ${student2Data.user.role}`);
    } else {
      recordTest('Pre-existing Student Login (student@vedicx.in)', false, `Status ${student2Res.status}: ${JSON.stringify(student2Data)}`);
    }
  } catch (e) {
    recordTest('Pre-existing Student Login (student@vedicx.in)', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: RBAC & Private Record Authorization Checks (Criteria 3 & 4)
  // ----------------------------------------------------
  try {
    // 4a. Student tries to access Admin Students list
    const rbacRes1 = await fetch(`${BASE_URL}/api/students`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (rbacRes1.status === 403) {
      recordTest('Authorization Block: Student Cannot Access Admin Students Tab', true, `HTTP 403 Forbidden received`);
    } else {
      recordTest('Authorization Block: Student Cannot Access Admin Students Tab', false, `Unexpected status: ${rbacRes1.status}`);
    }

    // 4b. Student tries to access Admin Site Settings Update
    const rbacRes2 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ site_title: 'Hacked Title' })
    });
    if (rbacRes2.status === 403) {
      recordTest('Authorization Block: Student Cannot Modify Site Settings', true, `HTTP 403 Forbidden received`);
    } else {
      recordTest('Authorization Block: Student Cannot Modify Site Settings', false, `Unexpected status: ${rbacRes2.status}`);
    }

    // 4c. Student tries to access Admin Question Creation
    const rbacRes3 = await fetch(`${BASE_URL}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        subject_id: 'mathematics',
        chapter_id: 'math-ch1',
        question_text: 'Unauthorized question',
        option_a: 'A',
        option_b: 'B',
        correct_answer: 'A'
      })
    });
    if (rbacRes3.status === 403) {
      recordTest('Authorization Block: Student Cannot Create Questions in Bank', true, `HTTP 403 Forbidden received`);
    } else {
      recordTest('Authorization Block: Student Cannot Create Questions in Bank', false, `Unexpected status: ${rbacRes3.status}`);
    }
  } catch (e) {
    recordTest('RBAC Authorization Tests', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 5: Admin Dashboard Stats Retrieval (Supabase 100%)
  // ----------------------------------------------------
  try {
    const dashRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dashData = await dashRes.json();
    if (dashRes.status === 200 && dashData.stats && dashData.stats.total_questions >= 800) {
      recordTest('Admin Dashboard Statistics via Supabase', true, `Total Qs: ${dashData.stats.total_questions}, Mock Tests: ${dashData.stats.total_mock_tests}, Students: ${dashData.stats.total_students}`);
    } else {
      recordTest('Admin Dashboard Statistics via Supabase', false, `Status ${dashRes.status}: ${JSON.stringify(dashData)}`);
    }
  } catch (e) {
    recordTest('Admin Dashboard Statistics via Supabase', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Mock Test Creation (Admin) & Question Linking
  // ----------------------------------------------------
  try {
    const testTitle = `Audit Verification Test ${Date.now()}`;
    const createTestRes = await fetch(`${BASE_URL}/api/mock-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subject_id: 'mathematics',
        chapter_id: 'math-ch1',
        category_id: 'chapter-tests',
        title: testTitle,
        description: 'Automated test suite verification mock test',
        duration_minutes: 15,
        access_tier: 'free',
        status: 'published'
      })
    });
    const createData = await createTestRes.json();
    if (createTestRes.status === 201 && createData.mock_test?.id) {
      createdMockTestId = createData.mock_test.id;
      recordTest('Admin Mock Test Creation', true, `Created mock test: ${createdMockTestId}`);
    } else {
      recordTest('Admin Mock Test Creation', false, `Status ${createTestRes.status}: ${JSON.stringify(createData)}`);
    }

    // Assign a question to this new mock test
    if (createdMockTestId) {
      // Pick an existing question from math-ch1
      const qRes = await fetch(`${BASE_URL}/api/questions?chapter_id=math-ch1&limit=2`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const qData = await qRes.json();
      const questionId = qData.questions?.[0]?.id;

      if (questionId) {
        const assignRes = await fetch(`${BASE_URL}/api/questions/bulk-assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            mock_test_id: createdMockTestId,
            question_ids: [questionId]
          })
        });
        const assignData = await assignRes.json();
        if (assignRes.status === 200 && assignData.success) {
          recordTest('Admin Question Assignment to Mock Test', true, `Assigned question ${questionId} to ${createdMockTestId}`);
        } else {
          recordTest('Admin Question Assignment to Mock Test', false, JSON.stringify(assignData));
        }
      }
    }
  } catch (e) {
    recordTest('Mock Test Creation and Question Assignment', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Student Mock Test Flow (Start, Submit, Grade, Results)
  // ----------------------------------------------------
  try {
    const testToTake = createdMockTestId || 'test-math-ch1-slot-1';

    // 7a. Start test attempt
    const startRes = await fetch(`${BASE_URL}/api/test-engine/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ mock_test_id: testToTake })
    });
    const startData = await startRes.json();

    if (startRes.status === 200 && startData.attempt?.id) {
      attemptId = startData.attempt.id;
      const questionCount = startData.questions?.length || 0;
      recordTest('Student Test Engine: Start Mock Test Attempt', true, `Attempt ID: ${attemptId}, Questions received: ${questionCount}`);

      // 7b. Submit answers
      const answersPayload = (startData.questions || []).map((q, idx) => ({
        question_id: q.id,
        selected_option: idx % 2 === 0 ? 'A' : 'B',
        time_spent_seconds: 12
      }));

      const submitRes = await fetch(`${BASE_URL}/api/test-engine/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          answers: answersPayload
        })
      });
      const submitData = await submitRes.json();

      if (submitRes.status === 200 && submitData.result) {
        recordTest('Server-Side Grading & Evaluation Execution', true, `Score: ${submitData.result.score}/${submitData.result.max_marks}, Accuracy: ${submitData.result.accuracy_percentage}%, Result: ${submitData.result.result_status}`);
      } else {
        recordTest('Server-Side Grading & Evaluation Execution', false, `Status ${submitRes.status}: ${JSON.stringify(submitData)}`);
      }

      // 7c. Fetch detailed result breakdown
      const resultRes = await fetch(`${BASE_URL}/api/test-engine/attempt/${attemptId}/result`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const resultData = await resultRes.json();

      if (resultRes.status === 200 && resultData.attempt && resultData.answers) {
        recordTest('Student Attempt Detailed Results & Analysis Retrieval', true, `Attempt retrieved with ${resultData.answers.length} verified answers`);
      } else {
        recordTest('Student Attempt Detailed Results & Analysis Retrieval', false, `Status ${resultRes.status}: ${JSON.stringify(resultData)}`);
      }

      // 7d. Privacy Cross-Access Check: Student 2 tries to view Student 1's attempt!
      if (student2Token) {
        const crossAccessRes = await fetch(`${BASE_URL}/api/test-engine/attempt/${attemptId}`, {
          headers: { Authorization: `Bearer ${student2Token}` }
        });
        if (crossAccessRes.status === 403) {
          recordTest('Privacy Enforcement: Student Cannot View Another Student Attempt', true, `HTTP 403 Forbidden correctly returned`);
        } else {
          recordTest('Privacy Enforcement: Student Cannot View Another Student Attempt', false, `Unexpected status: ${crossAccessRes.status}`);
        }
      }
    } else {
      recordTest('Student Test Engine: Start Mock Test Attempt', false, `Status ${startRes.status}: ${JSON.stringify(startData)}`);
    }
  } catch (e) {
    recordTest('Test Engine Full Flow', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Appointment Booking & Admin Query Flow
  // ----------------------------------------------------
  try {
    const aptRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_name: 'Audit Student Tester',
        student_email: testStudentEmail,
        student_phone: '+91 9876543210',
        target_class: 'Class 10',
        subject: 'Mathematics',
        counselling_type: '1-on-1 Doubt Clearing',
        appointment_date: '2026-11-20',
        appointment_time: '17:00',
        notes: 'Verification test booking via Supabase'
      })
    });
    const aptData = await aptRes.json();

    if (aptRes.status === 201 && aptData.appointment?.id) {
      recordTest('Student 1-on-1 Counselling Appointment Booking', true, `Appointment ID: ${aptData.appointment.id}`);

      // Verify admin can retrieve this appointment
      const adminAptRes = await fetch(`${BASE_URL}/api/appointments?email=${testStudentEmail}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const adminAptData = await adminAptRes.json();
      const matched = adminAptData.appointments?.find(a => a.student_email === testStudentEmail.toLowerCase());

      if (matched) {
        recordTest('Admin Retrieval of Student Appointments', true, `Found appointment for ${testStudentEmail}`);
      } else {
        recordTest('Admin Retrieval of Student Appointments', false, `Appointment not found in admin list: ${JSON.stringify(adminAptData)}`);
      }
    } else {
      recordTest('Student 1-on-1 Counselling Appointment Booking', false, `Status ${aptRes.status}: ${JSON.stringify(aptData)}`);
    }
  } catch (e) {
    recordTest('Appointment Flow', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 9: Razorpay Payment Gateway Safeguard (Criteria 6)
  // ----------------------------------------------------
  try {
    const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ amount: 49 })
    });
    const orderData = await orderRes.json();

    if (orderRes.status === 503 && orderData.error) {
      recordTest('Razorpay Create-Order Disabled with Graceful HTTP 503', true, `Correctly returned 503: "${orderData.error.substring(0, 60)}..."`);
    } else {
      recordTest('Razorpay Create-Order Disabled with Graceful HTTP 503', false, `Unexpected status ${orderRes.status}: ${JSON.stringify(orderData)}`);
    }

    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ razorpay_payment_id: 'fake_123' })
    });
    const verifyData = await verifyRes.json();

    if (verifyRes.status === 503 && verifyData.error) {
      recordTest('Razorpay Payment Verification Disabled with Graceful HTTP 503', true, `Correctly returned 503: "${verifyData.error.substring(0, 60)}..."`);
    } else {
      recordTest('Razorpay Payment Verification Disabled with Graceful HTTP 503', false, `Unexpected status ${verifyRes.status}: ${JSON.stringify(verifyData)}`);
    }
  } catch (e) {
    recordTest('Razorpay Payment Gateway Verification', false, e.message);
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');

  // Clean up created test student from Supabase
  if (registeredAuthUserId) {
    try {
      await supabase.auth.admin.deleteUser(registeredAuthUserId);
      await supabase.from('profiles').delete().eq('id', registeredAuthUserId);
      if (attemptId) {
        await supabase.from('student_answers').delete().eq('attempt_id', attemptId);
        await supabase.from('test_attempts').delete().eq('id', attemptId);
      }
      if (createdMockTestId) {
        await supabase.from('mock_test_questions').delete().eq('mock_test_id', createdMockTestId);
        await supabase.from('mock_tests').delete().eq('id', createdMockTestId);
      }
      console.log('🧹 Cleaned up temporary test artifacts.');
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  }

  process.exit(allPassed ? 0 : 1);
}

runAudit();
