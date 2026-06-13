import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '@/context/AuthContext';
import { InformedConsentWorkflow } from '@/components/InformedConsentWorkflow';
import type { Patient } from '@/types/patient';

function createPatient(): Patient {
  return {
    id: 1,
    horse_name: 'Midnight Thunder',
    age: 10,
    breed: 'Thoroughbred',
    weight: 500,
    sex: 'Gelding',
    owner_name: 'Jane Doe',
    owner_contact: '+1 555-0100',
    owner_email: 'jane@example.com',
    owner_phone: '+1 555-0100',
    owner_address: '123 Stable Lane',
    owner_relationship: 'owner',
    horse_microchip: '985112000000000',
    enrollment_date: new Date().toISOString(),
    trial_status: 'enrolled',
    screening_status: 'approved',
    screening_notes: null,
    screened_by: null,
    screened_at: null,
    eligibility_verified: true,
    protocol_start_time: null,
    consent_date: null,
    consent_id: null,
  } as Patient;
}

function seedAuth(role: 'admin' | 'vet' | null, email?: string) {
  if (role) {
    localStorage.setItem(
      'laminitis_auth_state',
      JSON.stringify({ role, email: email ?? `${role}@example.com`, termsAccepted: true, pendingApproval: false })
    );
  } else {
    localStorage.removeItem('laminitis_auth_state');
  }
}

function renderWithRole(role: 'admin' | 'vet' | null, email?: string, consentOverride?: Record<string, unknown>) {
  const patient = createPatient();
  if (consentOverride) {
    localStorage.setItem(
      'ptp102_mock_informed_consents',
      JSON.stringify([
        {
          id: 1,
          patient_id: patient.id,
          vet_id: null,
          vet_email: email,
          vet_phone: null,
          owner_name: patient.owner_name,
          owner_address: patient.owner_address,
          owner_phone: patient.owner_phone,
          owner_email: patient.owner_email,
          owner_relationship: patient.owner_relationship,
          horse_name: patient.horse_name,
          horse_breed: patient.breed,
          horse_age: patient.age,
          horse_weight: patient.weight,
          horse_microchip: patient.horse_microchip,
          section_acknowledgments: {},
          owner_signature: null,
          witness_name: null,
          witness_signature: null,
          investigator_signature: null,
          icf_pdf_url: null,
          scanned_document_url: null,
          signature_method: null,
          signed_at: null,
          can_sign_after: new Date(Date.now() - 1000).toISOString(),
          status: 'pending',
          admin_notes: null,
          admin_reviewed_by: null,
          admin_reviewed_at: null,
          sent_at: null,
          sent_to: null,
          audit_log: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...consentOverride,
        },
      ])
    );
  }
  render(
    <AuthProvider>
      <InformedConsentWorkflow
        patientId={patient.id}
        patient={patient}
        vetEmail={role === 'vet' ? email : patient.owner_email}
        onComplete={() => {}}
      />
    </AuthProvider>
  );
  return { patient };
}

describe('InformedConsentWorkflow permissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows admins to view the consent workflow', () => {
    seedAuth('admin', 'admin@example.com');
    renderWithRole('admin', 'admin@example.com');
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Informed Consent Required/i)).toBeInTheDocument();
  });

  it('allows vets to view the consent workflow', () => {
    seedAuth('vet', 'vet@example.com');
    renderWithRole('vet', 'vet@example.com');
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Informed Consent Required/i)).toBeInTheDocument();
  });

  it('shows the permission error for unauthenticated users', () => {
    seedAuth(null);
    renderWithRole(null);
    expect(screen.getByText(/You do not have permission to view the informed consent workflow/i)).toBeInTheDocument();
  });

  it('lets an admin generate/download a PDF and records a GENERATE audit', async () => {
    seedAuth('admin', 'admin@example.com');
    renderWithRole('admin', 'admin@example.com', { status: 'pending' });
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Print, Sign & Upload/i }));
    const downloadBtn = screen.getByRole('button', { name: /Download Blank PDF/i });
    expect(downloadBtn).toBeInTheDocument();

    await user.click(downloadBtn);
    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const generateLog = logs.find((log: { action: string }) => log.action === 'GENERATE');
      expect(generateLog).toBeTruthy();
      expect(generateLog.userEmail).toBe('admin@example.com');
    });
  });

  it('lets a vet generate/download a PDF and records a GENERATE audit', async () => {
    seedAuth('vet', 'vet@example.com');
    renderWithRole('vet', 'vet@example.com', { status: 'pending' });
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Print, Sign & Upload/i }));
    const downloadBtn = screen.getByRole('button', { name: /Download Blank PDF/i });
    expect(downloadBtn).toBeInTheDocument();

    await user.click(downloadBtn);
    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const generateLog = logs.find((log: { action: string }) => log.action === 'GENERATE');
      expect(generateLog).toBeTruthy();
      expect(generateLog.userEmail).toBe('vet@example.com');
    });
  });

  it('logs permission decisions for debugging', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    seedAuth('admin', 'admin@example.com');
    renderWithRole('admin', 'admin@example.com');
    const permissionLogs = infoSpy.mock.calls.filter((call) =>
      String(call[0]).includes('[InformedConsentWorkflow] permission decision')
    );
    expect(permissionLogs.length).toBeGreaterThanOrEqual(2);
    const decisionPayload = permissionLogs[0][1] as Record<string, unknown>;
    expect(decisionPayload.role).toBe('admin');
    expect(decisionPayload.resourceId).toBe(1);
    expect(decisionPayload.decision).toBe(true);
    infoSpy.mockRestore();
  });
});
