const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

interface Attachment {
  filename: string;
  content: string;
  content_type: string;
}

interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
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

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: SendEmailPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.to || !body.subject || !body.html) {
    return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@byrock.eth.limo';
  const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Byrock';

  const resendPayload: Record<string, unknown> = {
    from: `${fromName} <${fromEmail}>`,
    to: Array.isArray(body.to) ? body.to : [body.to],
    subject: body.subject,
    html: body.html,
  };

  if (body.attachments && body.attachments.length > 0) {
    resendPayload.attachments = body.attachments;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: result }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed to call Resend:', err);
    return new Response(JSON.stringify({ error: 'Failed to send email', detail: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
