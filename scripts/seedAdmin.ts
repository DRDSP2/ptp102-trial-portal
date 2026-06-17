/**
 * Seed or promote an admin user for the production Supabase project.
 *
 * Usage:
 *   1. Set ADMIN_EMAIL in .env.local (or export it):
 *        ADMIN_EMAIL=admin@example.com
 *   2. Run:
 *        npx tsx scripts/seedAdmin.ts
 *
 * The script:
 *   - Creates the Auth user (with a random password it discards) if missing,
 *     or updates app_metadata.role = 'admin' on an existing user.
 *   - Generates a password-recovery link the admin must use to set their own
 *     password before their first real sign-in.
 *   - Inserts or updates the corresponding row in the admin_users table.
 *
 * Environment variables (all read from .env.local):
 *   VITE_SUPABASE_URL          – Supabase project URL (required)
 *   SUPABASE_SERVICE_ROLE_KEY  – service-role key (required, never committed)
 *   ADMIN_EMAIL                – email of the admin to create / promote (required)
 *   ADMIN_NAME                 – display name (optional, default "Admin")
 *   ADMIN_REDIRECT_URL         – where the recovery link sends the admin
 *                                (optional, defaults to app domain)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// ── Configuration ──────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
const REDIRECT_URL =
  process.env.ADMIN_REDIRECT_URL || 'https://byrock.eth.limo/admin/login';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    'VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local',
  );
}
if (!ADMIN_EMAIL) {
  throw new Error(
    'ADMIN_EMAIL is required. Set it in .env.local or export it.',
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Look up an auth user by email (pagination-safe). */
async function findUserByEmail(
  email: string,
): Promise<{ id: string; email: string } | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find(
      (u) => (u.email ?? '').toLowerCase() === email,
    );
    if (match) return { id: match.id, email: match.email! };
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * Ensure an auth user exists with role = 'admin'.
 *
 * If the user already exists we update app_metadata (idempotent).
 * If not, we create them with a random one-time password; the admin will
 * set their own password via the recovery link generated afterwards.
 */
async function ensureAuthUser(email: string): Promise<string> {
  const existing = await findUserByEmail(email);

  if (existing) {
    console.log(`  Auth user exists: ${existing.id}`);
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: { role: 'admin' },
      email_confirm: true,
    });
    if (error) throw new Error(`updateUserById failed: ${error.message}`);
    console.log(`  ✔ app_metadata.role set to 'admin'`);
    return existing.id;
  }

  const tempPassword = crypto.randomUUID();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? 'no user returned'}`);
  }
  console.log(`  ✔ Auth user created: ${data.user.id}`);
  return data.user.id;
}

/** Generate a one-time password-recovery link for the admin. */
async function generateRecoveryLink(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: REDIRECT_URL },
  });
  if (error || !data?.properties?.action_link) {
    // generateLink may fail if the user was just created; retry once.
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: REDIRECT_URL },
    });
    if (retry.error || !retry.data?.properties?.action_link) {
      throw new Error(
        `generateLink failed: ${retry.error?.message ?? 'no action_link returned'}`,
      );
    }
    return retry.data.properties.action_link;
  }
  return data.properties.action_link;
}

/** Upsert a row in the admin_users table. */
async function ensureAdminRow(email: string, fullName: string): Promise<void> {
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  const payload = {
    email,
    full_name: fullName,
    password_hash: '__supabase_auth__',
  };

  if (existing) {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(`update admin_users: ${error.message}`);
    console.log(`  ✔ admin_users row updated (id=${existing.id})`);
  } else {
    const { error } = await supabase
      .from('admin_users')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(`insert admin_users: ${error.message}`);
    console.log(`  ✔ admin_users row created`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Admin User Seed');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Project: ${SUPABASE_URL}`);
  console.log(`  Admin:   ${ADMIN_EMAIL}`);
  console.log('');

  // 1. Auth user
  console.log('1. Ensuring auth user...');
  const userId = await ensureAuthUser(ADMIN_EMAIL);
  console.log(`   auth.users.id = ${userId}`);

  // 2. Recovery link
  console.log('\n2. Generating password-recovery link...');
  const recoveryLink = await generateRecoveryLink(ADMIN_EMAIL);
  console.log(`   ✔ Recovery link ready`);

  // 3. admin_users row
  console.log('\n3. Ensuring admin_users row...');
  await ensureAdminRow(ADMIN_EMAIL, ADMIN_NAME);

  // 4. Output
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  ✅ Admin user ready');
  console.log('');
  console.log('  Recovery link (share with the admin only!):');
  console.log(`  ${recoveryLink}`);
  console.log('');
  console.log('  The admin must click this link to set their own');
  console.log('  password. After that, they can sign in at:');
  console.log(`  ${REDIRECT_URL}`);
  console.log('');
  console.log('  This link is one-time-use. If it expires,');
  console.log('  re-run this script to generate a fresh one.');
  console.log('═══════════════════════════════════════════════');
  console.log('');
}

main().catch((err) => {
  console.error('\n✗ SEED FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
