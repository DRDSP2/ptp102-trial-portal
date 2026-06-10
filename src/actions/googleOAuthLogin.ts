import { action } from '@uibakery/data';

function googleOAuthLogin() {
  return action('googleOAuthLogin', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET last_login = NOW()
      WHERE LOWER(email) = LOWER({{params.email}})
      RETURNING id, email, full_name, tc_accepted, verification_status;
    `,
  });
}

export default googleOAuthLogin;
