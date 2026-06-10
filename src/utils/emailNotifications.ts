// Email notification utility for PTP-102 Trial system
// Sends notifications to phyto2002@gmail.com for all site activity

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
} as const;
