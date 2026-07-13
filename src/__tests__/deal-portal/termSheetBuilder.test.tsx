import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TermSheetBuilder } from '@/deal-portal/components/TermSheetBuilder';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

describe('TermSheetBuilder', () => {
  it('renders editable form and calls onPropose with valid data', async () => {
    const onPropose = vi.fn();
    const mockAuth = createMockSupabaseAuth({ tier: 'exclusive' });
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <TermSheetBuilder editable onPropose={onPropose} />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Term Sheet Builder')).toBeInTheDocument());

    const upfrontInput = screen.getByLabelText('Upfront Fee (USD)');
    fireEvent.change(upfrontInput, { target: { value: '2000000' } });

    const royaltyInput = screen.getByLabelText('Royalty Rate (%)');
    fireEvent.change(royaltyInput, { target: { value: '8' } });

    const form = screen.getByTestId('term-sheet-form');
    fireEvent.submit(form);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(onPropose).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'north_america',
        upfront_fee: 2000000,
        royalty_rate: 0.08,
        exclusivity_months: 6,
        sublicensing_allowed: false,
      }),
      expect.anything(),
    );
  });

  it('shows stored fractional royalty rates as percentages and saves fractions', async () => {
    const onPropose = vi.fn();
    const mockAuth = createMockSupabaseAuth({ tier: 'exclusive' });
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider overrideClient={mockAuth as never}>
          <TermSheetBuilder
            editable
            onPropose={onPropose}
            initialValues={{ royalty_rate: 0.05 }}
          />
        </AuthProvider>
      </MemoryRouter>,
    );

    const royaltyInput = await screen.findByLabelText('Royalty Rate (%)');
    expect(royaltyInput).toHaveValue(5);

    fireEvent.change(royaltyInput, { target: { value: '7.5' } });
    fireEvent.submit(screen.getByTestId('term-sheet-form'));

    await waitFor(() => {
      expect(onPropose).toHaveBeenCalledWith(
        expect.objectContaining({ royalty_rate: 0.075 }),
        expect.anything(),
      );
    });
  });
});
