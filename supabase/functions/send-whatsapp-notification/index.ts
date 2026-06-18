import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

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

  const to = (body.to as string) || '+353833614859';
  const message = body.message as string | undefined;
  const activityType = (body.activityType as string) || 'notification';
  const vetName = (body.vetName as string) || 'A veterinarian';
  const patientId = body.patientId as number | undefined;

  if (!message) {
    return new Response(JSON.stringify({ error: 'Missing required field: message' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!accountSid || !authToken) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await supabase.from('audit_logs').insert({
        action: 'whatsapp_notification_skipped',
        entity_type: 'system',
        new_value: JSON.stringify({ to, message, activityType, vetName, patientId, reason: 'Twilio not configured' }),
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      warning: 'Twilio not configured',
      detail: 'WhatsApp notification was not sent — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN',
      status: 'skipped',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM') || '+14155238886';
  const twilioTo = `whatsapp:${to}`;
  const twilioFromFormatted = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
  const bodyParams = new URLSearchParams({
    From: twilioFromFormatted,
    To: twilioTo,
    Body: message,
  });

  try {
    const twilioResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams,
      },
    );

    const twilioResult = await twilioResp.json();

    if (!twilioResp.ok) {
      return new Response(JSON.stringify({
        error: 'Twilio API error',
        detail: twilioResult.message || twilioResult,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      status: 'sent',
      twilioSid: twilioResult.sid,
      to,
      activityType,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to send WhatsApp notification',
      detail: err instanceof Error ? err.message : String(err),
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
