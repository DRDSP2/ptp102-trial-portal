import { supabase } from '@/lib/supabase/client';

export type DiscordNotificationPayload = {
  activityType: string;
  actorEmail?: string | null;
  details?: Record<string, unknown>;
};

// Discord delivery is deliberately best-effort. A notification outage must
// never block a clinical write, trial start, or secure upload.
export async function sendDiscordNotification(
  payload: DiscordNotificationPayload,
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-discord-notification', {
      body: {
        activityType: payload.activityType,
        actorEmail: payload.actorEmail ?? 'unknown',
        details: payload.details ?? {},
      },
    });

    if (error) {
      console.warn('Discord notification invocation failed (non-fatal):', error.message);
    }
  } catch (error) {
    console.warn('Discord notification error (non-fatal):', error);
  }
}
