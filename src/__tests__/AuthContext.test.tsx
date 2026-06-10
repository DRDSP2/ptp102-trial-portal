import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestComponent() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="role">{auth.role}</span>
      <span data-testid="email">{auth.email}</span>
      <button onClick={() => auth.loginVet('vet@example.com')}>Login Vet</button>
      <button onClick={() => auth.loginAdmin('admin@example.com')}>Login Admin</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts unauthenticated and transitions correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('role').textContent).toBe('null');
    expect(screen.getByTestId('email').textContent).toBe('');

    fireEvent.click(screen.getByText('Login Vet'));
    expect(screen.getByTestId('role').textContent).toBe('vet');
    expect(screen.getByTestId('email').textContent).toBe('vet@example.com');

    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('role').textContent).toBe('null');
    expect(screen.getByTestId('email').textContent).toBe('');

    fireEvent.click(screen.getByText('Login Admin'));
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('email').textContent).toBe('admin@example.com');
  });
});
