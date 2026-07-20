import { sendDiscordAlert } from '../_shared/discord.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const details = body.details;
  const result = await sendDiscordAlert(Deno.env.get('DISCORD_WEBHOOK_URL'), {
    activityType: typeof body.activityType === 'string' ? body.activityType : 'Trial notification',
    actorEmail: typeof body.actorEmail === 'string' ? body.actorEmail : 'unknown',
    details:
      details && typeof details === 'object' && !Array.isArray(details)
        ? (details as Record<string, unknown>)
        : {},
  });

  if (result.status === 'skipped') {
    return new Response(
      JSON.stringify({
        status: 'skipped',
        warning: 'Discord notification is not configured',
      }),
      { status: 200, headers: jsonHeaders },
    );
  }

  if (result.status === 'failed') {
    return new Response(
      JSON.stringify({
        status: 'failed',
        error: 'Discord notification delivery failed',
        upstreamStatus: result.httpStatus,
      }),
      { status: 502, headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ status: 'sent' }), {
    status: 200,
    headers: jsonHeaders,
  });
});
