import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handleUpload, isUploadCategory } from '@/lib/upload/uploadHandler';
import { handleDownload } from '@/lib/upload/downloadHandler';
import type { User } from '@supabase/supabase-js';
import type { ParsedFile } from '@/lib/upload/parseMultipart';

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from '@/lib/supabase/server';

function makeUser(id: string, role: 'admin' | 'vet'): User {
  return {
    id,
    app_metadata: { role },
    user_metadata: {},
  } as unknown as User;
}

function mockStorage(uploadResult?: { error?: Error | null; signedUrl?: string }) {
  const from = vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: uploadResult?.error ?? null }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: uploadResult?.signedUrl ? { signedUrl: uploadResult.signedUrl } : null,
      error: uploadResult?.signedUrl ? null : { message: 'not found' },
    }),
  });

  (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
    storage: { from },
  });

  return { from };
}

describe('secure upload handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a valid file and returns the storage path', async () => {
    const { from } = mockStorage();
    const file: ParsedFile = {
      fieldname: 'file',
      filename: 'gait.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('video'),
      size: 5,
    };

    const result = await handleUpload({
      user: makeUser('vet-1', 'vet'),
      category: 'gait-video',
      entityType: 'patients',
      entityId: '42',
      file,
    });

    expect(result.path).toContain('patients/42/gait-video/vet-1/');
    expect(result.path).toContain('gait.mp4');
    expect(result.fileName).toBe('gait.mp4');
    expect(result.size).toBe(5);
    expect(result.mimeType).toBe('video/mp4');
    expect(from).toHaveBeenCalledWith('private-uploads');
  });

  it('rejects files that fail category validation', async () => {
    mockStorage();
    const file: ParsedFile = {
      fieldname: 'file',
      filename: 'malware.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('bad'),
      size: 3,
    };

    await expect(
      handleUpload({
        user: makeUser('vet-1', 'vet'),
        category: 'gait-video',
        entityType: 'patients',
        entityId: '42',
        file,
      }),
    ).rejects.toThrow('not allowed');
  });

  it('rejects oversized files', async () => {
    mockStorage();
    const file: ParsedFile = {
      fieldname: 'file',
      filename: 'huge.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(11 * 1024 * 1024),
      size: 11 * 1024 * 1024,
    };

    await expect(
      handleUpload({
        user: makeUser('vet-1', 'vet'),
        category: 'profile-image',
        entityType: 'patients',
        entityId: '42',
        file,
      }),
    ).rejects.toThrow('exceeds maximum size');
  });

  it('throws when storage upload fails', async () => {
    mockStorage({ error: new Error('bucket not found') });
    const file: ParsedFile = {
      fieldname: 'file',
      filename: 'gait.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('video'),
      size: 5,
    };

    await expect(
      handleUpload({
        user: makeUser('vet-1', 'vet'),
        category: 'gait-video',
        entityType: 'patients',
        entityId: '42',
        file,
      }),
    ).rejects.toThrow('Storage upload failed');
  });
});

describe('secure download handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a signed URL for the owner', async () => {
    mockStorage({ signedUrl: 'https://signed.example.com/file' });
    const path = 'patients/42/gait-video/vet-1/20260101-000000-gait.mp4';

    const result = await handleDownload({ user: makeUser('vet-1', 'vet'), path });

    expect(result.signedUrl).toBe('https://signed.example.com/file');
  });

  it('returns a signed URL for admins', async () => {
    mockStorage({ signedUrl: 'https://signed.example.com/file' });
    const path = 'patients/42/gait-video/vet-1/20260101-000000-gait.mp4';

    const result = await handleDownload({ user: makeUser('admin-1', 'admin'), path });

    expect(result.signedUrl).toBe('https://signed.example.com/file');
  });

  it('denies access to another vets files', async () => {
    mockStorage();
    const path = 'patients/42/gait-video/vet-1/20260101-000000-gait.mp4';

    await expect(handleDownload({ user: makeUser('vet-2', 'vet'), path })).rejects.toThrow('Forbidden');
  });
});

describe('upload category guard', () => {
  it('accepts known categories', () => {
    expect(isUploadCategory('gait-video')).toBe(true);
    expect(isUploadCategory('profile-image')).toBe(true);
    expect(isUploadCategory('consent-document')).toBe(true);
  });

  it('rejects unknown categories', () => {
    expect(isUploadCategory('malware')).toBe(false);
  });
});
