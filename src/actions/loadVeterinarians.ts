import { action } from '@uibakery/data';

function loadVeterinarians() {
  return action('loadVeterinarians', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        id,
        full_name,
        email,
        license_number,
        hospital_affiliation,
        tc_accepted,
        tc_accepted_at,
        signature_text,
        no_conflict_of_interest,
        verification_status,
        approved_at,
        approved_by,
        last_login,
        created_at,
        updated_at
      FROM veterinarians
      ORDER BY 
        CASE verification_status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
          ELSE 4
        END,
        created_at DESC;
    `,
  });
}

export default loadVeterinarians;
