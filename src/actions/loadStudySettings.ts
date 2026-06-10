import { action } from '@uibakery/data';

function loadStudySettings() {
  return action('loadStudySettings', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM study_settings ORDER BY id LIMIT 1;
    `,
  });
}

export default loadStudySettings;
