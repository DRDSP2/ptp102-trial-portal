import { vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';

export { SUPPORT_EMAIL } from '@/lib/contact';

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'mock-user-id',
    app_metadata: { role: 'vet' },
    user_metadata: { role: 'vet' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'vet@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmation_sent_at: '',
    recovery_sent_at: '',
    email_change: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    ...overrides,
  } as User;
}

export function createMockSession(overrides: Partial<Session> = {}): Session {
  const user = createMockUser(overrides.user);
  return {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
    ...overrides,
  } as unknown as Session;
}

export function mockSupabaseAuth(
  role: 'admin' | 'vet',
  email: string,
  vetStatus?: 'pending' | 'approved' | 'rejected',
  termsAccepted?: boolean,
) {
  const session = createMockSession({
    user: createMockUser({
      app_metadata: { role },
      user_metadata: { role },
      email,
    }),
  });

  const maybeSingleResult =
    role === 'vet'
      ? {
          data: {
            tc_accepted: termsAccepted ?? (vetStatus !== 'pending'),
            verification_status: vetStatus ?? 'approved',
          },
          error: null,
        }
      : { data: null, error: null };

  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(maybeSingleResult),
        }),
      }),
    }),
  };

  return mockSupabase;
}

export function mockSupabaseAuthWithoutSession() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  };
}
