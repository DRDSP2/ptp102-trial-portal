import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { DealProfile } from '@/types/roles';

export function useDealProfile() {
  const { user, client } = useAuth();
  const [profile, setProfile] = useState<DealProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await client
      .from('deal_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile((data as DealProfile | null) || null);
    setLoading(false);
  }, [user, client]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateTier = async (tier: DealProfile['tier']) => {
    if (!user) return;
    await client.from('deal_profiles').update({ tier }).eq('user_id', user.id);
    await fetchProfile();
  };

  return { profile, loading, refresh: fetchProfile, updateTier };
}
