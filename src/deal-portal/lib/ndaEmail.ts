import { SUPER_ADMIN_EMAIL } from '@/utils/emailNotifications';

function readViteEnv(name: string): string | undefined {
  try {
    const raw = (import.meta.env as Record<string, string | undefined>)[name];
    return typeof raw === 'string' ? raw : undefined;
  } catch {
    return undefined;
  }
}

async function sendEmail({
  to_email,
  subject,
  message,
}: {
  to_email: string;
  subject: string;
  message: string;
}) {
  const serviceId = readViteEnv('VITE_EMAILJS_SERVICE_ID') || 'service_ptp102trial';
  const templateId = readViteEnv('VITE_EMAILJS_TEMPLATE_ID') || 'template_notifications';
  const publicKey = readViteEnv('VITE_EMAILJS_PUBLIC_KEY');
  if (!publicKey || publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
    console.warn('EmailJS not configured; skipping email.');
    return;
  }

  await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email,
        subject,
        message,
        activity_type: subject,
        timestamp: new Date().toISOString(),
      },
    }),
  });
}

export async function sendNdaPendingAdminEmail({
  investorEmail,
  companyName,
  reviewUrl,
  pdfUrl,
}: {
  investorEmail: string;
  companyName: string;
  reviewUrl: string;
  pdfUrl: string;
}) {
  const subject = `NDA signed by ${companyName} — approval required`;
  const message = [
    `A new Mutual NDA has been signed and is awaiting your approval.`,
    ``,
    `Company: ${companyName}`,
    `Investor email: ${investorEmail}`,
    ``,
    `Review and approve: ${reviewUrl}`,
    `View signed PDF: ${pdfUrl}`,
    ``,
    `Signed at: ${new Date().toLocaleString()}`,
  ].join('\n');

  await sendEmail({ to_email: SUPER_ADMIN_EMAIL, subject, message });
}

export async function sendNdaPendingInvestorEmail({
  toEmail,
  companyName,
}: {
  toEmail: string;
  companyName: string;
}) {
  const subject = 'Byrock deal portal application received';
  const message = [
    `Dear ${companyName},`,
    ``,
    `Thank you for signing the Mutual Non-Disclosure Agreement. Your Byrock deal portal application is being reviewed and we will inform you once it has been approved or declined in the coming days.`,
    ``,
    `Best regards,`,
    `Byrock Technologies Ltd`,
  ].join('\n');

  await sendEmail({ to_email: toEmail, subject, message });
}

export async function sendNdaApprovedInvestorEmail({
  toEmail,
  companyName,
  pdfUrl,
  dashboardUrl,
}: {
  toEmail: string;
  companyName: string;
  pdfUrl: string;
  dashboardUrl: string;
}) {
  const subject = 'Byrock deal portal application approved';
  const message = [
    `Dear ${companyName},`,
    ``,
    `Your Mutual Non-Disclosure Agreement has been approved and countersigned by Byrock Technologies Ltd.`,
    ``,
    `You now have access to the deal portal evaluation suite.`,
    ``,
    `View countersigned NDA: ${pdfUrl}`,
    `Access deal portal: ${dashboardUrl}`,
    ``,
    `Best regards,`,
    `Byrock Technologies Ltd`,
  ].join('\n');

  await sendEmail({ to_email: toEmail, subject, message });
}

export async function sendNdaDeniedInvestorEmail({
  toEmail,
  companyName,
}: {
  toEmail: string;
  companyName: string;
}) {
  const subject = 'Byrock deal portal application declined';
  const message = [
    `Dear ${companyName},`,
    ``,
    `Thank you for your interest. After review, we are unable to proceed with your application at this time.`,
    ``,
    `If you believe this decision was made in error, please contact us at ${SUPER_ADMIN_EMAIL}.`,
    ``,
    `Best regards,`,
    `Byrock Technologies Ltd`,
  ].join('\n');

  await sendEmail({ to_email: toEmail, subject, message });
}
