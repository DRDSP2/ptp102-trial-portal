import { action } from '@uibakery/data';

function updateVetLastLogin() {
  return action('updateVetLastLogin', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET last_login = NOW()
      WHERE email = {{params.email}}
      RETURNING *;
    `,
  });
}

export default updateVetLastLogin;
