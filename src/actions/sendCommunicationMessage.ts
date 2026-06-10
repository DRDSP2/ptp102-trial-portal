import { action } from '@uibakery/data';

function sendCommunicationMessage() {
  return action('sendCommunicationMessage', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO communication_messages (
        sender_email, sender_role, recipient_emails, subject, body,
        message_classification, compliance_warning_triggered, parent_message_id
      )
      VALUES (
        {{params.senderEmail}}, {{params.senderRole}}, {{params.recipientEmails}}::text[],
        {{params.subject}}, {{params.body}}, {{params.messageClassification}},
        {{params.complianceWarningTriggered}}::boolean, {{params.parentMessageId}}::int
      )
      RETURNING *;
    `,
  });
}

export default sendCommunicationMessage;
