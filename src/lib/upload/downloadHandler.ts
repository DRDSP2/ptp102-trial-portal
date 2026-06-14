import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import { PRIVATE_BUCKET, SIGNED_URL_TTL_SECONDS } from './config';
import { canAccessPath } from './access';

export type DownloadResult = {
  signedUrl: string;
};

export async function handleDownload({ user, path }: { user: User; path: string }): Promise<DownloadResult> {
  if (!canAccessPath(user, path)) {
    throw new Error('Forbidden');
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`);
  }

  return { signedUrl: data.signedUrl };
}
