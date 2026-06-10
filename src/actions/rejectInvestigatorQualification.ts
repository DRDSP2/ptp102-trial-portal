import { action } from '@uibakery/data';

function rejectInvestigatorQualification() {
  return action('rejectInvestigatorQualification', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE investigator_qualifications
      SET
        qualification_status = 'rejected',
        admin_reviewed_at = NOW(),
        admin_reviewed_by = {{params.adminEmail}},
        admin_rejection_reason = {{params.rejectionReason}},
        updated_at = NOW()
      WHERE id = {{params.qualificationId}}::int
      RETURNING *;
    `,
  });
}

export default rejectInvestigatorQualification;
