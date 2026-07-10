import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { FinancialProjection } from '@/types/roles';

export function useFinancialProjections() {
  const { client } = useAuth();
  const [projections, setProjections] = useState<FinancialProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await client.from('financial_projections').select('*').order('year');
      if (dbError) throw dbError;
      setProjections((data as FinancialProjection[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial projections');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  return { projections, loading, error, refresh: fetchProjections };
}
