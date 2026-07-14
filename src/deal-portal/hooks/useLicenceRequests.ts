import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { LicenceRequest, Certificate } from '@/deal-portal/types/dealPortal';

export function useLicenceRequests() {
  const { user, client } = useAuth();
  const [requests, setRequests] = useState<LicenceRequest[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setCertificates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: reqData, error: reqErr } = await client
        .from('licence_requests')
        .select('*')
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false });
      if (reqErr) throw reqErr;
      setRequests((reqData as LicenceRequest[]) ?? []);

      const { data: certData, error: certErr } = await client
        .from('certificates')
        .select('*')
        .eq('holder_user_id', user.id)
        .order('issued_at', { ascending: false });
      if (certErr) throw certErr;
      setCertificates((certData as Certificate[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRequest = useCallback(
    async (termSheetId: string, region?: string) => {
      if (!user) return { error: new Error('Not authenticated') };
      const { data, error } = await client
        .from('licence_requests')
        .insert({
          term_sheet_id: termSheetId,
          region: region ?? null,
          requested_by: user.id,
        })
        .select()
        .single();
      if (!error) await refresh();
      return { data, error };
    },
    [user, client, refresh],
  );

  return { requests, certificates, loading, error, refresh, createRequest };
}
