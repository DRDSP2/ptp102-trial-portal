import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminLoginScreen } from '@/components/AdminLoginScreen';
import { ConsultantLoginScreen } from '@/components/ConsultantLoginScreen';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    loginAdmin: vi.fn(),
    loginConsultant: vi.fn(),
  }),
}));

vi.mock('@uibakery/data', () => ({
  useMutateAction: () => [vi.fn()],
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

const noop = vi.fn();

describe('staff login privacy', () => {
  it('uses an identity-neutral email placeholder on the consultant login', () => {
    render(<ConsultantLoginScreen onSuccess={noop} onBackToAccessSelection={noop} />);

    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('placeholder', 'your.email@example.com');
    expect(emailInput).toHaveAttribute('autocomplete', 'off');
  });

  it('uses an identity-neutral email placeholder on the admin login', () => {
    render(
      <AdminLoginScreen
        onSuccess={noop}
        onBackToAccessSelection={noop}
        onConsultantLogin={noop}
      />,
    );

    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('placeholder', 'your.email@example.com');
    expect(emailInput).toHaveAttribute('autocomplete', 'off');
  });
});
