import { action } from '@uibakery/data';

function loadAuditLogs() {
  return action('loadAuditLogs', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT *
      FROM audit_logs
      WHERE
        ($startDate::timestamptz IS NULL OR timestamp >= $startDate::timestamptz) AND
        ($endDate::timestamptz IS NULL OR timestamp <= $endDate::timestamptz) AND
        ($userEmail::text IS NULL OR user_email ILIKE $userEmail::text) AND
        ($subjectId::text IS NULL OR entity_id::text = $subjectId::text OR patient_id::text = $subjectId::text) AND
        ($action::text IS NULL OR action = $action::text) AND
        ($entityType::text IS NULL OR entity_type = $entityType::text)
      ORDER BY sequence_number ASC;
    `,
  });
}

export default loadAuditLogs;
