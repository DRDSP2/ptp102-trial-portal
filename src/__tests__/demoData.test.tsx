import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutateAction } from '@uibakery/data';
import veterinarianLoginAction from '@/actions/veterinarianLogin';

describe('Demo vet account seeding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates the demo vet with approved status and valid password hash', async () => {
    const { result } = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = result.current;

    let loggedIn: any;
    await act(async () => {
      loggedIn = await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });
    expect(loggedIn).toHaveLength(1);
    expect(loggedIn[0]).toMatchObject({
      email: 'phyto2002@gmail.com',
      full_name: 'Dr. Sarah Phyto',
      verification_status: 'approved',
    });
  });

  it('seeds the demo patient, assessments, treatments, notes, labs, and shipment', async () => {
    const { result } = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = result.current;

    // Logging in triggers getVets(), which seeds the demo data
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const treatments = JSON.parse(localStorage.getItem('ptp102_mock_treatments') || '[]');
    const assessments = JSON.parse(localStorage.getItem('ptp102_mock_assessments') || '[]');
    const notes = JSON.parse(localStorage.getItem('ptp102_mock_notes') || '[]');
    const labs = JSON.parse(localStorage.getItem('ptp102_mock_lab_results') || '[]');
    const shipments = JSON.parse(localStorage.getItem('ptp102_mock_shipments') || '[]');

    const demoPatient = patients.find((p: any) => p.horse_name === 'Midnight Thunder');
    expect(demoPatient).toBeDefined();
    expect(demoPatient.enrolled_by_vet_email).toBe('phyto2002@gmail.com');
    expect(demoPatient.trial_status).toBe('enrolled');

    const patientAssessments = assessments
      .filter((a: any) => a.patient_id === demoPatient.id)
      .sort((a: any, b: any) => a.protocol_hour - b.protocol_hour);
    expect(patientAssessments.map((a: any) => ({ hour: a.protocol_hour, obel: a.obel_grade }))).toEqual([
      { hour: 0, obel: 3 },
      { hour: 12, obel: 2 },
      { hour: 36, obel: 1 },
    ]);

    const patientTreatments = treatments.filter((t: any) => t.patient_id === demoPatient.id);
    expect(patientTreatments).toHaveLength(2);

    const patientNotes = notes.filter((n: any) => n.patient_id === demoPatient.id);
    expect(patientNotes.length).toBeGreaterThan(0);

    const patientLabs = labs.filter((l: any) => l.patient_id === demoPatient.id);
    expect(patientLabs).toHaveLength(2);

    const demoShipment = shipments.find((s: any) => s.batch_lot_number === 'PTP102-2025-DEMO-001');
    expect(demoShipment).toBeDefined();
    expect(demoShipment.shipped_to_veterinarian_email).toBe('phyto2002@gmail.com');
  });
});
