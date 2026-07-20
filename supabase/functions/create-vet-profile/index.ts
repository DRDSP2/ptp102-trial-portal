import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { sendDiscordAlert } from '../_shared/discord.ts';

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

  const userId = body.userId as string | undefined;
  const email = body.email as string | undefined;
  const fullName = body.fullName as string | undefined;
  const phone = (body.phone as string) ?? '';
  const licenseNumber = body.licenseNumber as string | undefined;
  const hospitalAffiliation = body.hospitalAffiliation as string | undefined;
  const signatureText = body.signatureText as string | undefined;
  const consentPrintedAt = (body.consentPrintedAt as string) ?? new Date().toISOString();

  const missing: string[] = [];
  if (!userId) missing.push('userId');
  if (!email) missing.push('email');
  if (!fullName) missing.push('fullName');
  if (!licenseNumber) missing.push('licenseNumber');
  if (!hospitalAffiliation) missing.push('hospitalAffiliation');
  if (!signatureText) missing.push('signatureText');

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set — emails will not be sent');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Step 1: set the vet role in app_metadata.
  const { error: metadataError } = await supabase.auth.admin.updateUserById(userId!, {
    app_metadata: { role: 'vet' },
  });

  if (metadataError) {
    return new Response(
      JSON.stringify({
        error: 'Failed to set user role',
        detail: metadataError.message,
        step: 'update_app_metadata',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Step 2: insert the veterinarian profile.
  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from('veterinarians')
    .insert({
      full_name: fullName,
      email: email!.toLowerCase().trim(),
      phone: phone || null,
      password_hash: 'supabase-managed',
      license_number: licenseNumber,
      hospital_affiliation: hospitalAffiliation,
      tc_accepted: true,
      tc_accepted_at: consentPrintedAt,
      signature_text: signatureText,
      consent_printed_at: consentPrintedAt || null,
      verification_status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    await supabase.auth.admin.deleteUser(userId!).catch(() => {});

    return new Response(
      JSON.stringify({
        error: `Failed to create profile: ${insertError?.message ?? 'no row returned'}`,
        detail: insertError?.message ?? 'unknown',
        step: 'insert_veterinarians',
        code: insertError?.code,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Step 3: generate signed participation agreement PDF.
  const signedDate = new Date(consentPrintedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let pdfBytes: Uint8Array | null = null;
  try {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    let y = height - 50;

    const drawText = (text: string, size: number, x: number, yPos: number, opts?: { font?: typeof font; color?: number[] }) => {
      page.drawText(text, { x, y: yPos, size, font: opts?.font ?? font, color: rgb(opts?.color?.[0] ?? 0, opts?.color?.[1] ?? 0, opts?.color?.[2] ?? 0) });
      return yPos - size * 1.5;
    };

    const drawWrapped = (text: string, size: number, x: number, maxWidth: number, startY: number) => {
      const words = text.split(' ');
      let line = '';
      let cy = startY;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth) {
          page.drawText(line, { x, y: cy, size, font, color: rgb(0.15, 0.15, 0.15) });
          cy -= size * 1.4;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x, y: cy, size, font, color: rgb(0.15, 0.15, 0.15) });
        cy -= size * 1.4;
      }
      return cy;
    };

    // Header bar
    page.drawRectangle({ x: 0, y: height - 40, width, height: 40, color: rgb(107 / 255, 127 / 255, 58 / 255) });
    y = drawText('Byrock Technologies Ltd.', 18, 50, height - 28, { font: bold, color: [1, 1, 1] });

    // Title
    y = drawText('PTP-102 Laminitis Trial', 16, 50, y - 10, { font: bold, color: [107 / 255, 127 / 255, 58 / 255] });
    y = drawText('PARTICIPATION AGREEMENT', 14, 50, y - 6, { font: bold, color: [107 / 255, 127 / 255, 58 / 255] });

    // Document info
    y = drawText(`Date: ${signedDate}`, 9, 50, y - 10, { color: [0.4, 0.4, 0.4] });
    y = drawText(`Veterinarian ID: VET-${String(inserted.id).padStart(4, '0')}`, 9, 50, y - 4, { color: [0.4, 0.4, 0.4] });
    y = drawText('Document: PTP102-AGREEMENT', 9, 50, y - 4, { color: [0.4, 0.4, 0.4] });

    // Party details
    y -= 14;
    y = drawText('1. PARTY IDENTIFICATION', 12, 50, y, { font: bold, color: [107 / 255, 127 / 255, 58 / 255] });
    y -= 8;
    const details = [
      ['Full Name:', fullName!],
      ['Email Address:', email!],
      ['Veterinary License:', licenseNumber!],
      ['Hospital / Clinic:', hospitalAffiliation!],
      ['Phone:', phone || 'Not provided'],
      ['Registration Date:', now ? new Date(now).toLocaleString() : 'N/A'],
    ];
    for (const [label, value] of details) {
      page.drawText(label, { x: 50, y, size: 10, font: bold, color: rgb(0.15, 0.15, 0.15) });
      page.drawText(String(value), { x: 130, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 14;
    }

    // Declarations
    y -= 10;
    y = drawText('2. DECLARATIONS & ACKNOWLEDGMENTS', 12, 50, y, { font: bold, color: [107 / 255, 127 / 255, 58 / 255] });
    y -= 8;

    const declarations = [
      'I acknowledge that PTP-102 is an investigational drug not approved by regulatory authorities.',
      'I accept all treatment risks associated with administering this investigational compound.',
      'I acknowledge that professional liability is mine and I maintain appropriate insurance coverage.',
      'I confirm that I have no conflicts of interest in relation to PTP-102, Byrock Technologies Ltd., or this clinical trial.',
    ];
    for (let i = 0; i < declarations.length; i++) {
      const text = `${i + 1}. ${declarations[i]}`;
      page.drawText('☑  ', { x: 50, y, size: 10, font, color: rgb(107 / 255, 127 / 255, 58 / 255) });
      y = drawWrapped(text, 10, 70, width - 120, y);
      page.drawLine({ start: { x: 50, y: y + 2 }, end: { x: width - 70, y: y + 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
      y -= 8;
    }

    // Signature section
    y -= 10;
    y = drawText('3. DIGITAL SIGNATURE', 12, 50, y, { font: bold, color: [107 / 255, 127 / 255, 58 / 255] });
    y -= 14;
    page.drawText(`Digitally signed by: "${signatureText}"`, { x: 50, y, size: 11, font: bold, color: rgb(0.15, 0.15, 0.15) });
    y -= 18;
    page.drawText(`Date of signing: ${signedDate}`, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
    page.drawText('This agreement was electronically signed and constitutes a legally binding record.', { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    // Footer
    page.drawLine({ start: { x: 50, y: 60 }, end: { x: width - 50, y: 60 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    page.drawText('Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only', { x: 50, y: 48, size: 7, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.', { x: 50, y: 40, size: 7, font, color: rgb(0.5, 0.5, 0.5) });

    pdfBytes = await doc.save();
  } catch (err) {
    console.error('PDF generation failed (non-critical — continuing without PDF):', err);
  }

  // Step 4: upload PDF to signed-contracts storage bucket.
  let pdfUrl: string | null = null;
  if (pdfBytes) {
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    const filePath = `${userId}/participation-agreement.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('signed-contracts')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload to storage failed (non-critical):', uploadError);
    } else {
      const { data: urlData } = supabase.storage
        .from('signed-contracts')
        .getPublicUrl(filePath);
      pdfUrl = urlData?.publicUrl ?? null;
    }
  }

  // Step 5: send emails via Resend.
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@byrock.eth.limo';
  const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Byrock';

  const sendEmail = async (to: string, subject: string, html: string, attachments?: { filename: string; content: string; content_type: string }[]) => {
    if (!resendApiKey) return; // silently skip if Resend not configured
    try {
      const payload: Record<string, unknown> = {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      };
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  };

  // Email to vet: confirmation with signed PDF attached.
  if (pdfBytes) {
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    await sendEmail(
      email!,
      'Your PTP-102 Participation Agreement — Application Received',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6b7f3a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Byrock Technologies Ltd.</h1>
          <p style="margin: 5px 0 0; font-size: 14px;">PTP-102 Laminitis Trial — Participation Agreement</p>
        </div>
        <div style="padding: 30px 20px; background: #f9f9f9;">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Thank you for submitting your participation agreement for the PTP-102 Laminitis Trial.</p>
          <p>Your signed Participation Agreement is attached to this email. Please keep it for your records.</p>
          <p>Your application is now being reviewed by Byrock and its team. You will hear back from us shortly once the review is complete.</p>
          <p>If you have any questions in the meantime, please contact us at <a href="mailto:drdsp@pm.me">drdsp@pm.me</a>.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>The Byrock Team</strong></p>
        </div>
        <div style="background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Byrock Technologies Ltd. — PTP-102 Laminitis Trial</p>
          <p>This email contains your signed Participation Agreement as a PDF attachment.</p>
        </div>
      </div>`,
      [{ filename: 'PTP102_Participation_Agreement.pdf', content: pdfBase64, content_type: 'application/pdf' }],
    );
  }

  // Email to admin: new vet registration notification.
  await sendEmail(
    'drdsp@pm.me',
    '🆕 New Veterinarian Registration — Pending Approval',
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6b7f3a; color: white; padding: 20px;">
        <h2 style="margin: 0;">New Vet Registration</h2>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px; font-weight: bold;">Name:</td><td style="padding: 6px;">${fullName}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Email:</td><td style="padding: 6px;">${email}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Hospital:</td><td style="padding: 6px;">${hospitalAffiliation}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">License:</td><td style="padding: 6px;">${licenseNumber}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Signed Agreement:</td><td style="padding: 6px;">${pdfUrl ? `<a href="${pdfUrl}">Download PDF</a>` : 'Not available'}</td></tr>
        </table>
        <p style="margin-top: 20px;"><a href="${supabaseUrl}/project/default" style="background: #6b7f3a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review in Admin Panel</a></p>
      </div>
    </div>`,
  );

  const discordResult = await sendDiscordAlert(Deno.env.get('DISCORD_WEBHOOK_URL'), {
    activityType: 'Veterinarian Signup — Pending Approval',
    actorEmail: email,
    details: {
      Name: fullName,
      Email: email,
      Hospital: hospitalAffiliation,
      License: licenseNumber,
      'Veterinarian ID': inserted.id,
    },
  });
  if (discordResult.status === 'failed') {
    console.error('Discord signup alert failed (non-critical)', {
      upstreamStatus: discordResult.httpStatus,
    });
  }

  return new Response(JSON.stringify({ success: true, id: inserted.id, email: email!.toLowerCase().trim() }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
