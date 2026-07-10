import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useNDAStatus() {
  const { user, client } = useAuth();
  const [nda, setNda] = useState<{ signed: boolean; expiresAt: string | null; loading: boolean }>({
    signed: false,
    expiresAt: null,
    loading: true,
  });

  const fetchNDA = useCallback(async () => {
    if (!user) {
      // Stay in loading state until a user is present; NDAGate handles unauthenticated redirects.
      return;
    }
    setNda((current) => ({ ...current, loading: true }));
    const { data, error } = await client
      .from('ndas')
      .select('signed_at, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(1)
      .single();
    setNda({ signed: !!data && !error, expiresAt: data?.expires_at || null, loading: false });
  }, [user, client]);

  useEffect(() => {
    fetchNDA();
  }, [fetchNDA]);

  return { signed: nda.signed, expiresAt: nda.expiresAt, loading: nda.loading, refresh: fetchNDA };
}
