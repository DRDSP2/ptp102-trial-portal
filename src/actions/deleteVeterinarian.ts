import { action } from '@uibakery/data';

function deleteVeterinarian() {
  return action('deleteVeterinarian', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      DELETE FROM veterinarians
      WHERE id = {{params.id}}
      RETURNING id;
    `,
  });
}

export default deleteVeterinarian;
