import { action } from '@uibakery/data';

function loadTreatmentOutcomes() {
  return action('loadTreatmentOutcomes', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM treatment_outcomes
      WHERE patient_id = {{params.patientId}}::int
      ORDER BY assessment_day ASC;
    `,
  });
}

export default loadTreatmentOutcomes;
