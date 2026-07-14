import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { AuthChangeEvent, Session, User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { recordLoginAudit, recordLogoutAudit, setCurrentAuditUser, clearCurrentAuditUser } from '@/lib/uibakeryDataMock';
import type { DealProfile, DealTier } from '@/types/roles';

type AuthRole = 'vet' | 'admin' | null;

type AuthState = {
  role: AuthRole;
  email: string | null;
  termsAccepted: boolean;
  pendingApproval: boolean;
  isLoading: boolean;
  user: User | null;
};

type SessionScope = 'admin' | 'vet' | null;

type AuthContextType = AuthState & {
  user: User | null;
  loading: boolean;
  loginVet: (email: string, password?: string) => Promise<void>;
  requestVetApproval: (email: string) => void;
  approveVet: () => void;
  rejectVet: () => void;
  loginAdmin: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  sessionScope: SessionScope;
  setSessionScope: (scope: SessionScope) => void;
  // Deal portal
  dealProfile: DealProfile | null;
  dealTier: DealTier;
  isInvestor: boolean;
  isLicensee: boolean;
  hasDealAccess: (minimumTier: DealTier) => boolean;
  refreshDealProfile: () => Promise<void>;
  // Exposed for hooks/components that need the injected client in tests
  client: SupabaseClient;
};

const emptyState: AuthState = {
  role: null,
  email: null,
  termsAccepted: false,
  pendingApproval: false,
  isLoading: true,
  user: null,
};

function roleFromUser(user: User | null): AuthRole {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  if (role === 'vet' || role === 'admin') {
    return role;
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_SCOPE_KEY = 'ptp102_session_scope';

function getStoredSessionScope(): SessionScope {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_SCOPE_KEY);
  if (raw === 'admin' || raw === 'vet') return raw;
  return null;
}

function setStoredSessionScope(scope: SessionScope) {
  if (typeof window === 'undefined') return;
  if (scope) {
    window.localStorage.setItem(SESSION_SCOPE_KEY, scope);
  } else {
    window.localStorage.removeItem(SESSION_SCOPE_KEY);
  }
}

export function AuthProvider({
  children,
  overrideClient,
}: {
  children: ReactNode;
  overrideClient?: SupabaseClient;
}) {
  const client = overrideClient ?? supabase;
  const [state, setState] = useState<AuthState>(emptyState);
  const [sessionScope, setSessionScopeState] = useState<SessionScope>(getStoredSessionScope);
  const [dealProfile, setDealProfile] = useState<DealProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const { data, error } = await client.auth.getSession();
        if (error || !data.session) {
          if (mounted) setState({ ...emptyState, isLoading: false });
          return;
        }

        const user = data.session.user;
        const rawRole = roleFromUser(user);
        const email = user.email ?? null;
        let termsAccepted = false;
        let pendingApproval = false;

        // Respect session scope
        const scope = getStoredSessionScope();
        const role: AuthRole = scope && rawRole === scope ? rawRole : scope ? null : rawRole;

        if (role === 'vet' && email) {
          try {
            const { data: vet } = await client
              .from('veterinarians')
              .select('tc_accepted, verification_status')
              .eq('email', email)
              .maybeSingle();
            termsAccepted = vet?.tc_accepted ?? false;
            pendingApproval = vet?.verification_status === 'pending';
          } catch {
            // leave defaults
          }
        } else if (role === 'admin') {
          termsAccepted = true;
          pendingApproval = false;
        }

        if (mounted) {
          setState({
            role,
            email,
            termsAccepted,
            pendingApproval,
            isLoading: false,
            user,
          });
          if (role && email) {
            setCurrentAuditUser(email, role);
          }
        }
      } catch {
        if (mounted) setState({ ...emptyState, isLoading: false });
      }
    }

    hydrate();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!session) {
        if (mounted) setState({ ...emptyState, isLoading: false });
        return;
      }

      const user = session.user;
      const rawRole = roleFromUser(user);
      const email = user.email ?? null;
      let termsAccepted = false;
      let pendingApproval = false;

      // Respect session scope: if a scope is set, only allow that role
      const scope = getStoredSessionScope();
      const role: AuthRole = scope && rawRole === scope ? rawRole : scope ? null : rawRole;

      if (role === 'vet' && email) {
        try {
          const { data: vet } = await client
            .from('veterinarians')
            .select('tc_accepted, verification_status')
            .eq('email', email)
            .maybeSingle();
          termsAccepted = vet?.tc_accepted ?? false;
          pendingApproval = vet?.verification_status === 'pending';
        } catch {
          // leave defaults
        }
      } else if (role === 'admin') {
        termsAccepted = true;
        pendingApproval = false;
      }

      if (mounted) {
        const next = { role, email, termsAccepted, pendingApproval, isLoading: false, user };
        setState(next);
        if (role && email) {
          setCurrentAuditUser(email, role);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setSessionScope = useCallback((scope: SessionScope) => {
    setSessionScopeState(scope);
    setStoredSessionScope(scope);
  }, []);

  const fetchDealProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await client
        .from('deal_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('fetchDealProfile error:', error);
      }
      setDealProfile((data as DealProfile | null) || null);
    },
    [client],
  );

  useEffect(() => {
    if (state.user) {
      fetchDealProfile(state.user.id);
    } else {
      setDealProfile(null);
    }
  }, [state.user, fetchDealProfile]);

  const dealTier = dealProfile?.tier || 'none';
  const isInvestor = dealProfile?.role === 'investor';
  const isLicensee = dealProfile?.role?.startsWith('licensee_') || false;

  const hasDealAccess = useCallback(
    (minimumTier: DealTier): boolean => {
      const tiers: DealTier[] = ['none', 'evaluation', 'diligence', 'exclusive'];
      return tiers.indexOf(dealTier) >= tiers.indexOf(minimumTier);
    },
    [dealTier],
  );

  const refreshDealProfile = useCallback(async () => {
    if (state.user) {
      await fetchDealProfile(state.user.id);
    }
  }, [state.user, fetchDealProfile]);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      user: state.user,
      loading: state.isLoading,
      sessionScope,
      setSessionScope,
      dealProfile,
      dealTier,
      isInvestor,
      isLicensee,
      hasDealAccess,
      refreshDealProfile,
      client,
      loginVet: async (email: string, password?: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        setStoredSessionScope('vet');
        setSessionScopeState('vet');
        if (password) {
          const { error } = await client.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;
          // Best-effort LOGIN audit — never block sign-in on it.
          recordLoginAudit(normalizedEmail, 'vet').catch(() => {});
          return;
        }

        // Fallback for legacy / test flows without a Supabase password.
        const next = {
          role: 'vet' as const,
          email: normalizedEmail,
          termsAccepted: true,
          pendingApproval: false,
        };
        setState((current) => ({ ...current, ...next, isLoading: false }));
      },
      requestVetApproval: (email: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        const user = state.user;
        const next = {
          role: 'vet' as const,
          email: normalizedEmail,
          termsAccepted: state.email === normalizedEmail ? state.termsAccepted : false,
          pendingApproval: true,
          user,
        };
        setState((current) => ({ ...current, ...next, isLoading: false }));
      },
      approveVet: () => {
        setState((current) => (current.role === 'vet' ? { ...current, pendingApproval: false } : current));
      },
      rejectVet: () => {
        setState({ ...emptyState, isLoading: false });
      },
      loginAdmin: async (email: string, password?: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        setStoredSessionScope('admin');
        setSessionScopeState('admin');
        if (password) {
          const { error } = await client.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;
          const user = (await client.auth.getSession()).data.session?.user;
          const role = roleFromUser(user ?? null);
          if (role !== 'admin') {
            await client.auth.signOut();
            throw new Error('This account does not have admin access.');
          }
          // Best-effort LOGIN audit — never block sign-in on it.
          recordLoginAudit(normalizedEmail, 'admin').catch(() => {});
          return;
        }

        const next = {
          role: 'admin' as const,
          email: normalizedEmail,
          termsAccepted: true,
          pendingApproval: false,
        };
        setState((current) => ({ ...current, ...next, isLoading: false }));
      },
      logout: async () => {
        // Snapshot identity BEFORE clearing local state so the audit row
        // carries the real user, not 'unknown'.
        const auditEmail = state.email;
        const auditRole: 'admin' | 'vet' | 'unknown' = state.role ?? 'unknown';

        // Clear local UI state synchronously — the existing contract is that
        // logout takes effect immediately and does not wait on network or
        // audit I/O. The audit + Supabase sign-out are best-effort.
        setState({ ...emptyState, isLoading: false });
        setStoredSessionScope(null);
        setSessionScopeState(null);

        // Best-effort audit (never block sign-out on it).
        recordLogoutAudit(auditEmail, auditRole).catch(() => {
          // swallow — audit failures must not prevent the user from signing out
        });

        clearCurrentAuditUser();

        // Fire sign-out in the background; clear local state immediately so the UI
        // does not wait on a network round-trip.
        client.auth.signOut().catch(() => {});
      },
    }),
    [state, sessionScope, dealProfile, dealTier, isInvestor, isLicensee, hasDealAccess, refreshDealProfile, client],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
