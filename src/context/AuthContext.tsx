import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AuthRole = 'vet' | 'admin' | null;

type AuthState = {
  role: AuthRole;
  email: string | null;
  termsAccepted: boolean;
  pendingApproval: boolean;
};

type AuthContextType = AuthState & {
  loginVet: (email: string) => void;
  requestVetApproval: (email: string) => void;
  approveVet: () => void;
  rejectVet: () => void;
  loginAdmin: (email: string) => void;
  logout: () => void;
};

const STORAGE_KEY = 'laminitis_auth_state';

const emptyState: AuthState = {
  role: null,
  email: null,
  termsAccepted: false,
  pendingApproval: false,
};

function loadAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return emptyState;
    }
    const parsed = JSON.parse(stored) as AuthState;
    return {
      role: parsed.role ?? null,
      email: parsed.email ?? null,
      termsAccepted: parsed.termsAccepted ?? false,
      pendingApproval: parsed.pendingApproval ?? false,
    };
  } catch {
    return emptyState;
  }
}

function saveAuthState(state: AuthState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadAuthState());

  useEffect(() => {
    saveAuthState(state);
  }, [state]);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      loginVet: (email: string) => {
        setState({
          role: 'vet',
          email,
          termsAccepted: true,
          pendingApproval: false,
        });
      },
      requestVetApproval: (email: string) => {
        setState({
          role: 'vet',
          email,
          termsAccepted: false,
          pendingApproval: true,
        });
      },
      approveVet: () => {
        setState((current) =>
          current.role === 'vet'
            ? {
                ...current,
                termsAccepted: true,
                pendingApproval: false,
              }
            : current
        );
      },
      rejectVet: () => {
        setState(emptyState);
      },
      loginAdmin: (email: string) => {
        setState({
          role: 'admin',
          email,
          termsAccepted: true,
          pendingApproval: false,
        });
      },
      logout: () => {
        setState(emptyState);
      },
    }),
    [state]
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
