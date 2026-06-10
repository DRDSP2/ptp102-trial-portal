import { action } from '@uibakery/data';

function loadPatientById() {
  return action('loadPatientById', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM patients
      WHERE id = {{params.patientId}}::int;
    `,
  });
}

export default loadPatientById;
