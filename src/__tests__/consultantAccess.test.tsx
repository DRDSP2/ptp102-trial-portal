import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/pages/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { AppShell } from '@/components/AppShell';
import { seedAuth, clearAuthMocks } from './utils/supabaseMock';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Consultant role — dashboard + access gating', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
  });

  it('consultant sees read-only clinical tabs but NOT admin tabs', async () => {
    seedAuth('consultant', 'mark@hughesvet.com');

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // Read-only clinical / compliance tabs are visible to a consultant.
    await waitFor(() => {
      expect(screen.getAllByText(/Compliance/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/X-Ray/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Audit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Patients/i).length).toBeGreaterThan(0);

    // Admin-only tabs are hidden from consultants (Phase 0 read-only gating).
    // Role-scoped queries so stray body text (e.g. "across all veterinarians"
    // in the Patients subtitle) can't produce false matches.
    expect(screen.queryAllByRole('tab', { name: /Supply/i }).length).toBe(0);
    expect(screen.queryAllByRole('tab', { name: /Veterinarians/i }).length).toBe(0);
    expect(screen.queryAllByRole('tab', { name: /Deal Room/i }).length).toBe(0);
  });

  it('consultant sees a Consultant badge and Change Password button in the header', async () => {
    seedAuth('consultant', 'mark@hughesvet.com');

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ProtectedRoute>
            <AppShell>
              <div>content</div>
            </AppShell>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Consultant/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
  });
});

describe('Consultant role — forced first-login password reset', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
  });

  it('shows a non-dismissable reset dialog when must_reset_password is set', async () => {
    seedAuth('consultant', 'mark@hughesvet.com', undefined, true);

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ProtectedRoute>
            <AppShell>
              <div>content</div>
            </AppShell>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Set a new password/i).length).toBeGreaterThan(0);
    });
  });

  it('clears the reset flag after changing the password', async () => {
    seedAuth('consultant', 'mark@hughesvet.com', undefined, true);
    (supabase.auth.updateUser as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ error: null }) // password update
      .mockResolvedValueOnce({ error: null }); // metadata update

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ProtectedRoute>
            <AppShell>
              <div>content</div>
            </AppShell>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Set a new password/i).length).toBeGreaterThan(0);
    });

    const newPassword = screen.getByLabelText('New password');
    const confirm = screen.getByLabelText('Confirm new password');
    // React Testing Library's type() triggers the controlled input onChange.
    const userEvent = await import('@testing-library/user-event');
    const user = userEvent.default.setup();
    await user.type(newPassword, 'NewPassw0rd!');
    await user.type(confirm, 'NewPassw0rd!');
    await user.click(screen.getByRole('button', { name: /Save new password/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalled();
    });
    // The second call clears the forced-reset flag in user metadata.
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { must_reset_password: false } });
    });
  });
});
