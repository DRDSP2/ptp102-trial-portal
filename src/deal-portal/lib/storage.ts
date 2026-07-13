import type { SupabaseClient } from '@supabase/supabase-js';

export const DEAL_ROOM_BUCKET = 'deal-room-documents';

const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function createDealRoomSignedUrl(client: SupabaseClient, filePath: string) {
  const { data, error } = await client.storage
    .from(DEAL_ROOM_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(
      error?.message || 'Unable to create a secure document link. Confirm the deal-room-documents bucket exists.',
    );
  }

  return data.signedUrl;
}

export function isMissingDealRoomBucketError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /bucket not found|deal-room-documents/i.test(message);
}
