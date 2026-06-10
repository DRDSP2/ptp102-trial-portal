import { action } from '@uibakery/data';

function approveInvestigatorQualification() {
  return action('approveInvestigatorQualification', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE investigator_qualifications
      SET
        qualification_status = {{params.status}},
        admin_reviewed_at = NOW(),
        admin_reviewed_by = {{params.adminEmail}},
        admin_rejection_reason = {{params.rejectionReason}},
        updated_at = NOW()
      WHERE id = {{params.qualificationId}}::int
      RETURNING *;
    `,
  });
}

export default approveInvestigatorQualification;
