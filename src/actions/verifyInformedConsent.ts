import { action } from '@uibakery/data';

function verifyInformedConsent() {
  return action('verifyInformedConsent', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE informed_consents
      SET
        icf_status = 'approved',
        admin_reviewed_by = {{params.verifiedBy}},
        admin_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = {{params.consentId}}::int
      RETURNING *;
    `,
  });
}

export default verifyInformedConsent;
