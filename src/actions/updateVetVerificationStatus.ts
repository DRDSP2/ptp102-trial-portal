import { action } from '@uibakery/data';

function updateVetVerificationStatus() {
  return action('updateVetVerificationStatus', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET 
        verification_status = {{params.status}},
        approved_at = CASE WHEN {{params.status}} = 'approved' THEN NOW() ELSE NULL END,
        approved_by = {{params.approvedBy}}
      WHERE id = {{params.veterinarianId}}::bigint
      RETURNING *;
    `,
  });
}

export default updateVetVerificationStatus;
