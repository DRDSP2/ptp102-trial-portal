import { action } from '@uibakery/data';

function loadAuditLogs() {
  return action('loadAuditLogs', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 1000;
    `,
  });
}

export default loadAuditLogs;
