import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NDASigningPage } from '@/deal-portal/pages/NDASigningPage';
import { NDAGate } from '@/deal-portal/components/NDAGate';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';
import { NDA_ACKNOWLEDGEMENTS } from '@/deal-portal/lib/ndaAcknowledgements';

vi.mock('@/deal-portal/lib/ndaPdf', () => ({
  generateNdaPdf: vi.fn(async () => new Blob(['mock NDA'], { type: 'application/pdf' })),
}));

vi.mock('@/deal-portal/lib/ndaEmail', () => ({
  sendNdaPendingAdminEmail: vi.fn().mockResolvedValue(undefined),
  sendNdaPendingInvestorEmail: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

const setupUser = () => userEvent.setup({ delay: null });

function buildMockAuth({ ndaSigned = false, templateVersion = 'v2.0-byrock' }: { ndaSigned?: boolean; templateVersion?: string } = {}) {
  const base = createMockSupabaseAuth({ tier: 'none', ndaSigned, templateVersion });
  let lastNdaInsert: Record<string, unknown> | null = null;

  const mockFrom = vi.fn((table: string) => {
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
                          signed_at: '2026-07-10T10:00:00.000Z',
                          expires_at: '2032-07-10T10:00:00.000Z',
                          template_version: templateVersion,
                          approval_status: 'approved',
                        }
                      : null,
                    error: ndaSigned ? null : { code: 'PGRST116' },
                  }),
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: ndaSigned
                      ? {
                          signed_at: '2026-07-10T10:00:00.000Z',
                          expires_at: '2032-07-10T10:00:00.000Z',
                          template_version: templateVersion,
                          approval_status: 'approved',
                        }
                      : null,
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          lastNdaInsert = payload;
          return Promise.resolve({ data: null, error: null });
        }),
      };
    }
    if (table === 'deal_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'dp-1', tier: 'none' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dp-1', tier: 'none' }, error: null }),
          })),
        })),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }
    if (table === 'deal_access_logs') {
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        })),
      })),
    };
  });

  const mockWithStorage = {
    ...base,
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'ndas/mock/nda.pdf' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.test/nda.pdf' } }),
      })),
    },
  };

  return {
    mock: mockWithStorage,
    getLastNdaInsert: () => lastNdaInsert,
  };
}

async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByLabelText(/Counterparty Legal Name/i)).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/Counterparty Legal Name/i), { target: { value: 'TestCo Ltd' } });
  await user.click(screen.getByRole('combobox', { name: /Entity Type/i }));
  await user.click(screen.getByRole('option', { name: /Corporation/i }));
  fireEvent.change(screen.getByLabelText(/Jurisdiction of Formation/i), { target: { value: 'Ireland' } });
  fireEvent.change(screen.getByLabelText(/Full Registered Address/i), { target: { value: '123 Test Street, Dublin, Ireland' } });
  fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'test@testco.ie' } });
  fireEvent.change(screen.getByLabelText(/Contact Name/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/Contact Title/i), { target: { value: 'Director' } });
  await user.click(screen.getByRole('combobox', { name: /Estimated Number of Representatives/i }));
  await user.click(screen.getByRole('option', { name: /1–5/i }));
  fireEvent.change(screen.getByLabelText(/Project Purpose/i), { target: { value: 'Evaluate PTP-102 licensing opportunity' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /North America/i }));
}

async function advanceToStep3(user: ReturnType<typeof userEvent.setup>) {
  await fillStep1(user);
  fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /I Have Read the Agreement/i })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /I Have Read the Agreement/i }));
  await waitFor(() => expect(screen.getByText(/Legal Acknowledgements/i)).toBeInTheDocument());
}

function checkAcks(count: number = NDA_ACKNOWLEDGEMENTS.length) {
  const checkboxes = NDA_ACKNOWLEDGEMENTS
    .slice(0, count)
    .map((ack) => screen.getByRole('checkbox', { name: ack.label }));
  act(() => {
    checkboxes.forEach((checkbox) => checkbox.click());
  });
}

function fillStep4() {
  fireEvent.change(screen.getByLabelText(/Signer Full Name/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/Signer Title/i), { target: { value: 'Director' } });
  const dateInput = screen.getByLabelText(/Signature Date/i);
  fireEvent.change(dateInput, { target: { value: '2026-07-10' } });
  fireEvent.change(screen.getByLabelText(/Electronic Signature/i), { target: { value: 'Jane Doe' } });
}

