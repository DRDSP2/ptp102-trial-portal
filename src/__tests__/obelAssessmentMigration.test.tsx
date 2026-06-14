import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadAction } from '@uibakery/data';
import loadPatientCaseDataAction from '@/actions/loadPatientCaseData';

function seedPatientAndInvalidAssessments() {
  const now = new Date().toISOString();
  localStorage.setItem(
    'ptp102_mock_patients',
    JSON.stringify([
      {
        id: 1,
        horse_name: 'Test Horse',
        age: 10,
        breed: 'Thoroughbred',
        weight: 500,
        sex: 'Gelding',
        owner_name: 'Test Owner',
        owner_contact: '555-0000',
        owner_email: null,
        owner_phone: null,
        owner_address: null,
        owner_relationship: 'owner',
        horse_microchip: null,
        enrollment_date: now.slice(0, 10),
        trial_status: 'enrolled',
        screening_status: 'approved',
        screening_notes: null,
        screened_by: null,
        screened_at: null,
        eligibility_verified: true,
        protocol_start_time: now,
        consent_date: null,
        consent_id: null,
        completed_timeline_steps: [],
        created_at: now,
        updated_at: now,
        status_history: [],
        audit_log: [],
      },
    ])
  );

  localStorage.setItem(
    'ptp102_mock_assessments',
    JSON.stringify([
      {
        id: 101,
        patient_id: 1,
        assessment_datetime: now,
        obel_grade: -1,
        pain_score: 5,
        mobility_score: null,
        digital_pulse_score: null,
        hoof_temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        clinical_notes: null,
        veterinarian_name: 'Dr. Test',
        protocol_hour: 0,
      },
      {
        id: 102,
        patient_id: 1,
        assessment_datetime: now,
        obel_grade: 5,
        pain_score: 8,
        mobility_score: null,
        digital_pulse_score: null,
        hoof_temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        clinical_notes: null,
        veterinarian_name: 'Dr. Test',
        protocol_hour: 12,
      },
      {
        id: 103,
        patient_id: 1,
        assessment_datetime: now,
        obel_grade: 2.7,
        pain_score: 3,
        mobility_score: null,
        digital_pulse_score: null,
        hoof_temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        clinical_notes: null,
        veterinarian_name: 'Dr. Test',
        protocol_hour: 24,
      },
      {
        id: 104,
        patient_id: 1,
        assessment_datetime: now,
        obel_grade: 'bad',
        pain_score: 1,
        mobility_score: null,
        digital_pulse_score: null,
        hoof_temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        clinical_notes: null,
        veterinarian_name: 'Dr. Test',
        protocol_hour: 36,
      },
      {
        id: 105,
        patient_id: 1,
        assessment_datetime: now,
        obel_grade: 2,
        pain_score: 4,
        mobility_score: null,
        digital_pulse_score: null,
        hoof_temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        clinical_notes: null,
        veterinarian_name: 'Dr. Test',
        protocol_hour: 48,
      },
    ])
  );
}

describe('Obel grade assessment backfill', () => {
  beforeEach(() => {
    localStorage.clear();
    seedPatientAndInvalidAssessments();
  });

  it('normalizes invalid Obel grades when case data is loaded', async () => {
    const { result } = renderHook(() => useLoadAction(loadPatientCaseDataAction, [], { patientId: 1 }));

    await act(async () => {
      // Hook loads automatically; wait one tick for the async mock action.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const [caseData, loading] = result.current;
    expect(loading).toBe(false);
    expect(caseData).toBeDefined();
    expect(caseData?.length).toBeGreaterThan(0);

    const assessments = caseData![0].assessments as {
      id: number;
      obel_grade: number | null;
      obel_grade_original?: unknown;
    }[];

    const byId = (id: number) => assessments.find((a) => a.id === id)!;

    expect(byId(101).obel_grade).toBe(0);
    expect(byId(101).obel_grade_original).toBe(-1);

    expect(byId(102).obel_grade).toBe(4);
    expect(byId(102).obel_grade_original).toBe(5);

    expect(byId(103).obel_grade).toBe(3);
    expect(byId(103).obel_grade_original).toBe(2.7);

    expect(byId(104).obel_grade).toBeNull();
    expect(byId(104).obel_grade_original).toBe('bad');

    expect(byId(105).obel_grade).toBe(2);
    expect(byId(105).obel_grade_original).toBeUndefined();
  });

  it('persists normalized grades back to localStorage', async () => {
    renderHook(() => useLoadAction(loadPatientCaseDataAction, [], { patientId: 1 }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const stored = JSON.parse(localStorage.getItem('ptp102_mock_assessments') || '[]');
    expect(stored.find((a: any) => a.id === 101).obel_grade).toBe(0);
    expect(stored.find((a: any) => a.id === 101).obel_grade_original).toBe(-1);
    expect(stored.find((a: any) => a.id === 102).obel_grade).toBe(4);
    expect(stored.find((a: any) => a.id === 103).obel_grade).toBe(3);
    expect(stored.find((a: any) => a.id === 104).obel_grade).toBeNull();
  });

  it('writes an audit entry for the backfill', async () => {
    renderHook(() => useLoadAction(loadPatientCaseDataAction, [], { patientId: 1 }));

    // Give the async recordAudit call time to complete.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const backfillLogs = logs.filter(
      (l: any) => l.entityType === 'clinical_assessment' && l.reasonForChange === 'Backfill to valid 0-4 Obel grade'
    );
    expect(backfillLogs.length).toBeGreaterThan(0);
    expect(backfillLogs[0].action).toBe('UPDATE');
    expect(backfillLogs[0].oldValue).toContain('Backfill to valid 0-4 Obel grade');
  });
});
