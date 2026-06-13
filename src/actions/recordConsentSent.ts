import { action } from '@uibakery/data';

function recordConsentSent() {
  return action('recordConsentSent', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE informed_consents
      SET
        sent_at = COALESCE(sent_at, NOW()),
        sent_to = {{params.sentTo}},
        updated_at = NOW()
      WHERE id = {{params.consentId}}::int
      RETURNING *;
    `,
  });
}

export default recordConsentSent;
