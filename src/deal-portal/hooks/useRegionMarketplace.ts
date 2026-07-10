import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { RegionMarketplace } from '@/types/roles';

export function useRegionMarketplace() {
  const { client } = useAuth();
  const [regions, setRegions] = useState<RegionMarketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await client.from('region_marketplace').select('*').order('region');
      if (dbError) throw dbError;
      setRegions((data as RegionMarketplace[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const reserveRegion = useCallback(
    async (region: string) => {
      const { error: dbError } = await client
        .from('region_marketplace')
        .update({ status: 'under_evaluation' })
        .eq('region', region);
      if (!dbError) await fetchRegions();
      return { error: dbError };
    },
    [client, fetchRegions],
  );

  return { regions, loading, error, refresh: fetchRegions, reserveRegion };
}
