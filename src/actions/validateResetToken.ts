import { action } from '@uibakery/data';

function validateResetToken() {
  return action('validateResetToken', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT id, email, full_name
      FROM veterinarians
      WHERE password_reset_token = {{params.resetToken}}
      AND password_reset_expires > NOW();
    `,
  });
}

export default validateResetToken;
