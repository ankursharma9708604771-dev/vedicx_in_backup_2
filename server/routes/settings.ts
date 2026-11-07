import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { getSiteSettings, updateSiteSettings, logAuditEvent } from '../supabaseDb.ts';

export const settingsRouter = Router();

settingsRouter.use(authenticateUser);

// GET all site settings (Supabase first)
settingsRouter.get('/', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update site settings
settingsRouter.put('/', requireAdmin, async (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }

  try {
    await updateSiteSettings(settings);
    await logAuditEvent('UPDATE_SETTINGS', 'SITE_SETTINGS', 'ALL', 'Admin updated website content/settings');
    res.json({ success: true, message: 'Website content updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
