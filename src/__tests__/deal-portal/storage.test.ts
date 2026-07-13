import { describe, expect, it, vi } from 'vitest';
import {
  createDealRoomSignedUrl,
  DEAL_ROOM_BUCKET,
  isMissingDealRoomBucketError,
} from '@/deal-portal/lib/storage';

describe('deal portal storage helpers', () => {
  it('creates a signed URL from the private deal room bucket', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.test/nda.pdf' },
      error: null,
    });
    const from = vi.fn().mockReturnValue({ createSignedUrl });
    const client = { storage: { from } };

    await expect(createDealRoomSignedUrl(client as never, 'ndas/signed.pdf')).resolves.toBe(
      'https://signed.example.test/nda.pdf',
    );
    expect(from).toHaveBeenCalledWith(DEAL_ROOM_BUCKET);
    expect(createSignedUrl).toHaveBeenCalledWith('ndas/signed.pdf', 600);
  });

  it('throws a useful error when the signed URL cannot be created', async () => {
    const client = {
      storage: {
        from: () => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('bucket not found'),
          }),
        }),
      },
    };

    await expect(createDealRoomSignedUrl(client as never, 'ndas/missing.pdf')).rejects.toThrow('bucket not found');
  });

  it('recognises missing deal-room bucket errors', () => {
    expect(isMissingDealRoomBucketError(new Error('Bucket not found'))).toBe(true);
    expect(isMissingDealRoomBucketError('deal-room-documents bucket is unavailable')).toBe(true);
    expect(isMissingDealRoomBucketError(new Error('network timeout'))).toBe(false);
  });
});
