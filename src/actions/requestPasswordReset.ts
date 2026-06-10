import { action } from '@uibakery/data';

function requestPasswordReset() {
  return action('requestPasswordReset', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET 
        password_reset_token = {{params.resetToken}},
        password_reset_expires = NOW() + INTERVAL '1 hour'
      WHERE LOWER(email) = LOWER({{params.email}})
      RETURNING email, full_name;
    `,
  });
}

export default requestPasswordReset;
