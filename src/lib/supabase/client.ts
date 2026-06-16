import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function warnMissingEnv() {
  console.warn(
    'Missing Supabase environment variables. ' +
      'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local',
  );
}

// Some IPFS gateways (notably *.eth.limo) send `clear-site-data: "cookies"`
// on every response, which would wipe a cookie-backed Supabase session on
// every navigation. We persist the session in localStorage instead by
// providing a custom cookie-shaped adapter that reads/writes localStorage.
// Keys are namespaced under `sb-cookie:` so they don't collide with anything
// else the app stores. SSR contexts (no `window`) get a no-op adapter.
const localStorageCookieAdapter = {
  get(name: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      const value = window.localStorage.getItem(`sb-cookie:${name}`);
      return value ?? undefined;
    } catch {
      return undefined;
    }
  },
  set(name: string, value: string, _options?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`sb-cookie:${name}`, value);
    } catch {
      /* quota or privacy mode — silently ignore */
    }
  },
  remove(name: string, _options?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(`sb-cookie:${name}`);
    } catch {
      /* ignore */
    }
  },
};

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    warnMissingEnv();
    // Return a minimal stub so tests and non-Supabase flows don't crash.
    // In production builds this should never be reached if env vars are set.
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: localStorageCookieAdapter,
  });
};

export const supabase = createClient();
