import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

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

  const authHeader = req.headers.get('authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify the caller is an admin before doing any work.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const role = ((userData.user.app_metadata ?? {}) as Record<string, unknown>).role;
  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { certificate_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const certificateId = body.certificate_id;
  if (!certificateId) {
    return new Response(JSON.stringify({ error: 'Missing certificate_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: cert, error: certErr } = await adminClient
    .from('certificates')
    .select('id, certificate_number, region, issued_at, expires_at, holder_user_id, licence_id')
    .eq('id', certificateId)
    .maybeSingle();
  if (certErr || !cert) {
    return new Response(JSON.stringify({ error: 'Certificate not found', detail: certErr?.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: lic } = await adminClient
    .from('licences')
    .select('id, region, term_sheet_id')
    .eq('id', cert.licence_id)
    .maybeSingle();
  const { data: ts } = lic
    ? await adminClient.from('term_sheets').select('prospect_company, royalty_rate, exclusivity_months').eq('id', lic.term_sheet_id).maybeSingle()
    : { data: null };
  const { data: profile } = await adminClient
    .from('deal_profiles')
    .select('company')
    .eq('user_id', cert.holder_user_id)
    .maybeSingle();

  const company = (profile?.company as string | undefined) ?? (ts?.prospect_company as string | undefined) ?? 'Licensee';
  const region = (cert.region ?? lic?.region ?? 'global').toUpperCase();
  const royalty = ts?.royalty_rate != null ? `${Math.round(Number(ts.royalty_rate) * 100)}%` : '—';
  const exclusivity = ts?.exclusivity_months != null ? `${ts.exclusivity_months} months` : '—';

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();

  const text = (value: string, x: number, y: number, size = 12, useBold = false) =>
    page.drawText(value, { x, y, size, font: useBold ? bold : regular, color: rgb(0.1, 0.1, 0.2) });

  text('BYROCK THERAPEUTICS', 56, height - 96, 22, true);
  text('CERTIFICATE OF LICENCE', 56, height - 134, 16, true);
  text(`Certificate Number: ${cert.certificate_number}`, 56, height - 184, 12);
  text(`Licensee: ${company}`, 56, height - 210, 12);
  text(`Region: ${region}`, 56, height - 236, 12);
  text(`Royalty Rate: ${royalty}`, 56, height - 262, 12);
  text(`Exclusivity: ${exclusivity}`, 56, height - 288, 12);
  text(`Issued: ${new Date(cert.issued_at).toLocaleDateString()}`, 56, height - 314, 12);
  text(`Expires: ${cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : 'N/A'}`, 56, height - 340, 12);
  text('This certifies the above party holds a licence for the PTP-102', 56, height - 384, 11);
  text('laminitis programme in the stated region, subject to the executed', 56, height - 402, 11);
  text('term sheet and applicable law.', 56, height - 420, 11);
  text('Authorised by Byrock Therapeutics — Regulatory & Licensing Office', 56, 96, 10);

  const pdfBytes = await pdfDoc.save();
  const path = `${certificateId}.pdf`;

  const { error: upErr } = await adminClient.storage
    .from('licence-certificates')
    .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (upErr) {
    return new Response(JSON.stringify({ error: 'Upload failed', detail: upErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: updErr } = await adminClient
    .from('certificates')
    .update({ document_path: path })
    .eq('id', certificateId);
  if (updErr) {
    return new Response(JSON.stringify({ error: 'Failed to record document', detail: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, document_path: path }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
