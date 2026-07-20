import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { sendDiscordNotification } from '@/utils/discordNotifications';

describe('sendDiscordNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the event through the secret-backed Edge Function', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: null });

    await sendDiscordNotification({
      activityType: 'Trial Started',
      actorEmail: 'vet@example.com',
      details: { 'Patient ID': 42, Route: 'IV' },
    });

    expect(invoke).toHaveBeenCalledWith('send-discord-notification', {
      body: {
        activityType: 'Trial Started',
        actorEmail: 'vet@example.com',
        details: { 'Patient ID': 42, Route: 'IV' },
      },
    });
  });

  it('does not expose a webhook URL in the client payload', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: null });

    await sendDiscordNotification({ activityType: 'Secure Upload Completed' });

    expect(JSON.stringify(invoke.mock.calls[0])).not.toContain('webhookUrl');
    expect(JSON.stringify(invoke.mock.calls[0])).not.toContain('DISCORD_WEBHOOK_URL');
  });

  it('does not block the calling workflow when delivery fails', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockRejectedValue(new Error('network failure'));

    await expect(
      sendDiscordNotification({ activityType: 'Veterinarian Signup' }),
    ).resolves.toBeUndefined();
  });
});
