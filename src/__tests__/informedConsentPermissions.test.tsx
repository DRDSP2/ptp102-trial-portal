import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '@/context/AuthContext';
import { InformedConsentWorkflow } from '@/components/InformedConsentWorkflow';
import type { Patient } from '@/types/patient';

vi.mock('jspdf', () => ({
  default: class MockJsPDF {
    save = vi.fn();
    text = vi.fn();
    setFontSize = vi.fn();
    setFont = vi.fn();
    setTextColor = vi.fn();
    setFillColor = vi.fn();
    rect = vi.fn();
    splitTextToSize = vi.fn().mockReturnValue([]);
    setPage = vi.fn();
    addPage = vi.fn();
    addImage = vi.fn();
    output = vi.fn((type: string) => (type === 'bloburl' ? 'blob:mock-url' : 'data:application/pdf;base64,mock'));
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [null, {}] };
  },
}));

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
        vetEmail={role === 'vet' ? email : patient.owner_email ?? undefined}
        onComplete={() => {}}
      />
    </AuthProvider>
  );
  return { patient };
}

describe('InformedConsentWorkflow permissions', () => {
  beforeEach(() => {
    localStorage.clear();
    window.alert = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('lets an admin sign digitally and records a CONSENT_DIGITALLY_SIGNED audit', async () => {
    seedAuth('admin', 'admin@example.com');
    renderWithRole('admin', 'admin@example.com', { status: 'pending' });
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Sign Digitally/i }));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < 5; i++) {
      await user.click(checkboxes[i]);
    }

    await user.type(screen.getByTestId('typed-signature-input'), 'Jane Doe');
    await user.type(screen.getByTestId('owner-printed-name-input'), 'Jane Doe');
    await user.type(screen.getByTestId('pi-signature-input'), 'Dr Vet');

    await user.click(screen.getByRole('button', { name: /Confirm Digital Signature/i }));

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const signedLog = logs.find((log: { action: string }) => log.action === 'CONSENT_DIGITALLY_SIGNED');
      expect(signedLog).toBeTruthy();
      expect(signedLog.userEmail).toBe('admin@example.com');
    });

    const consents = JSON.parse(localStorage.getItem('ptp102_mock_informed_consents') || '[]');
    expect(consents[0].status).toBe('signed');
    expect(consents[0].signature_method).toBe('digital');
  });

  it('lets a vet upload a scanned signed consent and records a CONSENT_SCAN_UPLOADED audit', async () => {
    seedAuth('vet', 'vet@example.com');
    renderWithRole('vet', 'vet@example.com', { status: 'pending' });
    expect(screen.queryByText(/You do not have permission/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    const fileInput = screen.getByTestId('scanned-consent-input');
    const file = new File(['scanned-signature'], 'consent.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: /Upload Scanned Signed Consent/i }));

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const uploadLog = logs.find((log: { action: string }) => log.action === 'CONSENT_SCAN_UPLOADED');
      expect(uploadLog).toBeTruthy();
      expect(uploadLog.userEmail).toBe('vet@example.com');
    });

    const consents = JSON.parse(localStorage.getItem('ptp102_mock_informed_consents') || '[]');
    expect(consents[0].status).toBe('signed');
    expect(consents[0].signature_method).toBe('scanned');
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

  it('lets an admin download the blank PDF before the cooling-off period starts', async () => {
    seedAuth('admin', 'admin@example.com');
    renderWithRole('admin', 'admin@example.com');

    const downloadBtn = screen.getByRole('button', { name: /Download Blank PDF/i });
    expect(downloadBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(downloadBtn);

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const generateLog = logs.find((log: { action: string; entityType: string }) => log.action === 'GENERATE' && log.entityType === 'patient');
      expect(generateLog).toBeTruthy();
      expect(generateLog.userEmail).toBe('admin@example.com');
    });
  });

  it('lets a vet download the blank PDF while reviewing the consent before cooling-off', async () => {
    seedAuth('vet', 'vet@example.com');
    renderWithRole('vet', 'vet@example.com');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Begin Informed Consent Process/i }));

    const reviewDownloadBtn = screen.getByRole('button', { name: /Download Blank PDF for Owner Review\/Signature/i });
    expect(reviewDownloadBtn).toBeInTheDocument();

    await user.click(reviewDownloadBtn);

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const generateLog = logs.find((log: { action: string; entityType: string }) => log.action === 'GENERATE' && log.entityType === 'patient');
      expect(generateLog).toBeTruthy();
      expect(generateLog.userEmail).toBe('vet@example.com');
    });
  });
});
