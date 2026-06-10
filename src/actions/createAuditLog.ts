import { action } from '@uibakery/data';

function createAuditLog() {
  return action('createAuditLog', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO audit_logs (
        user_id, user_email, user_role, action, entity_type, entity_id,
        field_name, old_value, new_value, reason_for_change, ip_address, user_agent, session_id
      )
      VALUES (
        {{params.userId}}, {{params.userEmail}}, {{params.userRole}},
        {{params.action}}, {{params.entityType}}, {{params.entityId}}::int,
        {{params.fieldName}}, {{params.oldValue}}, {{params.newValue}},
        {{params.reasonForChange}}, {{params.ipAddress}}, {{params.userAgent}}, {{params.sessionId}}
      )
      RETURNING *;
    `,
  });
}

export default createAuditLog;
