import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { CapTableEntry, ESOPGrant } from '@/types/roles';

export function useCapTable() {
  const { client } = useAuth();
  const [entries, setEntries] = useState<CapTableEntry[]>([]);
  const [esopGrants, setEsopGrants] = useState<ESOPGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapTable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: capData, error: capError }, { data: esopData, error: esopError }] = await Promise.all([
        client.from('cap_table_entries').select('*').order('percentage', { ascending: false }),
        client.from('esop_grants').select('*'),
      ]);
      if (capError) throw capError;
      if (esopError) throw esopError;
      setEntries((capData as CapTableEntry[]) || []);
      setEsopGrants((esopData as ESOPGrant[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cap table');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCapTable();
  }, [fetchCapTable]);

  return { entries, esopGrants, loading, error, refresh: fetchCapTable };
}
