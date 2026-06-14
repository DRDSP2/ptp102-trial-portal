import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function warnMissingEnv() {
  console.warn(
    'Missing Supabase environment variables. ' +
      'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local',
  );
}

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

  return createBrowserClient(supabaseUrl, supabaseKey);
};

export const supabase = createClient();
