import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import veterinarianLoginAction from '@/actions/veterinarianLogin';
import loadPatientCaseDataAction from '@/actions/loadPatientCaseData';
import { CaseWorkspace } from '@/components/CaseWorkspace';
import { AuthProvider } from '@/context/AuthContext';

function seedBulkData(patientId: number) {
  const notes = [];
  const treatments = [];
  const assessments = [];
  const labs = [];
  const now = new Date('2025-11-15T08:00:00.000Z').getTime();
  for (let i = 0; i < 500; i++) {
    notes.push({
      id: i + 1,
      patient_id: patientId,
      veterinarian_name: 'Dr Vet',
      note_type: 'progress',
      note_content: `Progress note ${i} `.repeat(20),
      protocol_hour: i % 73,
      video_url: null,
      video_file_name: null,
      video_uploaded_at: null,
      created_at: new Date(now + i * 60000).toISOString(),
    });
  }
  for (let i = 0; i < 100; i++) {
    treatments.push({
      id: i + 1,
      patient_id: patientId,
      administration_datetime: new Date(now + i * 3600000).toISOString(),
      dosage_mg: 2500,
      route: 'IV',
      protocol_hour: i % 73,
      veterinarian_name: 'Dr Vet',
      total_volume_ml: 500,
      batch_number: 'DEMO-BATCH',
      immediate_reactions: null,
    });
    assessments.push({
      id: i + 1,
      patient_id: patientId,
      assessment_datetime: new Date(now + i * 3600000).toISOString(),
      obel_grade: (i % 4) + 1,
      pain_score: (i % 3) + 1,
      mobility_score: null,
      digital_pulse_score: null,
      hoof_temperature: null,
      heart_rate: 40,
      respiratory_rate: 16,
      temperature: 38,
      clinical_notes: `Assessment ${i}`,
      veterinarian_name: 'Dr Vet',
      protocol_hour: i % 73,
    });
    labs.push({
      id: i + 1,
      patient_id: patientId,
      test_datetime: new Date(now + i * 3600000).toISOString(),
      protocol_hour: i % 73,
      wbc: 8,
      rbc: 7,
      hemoglobin: 14,
      hematocrit: 42,
      platelets: 200,
      glucose: 90,
      creatinine: 1,
      bun: 16,
      alt: 25,
      ast: 30,
      alkaline_phosphatase: 100,
      total_protein: 60,
      albumin: 30,
      serum_amyloid_a: 10,
      fibrinogen: 3,
      lactate: 1.5,
      additional_notes: null,
    });
  }
  localStorage.setItem('ptp102_mock_notes', JSON.stringify(notes));
  localStorage.setItem('ptp102_mock_treatments', JSON.stringify(treatments));
  localStorage.setItem('ptp102_mock_assessments', JSON.stringify(assessments));
  localStorage.setItem('ptp102_mock_lab_results', JSON.stringify(labs));
}

describe('Patient open performance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the initial patient workspace render bounded with large history', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    await act(async () => {
      await loginHook.result.current[0]({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const patient = patients.find((p: any) => p.horse_name === 'Midnight Thunder');
    expect(patient).toBeDefined();

    seedBulkData(patient.id);

    let renderCommitCount = 0;
    const onRender: ProfilerOnRenderCallback = () => {
      renderCommitCount += 1;
    };

    localStorage.setItem('veterinarian_email', 'phyto2002@gmail.com');
    localStorage.removeItem('admin_email');
    localStorage.setItem(
      'laminitis_auth_state',
      JSON.stringify({ role: 'vet', email: 'phyto2002@gmail.com', termsAccepted: true, pendingApproval: false })
    );

    render(
      <AuthProvider>
        <Profiler id="CaseWorkspace" onRender={onRender}>
          <CaseWorkspace patientId={patient.id} onBack={() => {}} />
        </Profiler>
      </AuthProvider>
    );

    // Advance 3 seconds of wall-clock timers to exercise the countdown/timeline intervals.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Timer-driven components should not produce an excessive number of commits.
    // Budget allows the initial mount, data-load commits from several child panels,
    // and one shared clock tick per second.
    expect(renderCommitCount).toBeLessThanOrEqual(16);
  });

  it('reloads complete patient case data with large history', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    await act(async () => {
      await loginHook.result.current[0]({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const patient = patients[0];
    seedBulkData(patient.id);

    const { result } = renderHook(() => useLoadAction(loadPatientCaseDataAction, [], { patientId: patient.id }));
    // Trigger a reload and verify the requested patient remains the source row.
    await act(async () => {
      await result.current[3]();
    });

    expect(result.current[0]?.[0]?.id).toBe(patient.id);
  });
});

function renderHook<T>(hook: () => T) {
  const result: { current: T } = { current: undefined as unknown as T };
  function Wrapper() {
    result.current = hook();
    return null;
  }
  render(<Wrapper />);
  return { result };
}
