import { describe, expect, it } from 'vitest';
import { canAccessPath, getUserRole } from '@/lib/upload/access';
import { buildStoragePath } from '@/lib/upload/path';

function makeUser(id: string, role: 'admin' | 'vet' | null) {
  return {
    id,
    app_metadata: { role },
    user_metadata: {},
  } as unknown as import('@supabase/supabase-js').User;
}

describe('secure upload access control', () => {
  const ownPath = buildStoragePath({
    category: 'patient-media',
    entityType: 'patients',
    entityId: 42,
    userId: 'vet-1',
    fileName: 'gait.mp4',
  });

  it('extracts role from user metadata', () => {
    expect(getUserRole(makeUser('u1', 'admin'))).toBe('admin');
    expect(getUserRole(makeUser('u1', 'vet'))).toBe('vet');
    expect(getUserRole(makeUser('u1', null))).toBe(null);
  });

  it('allows admins to access any path', () => {
    expect(canAccessPath(makeUser('admin-1', 'admin'), ownPath)).toBe(true);
  });

  it('allows vets to access their own paths', () => {
    expect(canAccessPath(makeUser('vet-1', 'vet'), ownPath)).toBe(true);
  });

  it('denies vets access to another users path', () => {
    expect(canAccessPath(makeUser('vet-2', 'vet'), ownPath)).toBe(false);
  });

  it('denies users without a role', () => {
    expect(canAccessPath(makeUser('u1', null), ownPath)).toBe(false);
  });
});
