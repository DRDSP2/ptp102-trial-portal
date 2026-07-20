export type DiscordAlert = {
  activityType: string;
  actorEmail?: string | null;
  details?: Record<string, unknown>;
};

export type DiscordDeliveryResult = {
  status: 'sent' | 'skipped' | 'failed';
  httpStatus?: number;
};

const MAX_ACTIVITY_LENGTH = 200;
const MAX_FIELD_NAME_LENGTH = 256;
const MAX_FIELD_VALUE_LENGTH = 1_000;
const MAX_FIELDS = 25;

function clean(value: unknown, maxLength: number): string {
  return Array.from(String(value ?? ''))
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .trim()
    .slice(0, maxLength);
}

export async function sendDiscordAlert(
  webhookUrl: string | undefined,
  alert: DiscordAlert,
): Promise<DiscordDeliveryResult> {
  if (!webhookUrl) {
    return { status: 'skipped' };
  }

  const fields = Object.entries(alert.details ?? {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, MAX_FIELDS)
    .map(([name, value]) => ({
      name: clean(name, MAX_FIELD_NAME_LENGTH) || 'Detail',
      value: clean(value, MAX_FIELD_VALUE_LENGTH) || '—',
      inline: false,
    }));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'PTP-102 Trial Alerts',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `🐴 ${clean(alert.activityType, MAX_ACTIVITY_LENGTH) || 'Trial notification'}`,
            description: `Actor: ${clean(alert.actorEmail || 'system', MAX_FIELD_VALUE_LENGTH)}`,
            color: 0x6b7f3a,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: 'PTP-102 Trial Portal' },
          },
        ],
      }),
    });

    if (!response.ok) {
      return { status: 'failed', httpStatus: response.status };
    }

    return { status: 'sent', httpStatus: response.status };
  } catch {
    return { status: 'failed' };
  }
}
