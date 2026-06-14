import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import veterinarianLoginAction from '@/actions/veterinarianLogin';
import createAdverseEventAction from '@/actions/createAdverseEvent';
import loadAdverseEventsAction from '@/actions/loadAdverseEvents';
import loadAllAdverseEventsAction from '@/actions/loadAllAdverseEvents';

async function loginVet() {
  const { result } = renderHook(() => useMutateAction(veterinarianLoginAction));
  const [login] = result.current;
  await act(async () => {
    await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
  });
}

describe('Adverse event persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the adverse event row, audits CREATE, and exposes it via loadAdverseEvents', async () => {
    await loginVet();
    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const patient = patients.find((p: any) => p.trial_status === 'enrolled');
    expect(patient).toBeDefined();

    const createHook = renderHook(() => useMutateAction(createAdverseEventAction));
    const [createAE] = createHook.result.current;

    await act(async () => {
      const rows = (await createAE({
        patientId: patient.id,
        reporterName: 'Dr. Test',
        reporterEmail: 'phyto2002@gmail.com',
        eventDescription: 'Severe transient hypotension after second dose',
        severity: 'Severe',
        causality: 'Probable',
        startDate: new Date().toISOString(),
        isOngoing: false,
        resolvedDate: new Date().toISOString(),
        actionTaken: 'Drug_Withheld',
        outcome: 'Recovered',
        vetAssessment: 'Resolved within 30 minutes; clinical signs returned to baseline.',
        digitalSignature: 'Dr. Test',
        serious: true,
        expected: false,
      })) as Array<{ id: number; severity: string; serious: boolean }>;
      expect(rows.length).toBe(1);
      expect(rows[0].severity).toBe('Severe');
      expect(rows[0].serious).toBe(true);
    });

    // Stored
    const stored = JSON.parse(localStorage.getItem('ptp102_mock_adverse_events') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].patient_id).toBe(patient.id);
    expect(stored[0].signed_at).toBeTruthy();

    // Audit row
    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const aeAudit = logs.find((l: any) => l.entityType === 'adverse_event' && l.action === 'CREATE');
    expect(aeAudit).toBeDefined();
    expect(aeAudit.patientId).toBe(patient.id);
    expect(aeAudit.newValue).toContain('Severe');

    // loadAdverseEvents (per-patient)
    const load = renderHook(() =>
      useLoadAction(loadAdverseEventsAction, [], { patientId: patient.id }),
    );
    const [data] = load.result.current;
    expect(Array.isArray(data) && data.length).toBe(1);

    // loadAllAdverseEvents (admin view, enriched with horse info).
    // The demo seed patient does not set unique_id, so we accept either the
    // patient's stored value or null (whichever was on the patient row).
    const loadAll = renderHook(() => useLoadAction(loadAllAdverseEventsAction, []));
    const [allRows] = loadAll.result.current;
    const all = allRows as Array<{ horse_name: string | null; unique_id: string | null }>;
    expect(all.length).toBe(1);
    expect(all[0].horse_name).toBe(patient.horse_name);
    expect(all[0].unique_id).toBe(patient.unique_id ?? null);
  });
});
