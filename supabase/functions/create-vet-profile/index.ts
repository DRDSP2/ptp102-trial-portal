import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// The supabase-js FunctionsClient sends apikey and x-client-info alongside
// Authorization and Content-Type. All must be listed in the preflight response
// or the browser will reject the cross-origin POST with a CORS error.
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
  } catch (parseErr) {
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

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
  const { error: insertError } = await supabase.from('veterinarians').insert({
    id: userId,
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
  });

  if (insertError) {
    // Roll back the auth user so the email can be retried.
    await supabase.auth.admin.deleteUser(userId!).catch(() => {});

    return new Response(
      JSON.stringify({
        error: `Failed to create profile: ${insertError.message}`,
        detail: insertError.message,
        step: 'insert_veterinarians',
        code: insertError.code,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ success: true, id: userId, email: email!.toLowerCase().trim() }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
