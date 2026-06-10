import { action } from '@uibakery/data';

function loadSiteQualifications() {
  return action('loadSiteQualifications', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM site_qualifications
      ORDER BY created_at DESC;
    `,
  });
}

export default loadSiteQualifications;
