import { supabase } from './client';

const RECOVERY_KEY = 'supabase_recovery_mode';
const RECOVERY_TOKEN_KEY = 'recovery_token';

/**
 * Check whether the current URL is a password-recovery redirect.
 *
 * Handles three flows:
 *   - Supabase implicit grant: #access_token=…&refresh_token=…&type=recovery
 *   - Supabase PKCE:           ?code=…&type=recovery
 *   - Custom token:            #token=…&type=recovery
 *
 * Must be called **before** the React tree mounts so HashRouter doesn't
 * misinterpret the Supabase auth fragment as a route path.
 */
export async function handleRecoveryRedirect(): Promise<boolean> {
  const url = new URL(window.location.href);

  // ── Supabase implicit grant flow ────────────────────────────────────
  if (url.hash.includes('access_token') && url.hash.includes('type=recovery')) {
    const params = new URLSearchParams(url.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
      markRecovery();
      return true;
    }
  }

  // ── Custom token flow (admin/vet recovery) ──────────────────────────
  if (url.hash.includes('token=') && url.hash.includes('type=recovery')) {
    const params = new URLSearchParams(url.hash.slice(1));
    const token = params.get('token');
    if (token) {
      sessionStorage.setItem(RECOVERY_TOKEN_KEY, token);
      markRecovery();
      return true;
    }
  }

  // ── Supabase PKCE / code flow ───────────────────────────────────────
  const isRecovery = url.searchParams.get('type') === 'recovery';
  const code = url.searchParams.get('code');
  if (isRecovery && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    if (!error) {
      markRecovery();
      return true;
    }
  }

  return false;
}

function markRecovery() {
  sessionStorage.setItem(RECOVERY_KEY, 'true');
  window.history.replaceState(null, '', '/#/admin/login');
}

export function isRecoveryMode(): boolean {
  return sessionStorage.getItem(RECOVERY_KEY) === 'true';
}

export function clearRecoveryMode(): void {
  sessionStorage.removeItem(RECOVERY_KEY);
  sessionStorage.removeItem(RECOVERY_TOKEN_KEY);
}

export function getRecoveryToken(): string | null {
  return sessionStorage.getItem(RECOVERY_TOKEN_KEY);
}
