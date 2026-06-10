import { action } from '@uibakery/data';

function checkVeterinarianAcceptance() {
  return action('checkVeterinarianAcceptance', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT id, email, full_name, tc_accepted, verification_status, created_at
      FROM veterinarians
      WHERE LOWER(email) = LOWER({{params.email}})
      AND tc_accepted = true;
    `,
  });
}

export default checkVeterinarianAcceptance;
