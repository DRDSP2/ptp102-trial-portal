import { action } from '@uibakery/data';

function rejectPatientScreening() {
  return action('rejectPatientScreening', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients 
      SET 
        screening_status = 'rejected',
        trial_status = 'withdrawn',
        screening_notes = {{params.notes}},
        screened_by = {{params.adminEmail}},
        screened_at = NOW(),
        updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default rejectPatientScreening;
