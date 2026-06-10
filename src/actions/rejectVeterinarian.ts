import { action } from '@uibakery/data';

function rejectVeterinarian() {
  return action('rejectVeterinarian', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET 
        verification_status = 'rejected',
        approved_at = NOW()
      WHERE id = {{params.id}}
      RETURNING id, email, full_name, verification_status, approved_at;
    `,
  });
}

export default rejectVeterinarian;
