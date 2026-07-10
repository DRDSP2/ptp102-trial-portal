import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { CMCMilestone } from '@/types/roles';

interface CMCData {
  milestones: CMCMilestone[];
  documents: CMCDocument[];
}

interface CMCDocument {
  id: string;
  category: string;
  title: string;
  file_path: string | null;
  version: string | null;
  access_tier_min: string;
  uploaded_by: string | null;
  created_at: string;
}

export function useCMCData() {
  const { client } = useAuth();
  const [data, setData] = useState<CMCData>({ milestones: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCMC = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: milestoneData, error: milestoneError }, { data: docData, error: docError }] = await Promise.all([
        client.from('cmc_milestones').select('*').order('target_month', { ascending: true }),
        client.from('cmc_documents').select('*').order('created_at', { ascending: false }),
      ]);
      if (milestoneError) throw milestoneError;
      if (docError) throw docError;
      setData({
        milestones: (milestoneData as CMCMilestone[]) || [],
        documents: (docData as CMCDocument[]) || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CMC data');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCMC();
  }, [fetchCMC]);

  return { ...data, loading, error, refresh: fetchCMC };
}
