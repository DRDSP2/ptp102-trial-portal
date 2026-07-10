import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { IPAsset } from '@/types/roles';

export function useIPPortfolio() {
  const { client } = useAuth();
  const [assets, setAssets] = useState<IPAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIP = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await client.from('ip_portfolio').select('*').order('created_at', { ascending: false });
      if (dbError) throw dbError;
      setAssets((data as IPAsset[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IP portfolio');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchIP();
  }, [fetchIP]);

  return { assets, loading, error, refresh: fetchIP };
}
