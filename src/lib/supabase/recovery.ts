import { supabase } from './client';

const RECOVERY_KEY = 'supabase_recovery_mode';

/**
 * Check whether the current URL is a Supabase password-recovery redirect.
 *
 * Handles two flows:
 *   - Hash flow (implicit grant):  #access_token=…&refresh_token=…&type=recovery
 *   - PKCE flow (auth code):       ?code=…&type=recovery
 *
 * Must be called **before** the React tree mounts so HashRouter doesn't
 * misinterpret the Supabase auth fragment as a route path.
 */
export async function handleRecoveryRedirect(): Promise<boolean> {
  const url = new URL(window.location.href);

  // ── Hash flow (implicit grant) ──────────────────────────────────────
  if (url.hash.includes('type=recovery')) {
    const params = new URLSearchParams(url.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
      markRecovery();
      return true;
    }
  }

  // ── PKCE / code flow ────────────────────────────────────────────────
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
  // Navigate to the admin-login page without a full reload.  HashRouter
  // will pick up the hash on initialization and route to AdminLoginPage.
  window.history.replaceState(null, '', '/#/admin/login');
}

export function isRecoveryMode(): boolean {
  return sessionStorage.getItem(RECOVERY_KEY) === 'true';
}

export function clearRecoveryMode(): void {
  sessionStorage.removeItem(RECOVERY_KEY);
}
