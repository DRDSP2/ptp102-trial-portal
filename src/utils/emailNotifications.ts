// Email notification utility for PTP-102 Trial system
// Sends notifications to drdsp@pm.me (super admin) for all site activity

export const SUPER_ADMIN_EMAIL = 'drdsp@pm.me';

export async function sendNotification(
  notifyAction: (params: any) => Promise<any>,
  activityType: string,
  subject: string,
  details: Record<string, any>
) {
  try {
    const message = formatNotificationMessage(activityType, details);
    const timestamp = new Date().toISOString();
    
    await notifyAction({
      subject,
      message,
      activityType,
      timestamp,
    });
    
    console.log(`Notification sent: ${activityType} at ${timestamp}`);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

function formatNotificationMessage(activityType: string, details: Record<string, any>): string {
  const lines: string[] = [
    `Activity Type: ${activityType}`,
    `Timestamp: ${new Date().toLocaleString()}`,
    '',
    'Details:',
  ];

  Object.entries(details).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      lines.push(`  ${key}: ${String(value)}`);
    }
  });

  return lines.join('\n');
}

export const NotificationType = {
  NEW_VET_REGISTRATION: 'New Veterinarian Registration',
  VET_APPROVED: 'Veterinarian Approved',
  VET_REJECTED: 'Veterinarian Rejected',
  NEW_PATIENT_ENROLLED: 'New Patient Enrolled',
  PATIENT_UPDATED: 'Patient Updated',
  PATIENT_DELETED: 'Patient Deleted',
  CLINICAL_NOTE_ADDED: 'Clinical Note Added',
  TREATMENT_ADDED: 'Treatment Added',
  LAB_RESULT_ADDED: 'Lab Result Added',
  ASSESSMENT_ADDED: 'Assessment Added',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  SCREENING_APPROVED: 'Screening Approved',
  SCREENING_REJECTED: 'Screening Rejected',
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  AUDIT_EVENT: 'Audit Event',
} as const;

/**
 * Standalone email sender for audit events — callable from non-React
 * contexts (e.g. the audit repository). Posts to EmailJS when
 * VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and
 * VITE_EMAILJS_PUBLIC_KEY are set at build time; otherwise it no-ops so
 * tests and unconfigured environments never throw. Best-effort: errors
 * are logged and swallowed so audit infrastructure never blocks the
 * user action that triggered it.
 */
export async function fireAuditEmail(
  action: string,
  entityType: string,
  userEmail: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const serviceId = readViteEnv('VITE_EMAILJS_SERVICE_ID') || 'service_ptp102trial';
  const templateId = readViteEnv('VITE_EMAILJS_TEMPLATE_ID') || 'template_notifications';
  const publicKey = readViteEnv('VITE_EMAILJS_PUBLIC_KEY');
  if (!publicKey || publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
    // EmailJS not configured — skip silently. The audit row is still
    // persisted to the audit_logs table by the caller.
    return;
  }

  const subject = `[PTP-102 Audit] ${action} on ${entityType} by ${userEmail}`;
  const messageLines = [
    `Action: ${action}`,
    `Entity: ${entityType}`,
    `User: ${userEmail}`,
    `Timestamp: ${new Date().toLocaleString()}`,
    '',
    'Details:',
  ];
  if (details) {
    for (const [key, value] of Object.entries(details)) {
      if (value !== null && value !== undefined) {
        messageLines.push(`  ${key}: ${String(value)}`);
      }
    }
  }

  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: SUPER_ADMIN_EMAIL,
          subject,
          message: messageLines.join('\n'),
          activity_type: action,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.error('[audit] email send failed:', err);
  }
}

function readViteEnv(name: string): string | undefined {
  try {
    const raw = (import.meta.env as Record<string, string | undefined>)[name];
    return typeof raw === 'string' ? raw : undefined;
  } catch {
    return undefined;
  }
}
