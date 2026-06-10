import { action } from '@uibakery/data';

function updatePatientFlag() {
  return action('updatePatientFlag', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET 
        is_flagged = {{params.isFlagged}}::boolean,
        flag_reason = {{params.flagReason}},
        flagged_at = CASE WHEN {{params.isFlagged}}::boolean THEN NOW() ELSE NULL END,
        flagged_by = {{params.flaggedBy}}
      WHERE id = {{params.patientId}}::bigint
      RETURNING *;
    `,
  });
}

export default updatePatientFlag;
