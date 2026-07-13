import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RegionMarketplace } from '@/deal-portal/components/RegionMarketplace';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const mockRegions = [
  { region: 'north_america', status: 'available', base_licence_fee: 1500000, royalty_rate: 0.05, licensee_company: null, licensee_user_id: null, exclusivity_expires_at: null, notes: null },
  { region: 'eu', status: 'under_evaluation', base_licence_fee: 1500000, royalty_rate: 0.05, licensee_company: 'EvalCo', licensee_user_id: null, exclusivity_expires_at: null, notes: null },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'exclusive' });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'region_marketplace') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockRegions,
              error: null,
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
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

describe('RegionMarketplace', () => {
  it('lists regions and allows reserving an available region', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <RegionMarketplace />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('North America')).toBeInTheDocument());

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Under Evaluation')).toBeInTheDocument();

    const reserveButton = screen.getByText('Reserve Region');
    await userEvent.click(reserveButton);

    await waitFor(() => {
      expect(mockAuth.from).toHaveBeenCalledWith('region_marketplace');
    });
  });
});
