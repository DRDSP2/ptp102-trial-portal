import { action } from '@uibakery/data';

function requestPatientDetails() {
  return action('requestPatientDetails', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET
        screening_status = 'awaiting_details',
        trial_status = 'screening',
        screening_notes = {{params.notes}},
        screened_by = {{params.adminEmail}},
        screened_at = NOW(),
        updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default requestPatientDetails;
