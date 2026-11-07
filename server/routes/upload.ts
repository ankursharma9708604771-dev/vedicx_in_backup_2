import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';

export const uploadRouter = Router();

uploadRouter.use(authenticateUser);
uploadRouter.use(requireAdmin);

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage engine with sanitized unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${cleanBase}_${uniqueSuffix}${ext}`);
  }
});

// File filter (PDFs, Images)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only PDF documents and image files (PNG, JPEG, WebP, SVG) are permitted.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  }
});

// Upload single file endpoint (Supports Supabase Storage + Local fallback)
uploadRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was provided in the upload request.' });
  }

  let finalFileUrl = `/uploads/${req.file.filename}`;

  // If Supabase Storage is configured, sync to bucket 'vedicx-assets'
  const { isSupabaseConfigured, uploadToSupabaseStorage } = await import('../supabase.ts');
  if (isSupabaseConfigured()) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const storageRes = await uploadToSupabaseStorage(
        'vedicx-assets',
        `uploads/${req.file.filename}`,
        fileBuffer,
        req.file.mimetype
      );
      if (storageRes.success && storageRes.publicUrl) {
        finalFileUrl = storageRes.publicUrl;
      }
    } catch (err: any) {
      console.warn('[STORAGE] Supabase upload failed, using local file URL fallback:', err.message);
    }
  }

  const sizeFormatted = req.file.size > 1024 * 1024
    ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(req.file.size / 1024)} KB`;

  res.json({
    success: true,
    message: 'File uploaded and secured successfully.',
    file: {
      original_name: req.file.originalname,
      filename: req.file.filename,
      file_url: finalFileUrl,
      file_size: sizeFormatted,
      mimetype: req.file.mimetype
    }
  });
});

// Delete uploaded file endpoint
uploadRouter.delete('/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'File deleted from storage.' });
    } catch (err: any) {
      return res.status(500).json({ error: `Could not delete file: ${err.message}` });
    }
  }

  res.status(404).json({ error: 'File not found on storage server.' });
});
