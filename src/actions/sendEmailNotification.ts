import { action } from '@uibakery/data';

function sendEmailNotification() {
  return action('sendEmailNotification', 'HTTP', {
    datasourceName: 'httpApi',
    options: {
      method: 'POST',
      url: 'https://api.emailjs.com/api/v1.0/email/send',
      headers: {
        'Content-Type': 'application/json',
      },
      bodyType: 'object',
      body: `{
        service_id: 'service_ptp102trial',
        template_id: 'template_notifications',
        user_id: 'YOUR_EMAILJS_PUBLIC_KEY',
        template_params: {
          to_email: 'drdsp@pm.me',
          subject: {{params.subject}},
          message: {{params.message}},
          activity_type: {{params.activityType}},
          timestamp: {{params.timestamp}}
        }
      }`,
    },
  });
}

export default sendEmailNotification;
