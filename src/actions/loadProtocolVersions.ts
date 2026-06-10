import { action } from '@uibakery/data';

function loadProtocolVersions() {
  return action('loadProtocolVersions', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM protocol_versions
      ORDER BY effective_date DESC, version_number DESC;
    `,
  });
}

export default loadProtocolVersions;
