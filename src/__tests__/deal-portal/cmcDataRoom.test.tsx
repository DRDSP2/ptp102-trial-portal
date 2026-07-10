import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CMCDataRoom } from '@/deal-portal/components/CMCDataRoom';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const milestones = [
  { id: 'm1', phase: '1', milestone_id: '1.1', title: 'API synthesis route finalised', target_month: 3, acceptance_criteria: '≥95% yield', status: 'pending', deliverables: ['Synthesis report'], budget_estimate_low: 500000, budget_estimate_high: 1500000 },
  { id: 'm2', phase: '2', milestone_id: '2.1', title: 'Assay method validation', target_month: 9, acceptance_criteria: 'RSD ≤2%', status: 'in_progress', deliverables: ['Validation report'], budget_estimate_low: 300000, budget_estimate_high: 800000 },
];

const documents = [
  { id: 'd1', category: 'cmc', title: 'CMC Development Plan', file_path: null, version: 'v1.0', access_tier_min: 'diligence', uploaded_by: null, created_at: new Date().toISOString() },
  { id: 'd2', category: 'regulatory', title: 'Module 3 Outline', file_path: null, version: 'v0.5', access_tier_min: 'exclusive', uploaded_by: null, created_at: new Date().toISOString() },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'diligence' });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'cmc_milestones') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: milestones,
              error: null,
            })),
          })),
        };
      }
      if (table === 'cmc_documents') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: documents,
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

describe('CMCDataRoom', () => {
  it('renders milestones and documents for diligence users', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter>
        <AuthProvider overrideClient={mockAuth as never}>
          <CMCDataRoom />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('CMC Development Timeline')).toBeInTheDocument());

    expect(screen.getByText('API synthesis route finalised')).toBeInTheDocument();
    expect(screen.getByText('Assay method validation')).toBeInTheDocument();
    expect(screen.getByText('CMC Development Plan')).toBeInTheDocument();
    expect(screen.getByText('Module 3 Outline')).toBeInTheDocument();
  });
});
