import { action } from '@uibakery/data';

function loadRecentVetActivity() {
  return action('loadRecentVetActivity', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        id,
        full_name,
        email,
        hospital_affiliation,
        verification_status,
        last_login,
        created_at
      FROM veterinarians
      ORDER BY COALESCE(last_login, created_at) DESC
      LIMIT 10;
    `,
  });
}

export default loadRecentVetActivity;
