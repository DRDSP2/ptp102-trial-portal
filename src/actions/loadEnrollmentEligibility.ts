import { action } from '@uibakery/data';

function loadEnrollmentEligibility() {
  return action('loadEnrollmentEligibility', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM enrollment_eligibility
      WHERE patient_id = {{params.patientId}}::int
      LIMIT 1;
    `,
  });
}

export default loadEnrollmentEligibility;
