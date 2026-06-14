import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutateAction } from '@uibakery/data';
import simpleRegisterVetAction from '@/actions/simpleRegisterVet';

describe('simpleRegisterVet existing-vet UPDATE branch records an audit row', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('emits an UPDATE audit when re-registering an existing vet, flagging password change', async () => {
    // Step 1: initial registration creates the vet (REGISTER audit)
    const { result } = renderHook(() => useMutateAction(simpleRegisterVetAction));
    const [register] = result.current;

    await act(async () => {
      await register({
        fullName: 'Dr. Initial Name',
        email: 'reaudit@example.com',
        phone: '555-0100',
        passwordHash: 'hash-v1',
        licenseNumber: 'LIC-100',
        hospitalAffiliation: 'Hospital A',
        signatureText: 'Dr. Initial Name',
      });
    });

    let logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const registerEntries = logs.filter(
      (l: any) => l.entityType === 'veterinarian' && l.action === 'REGISTER' && l.userEmail === 'reaudit@example.com',
    );
    expect(registerEntries.length).toBe(1);

    // Step 2: re-registration with a new password and updated profile
    await act(async () => {
      await register({
        fullName: 'Dr. Renamed',
        email: 'reaudit@example.com',
        phone: '555-0100',
        passwordHash: 'hash-v2', // changed
        licenseNumber: 'LIC-100',
        hospitalAffiliation: 'Hospital B',
        signatureText: 'Dr. Renamed',
      });
    });

    logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const updateEntries = logs.filter(
      (l: any) =>
        l.entityType === 'veterinarian' &&
        l.action === 'UPDATE' &&
        l.userEmail === 'reaudit@example.com',
    );
    expect(updateEntries.length).toBe(1);
    const entry = updateEntries[0];
    expect(entry.fieldName).toBe('password_hash,profile');
    expect(entry.oldValue).toContain('Dr. Initial Name');
    expect(entry.newValue).toContain('Dr. Renamed');
    expect(entry.newValue).toContain('"password_hash_changed":true');
    expect(entry.reasonForChange).toBeTruthy();
  });

  it('does not flag a password change when the password is unchanged', async () => {
    const { result } = renderHook(() => useMutateAction(simpleRegisterVetAction));
    const [register] = result.current;

    await act(async () => {
      await register({
        fullName: 'Dr. Stable',
        email: 'stable@example.com',
        phone: null,
        passwordHash: 'same-hash',
        licenseNumber: 'LIC-200',
        hospitalAffiliation: 'Hospital A',
        signatureText: 'Dr. Stable',
      });
    });

    await act(async () => {
      await register({
        fullName: 'Dr. Stable Updated',
        email: 'stable@example.com',
        phone: '555-0200',
        passwordHash: 'same-hash', // unchanged
        licenseNumber: 'LIC-200',
        hospitalAffiliation: 'Hospital A',
        signatureText: 'Dr. Stable Updated',
      });
    });

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const updateEntries = logs.filter(
      (l: any) =>
        l.entityType === 'veterinarian' &&
        l.action === 'UPDATE' &&
        l.userEmail === 'stable@example.com',
    );
    expect(updateEntries.length).toBe(1);
    const entry = updateEntries[0];
    expect(entry.fieldName).toBe('profile'); // not password_hash,profile
    expect(entry.newValue).toContain('"password_hash_changed":false');
  });
});
