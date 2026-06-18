import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateLimit = new Map<string, RateLimitEntry>();
const IP_LIMIT = 3;
const IP_WINDOW_MS = 15 * 60 * 1000;

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

  // ── IP rate limiting ────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const ipEntry = ipRateLimit.get(ip);

  if (ipEntry && now < ipEntry.resetAt) {
    if (ipEntry.count >= IP_LIMIT) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    ipEntry.count++;
  } else {
    ipRateLimit.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
  }

  let body: { email?: string; actor_email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const email = (body.email ?? '').toLowerCase().trim();
  if (!email) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
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

  // ── Look up account ─────────────────────────────────────────────────
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  const { data: vetUser } = await supabase
    .from('veterinarians')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  const foundUser = adminUser ?? vetUser;
  if (!foundUser) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const role = adminUser ? 'admin' : 'vet';

  // ── Account rate limit: max 3 requests per 60 minutes ───────────────
  const sixtyMinAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('recovery_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', sixtyMinAgo);

  if ((recentCount ?? 0) >= 3) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Generate token ──────────────────────────────────────────────────
  const token = crypto.randomUUID();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from('recovery_tokens')
    .insert({ email, token_hash: tokenHash, role, expires_at: expiresAt });

  if (insertError) {
    console.error('Failed to insert recovery token:', insertError.message);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Audit log ───────────────────────────────────────────────────────
  const actorEmail = body.actor_email ? body.actor_email.toLowerCase().trim() : email;
  const action = actorEmail === email ? 'recovery_requested' : 'admin_initiated_recovery';

  await supabase.from('audit_logs').insert({
    action,
    user_email: email,
    user_role: role,
    entity_type: 'recovery_tokens',
    new_value: `token_hash=${tokenHash.slice(0, 8)}...`,
    timestamp: new Date().toISOString(),
    ...(actorEmail !== email ? { reason_for_change: `Initiated by admin ${actorEmail}` } : {}),
  }).catch(() => {});

  // ── Recovery link (logged to console until email sending is wired) ──
  const recoveryLink = `https://byrock.eth.limo/#token=${token}&type=recovery`;
  console.log(`[recovery-request] Link for ${email} (${role}): ${recoveryLink}`);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
