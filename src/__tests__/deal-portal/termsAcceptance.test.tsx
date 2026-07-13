import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { DealTermsAcceptance } from '@/deal-portal/components/DealTermsAcceptance';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

function buildMockAuth({
  existingConsent = null,
  insertError = null,
}: {
  existingConsent?: { id: string } | null;
  insertError?: { message: string } | null;
} = {}) {
  const base = createMockSupabaseAuth({ tier: 'none' });
  let lastConsentInsert: Record<string, unknown> | null = null;

  const mockFrom = vi.fn((table: string) => {
    if (table === 'deal_access_logs') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: existingConsent, error: null }),
              })),
            })),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          lastConsentInsert = payload;
          return Promise.resolve({ data: null, error: insertError });
        }),
      };
    }
    if (table === 'deal_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'dp-1',
                user_id: 'deal-mock-user-id',
                company: 'MockCo',
                role: 'licensee_eval',
                tier: 'none',
                nda_signed_at: null,
                nda_expires_at: null,
                stripe_customer_id: null,
                region_of_interest: null,
                created_at: '2026-07-13T00:00:00.000Z',
                updated_at: '2026-07-13T00:00:00.000Z',
              },
              error: null,
            }),
          })),
        })),
      };
    }
    return base.from(table);
  });

  return {
    mock: { ...base, from: mockFrom },
    getLastConsentInsert: () => lastConsentInsert,
  };
}

function renderTerms(mock: ReturnType<typeof buildMockAuth>['mock']) {
  return render(
    <AuthProvider overrideClient={mock as never}>
      <MemoryRouter initialEntries={['/deal/terms']}>
        <Routes>
          <Route path="/deal/terms" element={<DealTermsAcceptance />} />
          <Route path="/deal/nda" element={<div>NDA Page</div>} />
          <Route path="/deal/signup" element={<div>Signup Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('DealTermsAcceptance', () => {
  it('records terms and privacy consent before continuing to NDA', async () => {
    const user = userEvent.setup();
    const { mock, getLastConsentInsert } = buildMockAuth();

    renderTerms(mock);

    await user.click(screen.getByRole('checkbox', { name: /I accept the Terms of Service/i }));
    await user.click(screen.getByRole('checkbox', { name: /I accept the Privacy Policy/i }));
    await user.click(screen.getByRole('button', { name: /Continue to NDA/i }));

    await waitFor(() => expect(screen.getByText('NDA Page')).toBeInTheDocument());
    expect(getLastConsentInsert()).toMatchObject({
      user_id: 'deal-mock-user-id',
      action: 'terms_consent',
      document_type: 'deal_terms',
      action_detail: expect.stringContaining('Terms of Service and Privacy Policy accepted'),
    });
  });

  it('stays on the terms page and shows the consent error when recording fails', async () => {
    const user = userEvent.setup();
    const { mock } = buildMockAuth({ insertError: { message: 'RLS denied' } });

    renderTerms(mock);

    await user.click(screen.getByRole('checkbox', { name: /I accept the Terms of Service/i }));
    await user.click(screen.getByRole('checkbox', { name: /I accept the Privacy Policy/i }));
    await user.click(screen.getByRole('button', { name: /Continue to NDA/i }));

    await waitFor(() => {
      expect(screen.getByText('We could not record your consent. Please try again.')).toBeInTheDocument();
    });
    expect(screen.queryByText('NDA Page')).not.toBeInTheDocument();
  });

  it('continues without duplicating an existing terms consent record', async () => {
    const user = userEvent.setup();
    const { mock, getLastConsentInsert } = buildMockAuth({ existingConsent: { id: 'consent-1' } });

    renderTerms(mock);

    await user.click(screen.getByRole('checkbox', { name: /I accept the Terms of Service/i }));
    await user.click(screen.getByRole('checkbox', { name: /I accept the Privacy Policy/i }));
    await user.click(screen.getByRole('button', { name: /Continue to NDA/i }));

    await waitFor(() => expect(screen.getByText('NDA Page')).toBeInTheDocument());
    expect(getLastConsentInsert()).toBeNull();
  });
});
