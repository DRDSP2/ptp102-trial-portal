// DEPRECATED — This UiBakery action was used to send admin notification emails
// via EmailJS. EmailJS was unconfigured (user_id was a placeholder) and is now
// replaced by the supabase/functions/send-email edge function which uses
// Resend for reliable email delivery with PDF attachment support.
//
// The file is kept so existing callers (TermsAndConditionsScreen,
// VeterinarianManagementPanel) compile. TODO: remove after all callers are
// migrated to supabase.functions.invoke('send-email').

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
        service_id: '${import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ptp102trial'}',
        template_id: '${import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_notifications'}',
        user_id: '${import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'placeholder'}',
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
