import { vi } from 'vitest';
import { supabase } from '@/lib/supabase/client';
import { setCurrentAuditUser, clearCurrentAuditUser } from '@/lib/uibakeryDataMock';

export function seedAuth(role: 'admin' | 'vet', email: string, vetStatus?: 'pending' | 'approved' | 'rejected') {
  const session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    user: {
      id: 'mock-id',
      app_metadata: { role },
      user_metadata: { role },
      email,
    },
  };

  (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { session },
    error: null,
  });
  (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  if (role === 'vet') {
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              tc_accepted: true,
              verification_status: vetStatus ?? 'approved',
            },
            error: null,
          }),
        }),
      }),
    });
  } else {
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  }

  setCurrentAuditUser(email, role);
}

export function clearAuthMocks() {
  (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { session: null }, error: null });
  (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  });
  (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockReset();
  (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockReset();
  (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockReset();
  clearCurrentAuditUser();
}
