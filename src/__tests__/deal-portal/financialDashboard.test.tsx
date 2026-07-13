import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { FinancialDashboard } from '@/deal-portal/components/FinancialDashboard';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const projections = [
  { id: 'fp1', year: 2025, revenue: 598600000, cogs: 21031232, gross_profit: 577568768, operating_expenses: 268879956, ebit: 308688812, operating_cash_flow: 71227311, sam_cases: 598600, tam_cases: 1197000, price_per_treatment: 1000, cost_per_treatment: 35.12, gross_margin_percent: 96.5 },
  { id: 'fp2', year: 2026, revenue: 707600000, cogs: 24854912, gross_profit: 682745088, operating_expenses: 317880858, ebit: 364864230, operating_cash_flow: 84191986, sam_cases: 707600, tam_cases: 1179000, price_per_treatment: 1000, cost_per_treatment: 35.12, gross_margin_percent: 96.5 },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'diligence' });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'financial_projections') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: projections,
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

describe('FinancialDashboard', () => {
  it('renders financial projections and charts', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <FinancialDashboard />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Revenue vs COGS (USD Millions)')).toBeInTheDocument());

    expect(screen.getByText('Year 1 Revenue')).toBeInTheDocument();
    expect(screen.getByText('$598.6M')).toBeInTheDocument();
    expect(screen.getByText('Gross Margin Trend')).toBeInTheDocument();
  });
});
