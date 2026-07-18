import { supabase } from '@/lib/supabase/client';
import { sendEmailNotification } from '@/utils/emailNotifications';

type WhatsAppNotificationPayload = {
  activityType: string;
  vetName: string;
  patientId?: number;
  details: Record<string, string | number | undefined | null>;
};

function buildWhatsAppMessage(type: string, vetName: string, details: Record<string, unknown>): string {
  const lines: string[] = [
    `🐴 PTP-102 Trial Alert`,
    `───`,
    `Action: ${type}`,
    `Vet: ${vetName}`,
  ];

  if (details['Patient Name']) {
    lines.push(`Patient: ${details['Patient Name']}`);
  }

  for (const [key, val] of Object.entries(details)) {
    if (key === 'Patient Name') continue;
    if (val !== null && val !== undefined && val !== '') {
      lines.push(`${key}: ${String(val).slice(0, 200)}`);
    }
  }

  lines.push(`───`, `byrock.eth.limo`);
  return lines.join('\n');
}

export async function sendWhatsAppNotification(payload: WhatsAppNotificationPayload): Promise<void> {
  const enriched = { ...payload.details };
  if (payload.patientId != null && !enriched['Patient Name']) {
    enriched['Patient ID'] = payload.patientId;
  }

  const message = buildWhatsAppMessage(
    payload.activityType,
    payload.vetName,
    enriched as Record<string, unknown>,
  );

  const body: Record<string, unknown> = {
    message,
    activityType: payload.activityType,
    vetName: payload.vetName,
  };
  if (payload.patientId != null) {
    body.patientId = payload.patientId;
  }

  try {
    const result = await supabase.functions.invoke('send-whatsapp-notification', {
      body,
    });

    if (result && result.error) {
      console.warn('WhatsApp notification invocation failed (non-fatal):', result.error.message);
    }
  } catch (err) {
    console.warn('WhatsApp notification error (non-fatal):', err);
  }

  // Mirror every main event to the owner's email (best-effort, non-blocking).
  // Fired after the WhatsApp invoke so the WhatsApp call stays first in
  // mocked invoke sequences (tests rely on that order).
  void sendEmailNotification({
    activityType: payload.activityType,
    actorEmail: payload.vetName,
    details: enriched,
  });
}
