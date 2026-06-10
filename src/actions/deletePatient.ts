import { action } from '@uibakery/data';

function deletePatient() {
  return action('deletePatient', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      DELETE FROM patients
      WHERE id = {{params.patientId}}::bigint
      RETURNING *;
    `,
  });
}

export default deletePatient;
