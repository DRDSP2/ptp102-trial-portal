/**
 * Standalone smoke test for direct-browser → Supabase Storage uploads.
 *
 * Usage:
 *   npx tsx scripts/testDirectUpload.ts
 *
 * What it does:
 *   1. Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local.
 *      These are the same env vars the deployed browser app uses; if upload
 *      works here it should work in the browser, modulo bucket-level RLS.
 *   2. Signs in as the seeded test vet (test-vet@ptp102.local).
 *   3. Uploads a small in-memory PDF to bucket "ptp102-trial-portal" under
 *      a path the RLS policy "auth.uid() in 2nd path segment" will accept.
 *   4. Creates a 5-minute signed URL and HEADs it to confirm the object is
 *      readable through the signed URL.
 *   5. Deletes the test object so the bucket stays clean.
 *
 * What it does NOT test:
 *   - The hand-rolled localStorage data layer (useMutateAction recordUpload).
 *   - The /api/upload Vercel route. That path is exercised by
 *     scripts/e2eSecureUpload.ts which expects a running Vercel dev server.
 *
 * Exit codes:
 *   0 — all checks passed.
 *   1 — any check failed (full error printed).
 *
 * Required: tsx + dotenv (already in devDependencies).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

const TEST_EMAIL = process.env.TEST_VET_EMAIL ?? 'test-vet@ptp102.local';
const TEST_PASSWORD = process.env.TEST_VET_PASSWORD ?? 'TestVet!2026';

const BUCKET = 'ptp102-trial-portal';

function step(label: string) {
  // eslint-disable-next-line no-console
  console.log(`\n→ ${label}`);
}

function ok(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string): never {
  // eslint-disable-next-line no-console
  console.error(`  ✗ ${msg}`);
  process.exit(1);
}

function projectRefFromUrl(url: string): string {
  const m = url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(co|in)/);
  return m?.[1] ?? '<unparseable>';
}

async function signIn(client: SupabaseClient): Promise<{ userId: string }> {
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error || !data.session) {
    fail(
      `sign-in failed: ${error?.message ?? 'no session'}. ` +
        `Confirm seed users exist on project "${projectRefFromUrl(SUPABASE_URL)}" ` +
        `(see scripts/seedTestUsers.ts).`,
    );
  }
  return { userId: data.session.user.id };
}

async function uploadAndVerify(client: SupabaseClient, userId: string): Promise<string> {
  // Path scheme matches src/lib/upload/path.ts:
  //   <category>/<userId>/<entityType>/<entityId>/<timestamp>-<filename>
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const uploadPath = `patient-media/${userId}/diagnostics/test/${ts}-direct-upload-probe.pdf`;

  console.log(`  · bucket:     "${BUCKET}"`);
  console.log(`  · uploadPath: "${uploadPath}"`);

  // Tiny valid PDF (1-page minimal). Just bytes; RLS doesn't validate
  // content, only path/auth.
  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4
    0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, 0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a,
    0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a, // %%EOF
  ]);

  const { data: uploadData, error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(uploadPath, pdfBytes, {
      contentType: 'application/pdf',
      cacheControl: '60',
      upsert: false,
    });

  if (uploadError) {
    fail(`upload to "${BUCKET}" failed: ${uploadError.message} (path=${uploadPath})`);
  }
  console.log(`  · upload() returned path: "${uploadData?.path ?? '<none>'}"`);
  console.log(`  · upload() returned id:   "${uploadData?.id ?? '<none>'}"`);
  ok('upload succeeded');

  // Post-upload existence probe. Uses SELECT (list) on the parent folder.
  // If this passes, the object is queryable via SELECT — confirming the
  // path is correct AND a SELECT policy permits the read. If it fails
  // with zero matches but upload succeeded, the cause is the SELECT
  // policy (not a path-string mismatch).
  const lastSlash = uploadPath.lastIndexOf('/');
  const parentDir = uploadPath.slice(0, lastSlash);
  const fileName = uploadPath.slice(lastSlash + 1);
  console.log(`  · existence probe — list("${parentDir}") searching for "${fileName}"`);

  const { data: listed, error: listError } = await client.storage
    .from(BUCKET)
    .list(parentDir, { limit: 100, search: fileName });

  if (listError) {
    fail(`list() failed: ${listError.message}. Likely a missing or mismatched SELECT policy on bucket "${BUCKET}".`);
  }
  const found = (listed ?? []).find((entry) => entry.name === fileName);
  if (!found) {
    fail(
      `list() returned ${listed?.length ?? 0} entries but none matched "${fileName}". ` +
        `Either the object was not written, or a SELECT policy is filtering it out (RLS denies the read). ` +
        `Cause is NOT a path-string mismatch — upload and list used the same "${uploadPath}".`,
    );
  }
  ok(`existence probe found "${found.name}" (size=${found.metadata?.size ?? '?'} bytes)`);

  return uploadPath;
}

async function signAndHead(client: SupabaseClient, path: string): Promise<void> {
  console.log(`  · createSignedUrl bucket: "${BUCKET}"`);
  console.log(`  · createSignedUrl path:   "${path}"`);

  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    fail(`createSignedUrl failed for path "${path}": ${error?.message ?? 'no URL returned'}`);
  }

  const head = await fetch(data.signedUrl, { method: 'HEAD' });
  if (!head.ok) {
    fail(`signed URL HEAD returned ${head.status} ${head.statusText}`);
  }
  ok(`signed URL HEAD ${head.status}`);
}

async function cleanup(client: SupabaseClient, path: string): Promise<void> {
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) {
    // Don't fail the whole run on cleanup failure — log loudly.
    // eslint-disable-next-line no-console
    console.warn(`  ! cleanup failed (manual delete needed): ${path} — ${error.message}`);
  } else {
    ok(`removed test object`);
  }
}

async function main() {
  step('Environment');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    fail(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local. ' +
        'These are required to talk to Supabase.',
    );
  }
  ok(`project ref: ${projectRefFromUrl(SUPABASE_URL)}`);
  ok(`anon key length: ${SUPABASE_ANON_KEY.length} chars (value redacted)`);

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  step(`Sign in as ${TEST_EMAIL}`);
  const { userId } = await signIn(client);
  ok(`session for user ${userId}`);

  step(`Upload to bucket "${BUCKET}" + verify existence`);
  const path = await uploadAndVerify(client, userId);
  ok(`uploaded and verified: ${path}`);

  step('Mint signed URL and HEAD it');
  await signAndHead(client, path);

  step('Cleanup');
  await cleanup(client, path);

  step('Done');
  ok('all checks passed');
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  process.exit(1);
});
