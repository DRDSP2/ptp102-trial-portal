import { action } from '@uibakery/data';

function updateDataLockStatus() {
  return action('updateDataLockStatus', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET data_lock_status = {{params.dataLockStatus}},
          updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default updateDataLockStatus;
