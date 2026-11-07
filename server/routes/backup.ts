import { Router } from 'express';
import {
  createDatabaseBackup,
  restoreDatabaseFromBackup,
  listBackups,
  deleteBackup,
  getBackupFilePath,
  verifyBackupFile
} from '../backupService.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';

export const backupRouter = Router();

backupRouter.use(authenticateUser);
backupRouter.use(requireAdmin);

// GET list of backups
backupRouter.get('/list', async (_req, res) => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual backup
backupRouter.post('/create', async (req, res) => {
  try {
    const { type = 'manual', admin_email = 'admin@vedicx.in' } = req.body;
    const backup = await createDatabaseBackup(type, admin_email);
    res.json({
      success: true,
      message: `Database backup created successfully. Included tables and all relationships preserved.`,
      backup
    });
  } catch (err: any) {
    res.status(500).json({ error: `Backup failed: ${err.message}` });
  }
});

// Verify a backup before restoring
backupRouter.post('/verify', (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const filePath = getBackupFilePath(filename);
  if (!filePath) {
    return res.status(404).json({ error: 'Backup file not found on disk.' });
  }

  const verification = verifyBackupFile(filePath);
  if (!verification.valid || !verification.data) {
    return res.status(400).json({ valid: false, error: verification.error });
  }

  res.json({
    valid: true,
    metadata: verification.data.metadata,
    table_summary: Object.keys(verification.data.tables).map(tbl => ({
      table: tbl,
      count: verification.data!.tables[tbl].length
    }))
  });
});

// Restore from backup
backupRouter.post('/restore', async (req, res) => {
  const { filename, admin_email = 'admin@vedicx.in' } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  try {
    const result = await restoreDatabaseFromBackup(filename, admin_email);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: `Restore error: ${err.message}` });
  }
});

// Download backup file
backupRouter.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = getBackupFilePath(filename);

  if (!filePath) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  res.download(filePath, filename);
});

// Delete backup
backupRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await deleteBackup(id);

    if (!success) {
      return res.status(404).json({ error: 'Backup record not found.' });
    }

    res.json({ success: true, message: 'Backup record and file deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
