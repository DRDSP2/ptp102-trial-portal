import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export type VetRecord = {
  id: number;
  full_name: string;
  email: string;
  license_number: string;
  hospital_affiliation: string;
  verification_status: string;
  tc_accepted: boolean;
  tc_accepted_at: string | null;
  signature_text: string | null;
  no_conflict_of_interest?: boolean;
  created_at: string;
  last_login: string | null;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

export function useVeterinarians() {
  const [vets, setVets] = useState<VetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('veterinarians')
        .select('*')
        .order('verification_status', { ascending: true })
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setVets((data ?? []) as VetRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return { vets, loading, error, load };
}

type VetAction = 'approve' | 'reject';

export function useMutateVeterinarian() {
  const [mutating, setMutating] = useState(false);

  const mutate = useCallback(async (id: number, action: VetAction, reason?: string) => {
    setMutating(true);
    try {
      const payload: Record<string, unknown> = {
        verification_status: action === 'approve' ? 'approved' : 'rejected',
      };
      if (action === 'approve') {
        payload.approved_at = new Date().toISOString();
      }
      const { error: updateError } = await supabase
        .from('veterinarians')
        .update(payload)
        .eq('id', id);
      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        action: `vet_${action}d`,
        entity_type: 'veterinarian',
        entity_id: id,
        new_value: JSON.stringify({ verification_status: payload.verification_status }),
        timestamp: new Date().toISOString(),
        reason_for_change: reason ?? null,
      }).catch(() => {});
    } finally {
      setMutating(false);
    }
  }, []);

  return { mutate, mutating };
}

export function useDeleteVeterinarian() {
  const [deleting, setDeleting] = useState(false);

  const remove = useCallback(async (id: number) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('veterinarians')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { remove, deleting };
}
