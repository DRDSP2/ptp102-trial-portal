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

export function createMockSupabaseAuth({
  tier = 'none',
  role = 'licensee_eval',
}: {
  tier?: 'none' | 'evaluation' | 'diligence' | 'exclusive';
  role?: 'investor' | 'licensee_eval' | 'licensee_diligence' | 'licensee_exclusive';
} = {}) {
  const user = createMockUser({
    id: 'deal-mock-user-id',
    app_metadata: { role: 'deal' },
    user_metadata: { role: 'deal' },
    email: 'deal@example.com',
  });
  const session = createMockSession({ user });

  const dealProfile = {
    id: 'dp-1',
    user_id: user.id,
    company: 'MockCo',
    role,
    tier,
    nda_signed_at: null,
    nda_expires_at: null,
    stripe_customer_id: null,
    region_of_interest: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockFrom = vi.fn((table: string) => {
    if (table === 'deal_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: dealProfile, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: dealProfile, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }
    if (table === 'ndas') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                })),
              })),
            })),
          })),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        })),
      })),
    };
  });

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: mockFrom,
  };
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
