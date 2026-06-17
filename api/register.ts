// @deprecated — Supabase Auth + Edge Function replaces this on IPFS deployments.
// The app now signs up via supabase.auth.signUp() client-side and creates the
// vet profile through the create-vet-profile Edge Function. This file is kept
// for Vercel deployments that may still use it during the migration period.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServiceClient } from '../src/lib/supabase/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    fullName,
    email,
    phone,
    password,
    licenseNumber,
    hospitalAffiliation,
    signatureText,
    consentPrintedAt,
  } = req.body ?? {};

  const normalizedEmail = String(email ?? '').toLowerCase().trim();

  if (!normalizedEmail || !password || !fullName || !licenseNumber || !hospitalAffiliation || !signatureText) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  try {
    const supabase = createServiceClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: { role: 'vet' },
    });

    if (authError || !authData.user) {
      const message = authError?.message ?? 'Failed to create user';
      return res.status(409).json({ error: message });
    }

    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from('veterinarians').insert({
      full_name: fullName,
      email: normalizedEmail,
      phone: phone || null,
      password_hash: 'supabase-managed',
      license_number: licenseNumber,
      hospital_affiliation: hospitalAffiliation,
      tc_accepted: true,
      tc_accepted_at: consentPrintedAt ?? now,
      signature_text: signatureText,
      consent_printed_at: consentPrintedAt ?? null,
      verification_status: 'pending',
      created_at: now,
      updated_at: now,
    });

    if (profileError) {
      // Best-effort cleanup: delete the auth user so the email can be retried.
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: `Failed to create veterinarian profile: ${profileError.message}` });
    }

    return res.status(201).json({
      id: authData.user.id,
      email: normalizedEmail,
      verification_status: 'pending',
    });
  } catch (err) {
    console.error('Registration handler error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}
