import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET_NAME = 'vedicx-assets';
const DIAGRAMS_DIR = path.resolve(process.cwd(), 'public', 'diagrams');
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

async function migrateStorage() {
  console.log('===============================================================');
  console.log('         VEDICX ASSETS & DIAGRAMS STORAGE MIGRATION            ');
  console.log('===============================================================');

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project-id')) {
    console.log('[STORAGE] Supabase credentials not configured in .env.');
    console.log('[STORAGE] Preserving all 26 vector diagrams in public/diagrams/ and uploads in data/uploads/.');
    console.log('[STORAGE] When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, rerun this script to upload assets.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  // Ensure bucket exists
  const { data: buckets, error: getBucketsErr } = await supabase.storage.listBuckets();
  if (getBucketsErr) {
    console.error('[STORAGE ERROR] Could not list buckets:', getBucketsErr.message);
    return;
  }

  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.log(`[STORAGE] Creating public bucket '${BUCKET_NAME}'...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024 // 25MB
    });
    if (createErr) {
      console.error('[STORAGE ERROR] Failed to create bucket:', createErr.message);
      return;
    }
  }

  // 1. Upload diagrams
  if (fs.existsSync(DIAGRAMS_DIR)) {
    const files = fs.readdirSync(DIAGRAMS_DIR);
    console.log(`[STORAGE] Found ${files.length} diagrams to sync...`);
    for (const f of files) {
      const filePath = path.join(DIAGRAMS_DIR, f);
      const fileBuffer = fs.readFileSync(filePath);
      const contentType = f.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`diagrams/${f}`, fileBuffer, {
          contentType,
          upsert: true
        });

      if (upErr) {
        console.warn(`  [!] Warning uploading ${f}:`, upErr.message);
      } else {
        console.log(`  [OK] Uploaded diagrams/${f}`);
      }
    }
  }

  // 2. Upload files in data/uploads
  if (fs.existsSync(UPLOADS_DIR)) {
    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    console.log(`[STORAGE] Found ${uploadFiles.length} uploads to sync...`);
    for (const f of uploadFiles) {
      const filePath = path.join(UPLOADS_DIR, f);
      const fileBuffer = fs.readFileSync(filePath);
      let contentType = 'application/octet-stream';
      if (f.endsWith('.pdf')) contentType = 'application/pdf';
      else if (f.endsWith('.png')) contentType = 'image/png';
      else if (f.endsWith('.jpg') || f.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (f.endsWith('.svg')) contentType = 'image/svg+xml';

      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`uploads/${f}`, fileBuffer, {
          contentType,
          upsert: true
        });

      if (upErr) {
        console.warn(`  [!] Warning uploading uploads/${f}:`, upErr.message);
      } else {
        console.log(`  [OK] Uploaded uploads/${f}`);
      }
    }
  }

  console.log('[STORAGE SUCCESS] Supabase Storage synchronization completed!');
}

migrateStorage().catch(err => {
  console.error('[STORAGE ERROR]:', err);
});
