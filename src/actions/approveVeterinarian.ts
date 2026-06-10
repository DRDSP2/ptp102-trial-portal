import { action } from '@uibakery/data';

function approveVeterinarian() {
  return action('approveVeterinarian', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE veterinarians
      SET 
        verification_status = 'approved',
        approved_at = NOW()
      WHERE id = {{params.id}}
      RETURNING id, email, full_name, verification_status, approved_at;
    `,
  });
}

export default approveVeterinarian;
