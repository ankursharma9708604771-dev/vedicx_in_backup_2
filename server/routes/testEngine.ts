import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.ts';
import {
  startTestAttempt,
  submitTestAttempt,
  getTestAttemptResult,
  getStudentTestHistory
} from '../supabaseDb.ts';

export const testEngineRouter = Router();

testEngineRouter.use(authenticateUser);

// Start a test (Student initiates attempt)
testEngineRouter.post('/start', async (req, res) => {
  const { mock_test_id } = req.body;
  const studentId = req.user?.id;

  if (!studentId) {
    return res.status(401).json({ error: 'Please sign in to take this mock test.' });
  }

  if (!mock_test_id) {
    return res.status(400).json({ error: 'mock_test_id is required' });
  }

  try {
    const result = await startTestAttempt(studentId, mock_test_id);
    res.json(result);
  } catch (err: any) {
    const status = err.status || (err.requires_premium ? 403 : 400);
    res.status(status).json({
      error: err.message,
      requires_premium: err.requires_premium,
      free_limit_reached: err.free_limit_reached
    });
  }
});

// Submit a test (Server-side grading & evaluation)
testEngineRouter.post('/submit', async (req, res) => {
  const { attempt_id, answers, time_taken_seconds = 0 } = req.body;
  const studentId = req.user?.id;

  if (!attempt_id || !answers) {
    return res.status(400).json({ error: 'attempt_id and answers map are required' });
  }

  if (!studentId) {
    return res.status(401).json({ error: 'Unauthorized submission. Authentication required.' });
  }

  try {
    const result = await submitTestAttempt(studentId, attempt_id, answers, Number(time_taken_seconds));
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET attempt results (Enforces student data isolation)
testEngineRouter.get('/attempt/:id', async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?.id || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);
  const isAdmin = req.user?.role === 'admin';

  try {
    const result = await getTestAttemptResult(id, currentUserId, isAdmin);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 404).json({ error: err.message });
  }
});

// GET student attempt history
testEngineRouter.get('/my-history', async (req, res) => {
  const studentId = req.user?.id || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);

  if (!studentId) {
    return res.json({ history: [] });
  }

  try {
    const history = await getStudentTestHistory(studentId);
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
