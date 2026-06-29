import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

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
import { seedAuth, clearAuthMocks } from './utils/supabaseMock';

/**
 * Regression test for the admin "Trial Data" tab crash.
 *
 * Symptom (before fix): clicking Trial Data threw a Radix Select
 * invariant — `<Select.Item /> must have a value prop that is not an
 * empty string.` — because the per-vet filter dropdown built its options
 * from `data.map(t => t.veterinarian_email)`, and any patient whose
 * `enrolled_by_vet_email` was null produced an empty-string entry. The
 * 12 seeded LAM-XXXXX patients all had null enrolled_by_vet_email, so
 * the crash hit on first render.
 */

function seedPatientsMissingVetEmail() {
  // Two patients with no enrolled_by_vet_email — replicates the seeded
  // LAM-00001..LAM-00012 state observed in the live database.
  localStorage.setItem(
    'ptp102_mock_patients',
    JSON.stringify([
      {
        id: 1,
        unique_id: 'LAM-00001',
        horse_name: 'Thunder Bay',
        age: 8,
        breed: 'Thoroughbred',
        weight: 525.5,
        sex: 'Gelding',
        owner_name: 'Sarah Mitchell',
        owner_contact: 'sarah@example.com',
        enrollment_date: '2025-10-15',
        trial_status: 'enrolled',
        screening_status: 'approved',
        eligibility_verified: true,
        laminitis_grade: 3,
        affected_limbs: 'Front Both',
        is_flagged: false,
        flag_reason: null,
        // enrolled_by_vet_email intentionally absent
      },
      {
        id: 2,
        unique_id: 'LAM-00002',
        horse_name: 'Midnight Star',
        age: 6,
        breed: 'Quarter Horse',
        weight: 485,
        sex: 'Mare',
        owner_name: 'John Peterson',
        owner_contact: 'john@example.com',
        enrollment_date: '2025-10-18',
        trial_status: 'enrolled',
        screening_status: 'approved',
        eligibility_verified: true,
        laminitis_grade: 2,
        affected_limbs: 'Front Both',
        is_flagged: false,
        flag_reason: null,
        // enrolled_by_vet_email intentionally absent
      },
    ]),
  );
  localStorage.setItem('ptp102_mock_vets', JSON.stringify([]));
  localStorage.setItem('ptp102_mock_treatments', JSON.stringify([]));
  localStorage.setItem('ptp102_mock_assessments', JSON.stringify([]));
}

describe('MasterTrialsTable — Trial Data tab does not crash on missing vet email', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
    // Capture any React/Radix error boundary logs for assertion. The
    // pre-fix Radix invariant logs a synchronous throw via console.error.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders the trials table when patient rows have no veterinarian email', async () => {
    seedAuth('admin', 'admin@example.com');
    seedPatientsMissingVetEmail();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell>
            <DashboardPage />
          </AppShell>
        </AuthProvider>
      </MemoryRouter>,
    );

    await screen.findByText('Admin');
    // Click the Trial Data tab. Pre-fix, this synchronously threw the
    // Radix Select invariant during render of the Veterinarians filter.
    await user.click(screen.getByRole('tab', { name: /Trials Data/i }));

    // The table header for the Master Trials block should render.
    await waitFor(() => {
      expect(screen.getByText('Master Trials Data')).toBeInTheDocument();
    });

    // Both patients should be visible by their unique trial IDs.
    expect(screen.getByText('LAM-00001')).toBeInTheDocument();
    expect(screen.getByText('LAM-00002')).toBeInTheDocument();

    // The Radix invariant must not have fired.
    const calls = errorSpy.mock.calls.flat().map((c) => String(c));
    const radixInvariant = calls.find((m) =>
      m.includes('A <Select.Item /> must have a value prop that is not an empty string'),
    );
    expect(radixInvariant).toBeUndefined();
  });
});
