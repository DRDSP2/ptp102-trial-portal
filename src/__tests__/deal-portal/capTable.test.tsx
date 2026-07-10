import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CapTableViewer } from '@/deal-portal/components/CapTableViewer';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const capTableData = [
  { id: 'ct-1', shareholder_name: 'Byrock Clinical Ltd', share_class: 'ordinary', shares: 800000, percentage: 80, vesting_schedule: null, is_employee_pool: false },
  { id: 'ct-2', shareholder_name: 'Dr. Daniel Shanahan-Prendergast', share_class: 'ordinary', shares: 100000, percentage: 10, vesting_schedule: null, is_employee_pool: false },
  { id: 'ct-3', shareholder_name: 'ESOP Pool', share_class: 'option', shares: 100000, percentage: 10, vesting_schedule: null, is_employee_pool: true },
];

function buildMockAuth({ role, tier }: { role: 'investor' | 'licensee_eval'; tier: 'evaluation' | 'diligence' | 'exclusive' }) {
  const base = createMockSupabaseAuth({ tier, role });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'cap_table_entries') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: capTableData,
              error: null,
            })),
          })),
        };
      }
      if (table === 'esop_grants') {
        return {
          select: vi.fn(() => ({
            data: [{ id: 'eg-1', participant_id: 'p-1', units: 50000, exercise_price: 0.01, vesting_schedule: null, grant_date: null, expiry_date: null }],
            error: null,
          })),
        };
      }
      if (table === 'deal_profiles') {
        return base.from(table);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      };
    }),
  };
}

describe('CapTableViewer', () => {
  it('hides shareholder names in anonymised mode for diligence users', async () => {
    const mockAuth = buildMockAuth({ role: 'licensee_eval', tier: 'diligence' });
    render(
      <MemoryRouter>
        <AuthProvider overrideClient={mockAuth as never}>
          <CapTableViewer />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Cap Table')).toBeInTheDocument());

    expect(screen.getByText('Anonymised View')).toBeInTheDocument();
    expect(screen.getAllByText('Confidential Holder').length).toBeGreaterThan(0);
    expect(screen.queryByText('Byrock Clinical Ltd')).not.toBeInTheDocument();
    expect(screen.queryByText('ESOP Grants')).not.toBeInTheDocument();
  });

  it('reveals full names and ESOP grants for investors', async () => {
    const mockAuth = buildMockAuth({ role: 'investor', tier: 'evaluation' });
    render(
      <MemoryRouter>
        <AuthProvider overrideClient={mockAuth as never}>
          <CapTableViewer />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Cap Table')).toBeInTheDocument());

    const showFullButton = screen.getByRole('button', { name: /show full/i });
    expect(showFullButton).toBeInTheDocument();
    await userEvent.click(showFullButton);

    await waitFor(() => {
      expect(screen.getByText('Full Investor View')).toBeInTheDocument();
      expect(screen.getByText('Byrock Clinical Ltd')).toBeInTheDocument();
      expect(screen.getByText('ESOP Grants')).toBeInTheDocument();
    });
  });
});
