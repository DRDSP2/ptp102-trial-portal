import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutateAction } from '@uibakery/data';
import { DataLockError } from '@/lib/uibakeryDataMock';
import veterinarianLoginAction from '@/actions/veterinarianLogin';
import addClinicalAssessmentAction from '@/actions/addClinicalAssessment';
import addClinicalNoteAction from '@/actions/addClinicalNote';
import addTreatmentAction from '@/actions/addTreatment';
import addLabResultAction from '@/actions/addLabResult';
import updatePatientAction from '@/actions/updatePatient';
import updateDataLockStatusAction from '@/actions/updateDataLockStatus';
import bulkUpdateDataLockStatusAction from '@/actions/bulkUpdateDataLockStatus';
import createAdverseEventAction from '@/actions/createAdverseEvent';

/**
 * Helper: read patients out of localStorage and return the first one with the
 * given trial_status (defaulting to 'enrolled').
 */
function findEnrolledPatient(): { id: number; horse_name: string } {
  const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
  const p = patients.find((pt: any) => pt.trial_status === 'enrolled');
  expect(p).toBeDefined();
  return p;
}

function setLockStatus(patientId: number, status: 'open' | 'locked' | 'frozen') {
  const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
  const target = patients.find((p: any) => p.id === patientId);
  if (!target) throw new Error(`patient ${patientId} not found`);
  target.data_lock_status = status;
  localStorage.setItem('ptp102_mock_patients', JSON.stringify(patients));
}

async function loginVet() {
  const { result } = renderHook(() => useMutateAction(veterinarianLoginAction));
  const [login] = result.current;
  await act(async () => {
    await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
  });
}

