import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useNDAStatus() {
  const { user, client } = useAuth();
  const [nda, setNda] = useState<{
    signed: boolean;
    expiresAt: string | null;
    templateVersion: string | null;
    loading: boolean;
  }>({
    signed: false,
    expiresAt: null,
    templateVersion: null,
    loading: true,
  });

  const fetchNDA = useCallback(async () => {
    if (!user) {
      // No user yet; NDAGate handles unauthenticated redirects.
      setNda((current) => (current.loading ? current : { ...current, loading: false }));
      return;
    }
    setNda((current) => ({ ...current, loading: true }));
    const { data, error } = await client
      .from('ndas')
      .select('signed_at, expires_at, template_version, approval_status')
      .eq('user_id', user.id)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setNda({
      signed: !!data && !error && data.approval_status === 'approved',
      expiresAt: data?.expires_at || null,
      templateVersion: data?.template_version || null,
      loading: false,
    });
  }, [user, client]);

  useEffect(() => {
    fetchNDA();
  }, [fetchNDA]);

  return {
    signed: nda.signed,
    expiresAt: nda.expiresAt,
    templateVersion: nda.templateVersion,
    loading: nda.loading,
    refresh: fetchNDA,
  };
}
