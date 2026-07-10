import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface InvestorUpdate {
  id: string;
  title: string;
  content: string | null;
  update_type: 'monthly_kpi' | 'board_minutes' | 'financial_report' | 'deal_pipeline' | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

export function useInvestorUpdates() {
  const { client } = useAuth();
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await client
        .from('investor_updates')
        .select('*')
        .order('published_at', { ascending: false });
      if (dbError) throw dbError;
      setUpdates((data as InvestorUpdate[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor updates');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return { updates, loading, error, refresh: fetchUpdates };
}
