import type { SupabaseClient } from '@supabase/supabase-js';
import { generateNdaPdf } from './ndaPdf';
import {
  sendNdaApprovedInvestorEmail,
  sendNdaDeniedInvestorEmail,
} from './ndaEmail';

const BYROCK_SIGNATORY = {
  name: 'Anthony Joyce',
  title: 'Director, Byrock Technologies Ltd',
};

export async function approveNda({
  client,
  userId,
  investorEmail,
  baseUrl,
}: {
  client: SupabaseClient;
  userId: string;
  investorEmail: string;
  baseUrl: string;
}) {
  // Fetch the pending NDA record
  const { data: nda, error: fetchError } = await client
    .from('ndas')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'signed')
    .eq('approval_status', 'pending')
    .order('signed_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !nda) {
    throw new Error(fetchError?.message || 'No pending NDA found');
  }

  const adminSignedAt = new Date().toISOString();

  // Generate countersigned PDF
  const pdfBlob = await generateNdaPdf({
    companyName: nda.company_name || '',
    counterpartyEntityType: nda.counterparty_entity_type || '',
    counterpartyJurisdiction: nda.counterparty_jurisdiction || '',
    counterpartyAddress: nda.counterparty_address || '',
    counterpartyContactEmail: nda.counterparty_contact_email || '',
    counterpartyContactName: nda.counterparty_contact_name || '',
    counterpartyContactTitle: nda.counterparty_contact_title || '',
    projectPurpose: nda.project_purpose || '',
    projectRegions: nda.project_regions || [],
    signerName: nda.signer_name || '',
    signerTitle: nda.signer_title || '',
    signatureDate: nda.signature_date || '',
    electronicSignature: nda.electronic_signature || '',
    adminSignature: {
      name: BYROCK_SIGNATORY.name,
      title: BYROCK_SIGNATORY.title,
      date: adminSignedAt.split('T')[0],
    },
  });

  const pdfPath = `ndas/${userId}/${Date.now()}_nda_countersigned.pdf`;
  const { error: uploadError } = await client.storage
    .from('deal-room-documents')
    .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });

  if (uploadError) {
    throw new Error('Failed to upload countersigned PDF: ' + uploadError.message);
  }

  const { data: publicUrlData } = client.storage.from('deal-room-documents').getPublicUrl(pdfPath);
  const pdfUrl = publicUrlData.publicUrl;

  // Update NDA record
  const { error: ndaError } = await client
    .from('ndas')
    .update({
      approval_status: 'approved',
      admin_signed_at: adminSignedAt,
      admin_signature: `${BYROCK_SIGNATORY.name}, ${BYROCK_SIGNATORY.title}`,
      signed_pdf_path: pdfPath,
    })
    .eq('id', nda.id);

  if (ndaError) {
    throw new Error(ndaError.message);
  }

  // Upgrade tier to evaluation
  const { error: profileError } = await client
    .from('deal_profiles')
    .update({
      tier: 'evaluation',
      nda_signed_at: nda.signed_at,
    })
    .eq('user_id', userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Audit log
  await client.from('deal_access_logs').insert({
    user_id: userId,
    action: 'edit',
    document_type: 'nda',
    action_detail: 'NDA approved and countersigned by Byrock',
  });

  // Email investor
  await sendNdaApprovedInvestorEmail({
    toEmail: investorEmail,
    companyName: nda.company_name || investorEmail,
    pdfUrl,
    dashboardUrl: `${baseUrl}/#/deal/overview`,
  });

  return { pdfUrl };
}

export async function denyNda({
  client,
  userId,
  investorEmail,
  companyName,
}: {
  client: SupabaseClient;
  userId: string;
  investorEmail: string;
  companyName: string;
}) {
  const { data: nda, error: fetchError } = await client
    .from('ndas')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'signed')
    .eq('approval_status', 'pending')
    .order('signed_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !nda) {
    throw new Error(fetchError?.message || 'No pending NDA found');
  }

  const { error: ndaError } = await client
    .from('ndas')
    .update({ approval_status: 'denied' })
    .eq('id', nda.id);

  if (ndaError) {
    throw new Error(ndaError.message);
  }

  await client.from('deal_access_logs').insert({
    user_id: userId,
    action: 'edit',
    document_type: 'nda',
    action_detail: 'NDA declined by Byrock',
  });

  await sendNdaDeniedInvestorEmail({
    toEmail: investorEmail,
    companyName,
  });
}
