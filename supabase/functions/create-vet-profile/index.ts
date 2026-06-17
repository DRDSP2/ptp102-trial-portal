import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CreateVetProfileBody {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  hospitalAffiliation: string;
  signatureText: string;
  consentPrintedAt: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: CreateVetProfileBody = await req.json();
    const { userId, email, fullName, phone, licenseNumber, hospitalAffiliation, signatureText, consentPrintedAt } = body;

    if (!userId || !email || !fullName || !licenseNumber || !hospitalAffiliation || !signatureText) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Set the vet role in app_metadata so AuthContext recognises this user.
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'vet' },
    });

    if (metadataError) {
      console.error('Failed to update app_metadata:', metadataError);
      return new Response(JSON.stringify({ error: 'Failed to set user role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('veterinarians').insert({
      id: userId,
      full_name: fullName,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      password_hash: 'supabase-managed',
      license_number: licenseNumber,
      hospital_affiliation: hospitalAffiliation,
      tc_accepted: true,
      tc_accepted_at: consentPrintedAt || now,
      signature_text: signatureText,
      consent_printed_at: consentPrintedAt || null,
      verification_status: 'pending',
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      // Roll back the auth user on failure so the email can be retried.
      await supabase.auth.admin.deleteUser(userId);

      console.error('Failed to insert veterinarian profile:', insertError);
      return new Response(JSON.stringify({ error: `Failed to create profile: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: userId, email: email.toLowerCase().trim() }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-vet-profile error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
