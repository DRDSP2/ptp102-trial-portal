// Email notification utility for PTP-102 Trial system
// Sends notifications to drdsp@pm.me (super admin) for all site activity.
//
// Delivery goes through the `send-email-notification` Supabase Edge
// Function (Resend API). All sends are best-effort: failures are logged
// and never thrown, so a notification problem can never block a clinical
// workflow or an audit write.

import { supabase } from '@/lib/supabase/client';

export const SUPER_ADMIN_EMAIL = 'drdsp@pm.me';

export type EmailNotificationPayload = {
  activityType: string;
  actorEmail?: string | null;
  subject?: string;
  details?: Record<string, unknown>;
};

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        activityType: payload.activityType,
        actorEmail: payload.actorEmail ?? 'unknown',
        subject: payload.subject ?? `PTP-102: ${payload.activityType}`,
        details: payload.details ?? {},
      },
    });

    if (error) {
      console.warn('Email notification invocation failed (non-fatal):', error.message);
    }
  } catch (err) {
    console.warn('Email notification error (non-fatal):', err);
  }
}

/**
 * Send an owner notification. Supports both call shapes:
 *   sendNotification(activityType, subject, details)
 *   sendNotification(legacyNotifyAction, activityType, subject, details)
 * The legacy first argument (a dead EmailJS action) is ignored.
 */
export async function sendNotification(
  arg1: unknown,
  arg2: string,
  arg3: string | Record<string, unknown>,
  arg4?: Record<string, unknown>,
): Promise<void> {
  const legacyForm = typeof arg1 !== 'string';
  const activityType = legacyForm ? arg2 : (arg1 as string);
  const subject = legacyForm ? (arg3 as string) : arg2;
  const details = (legacyForm ? arg4 : (arg3 as Record<string, unknown>)) ?? {};
  const actorEmail =
    details && typeof details['Email'] === 'string' ? (details['Email'] as string) : undefined;
  await sendEmailNotification({ activityType, subject, details, actorEmail });
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
  ADVERSE_EVENT: 'Adverse Event Reported',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  SCREENING_APPROVED: 'Screening Approved',
  SCREENING_REJECTED: 'Screening Rejected',
  VET_LOGIN: 'Vet Login',
  ADMIN_LOGIN: 'Admin Login',
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  AUDIT_EVENT: 'Audit Event',
} as const;

/**
 * Standalone email sender for audit events — callable from non-React
 * contexts (e.g. the audit repository). Routes through the
 * `send-email-notification` Edge Function. Best-effort: errors are logged
 * and swallowed so audit infrastructure never blocks the user action that
 * triggered it.
 */
export async function fireAuditEmail(
  action: string,
  entityType: string,
  userEmail: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await sendEmailNotification({
    activityType: `${NotificationType.AUDIT_EVENT}: ${action} on ${entityType}`,
    actorEmail: userEmail,
    subject: `[PTP-102 Audit] ${action} on ${entityType} by ${userEmail}`,
    details: {
      Action: action,
      Entity: entityType,
      User: userEmail,
      ...(details ?? {}),
    },
  });
}
