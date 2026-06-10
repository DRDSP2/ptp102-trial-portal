import { action } from '@uibakery/data';

function approvePatientScreening() {
  return action('approvePatientScreening', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients 
      SET 
        screening_status = 'approved',
        trial_status = 'enrolled',
        screening_notes = {{params.notes}},
        screened_by = {{params.adminEmail}},
        screened_at = NOW(),
        updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default approvePatientScreening;
