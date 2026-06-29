import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { AppShell } from '@/components/AppShell';
import { CaseWorkspace } from '@/components/CaseWorkspace';
import { seedAuth, clearAuthMocks } from './utils/supabaseMock';

function seedShipments() {
  localStorage.setItem(
    'ptp102_mock_supply_shipments',
    JSON.stringify([
      {
        id: 1,
        product_name: 'PTP-102',
        batch_lot_number: 'BATCH-001',
        quantity_vials: 10,
        remaining_quantity: 8,
        bottle_volume_ml: 500,
        low_threshold: 2,
        shipment_status: 'received',
        shipped_to_veterinarian_id: 1,
        shipped_to_veterinarian_email: 'vet@example.com',
        shipped_to_veterinarian_name: 'Dr Vet',
        clinic_name: 'Equine Clinic',
        vet_full_name: 'Dr Vet',
        tracking_number: null,
        carrier: null,
        expected_delivery_date: null,
        expiration_date: null,
        shipment_notes: null,
        created_at: new Date().toISOString(),
        bottles_received_at_clinic: 10,
      },
    ])
  );
  localStorage.setItem(
    'ptp102_mock_vets',
    JSON.stringify([
      {
        id: 1,
        full_name: 'Dr Vet',
        email: 'vet@example.com',
        hospital_affiliation: 'Equine Clinic',
        verification_status: 'approved',
      },
    ])
  );
}

function seedPatient() {
  localStorage.setItem(
    'ptp102_mock_patients',
    JSON.stringify([
      {
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
        screening_status: 'pending_screening',
        screening_notes: null,
        screened_by: null,
        screened_at: null,
        eligibility_verified: true,
        protocol_start_time: null,
        consent_date: null,
        consent_id: null,
        enrolled_by_vet_email: 'vet@example.com',
      },
    ])
  );
}

describe('Admin navigation and role preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
  });

  it('renders the admin dashboard with admin-only tabs', async () => {
    seedAuth('admin', 'admin@example.com');
    seedShipments();
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell>
            <DashboardPage />
          </AppShell>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Patients/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Supply/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Audit/i })).toBeInTheDocument();
  });

  it('does not crash when clicking the Supply tab and shows the supply panel', async () => {
    seedAuth('admin', 'admin@example.com');
    seedShipments();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell>
            <DashboardPage />
          </AppShell>
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('Admin');
    await user.click(screen.getByRole('tab', { name: /Supply/i }));
    await waitFor(() => {
      expect(screen.getByText('Clinic Inventory Summary')).toBeInTheDocument();
      expect(screen.getByText('Supply Shipments')).toBeInTheDocument();
    });
  });

  it('does not crash when clicking the Audit tab and shows the audit viewer', async () => {
    seedAuth('admin', 'admin@example.com');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell>
            <DashboardPage />
          </AppShell>
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('Admin');
    await user.click(screen.getByRole('tab', { name: /Audit/i }));
    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });
  });

  it('preserves the admin role inside the patient case workspace', async () => {
    seedAuth('admin', 'admin@example.com');
    seedPatient();
    render(
      <MemoryRouter>
        <AuthProvider>
          <CaseWorkspace patientId={1} onBack={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Midnight Thunder' })).toBeInTheDocument();
      expect(screen.getByTitle('Click to cycle lock status (Admin only)')).toBeInTheDocument();
      expect(screen.getByText('Screening Required')).toBeInTheDocument();
    });
  });
});
