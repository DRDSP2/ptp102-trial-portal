import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedDealRoute } from '@/deal-portal/components/ProtectedDealRoute';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

function renderWithRouter(children: React.ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={children} />
        <Route path="/deal/signup" element={<div data-testid="signup">Signup</div>} />
        <Route path="/deal/overview" element={<div data-testid="overview">Overview</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Deal Portal Auth', () => {
  it('redirects unauthenticated users to /deal/signup', async () => {
    renderWithRouter(
      <AuthProvider>
        <ProtectedDealRoute minimumTier="evaluation">
          <div>Protected</div>
        </ProtectedDealRoute>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('signup')).toBeInTheDocument());
  });

  it('allows evaluation tier users to view overview', async () => {
    const mockAuth = createMockSupabaseAuth({ tier: 'evaluation' });
    renderWithRouter(
      <AuthProvider overrideClient={mockAuth as never}>
        <ProtectedDealRoute minimumTier="evaluation">
          <div data-testid="protected">Protected</div>
        </ProtectedDealRoute>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());
  });

  it('blocks evaluation tier from diligence content', async () => {
    const mockAuth = createMockSupabaseAuth({ tier: 'evaluation' });
    renderWithRouter(
      <AuthProvider overrideClient={mockAuth as never}>
        <ProtectedDealRoute minimumTier="diligence">
          <div>Protected</div>
        </ProtectedDealRoute>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('overview')).toBeInTheDocument());
  });
});
