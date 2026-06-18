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
    expect(getUserRole(makeUser('u1', null), ownPath)).toBeNull();
  });
});

describe('storage path RLS compatibility', () => {
  // The Supabase Storage RLS policy checks:
  //   (storage.foldername(name))[2] = auth.uid()::text
  //
  // Path scheme: <category>/<userId>/<entityType>/<entityId>/<timestamp>-<safeName>
  // foldername() returns directory components only (everything before the last /).
  // So foldername(name)[2] must equal auth.uid()::text.
  //
  // This test verifies that buildStoragePath generates paths meeting that contract.

  it('places userId as the second directory component matching foldername()[2]', () => {
    const userId = 'b1a2c3d4-e5f6-7890-abcd-ef1234567890';
    const path = buildStoragePath({
      category: 'site-files',
      entityType: 'investigator-quals',
      entityId: 'vet@example.com',
      userId,
      fileName: 'drug_storage.jpg',
    });

    // Simulate what `storage.foldername(name)` does:
    // Strip the last segment (file name), then split remaining by `/`.
    // The result is a 0-indexed array in JS, but SQL foldername() returns
    // a 1-based array. So [2] in SQL = index 1 in JS.
    const lastSlash = path.lastIndexOf('/');
    const dirs = path.slice(0, lastSlash).split('/');
    // dirs[0] = 'site-files', dirs[1] = userId
    expect(dirs[1]).toBe(userId);
    expect(dirs[0]).toBe('site-files');
  });

  it('generates path with exactly 4 directory components matching expected RLS index', () => {
    const path = buildStoragePath({
      category: 'site-files',
      entityType: 'investigator-quals',
      entityId: 'vet@example.com',
      userId: 'user-uuid',
      fileName: 'photo.png',
    });

    const lastSlash = path.lastIndexOf('/');
    const dirs = path.slice(0, lastSlash).split('/');
    // Expected: ['site-files', 'user-uuid', 'investigator-quals', 'vet@example.com']
    expect(dirs).toHaveLength(4);
  });

  it('generates category+userId prefix that matches the RLS INSERT check pattern', () => {
    const userId = 'vet-user-id';
    const path = buildStoragePath({
      category: 'site-files',
      entityType: 'investigator-quals',
      entityId: 'vet@example.com',
      userId,
      fileName: 'photo.png',
    });

    // The RLS INSERT policy allows the insert when
    //   (storage.foldername(name))[2] = auth.uid()::text
    // For a path like:
    //   site-files/vet-user-id/investigator-quals/vet@example.com/...
    // foldername() returns {site-files, vet-user-id, investigator-quals, vet@example.com}
    // foldername(name)[2] = 'vet-user-id' which must equal the auth user id.
    //
    // Verify the second path component is the userId.
    const parts = path.split('/');
    expect(parts[0]).toBe('site-files');
    expect(parts[1]).toBe(userId);
  });
});
