import { action } from '@uibakery/data';

function exportSubmissionPackage() {
  return action('exportSubmissionPackage', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT
        {{params.exportedBy}} as exported_by,
        NOW() as exported_at;
    `,
  });
}

export default exportSubmissionPackage;
