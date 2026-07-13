import { vi, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DealTermsAcceptance } from '@/deal-portal/components/DealTermsAcceptance';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'none' });
  const insert = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    insert,
    mock: {
      ...base,
      from: vi.fn((table: string) => {
        if (table === 'deal_access_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  })),
                })),
              })),
            })),
            insert,
          };
        }
        return base.from(table);
      }),
    },
  };
}

describe('DealTermsAcceptance', () => {
  it('persists ToS and privacy consent once before moving to the NDA', async () => {
    const user = userEvent.setup();
    const { mock, insert } = buildMockAuth();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <Routes>
            <Route path="/" element={<DealTermsAcceptance />} />
            <Route path="/deal/nda" element={<div data-testid="nda-page">NDA</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('checkbox', { name: /Terms of Service/i }));
    await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/i }));
    await user.click(screen.getByRole('button', { name: /Continue to NDA/i }));

    await waitFor(() => expect(screen.getByTestId('nda-page')).toBeInTheDocument());
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'terms_consent',
      document_type: 'deal_terms',
      action_detail: expect.stringContaining('Byrock Technologies Ltd'),
    }));
  });
});
