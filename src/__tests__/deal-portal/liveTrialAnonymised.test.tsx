import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LiveTrialDashboard } from '@/deal-portal/components/LiveTrialDashboard';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const mockData = [
  { trial_id: 'LAM-00007', horse_id: 'Silver-Moon', event_type: 'treatment', hour: 0, dose_mg: 535, outcome: 'No complications', pain_score: null, event_timestamp: '2026-01-01T00:00:00Z' },
  { trial_id: 'LAM-00007', horse_id: 'Golden-Sun', event_type: 'assessment', hour: 72, outcome: 'Favorable', pain_score: 1, event_timestamp: '2026-01-03T12:00:00Z' },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'diligence' });
  return {
    ...base,
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === 'trial_events_deal_room') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockData,
                error: null,
              })),
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

describe('LiveTrialDashboard', () => {
  it('renders anonymised trial data without vet PII', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <LiveTrialDashboard />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Silver-Moon')).toBeInTheDocument();
      expect(screen.getByText('535mg IV')).toBeInTheDocument();
      expect(screen.getByText('Favorable')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Dr\. /)).not.toBeInTheDocument();
    expect(screen.queryByText(/owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
  });
});
