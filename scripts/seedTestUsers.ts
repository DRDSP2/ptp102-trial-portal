/**
 * Seed minimal test users for local development.
 *
 * Creates (or updates idempotently):
 *   - 1 admin auth user with app_metadata.role = 'admin'
 *     and a matching row in public.admin_users.
 *   - 1 vet auth user with app_metadata.role = 'vet'
 *     and a matching approved row in public.veterinarians.
 *
 * Both passwords are well-known test values; never use these credentials in
 * production. Service-role key required.
 *
 * Run: npx tsx scripts/seedTestUsers.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
}

const TEST_ADMIN = {
  email: 'test-admin@ptp102.local',
  password: 'TestAdmin!2026',
  full_name: 'Test Admin',
};

const TEST_VET = {
  email: 'test-vet@ptp102.local',
  password: 'TestVet!2026',
  full_name: 'Dr. Test Vet',
  license_number: 'TEST-LIC-0001',
  hospital_affiliation: 'Test Equine Hospital',
};

const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAuthUser(
  email: string,
  password: string,
  role: 'admin' | 'vet',
): Promise<string> {
  // Look up an existing user by email (admin.listUsers paginates).
  let existing: { id: string; email: string | undefined } | null = null;
  let page = 1;
  while (page <= 10) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (match) {
      existing = { id: match.id, email: match.email };
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  if (existing) {
    // Update password + app_metadata so the user is in a known good state.
    const { error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { role },
      email_confirm: true,
    });
    if (error) throw new Error(`updateUserById(${email}) failed: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error || !data.user) {
    throw new Error(`createUser(${email}) failed: ${error?.message ?? 'no user returned'}`);
  }
  return data.user.id;
}

async function ensureAdminRow() {
  const { data: existing } = await client
    .from('admin_users')
    .select('id')
    .eq('email', TEST_ADMIN.email)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('admin_users')
      .update({ full_name: TEST_ADMIN.full_name, password_hash: '__supabase_auth__', updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(`update admin_users: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await client
    .from('admin_users')
    .insert({
      email: TEST_ADMIN.email,
      password_hash: '__supabase_auth__', // sentinel: real auth lives in Supabase Auth
      full_name: TEST_ADMIN.full_name,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`insert admin_users: ${error?.message ?? 'no row'}`);
  return data.id;
}

async function ensureVetRow() {
  const { data: existing } = await client
    .from('veterinarians')
    .select('id')
    .eq('email', TEST_VET.email)
    .maybeSingle();

  const baseFields = {
    full_name: TEST_VET.full_name,
    license_number: TEST_VET.license_number,
    hospital_affiliation: TEST_VET.hospital_affiliation,
    tc_accepted: true,
    tc_accepted_at: new Date().toISOString(),
    signature_text: TEST_VET.full_name,
    password_hash: '__supabase_auth__',
    verification_status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: 'seed-script',
    no_conflict_of_interest: true,
  };

  if (existing) {
    const { error } = await client
      .from('veterinarians')
      .update({ ...baseFields, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(`update veterinarians: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await client
    .from('veterinarians')
    .insert({ email: TEST_VET.email, ...baseFields })
    .select('id')
    .single();
  if (error || !data) throw new Error(`insert veterinarians: ${error?.message ?? 'no row'}`);
  return data.id;
}

async function main() {
  console.log('=== Seeding minimal test users ===');
  console.log(`Project: ${SUPABASE_URL}\n`);

  console.log(`1. Admin: ${TEST_ADMIN.email}`);
  const adminUid = await ensureAuthUser(TEST_ADMIN.email, TEST_ADMIN.password, 'admin');
  console.log(`   auth.users.id = ${adminUid}`);
  const adminRowId = await ensureAdminRow();
  console.log(`   admin_users.id = ${adminRowId}`);

  console.log(`\n2. Vet:   ${TEST_VET.email}`);
  const vetUid = await ensureAuthUser(TEST_VET.email, TEST_VET.password, 'vet');
  console.log(`   auth.users.id = ${vetUid}`);
  const vetRowId = await ensureVetRow();
  console.log(`   veterinarians.id = ${vetRowId}`);

  console.log('\n=== Done. Test credentials (dev only) ===');
  console.log(`Admin: ${TEST_ADMIN.email} / ${TEST_ADMIN.password}`);
  console.log(`Vet:   ${TEST_VET.email} / ${TEST_VET.password}`);
}

main().catch((err) => {
  console.error('SEED FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
