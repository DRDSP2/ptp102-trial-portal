import { action } from '@uibakery/data';

function updateAdminLastLogin() {
  return action('updateAdminLastLogin', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE admin_users
      SET last_login = NOW()
      WHERE LOWER(email) = LOWER({{params.email}})
      RETURNING id;
    `,
  });
}

export default updateAdminLastLogin;
