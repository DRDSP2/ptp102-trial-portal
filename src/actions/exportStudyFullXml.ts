import { action } from '@uibakery/data';

function exportStudyFullXml() {
  return action('exportStudyFullXml', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT
        {{params.exportedBy}} as exported_by,
        NOW() as exported_at;
    `,
  });
}

export default exportStudyFullXml;
