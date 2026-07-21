import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { clearAuthMocks, seedAuth } from './utils/supabaseMock';

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

describe('configured consultant accounts', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
  });

  it.each(['mark@hughesvet.com', 'drdsp@protonmail.ch'])(
    'allows %s into the consultant workspace without forcing a password reset',
    async (email) => {
      seedAuth('consultant', email, undefined, false);

      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppShell>
              <div>Consultant workspace</div>
            </AppShell>
          </AuthProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
      });
      expect(screen.getByText('Consultant workspace')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText(/Set a new password/i)).not.toBeInTheDocument();
    },
  );
});
