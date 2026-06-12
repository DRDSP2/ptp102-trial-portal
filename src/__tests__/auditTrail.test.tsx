import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutateAction, useLoadAction } from '@uibakery/data';
import veterinarianLoginAction from '@/actions/veterinarianLogin';
import addClinicalAssessmentAction from '@/actions/addClinicalAssessment';
import loadAuditLogsAction from '@/actions/loadAuditLogs';
import exportStudyXmlAction from '@/actions/exportStudyXml';
import exportSubmissionPackageAction from '@/actions/exportSubmissionPackage';

describe('FDA-ready audit trail', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records a LOGIN audit event when a vet logs in', async () => {
    const { result } = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = result.current;

    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const loginEvents = logs.filter((l: any) => l.action === 'LOGIN');
    expect(loginEvents.length).toBeGreaterThan(0);
    expect(loginEvents[0]).toMatchObject({
      userEmail: 'phyto2002@gmail.com',
      userRole: 'vet',
      entityType: 'veterinarian',
    });
  });

  it('creates audit entries with before/after values for clinical data', async () => {
    // Seed vet and patient
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = loginHook.result.current;
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const demoPatient = patients.find((p: any) => p.horse_name === 'Midnight Thunder');
    expect(demoPatient).toBeDefined();

    const { result } = renderHook(() => useMutateAction(addClinicalAssessmentAction));
    const [addAssessment] = result.current;

    await act(async () => {
      await addAssessment({
        patientId: demoPatient.id,
        assessmentDatetime: new Date().toISOString(),
        obelGrade: 1,
        painScore: 2,
        protocolHour: 48,
        veterinarianName: 'Dr. Test',
      });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const assessmentLogs = logs.filter((l: any) => l.entityType === 'clinical_assessment');
    expect(assessmentLogs.length).toBeGreaterThan(0);
    const entry = assessmentLogs[assessmentLogs.length - 1];
    expect(entry.action).toBe('CREATE');
    expect(entry.newValue).toContain('obel_grade');
    expect(entry.sequenceNumber).toBeGreaterThan(0);
    expect(entry.clientHash).toHaveLength(64);
  });

  it('maintains a valid hash chain across multiple audit entries', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = loginHook.result.current;
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    expect(logs.length).toBeGreaterThan(0);

    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].previousHash).toBe(logs[i - 1].clientHash);
    }
  });

  it('records an EXPORT audit event for XML exports', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = loginHook.result.current;
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const { result } = renderHook(() => useMutateAction(exportStudyXmlAction));
    const [exportXml] = result.current;

    await act(async () => {
      await exportXml({ exportedBy: 'admin@test.com' });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const exportLogs = logs.filter((l: any) => l.action === 'EXPORT');
    expect(exportLogs.length).toBeGreaterThan(0);
    expect(exportLogs[0].entityType).toBe('study_export');
    expect(exportLogs[0].newValue).toContain('statistical');
    expect(exportLogs[0].newValue).toContain('define');
  });

  it('records an EXPORT_SUBMISSION_PACKAGE audit event for CVM package exports', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = loginHook.result.current;
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const { result } = renderHook(() => useMutateAction(exportSubmissionPackageAction));
    const [exportPackage] = result.current;

    await act(async () => {
      await exportPackage({ exportedBy: 'admin@test.com' });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const packageLogs = logs.filter((l: any) => l.action === 'EXPORT_SUBMISSION_PACKAGE');
    expect(packageLogs.length).toBeGreaterThan(0);
    expect(packageLogs[0].entityType).toBe('study_export');
    expect(packageLogs[0].newValue).toContain('ptp102_ptp102_dataset_statistical_');
    expect(packageLogs[0].newValue).toContain('ptp102_ptp102_dataset_fda_audit_');
    expect(packageLogs[0].newValue).toContain('ptp102_ptp102_define_');
    expect(packageLogs[0].newValue).toContain('ptp102_ptp102_toc_');
  });

  it('returns audit logs through the loadAuditLogs action with filters', async () => {
    const loginHook = renderHook(() => useMutateAction(veterinarianLoginAction));
    const [login] = loginHook.result.current;
    await act(async () => {
      await login({ email: 'phyto2002@gmail.com', password: 'Test123456' });
    });

    const { result } = renderHook(() => useLoadAction(loadAuditLogsAction, [], { action: 'LOGIN' }));
    const [data, loading] = result.current;

    // useLoadAction runs synchronously in the mock; data should be populated immediately
    const logs = data as any[];
    expect(loading).toBe(false);
    expect(logs.every((l) => l.action === 'LOGIN')).toBe(true);
  });
});
