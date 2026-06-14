/**
 * End-to-end smoke test for secure upload/download.
 *
 * Creates two temporary Supabase Auth users, uploads a file as user A,
 * verifies user A can download it, verifies user B is denied, checks that
 * direct public/storage access is blocked, then cleans up.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function mask(value: string): string {
  return value ? `${value.slice(0, 8)}...${value.slice(-4)}` : 'missing';
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function signIn(email: string, password: string): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? 'no session'}`);
  }
  return data.session.access_token;
}

async function createTestUser(email: string, password: string, role: 'vet' | 'admin') {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test user ${email}: ${error?.message ?? 'unknown'}`);
  }
  return data.user.id;
}

async function uploadFile(token: string, file: File): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'profile-image');
  formData.append('entityType', 'patients');
  formData.append('entityId', 'e2e-42');

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = (await response.json().catch(() => ({ error: 'Upload request failed' }))) as {
    error?: string;
    path?: string;
  };

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}): ${result.error ?? 'unknown'}`);
  }
  assert(typeof result.path === 'string', 'upload response did not include a path');
  return { path: result.path! };
}

async function downloadFile(token: string, path: string): Promise<{ signedUrl: string; status: number }> {
  const response = await fetch(`${API_BASE}/api/download?path=${encodeURIComponent(path)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = (await response.json().catch(() => ({ error: 'Download request failed' }))) as {
    error?: string;
    signedUrl?: string;
  };
  return { signedUrl: result.signedUrl ?? '', status: response.status };
}

async function cleanupUser(userId: string, path?: string) {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (path) {
    const { error } = await serviceClient.storage.from('private-uploads').remove([path]);
    if (error) {
      console.warn(`Cleanup: failed to remove object ${path}:`, error.message);
    }
  }

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`Cleanup: failed to delete user ${userId}:`, error.message);
  }
}

async function main() {
  console.log('=== Secure upload E2E validation ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Anon key:     ${mask(SUPABASE_ANON_KEY)}`);
  console.log(`Service key:  ${mask(SUPABASE_SERVICE_ROLE_KEY)}`);
  console.log(`API base:     ${API_BASE}\n`);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n0. Ensuring private-uploads bucket exists...');
  const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }
  if (!buckets?.find((b) => b.name === 'private-uploads')) {
    const { error: createError } = await serviceClient.storage.createBucket('private-uploads', {
      public: false,
    });
    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }
    console.log('   Created private-uploads bucket ✅');
  } else {
    console.log('   Bucket already exists ✅');
  }

  const timestamp = Date.now();
  const userAEmail = `e2e-a-${timestamp}@example.com`;
  const userBEmail = `e2e-b-${timestamp}@example.com`;
  const password = `E2eTest!${timestamp}`;

  let userAId: string | undefined;
  let userBId: string | undefined;
  let uploadedPath: string | undefined;

  try {
    console.log('1. Creating test users via service role...');
    userAId = await createTestUser(userAEmail, password, 'vet');
    userBId = await createTestUser(userBEmail, password, 'vet');
    console.log(`   User A: ${userAId}`);
    console.log(`   User B: ${userBId}`);

    console.log('\n2. Signing in users...');
    const tokenA = await signIn(userAEmail, password);
    const tokenB = await signIn(userBEmail, password);
    console.log(`   Token A: ${mask(tokenA)}`);
    console.log(`   Token B: ${mask(tokenB)}`);

    console.log('\n3. Testing unauthorized access...');
    const noAuthUpload = await fetch(`${API_BASE}/api/upload`, { method: 'POST' });
    assert(noAuthUpload.status === 401, `expected 401 for upload without auth, got ${noAuthUpload.status}`);
    console.log('   Upload without auth -> 401 ✅');

    const noAuthDownload = await fetch(`${API_BASE}/api/download?path=patients/e2e-42/profile-image/x/test.png`);
    assert(noAuthDownload.status === 401, `expected 401 for download without auth, got ${noAuthDownload.status}`);
    console.log('   Download without auth -> 401 ✅');

    console.log('\n4. Uploading file as user A...');
    const file = new File(['hello-secure-world'], 'e2e-test.png', { type: 'image/png' });
    const uploadResult = await uploadFile(tokenA, file);
    uploadedPath = uploadResult.path;
    console.log(`   Uploaded path: ${uploadedPath}`);

    console.log('\n5. User A downloading their own file...');
    const ownerDownload = await downloadFile(tokenA, uploadedPath);
    assert(ownerDownload.status === 200, `expected 200 for owner download, got ${ownerDownload.status}`);
    assert(ownerDownload.signedUrl.length > 0, 'expected signed URL for owner download');
    console.log(`   Owner download -> 200 ✅ (${ownerDownload.signedUrl.slice(0, 60)}...)`);

    console.log('\n6. Verifying signed URL is reachable...');
    const signedFetch = await fetch(ownerDownload.signedUrl);
    assert(signedFetch.status === 200, `expected signed URL to be reachable, got ${signedFetch.status}`);
    const body = await signedFetch.text();
    assert(body === 'hello-secure-world', 'signed URL returned wrong content');
    console.log('   Signed URL content matches ✅');

    console.log('\n7. User B attempting to download user A file...');
    const otherDownload = await downloadFile(tokenB, uploadedPath);
    assert(otherDownload.status === 403, `expected 403 for cross-user download, got ${otherDownload.status}`);
    console.log('   Cross-user download -> 403 ✅');

    console.log('\n8. Verifying RLS blocks direct storage access by user B...');
    const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await clientB.auth.setSession({ access_token: tokenB, refresh_token: '' });
    const { data: directData, error: directError } = await clientB.storage
      .from('private-uploads')
      .download(uploadedPath);
    assert(!directData && directError !== null, 'expected RLS to block direct download');
    console.log(`   Direct storage download blocked: ${directError?.message} ✅`);

    console.log('\n9. Verifying public URL does not expose the file...');
    const publicUrl = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      .storage.from('private-uploads')
      .getPublicUrl(uploadedPath).data.publicUrl;
    const publicFetch = await fetch(publicUrl);
    assert(publicFetch.status !== 200, `expected public URL to be inaccessible, got ${publicFetch.status}`);
    console.log(`   Public URL inaccessible -> ${publicFetch.status} ✅`);

    console.log('\n=== ALL E2E CHECKS PASSED ✅ ===');
  } catch (err) {
    console.error('\n=== E2E CHECK FAILED ❌ ===');
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    console.log('\n10. Cleaning up...');
    if (uploadedPath && userAId) await cleanupUser(userAId, uploadedPath);
    if (userBId) await cleanupUser(userBId);
    console.log('   Cleanup complete');
  }
}

main();
