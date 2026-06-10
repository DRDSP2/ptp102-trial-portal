import { action } from '@uibakery/data';

function loadInformedConsentByPatient() {
  return action('loadInformedConsentByPatient', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM informed_consents
      WHERE patient_id = {{params.patientId}}::int
      ORDER BY created_at DESC
      LIMIT 1;
    `,
  });
}

export default loadInformedConsentByPatient;
