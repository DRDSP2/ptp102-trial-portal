import { describe, expect, it, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { sendWhatsAppNotification } from '@/utils/whatsappNotifications';

describe('sendWhatsAppNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes the Edge Function with a formatted WhatsApp message for clinical notes', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: null });

    await sendWhatsAppNotification({
      activityType: 'Clinical Note Added',
      vetName: 'dr.smith@test.com',
      patientId: 42,
      details: { 'Note Type': 'observation', 'Note': 'Patient is doing well' },
    });

    expect(invoke).toHaveBeenCalledWith('send-whatsapp-notification', {
      body: expect.objectContaining({
        activityType: 'Clinical Note Added',
        vetName: 'dr.smith@test.com',
        patientId: 42,
        message: expect.stringContaining('Clinical Note Added'),
      }),
    });

    const calledBody = invoke.mock.calls[0][1].body;
    expect(calledBody.message).toContain('PTP-102 Trial Alert');
    expect(calledBody.message).toContain('Action: Clinical Note Added');
    expect(calledBody.message).toContain('Vet: dr.smith@test.com');
    expect(calledBody.message).toContain('Patient ID: 42');
    expect(calledBody.message).toContain('Note: Patient is doing well');
  });

  it('invokes the Edge Function for adverse events', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: null });

    await sendWhatsAppNotification({
      activityType: 'Adverse Event Reported',
      vetName: 'Dr. Jane Smith',
      patientId: 7,
      details: { Severity: 'Severe', Description: 'Horse showing signs of colic' },
    });

    expect(invoke).toHaveBeenCalledWith('send-whatsapp-notification', {
      body: expect.objectContaining({
        activityType: 'Adverse Event Reported',
        vetName: 'Dr. Jane Smith',
      }),
    });

    const invokedBody = invoke.mock.calls[0][1].body;
    expect(invokedBody.message).toContain('Action: Adverse Event Reported');
    expect(invokedBody.message).toContain('Severity: Severe');
  });

  it('includes patient name in the message when available', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: null });

    await sendWhatsAppNotification({
      activityType: 'Treatment Added',
      vetName: 'dr.jones@test.com',
      patientId: 15,
      details: { 'Patient Name': 'Thunder', 'Route': 'IV', 'Dosage (mg)': 500 },
    });

    const invokedBody = invoke.mock.calls[0][1].body;
    expect(invokedBody.message).toContain('Patient: Thunder');
    expect(invokedBody.message).toContain('Route: IV');
  });

  it('does not throw when the Edge Function returns an error', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValue({ error: new Error('network error') });

    await expect(
      sendWhatsAppNotification({
        activityType: 'Assessment Added',
        vetName: 'vet@test.com',
        details: { 'Obel Grade': '2' },
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when supabase.functions.invoke throws', async () => {
    const invoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
    invoke.mockRejectedValue(new Error('network failure'));

    await expect(
      sendWhatsAppNotification({
        activityType: 'Lab Result Added',
        vetName: 'vet@test.com',
        details: { 'SAA': '150' },
      }),
    ).resolves.toBeUndefined();
  });
});
