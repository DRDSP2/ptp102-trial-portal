import { action } from '@uibakery/data';

function updatePassword() {
  return action('updatePassword', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET 
        password_hash = {{params.newPasswordHash}},
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
      WHERE password_reset_token = {{params.resetToken}}
      AND password_reset_expires > NOW()
      RETURNING email, full_name;
    `,
  });
}

export default updatePassword;
