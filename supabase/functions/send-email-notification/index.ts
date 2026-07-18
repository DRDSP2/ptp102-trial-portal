// Sends an email notification to the trial owner (default drdsp@pm.me)
// whenever a login or main trial event occurs. Uses the Resend API
// (https://resend.com). If RESEND_API_KEY is not configured the function
// returns { status: 'skipped' } so callers can treat email as best-effort,
// mirroring the behaviour of send-whatsapp-notification.
//
// Required secret (Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — API key from https://resend.com
// Optional secrets:
//   RESEND_FROM      — verified sender, e.g. 'PTP-102 Trial <trial@yourdomain.com>'
//                      (defaults to Resend's onboarding address for testing)
//   NOTIFY_EMAIL_TO  — recipient override (defaults to drdsp@pm.me)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

const MAX_FIELD_LEN = 500;
const MAX_FIELDS = 40;

function sanitize(value: unknown): string {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .slice(0, MAX_FIELD_LEN);
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const activityType = sanitize(body.activityType || 'Notification');
  const actorEmail = sanitize(body.actorEmail || 'unknown');
  const subject = sanitize(body.subject || `PTP-102: ${activityType}`);
  const details = (body.details ?? {}) as Record<string, unknown>;

  const lines: string[] = [
    `Activity: ${activityType}`,
    `Actor: ${actorEmail}`,
    `Time (UTC): ${new Date().toISOString()}`,
    '',
    'Details:',
  ];
  let count = 0;
  for (const [key, val] of Object.entries(details)) {
    if (count >= MAX_FIELDS) break;
    if (val === null || val === undefined || val === '') continue;
    lines.push(`  ${sanitize(key)}: ${sanitize(val)}`);
    count++;
  }
  const text = lines.join('\n');

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return new Response(JSON.stringify({
      warning: 'Resend not configured',
      detail: 'Email was not sent — set the RESEND_API_KEY secret for this function',
      status: 'skipped',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const from = Deno.env.get('RESEND_FROM') || 'PTP-102 Trial Portal <onboarding@resend.dev>';
  const to = Deno.env.get('NOTIFY_EMAIL_TO') || 'drdsp@pm.me';

  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `🐴 ${subject}`,
        text,
      }),
    });

    const resendResult = await resendResp.json();

    if (!resendResp.ok) {
      return new Response(JSON.stringify({
        error: 'Resend API error',
        detail: resendResult.message || resendResult,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      status: 'sent',
      id: resendResult.id,
      to,
      activityType,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to send email notification',
      detail: err instanceof Error ? err.message : String(err),
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
