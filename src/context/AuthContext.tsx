import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { recordLogoutAudit } from '@/lib/uibakeryDataMock';

type AuthRole = 'vet' | 'admin' | null;

type AuthState = {
  role: AuthRole;
  email: string | null;
  termsAccepted: boolean;
  pendingApproval: boolean;
  isLoading: boolean;
  user: User | null;
};

type AuthContextType = AuthState & {
  loginVet: (email: string, password?: string) => Promise<void>;
  requestVetApproval: (email: string) => void;
  approveVet: () => void;
  rejectVet: () => void;
  loginAdmin: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'laminitis_auth_state';

const emptyState: AuthState = {
  role: null,
  email: null,
  termsAccepted: false,
  pendingApproval: false,
  isLoading: true,
  user: null,
};

function loadLegacyAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { ...emptyState, isLoading: false };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...emptyState, isLoading: false };
    }
    const parsed = JSON.parse(stored) as Omit<AuthState, 'isLoading' | 'user'>;
    return {
      role: parsed.role ?? null,
      email: parsed.email ?? null,
      termsAccepted: parsed.termsAccepted ?? false,
      pendingApproval: parsed.pendingApproval ?? false,
      isLoading: false,
      user: null,
    };
  } catch {
    return { ...emptyState, isLoading: false };
  }
}

function saveLegacyAuthState(state: Omit<AuthState, 'isLoading' | 'user'>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      role: state.role,
      email: state.email,
      termsAccepted: state.termsAccepted,
      pendingApproval: state.pendingApproval,
    }),
  );
}

function clearLegacyAuthState() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

function roleFromUser(user: User | null): AuthRole {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  if (role === 'vet' || role === 'admin') {
    return role;
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadLegacyAuthState());

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (mounted) setState(loadLegacyAuthState());
          return;
        }

        const user = data.session.user;
        const role = roleFromUser(user);
        const email = user.email ?? null;
        let termsAccepted = false;
        let pendingApproval = false;

        if (role === 'vet' && email) {
          try {
            const { data: vet } = await supabase
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
          saveLegacyAuthState({ role, email, termsAccepted, pendingApproval });
        }
      } catch {
        if (mounted) setState(loadLegacyAuthState());
      }
    }

    hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!session) {
        if (mounted) setState({ ...emptyState, isLoading: false });
        return;
      }

      const user = session.user;
      const role = roleFromUser(user);
      const email = user.email ?? null;
      let termsAccepted = false;
      let pendingApproval = false;

      if (role === 'vet' && email) {
        try {
          const { data: vet } = await supabase
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
        saveLegacyAuthState({ role, email, termsAccepted, pendingApproval });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      loginVet: async (email: string, password?: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        if (password) {
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;
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
        saveLegacyAuthState(next);
      },
      requestVetApproval: (email: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        const next = {
          role: 'vet' as const,
          email: normalizedEmail,
          termsAccepted: false,
          pendingApproval: true,
        };
        setState((current) => ({ ...current, ...next, isLoading: false }));
        saveLegacyAuthState(next);
      },
      approveVet: () => {
        setState((current) =>
          current.role === 'vet'
            ? { ...current, termsAccepted: true, pendingApproval: false }
            : current,
        );
        saveLegacyAuthState({
          role: state.role,
          email: state.email,
          termsAccepted: true,
          pendingApproval: false,
        });
      },
      rejectVet: () => {
        setState({ ...emptyState, isLoading: false });
        clearLegacyAuthState();
      },
      loginAdmin: async (email: string, password?: string) => {
        const normalizedEmail = email.toLowerCase().trim();
        if (password) {
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;
          const user = (await supabase.auth.getSession()).data.session?.user;
          const role = roleFromUser(user ?? null);
          if (role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('This account does not have admin access.');
          }
          return;
        }

        const next = {
          role: 'admin' as const,
          email: normalizedEmail,
          termsAccepted: true,
          pendingApproval: false,
        };
        setState((current) => ({ ...current, ...next, isLoading: false }));
        saveLegacyAuthState(next);
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
        clearLegacyAuthState();

        // Best-effort audit (never block sign-out on it).
        recordLogoutAudit(auditEmail, auditRole).catch(() => {
          // swallow — audit failures must not prevent the user from signing out
        });

        // Fire sign-out in the background; clear local state immediately so the UI
        // does not wait on a network round-trip.
        supabase.auth.signOut().catch(() => {});
      },
    }),
    [state],
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
