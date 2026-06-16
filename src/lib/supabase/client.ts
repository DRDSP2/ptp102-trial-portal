import { createBrowserClient } from '@supabase/ssr';

// Some IPFS gateways (notably *.eth.limo) send `clear-site-data: "cookies"`
// on every response, which would wipe a cookie-backed Supabase session on
// every navigation. We persist the session in localStorage instead by
// providing a custom cookie-shaped adapter that reads/writes localStorage.
// Keys are namespaced under `sb-cookie:` so they don't collide with anything
// else the app stores. SSR contexts (no `window`) get a no-op adapter.
//
// Note: this adapter (and the createBrowserClient call below) are only
// included in the production bundle if Vite has VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY at build time. When those env vars are absent
// at build time, Vite inlines them as undefined and tree-shakes the
// real-Supabase code path. Set the env vars on the deploy provider
// (4EVERLAND, Cloudflare Pages, etc.) before the build runs.
export const localStorageCookieAdapter = {
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

function readEnv(name: string): string {
  // Vite inlines import.meta.env.* at build time. Reading via this helper
  // keeps the read-site uniform and makes it easy to swap in a runtime
  // source later if needed.
  const raw = (import.meta.env as Record<string, string | undefined>)[name];
  return typeof raw === 'string' ? raw : '';
}

function buildStubClient() {
  // Returned only when env vars are missing at build time. Keeps tests
  // and non-Supabase code paths working without crashing.
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({
        data: null,
        error: new Error('Supabase not configured'),
      }),
      signOut: async () => ({ error: null }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export const createClient = () => {
  const supabaseUrl = readEnv('VITE_SUPABASE_URL');
  const supabaseKey = readEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Missing Supabase environment variables. ' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deploy ' +
        'provider (4EVERLAND / Cloudflare Pages / .env.local for dev). ' +
        'Falling back to a no-op auth client.',
    );
    return buildStubClient();
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: localStorageCookieAdapter,
  });
};

export const supabase = createClient();
