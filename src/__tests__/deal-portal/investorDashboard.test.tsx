import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { InvestorDashboard } from '@/deal-portal/components/InvestorDashboard';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const updates = [
  { id: 'u1', title: 'Q1 Board Minutes', content: 'Board approved the CMC budget.', update_type: 'board_minutes', published_at: new Date().toISOString(), created_by: null, created_at: new Date().toISOString() },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'evaluation', role: 'investor' });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'investor_updates') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: updates,
              error: null,
            })),
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

describe('InvestorDashboard', () => {
  it('renders investor updates and KPIs', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <InvestorDashboard />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Investor Updates')).toBeInTheDocument());

    expect(screen.getByText('Q1 Board Minutes')).toBeInTheDocument();
    expect(screen.getByText('$598.6M')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
  });
});
