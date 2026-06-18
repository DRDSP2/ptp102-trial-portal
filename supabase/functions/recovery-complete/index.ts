import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.token) {
    return new Response(JSON.stringify({ error: 'validation_error', details: ['token is required'] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.password || body.password.length < 6) {
    return new Response(JSON.stringify({ error: 'validation_error', details: ['password must be at least 6 characters'] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Verify token ────────────────────────────────────────────────────
  const tokenHash = await sha256(body.token);
  const now = new Date().toISOString();

  const { data: tokenRow, error: lookupError } = await supabase
    .from('recovery_tokens')
    .select('id, email, role')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', now)
    .maybeSingle();

  if (lookupError || !tokenRow) {
    return new Response(JSON.stringify({ error: 'invalid_or_expired_token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Mark token used ─────────────────────────────────────────────────
  const { error: markError } = await supabase
    .from('recovery_tokens')
    .update({ used_at: now })
    .eq('id', tokenRow.id);

  if (markError) {
    console.error('Failed to mark token used:', markError.message);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Find auth user by email ─────────────────────────────────────────
  let authUserId: string | null = null;
  for (let page = 1; page <= 5; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const match = data?.users.find((u) => (u.email ?? '').toLowerCase() === tokenRow.email);
    if (match) { authUserId = match.id; break; }
    if ((data?.users.length ?? 0) < 200) break;
  }

  if (!authUserId) {
    return new Response(JSON.stringify({ error: 'User not found in auth system' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Update password + invalidate sessions ───────────────────────────
  const { error: passwordError } = await supabase.auth.admin.updateUserById(authUserId, {
    password: body.password,
  });

  if (passwordError) {
    return new Response(JSON.stringify({ error: 'Failed to update password', detail: passwordError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await supabase.auth.admin.signOut(authUserId).catch(() => {});

  // ── Audit log ───────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    action: 'recovery_completed',
    user_email: tokenRow.email,
    user_role: tokenRow.role,
    entity_type: 'recovery_tokens',
    entity_id: tokenRow.id,
    timestamp: now,
  }).catch(() => {});

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
