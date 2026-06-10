import { action } from '@uibakery/data';

function loadInvestigatorQualification() {
  return action('loadInvestigatorQualification', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT iq.*, v.full_name, v.email, v.hospital_affiliation
      FROM investigator_qualifications iq
      JOIN veterinarians v ON iq.veterinarian_id = v.id
      WHERE v.email = {{params.vetEmail}}
      ORDER BY iq.created_at DESC
      LIMIT 1;
    `,
  });
}

export default loadInvestigatorQualification;
