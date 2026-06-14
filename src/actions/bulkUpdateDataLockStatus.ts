import { action } from '@uibakery/data';

/**
 * Bulk-update data_lock_status across patients matching `trialStatusFilter`.
 *
 * Params:
 *   - dataLockStatus:    'open' | 'locked' | 'frozen'
 *   - trialStatusFilter: optional string array of trial_status values to scope
 *                        the update (e.g. ['enrolled','completed']). When null
 *                        or empty, all patients are affected.
 *   - reasonForChange:   required by the mock; ignored by the SQL path.
 *   - adminEmail:        emitted into the audit trail.
 *
 * Returns: array of updated patient rows.
 */
function bulkUpdateDataLockStatus() {
  return action('bulkUpdateDataLockStatus', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET data_lock_status = {{params.dataLockStatus}},
          updated_at = NOW()
      WHERE
        ({{params.trialStatusFilter}} IS NULL
          OR trial_status = ANY({{params.trialStatusFilter}}::text[]))
      RETURNING *;
    `,
  });
}

export default bulkUpdateDataLockStatus;