describe('Data lock guard (assertLockAllowsWrite)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows writes when patient is open', async () => {
    await loginVet();
    const patient = findEnrolledPatient();

    const { result } = renderHook(() => useMutateAction(addClinicalAssessmentAction));
    const [addAssessment] = result.current;

    await act(async () => {
      const rows = await addAssessment({
        patientId: patient.id,
        assessmentDatetime: new Date().toISOString(),
        obelGrade: 2,
        painScore: 3,
        protocolHour: 24,
        veterinarianName: 'Dr. Test',
      });
      expect(Array.isArray(rows) && rows.length).toBe(1);
    });
  });

  it('rejects all clinical writes when patient is locked', async () => {
    await loginVet();
    const patient = findEnrolledPatient();
    setLockStatus(patient.id, 'locked');

    const cases = [
      { hook: addClinicalAssessmentAction, args: { patientId: patient.id, assessmentDatetime: new Date().toISOString(), obelGrade: 1, veterinarianName: 'Dr. Test' } },
      { hook: addClinicalNoteAction, args: { patientId: patient.id, veterinarianName: 'Dr. Test', noteType: 'observation', noteContent: 'note' } },
      { hook: addTreatmentAction, args: { patientId: patient.id, administrationDatetime: new Date().toISOString(), dosageMg: 500, route: 'IV', veterinarianName: 'Dr. Test' } },
      { hook: addLabResultAction, args: { patientId: patient.id, testDatetime: new Date().toISOString(), wbc: 10 } },
      { hook: updatePatientAction, args: { patientId: patient.id, horse_name: 'Renamed' } },
    ];

    for (const c of cases) {
      const { result } = renderHook(() => useMutateAction(c.hook));
      const [run] = result.current;
      await act(async () => {
        await expect(run(c.args)).rejects.toBeInstanceOf(DataLockError);
      });
    }
  });

  it('rejects writes on a frozen patient when no reasonForChange is provided', async () => {
    await loginVet();
    const patient = findEnrolledPatient();
    setLockStatus(patient.id, 'frozen');

    const { result } = renderHook(() => useMutateAction(addClinicalNoteAction));
    const [addNote] = result.current;

    await act(async () => {
      await expect(
        addNote({
          patientId: patient.id,
          veterinarianName: 'Dr. Test',
          noteType: 'observation',
          noteContent: 'attempted while frozen, no reason',
        }),
      ).rejects.toBeInstanceOf(DataLockError);
    });
  });

  it('allows writes on a frozen patient when reasonForChange is provided', async () => {
    await loginVet();
    const patient = findEnrolledPatient();
    setLockStatus(patient.id, 'frozen');

    const { result } = renderHook(() => useMutateAction(addClinicalNoteAction));
    const [addNote] = result.current;

    await act(async () => {
      const rows = await addNote({
        patientId: patient.id,
        veterinarianName: 'Dr. Test',
        noteType: 'observation',
        noteContent: 'frozen-write with documented justification',
        reasonForChange: 'Late lab result needed for FDA package; investigator approved',
      });
      expect(Array.isArray(rows) && rows.length).toBe(1);
    });
  });

  it('always allows adverse event reporting, even on locked records', async () => {
    await loginVet();
    const patient = findEnrolledPatient();
    setLockStatus(patient.id, 'locked');

    const { result } = renderHook(() => useMutateAction(createAdverseEventAction));
    const [createAE] = result.current;

    await act(async () => {
      const rows = (await createAE({
        patientId: patient.id,
        reporterName: 'Dr. Test',
        reporterEmail: 'phyto2002@gmail.com',
        eventDescription: 'Mild elevated heart rate noted',
        severity: 'Mild',
        causality: 'Possible',
        startDate: new Date().toISOString(),
        isOngoing: true,
        actionTaken: 'None',
        outcome: 'Recovering',
        serious: false,
        expected: false,
      })) as Array<{ id: number; severity: string }>;
      expect(rows.length).toBe(1);
      expect(rows[0].severity).toBe('Mild');
    });

    const stored = JSON.parse(localStorage.getItem('ptp102_mock_adverse_events') || '[]');
    expect(stored.length).toBe(1);
  });

  it('records FREEZE / LOCK / UNLOCK audit entries with the reason', async () => {
    await loginVet();
    const patient = findEnrolledPatient();

    const { result } = renderHook(() => useMutateAction(updateDataLockStatusAction));
    const [updateLock] = result.current;

    await act(async () => {
      await updateLock({ patientId: patient.id, dataLockStatus: 'frozen', reasonForChange: 'Investigator review pending' });
      await updateLock({ patientId: patient.id, dataLockStatus: 'locked', reasonForChange: 'End-of-study FDA submission lock' });
      await updateLock({ patientId: patient.id, dataLockStatus: 'open', reasonForChange: 'Reopened to address sponsor query' });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const entries = logs.filter(
      (l: any) => l.entityType === 'patient' && l.fieldName === 'data_lock_status' && l.entityId === patient.id,
    );
    expect(entries.length).toBeGreaterThanOrEqual(3);
    const actions = entries.slice(-3).map((l: any) => l.action);
    expect(actions).toEqual(['FREEZE', 'LOCK', 'UNLOCK']);
    for (const e of entries.slice(-3)) {
      expect(e.reasonForChange).toBeTruthy();
    }
  });

  it('bulkUpdateDataLockStatus emits one audit row per affected patient and skips no-ops', async () => {
    await loginVet();
    const before = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]').length;

    const { result } = renderHook(() => useMutateAction(bulkUpdateDataLockStatusAction));
    const [bulk] = result.current;

    let firstRun: unknown[] = [];
    await act(async () => {
      firstRun = (await bulk({
        dataLockStatus: 'frozen',
        trialStatusFilter: ['enrolled'],
        reasonForChange: 'End-of-study soft hold prior to FDA submission',
        adminEmail: 'admin@test.com',
      })) as unknown[];
    });

    expect(firstRun.length).toBeGreaterThan(0);

    const after = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const newEntries = after
      .slice(before)
      .filter((l: any) => l.entityType === 'patient' && l.fieldName === 'data_lock_status' && l.action === 'FREEZE');
    expect(newEntries.length).toBe(firstRun.length);
    for (const e of newEntries) {
      expect(e.reasonForChange).toMatch(/^\[bulk\] /);
      expect(e.userEmail).toBe('admin@test.com');
      expect(e.userRole).toBe('admin');
    }

    // Re-running with the same status must skip everyone (no audit rows added)
    const auditCountBeforeReplay = after.length;
    let secondRun: unknown[] = [];
    await act(async () => {
      secondRun = (await bulk({
        dataLockStatus: 'frozen',
        trialStatusFilter: ['enrolled'],
        reasonForChange: 'noop replay',
        adminEmail: 'admin@test.com',
      })) as unknown[];
    });
    const auditAfterReplay = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    expect(secondRun.length).toBe(0);
    expect(auditAfterReplay.length).toBe(auditCountBeforeReplay);
  });

  it('rejects bulkUpdateDataLockStatus without a reasonForChange', async () => {
    await loginVet();
    const { result } = renderHook(() => useMutateAction(bulkUpdateDataLockStatusAction));
    const [bulk] = result.current;
    await act(async () => {
      await expect(
        bulk({
          dataLockStatus: 'locked',
          trialStatusFilter: ['enrolled'],
          reasonForChange: '',
          adminEmail: 'admin@test.com',
        }),
      ).rejects.toThrow(/reasonForChange/);
    });
  });
});
