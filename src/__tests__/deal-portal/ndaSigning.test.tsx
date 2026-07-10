import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NDAGate } from '@/deal-portal/components/NDAGate';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

function buildMockAuth(ndaSigned: boolean) {
  const base = createMockSupabaseAuth({ tier: 'evaluation' });
  return {
    ...base,
    from: vi.fn((table: string) => {
      if (table === 'ndas') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: ndaSigned
                        ? {
                            signed_at: new Date().toISOString(),
                            expires_at: null,
                          }
                        : null,
                      error: ndaSigned ? null : { code: 'PGRST116' },
                    }),
                  })),
                })),
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
          })),
        })),
      };
    }),
  };
}

describe('NDA Gate', () => {
  it('renders children when NDA is signed', async () => {
    const mockAuth = buildMockAuth(true);
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider overrideClient={mockAuth as never}>
          <Routes>
            <Route path="/" element={<NDAGate><div data-testid="gated-content">Gated</div></NDAGate>} />
            <Route path="/deal/nda" element={<div>NDA Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('gated-content')).toBeInTheDocument());
  });

  it('redirects to /deal/nda when NDA is not signed', async () => {
    const mockAuth = buildMockAuth(false);
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider overrideClient={mockAuth as never}>
          <Routes>
            <Route path="/" element={<NDAGate><div data-testid="gated-content">Gated</div></NDAGate>} />
            <Route path="/deal/nda" element={<div>NDA Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('NDA Page')).toBeInTheDocument());
  });
});
