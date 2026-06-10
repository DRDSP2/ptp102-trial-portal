import { action } from '@uibakery/data';

function loadCommunicationMessages() {
  return action('loadCommunicationMessages', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT * FROM communication_messages
      WHERE
        {{params.userEmail}} = ANY(recipient_emails)
        OR sender_email = {{params.userEmail}}
      ORDER BY created_at DESC;
    `,
  });
}

export default loadCommunicationMessages;
