import { supabase } from '@/lib/supabase/client';

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
    const { error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body,
    });

    if (error) {
      console.warn('WhatsApp notification invocation failed (non-fatal):', error.message);
    }
  } catch (err) {
    console.warn('WhatsApp notification error (non-fatal):', err);
  }
}
