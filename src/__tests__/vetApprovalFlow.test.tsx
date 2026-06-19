import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/pages/ProtectedRoute';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { seedAuth, clearAuthMocks } from './utils/supabaseMock';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

function mockVetStatus(status: 'pending' | 'approved') {
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            tc_accepted: true,
            verification_status: status,
          },
          error: null,
        }),
      }),
    }),
  });
}

describe('Vet approval flow — no stale localStorage cache', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthMocks();
  });

  it('vet with pending status is redirected to /vet/pending by ProtectedRoute', async () => {
    seedAuth('vet', 'alice@example.com', 'pending');
    mockVetStatus('pending');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/vet/pending" element={<PendingApprovalPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // The vet should be redirected to /vet/pending
    await waitFor(() => {
      expect(screen.getByText(/Pending Approval/i)).toBeInTheDocument();
    });
  });

  it('vet with approved status lands on dashboard (no stale cache)', async () => {
    seedAuth('vet', 'alice@example.com', 'approved');
    mockVetStatus('approved');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/vet/pending" element={<PendingApprovalPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // The vet should NOT be redirected to /vet/pending
    await waitFor(() => {
      expect(screen.queryByText(/Pending Approval/i)).not.toBeInTheDocument();
    });

    // The dashboard header should render
    await waitFor(() => {
      expect(screen.getByText(/PTP-102 Laminitis Trial/i)).toBeInTheDocument();
    });
  });
});
