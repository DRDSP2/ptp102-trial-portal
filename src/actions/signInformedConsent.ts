import { action } from '@uibakery/data';

function signInformedConsent() {
  return action('signInformedConsent', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE informed_consents
      SET
        icf_status = 'signed',
        icf_signed_at = NOW(),
        owner_signature = {{params.ownerSignature}},
        witness_name = {{params.witnessName}},
        witness_signature = {{params.witnessSignature}},
        investigator_signature = {{params.investigatorSignature}},
        investigator_signed_at = NOW(),
        icf_pdf_url = {{params.icfPdfUrl}},
        updated_at = NOW()
      WHERE id = {{params.consentId}}::int
      RETURNING *;
    `,
  });
}

export default signInformedConsent;
