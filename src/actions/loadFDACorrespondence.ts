import { action } from '@uibakery/data';

function loadFDACorrespondence() {
  return action('loadFDACorrespondence', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM fda_correspondence
      ORDER BY correspondence_date DESC;
    `,
  });
}

export default loadFDACorrespondence;
