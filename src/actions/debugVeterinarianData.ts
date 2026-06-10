import { action } from '@uibakery/data';

function debugVeterinarianData() {
  return action('debugVeterinarianData', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        id,
        full_name,
        email,
        license_number,
        pg_typeof(license_number) as license_number_type,
        hospital_affiliation,
        tc_accepted
      FROM veterinarians
      ORDER BY id;
    `,
  });
}

export default debugVeterinarianData;
