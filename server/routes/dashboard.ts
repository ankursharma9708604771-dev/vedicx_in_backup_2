import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { getDashboardStats } from '../supabaseDb.ts';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateUser);

// GET Admin Dashboard aggregated statistics (Admin only)
dashboardRouter.get('/stats', requireAdmin, async (req, res) => {
  try {
    const data = await getDashboardStats();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