describe('NDA v2.0 Signing', () => {
  it('requires all 19 acknowledgements to be checked', async () => {
    const user = setupUser();
    const { mock } = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <NDASigningPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await advanceToStep3(user);

    // Verify 19 acknowledgement checkboxes are present
    const ackCheckboxes = NDA_ACKNOWLEDGEMENTS.map((ack) => screen.getByRole('checkbox', { name: ack.label }));
    expect(ackCheckboxes).toHaveLength(19);

    // Check only 18 of 19
    checkAcks(18);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByText(/is required/i)).toBeInTheDocument());

    // Check the last one
    fireEvent.click(ackCheckboxes[18]);
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByLabelText(/Signer Full Name/i)).toBeInTheDocument());
  });

  it('captures counterparty_entity_type and counterparty_jurisdiction in the submitted record', async () => {
    const user = setupUser();
    const { mock, getLastNdaInsert } = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <NDASigningPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await advanceToStep3(user);
    checkAcks();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByLabelText(/Signer Full Name/i)).toBeInTheDocument());
    fillStep4();
    fireEvent.click(screen.getByRole('button', { name: /Execute Mutual NDA/i }));

    await waitFor(() => {
      const insert = getLastNdaInsert();
      expect(insert).not.toBeNull();
      expect(insert?.counterparty_entity_type).toBe('Corporation');
      expect(insert?.counterparty_jurisdiction).toBe('Ireland');
    });
  });

  it('submits all 19 acknowledgement booleans as true', async () => {
    const user = setupUser();
    const { mock, getLastNdaInsert } = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <NDASigningPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await advanceToStep3(user);
    checkAcks();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByLabelText(/Signer Full Name/i)).toBeInTheDocument());
    fillStep4();
    fireEvent.click(screen.getByRole('button', { name: /Execute Mutual NDA/i }));

    await waitFor(() => {
      const insert = getLastNdaInsert();
      expect(insert).not.toBeNull();
      for (const ack of NDA_ACKNOWLEDGEMENTS) {
        expect(insert?.[ack.id]).toBe(true);
      }
    });
  });

  it('submits governing_law Ireland and venue Dublin, Ireland', async () => {
    const user = setupUser();
    const { mock, getLastNdaInsert } = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <NDASigningPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await advanceToStep3(user);
    checkAcks();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByLabelText(/Signer Full Name/i)).toBeInTheDocument());
    fillStep4();
    fireEvent.click(screen.getByRole('button', { name: /Execute Mutual NDA/i }));

    await waitFor(() => {
      const insert = getLastNdaInsert();
      expect(insert?.governing_law).toBe('Ireland');
      expect(insert?.venue).toBe('Dublin, Ireland');
      expect(insert?.company_notice_email).toBe('info@byrocktechnologies.com');
    });
  });

  it('renders Byrock/Ireland details and excludes Cencora/Delaware references', async () => {
    const user = setupUser();
    const { mock } = buildMockAuth();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <NDASigningPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await fillStep1(user);
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /I Have Read the Agreement/i })).toBeInTheDocument());

    const text = document.body.textContent || '';
    expect(text).toContain('Byrock Technologies Ltd');
    expect(text).toContain('Ireland');
    expect(text).toContain('info@byrocktechnologies.com');
    expect(text).not.toContain('Cencora');
    expect(text).not.toContain('Delaware');
    expect(text).not.toContain('amerisourcebergen');
  });
});

describe('NDA v2.0 Gate', () => {
  it('redirects to /deal/nda when templateVersion is v1.0', async () => {
    const { mock } = buildMockAuth({ ndaSigned: true, templateVersion: 'v1.0' });
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <Routes>
            <Route path="/" element={<NDAGate><div data-testid="gated-content">Gated</div></NDAGate>} />
            <Route path="/deal/nda" element={<div>NDA Page</div>} />
            <Route path="/deal/signup" element={<div>Signup Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('NDA Page')).toBeInTheDocument());
  });

  it('allows access when templateVersion is v2.0-byrock', async () => {
    const { mock } = buildMockAuth({ ndaSigned: true, templateVersion: 'v2.0-byrock' });
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mock as never}>
          <Routes>
            <Route path="/" element={<NDAGate><div data-testid="gated-content">Gated</div></NDAGate>} />
            <Route path="/deal/nda" element={<div>NDA Page</div>} />
            <Route path="/deal/signup" element={<div>Signup Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('gated-content')).toBeInTheDocument());
  });
});
