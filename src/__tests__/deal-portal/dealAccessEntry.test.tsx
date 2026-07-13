import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthSelectionPage } from '@/pages/AuthSelectionPage';

describe('Deal access entry', () => {
  it('offers returning deal users a login path and new users a signup path', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<AuthSelectionPage />} />
          <Route path="/deal/login" element={<div data-testid="deal-login">Deal login</div>} />
          <Route path="/deal/signup" element={<div data-testid="deal-signup">Deal signup</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Company \/ Investor Login/i }));
    expect(screen.getByTestId('deal-login')).toBeInTheDocument();
  });
});
