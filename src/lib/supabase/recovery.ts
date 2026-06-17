import { supabase } from './client';

const RECOVERY_KEY = 'supabase_recovery_mode';

/**
 * Check whether the current URL is a Supabase password-recovery redirect.
 * If so, exchange the URL-hash tokens for a real session and return true.
 *
 * Must be called **before** the React tree mounts so HashRouter doesn't
 * misinterpret the Supabase auth fragment (`#access_token=…&type=recovery`)
 * as a route path.
 */
export async function handleRecoveryRedirect(): Promise<boolean> {
  const hash = window.location.hash;
  if (!hash || !hash.includes('type=recovery')) return false;

  const params = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (!accessToken || type !== 'recovery') return false;

  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? '',
  });

  sessionStorage.setItem(RECOVERY_KEY, 'true');

  // Replace the URL so the hash fragment is gone and HashRouter
  // sees a clean path.
  window.history.replaceState(null, '', '/');

  return true;
}

export function isRecoveryMode(): boolean {
  return sessionStorage.getItem(RECOVERY_KEY) === 'true';
}

export function clearRecoveryMode(): void {
  sessionStorage.removeItem(RECOVERY_KEY);
}
