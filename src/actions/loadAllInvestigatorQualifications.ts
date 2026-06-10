import { action } from '@uibakery/data';

function loadAllInvestigatorQualifications() {
  return action('loadAllInvestigatorQualifications', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT iq.*, v.full_name, v.email, v.hospital_affiliation, v.verification_status
      FROM investigator_qualifications iq
      JOIN veterinarians v ON iq.veterinarian_id = v.id
      ORDER BY
        CASE iq.qualification_status
          WHEN 'pending_review' THEN 0
          WHEN 'pending_submission' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
          WHEN 'expired' THEN 4
        END,
        iq.created_at DESC;
    `,
  });
}

export default loadAllInvestigatorQualifications;
