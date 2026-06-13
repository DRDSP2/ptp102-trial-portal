import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useMutateAction } from '@uibakery/data';
import { AuthProvider } from '@/context/AuthContext';
import { DashboardPage } from '@/pages/DashboardPage';
import createSupplyShipmentAction from '@/actions/createSupplyShipment';
import type { ReactNode } from 'react';

function seedAuth(role: 'admin' | 'vet', email: string) {
  localStorage.setItem(
    'laminitis_auth_state',
    JSON.stringify({ role, email, termsAccepted: true, pendingApproval: false })
  );
}

function seedVets() {
  localStorage.setItem(
    'ptp102_mock_vets',
    JSON.stringify([
      {
        id: 1,
        full_name: 'Dr Alice Vet',
        email: 'alice@example.com',
        phone: '+1 555-0101',
        password_hash: 'hash',
        license_number: 'VET-001',
        hospital_affiliation: 'Davis Equine Clinic',
        tc_accepted: true,
        tc_accepted_at: new Date().toISOString(),
        signature_text: null,
        verification_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin@example.com',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        full_name: 'Dr Bob Vet',
        email: 'bob@example.com',
        phone: '+1 555-0102',
        password_hash: 'hash',
        license_number: 'VET-002',
        hospital_affiliation: 'Sacramento Horse Hospital',
        tc_accepted: true,
        tc_accepted_at: new Date().toISOString(),
        signature_text: null,
        verification_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin@example.com',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  );
}

function seedQualification(vetId: number, vetEmail: string) {
  localStorage.setItem(
    'ptp102_mock_investigator_quals',
    JSON.stringify([
      {
        id: 1,
        veterinarian_id: vetId,
        vet_email: vetEmail,
        protocol_experience: 'experienced',
        qualification_status: 'approved',
        qualified_at: new Date().toISOString(),
        reviewed_by: 'admin@example.com',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  );
}

function renderDashboard(role: 'admin' | 'vet', email: string) {
  seedAuth(role, email);
  render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderHook<T>(hook: () => T, wrapper?: (props: { children: ReactNode }) => JSX.Element) {
  const result: { current: T } = { current: undefined as unknown as T };
  function Wrapper() {
    result.current = hook();
    return null;
  }
  if (wrapper) {
    render(<wrapper><Wrapper /></wrapper>);
  } else {
    render(<Wrapper />);
  }
  return result;
}

async function createShipmentForVet(vetId: number, vetEmail: string, batchLotNumber: string) {
  const hook = renderHook(() => useMutateAction(createSupplyShipmentAction));
  let created: any[] | null = null;
  await act(async () => {
    created = (await hook.current[0]({
      productName: 'PTP-102',
      batchLotNumber,
      quantityVials: 5,
      bottleVolumeMl: 100,
      lowThreshold: 1,
      shippedToVeterinarianId: vetId,
      shippedToVeterinarianEmail: vetEmail,
      shippedToVeterinarianName: `Dr Vet ${vetId}`,
      shipmentStatus: 'pending',
      shipmentDate: new Date().toISOString(),
      expectedDeliveryDate: null,
      trackingNumber: 'TRACK-001',
      carrier: 'FedEx',
      expirationDate: null,
      shipmentNotes: null,
    })) as any[] | null;
  });
  return created;
}

describe('Supply shipment visibility between admin and vet clinic', () => {
  beforeEach(() => {
    localStorage.clear();
    seedVets();
  });

  it('creates a shipment linked to the selected clinic/vet ID and email', async () => {
    const created = await createShipmentForVet(1, 'alice@example.com', 'BATCH-ALICE-001');
    expect(created).toBeTruthy();
    expect(created!.length).toBeGreaterThan(0);
    const shipment = created![0];
    expect(shipment.shipped_to_veterinarian_id).toBe(1);
    expect(shipment.shipped_to_veterinarian_email).toBe('alice@example.com');
    expect(shipment.batch_lot_number).toBe('BATCH-ALICE-001');
    expect(shipment.quantity_vials).toBe(5);
  });

  it('shows the shipment on the admin Supply tab', async () => {
    await createShipmentForVet(1, 'alice@example.com', 'BATCH-ADMIN-001');
    renderDashboard('admin', 'admin@example.com');

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Supply/i }));

    await waitFor(() => {
      expect(screen.getByText('Supply Shipments')).toBeInTheDocument();
      expect(screen.getByText('BATCH-ADMIN-001')).toBeInTheDocument();
      expect(screen.getByText('Davis Equine Clinic')).toBeInTheDocument();
    });
  });

  it('shows the shipment on the assigned vet clinic Supply tab', async () => {
    seedQualification(1, 'alice@example.com');
    await createShipmentForVet(1, 'alice@example.com', 'BATCH-VET-001');
    renderDashboard('vet', 'alice@example.com');

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Supply/i }));

    await waitFor(() => {
      expect(screen.getByText('BATCH-VET-001')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('does not show another clinic shipment to the wrong vet', async () => {
    seedQualification(1, 'alice@example.com');
    await createShipmentForVet(2, 'bob@example.com', 'BATCH-BOB-001');
    renderDashboard('vet', 'alice@example.com');

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Supply/i }));

    await waitFor(() => {
      expect(screen.getByText('No shipments assigned to you yet.')).toBeInTheDocument();
    });
    expect(screen.queryByText('BATCH-BOB-001')).not.toBeInTheDocument();
  });
});
