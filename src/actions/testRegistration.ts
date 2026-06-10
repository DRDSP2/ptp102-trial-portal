import { action } from '@uibakery/data';

function testRegistration() {
  return action('testRegistration', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        COUNT(*) as total_vets,
        MAX(created_at) as last_registration
      FROM veterinarians;
    `,
  });
}

export default testRegistration;
