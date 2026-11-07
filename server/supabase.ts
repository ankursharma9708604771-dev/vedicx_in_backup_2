import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseServiceKey.includes('your-service-role-secret')
  );
}

// Server-side privileged client using Service Role Key (NEVER exposed to frontend!)
export const supabaseServerClient: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Verify a Supabase Auth Bearer JWT token from client headers
 */
export async function verifySupabaseToken(token: string) {
  if (!supabaseServerClient) return null;
  try {
    const { data: { user }, error } = await supabaseServerClient.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('[SUPABASE AUTH] Token verification error:', err);
    return null;
  }
}

/**
 * Upload a file buffer directly to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  if (!supabaseServerClient) {
    return { success: false, error: 'Supabase storage is not configured' };
  }

  try {
    const { data, error } = await supabaseServerClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabaseServerClient.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Storage upload failed' };
  }
}
