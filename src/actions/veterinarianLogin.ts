import { action } from '@uibakery/data';

function veterinarianLogin() {
  return action('veterinarianLogin', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT id, email, full_name, tc_accepted, verification_status
      FROM veterinarians
      WHERE LOWER(email) = LOWER({{params.email}})
      AND tc_accepted = true
      AND verification_status = 'approved'
      AND (
        password_hash = crypt({{params.password}}, password_hash)
        OR password_hash = {{params.password}}
      )
      LIMIT 1;
    `,
  });
}

export default veterinarianLogin;
