import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingApprovalScreen } from '@/components/PendingApprovalScreen';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/contact';

vi.mock('@uibakery/data', () => ({
  useLoadAction: () => [[], false, null, vi.fn()],
}));

describe('support contact configuration', () => {
  it('uses drsp@pm.me in Contact Support mailto and fallback text', () => {
    render(
      <PendingApprovalScreen
        email="vet@example.com"
        onApproved={vi.fn()}
        onRejected={vi.fn()}
      />,
    );

    expect(screen.getByText(SUPPORT_EMAIL)).toBeInTheDocument();
    expect(supportMailto('Account Approval Status - vet@example.com')).toBe(
      'mailto:drsp@pm.me?subject=Account%20Approval%20Status%20-%20vet%40example.com',
    );
  });
});
