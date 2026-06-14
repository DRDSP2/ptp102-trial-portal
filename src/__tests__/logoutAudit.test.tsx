import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="role" data-value={String(auth.role)}>{auth.role}</span>
      <button onClick={() => auth.loginVet('phyto2002@gmail.com')}>Login Vet</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
}

describe('AuthContext logout records a LOGOUT audit event', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('emits a LOGOUT audit row with the user email and role captured before sign-out', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('Login Vet'));
    expect(screen.getByTestId('role').dataset.value).toBe('vet');

    fireEvent.click(screen.getByText('Logout'));

    // UI clears synchronously (the existing contract), audit lands shortly
    // after on the microtask queue.
    expect(screen.getByTestId('role').dataset.value).toBe('null');

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const logoutEntry = logs.find(
        (l: any) => l.action === 'LOGOUT' && l.userEmail === 'phyto2002@gmail.com',
      );
      expect(logoutEntry).toBeDefined();
      expect(logoutEntry.userRole).toBe('vet');
      expect(logoutEntry.entityType).toBe('veterinarian');
    });
  });

  it('falls back to userRole=unknown when logout is called from an unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Log out without ever logging in
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
      const logoutEntry = logs.find((l: any) => l.action === 'LOGOUT');
      expect(logoutEntry).toBeDefined();
      expect(logoutEntry.userRole).toBe('unknown');
      expect(logoutEntry.userEmail).toBe('unknown');
    });
  });
});
