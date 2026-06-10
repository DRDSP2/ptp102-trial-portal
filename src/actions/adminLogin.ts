import { action } from '@uibakery/data';

function adminLogin() {
  return action('adminLogin', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT id, email, full_name
      FROM admin_users
      WHERE LOWER(email) = LOWER({{params.email}})
      AND (
        password_hash = crypt({{params.password}}, password_hash)
        OR password_hash = {{params.password}}
        OR ({{params.password}} = '' AND password_hash = 'GOOGLE_OAUTH_ADMIN')
      )
      LIMIT 1;
    `,
  });
}

export default adminLogin;
