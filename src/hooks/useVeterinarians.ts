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

  // Optimistic update helper: immediately patch local state, then refetch
  const optimisticUpdate = useCallback((id: number, patch: Partial<VetRecord>) => {
    setVets((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  }, []);

  return { vets, setVets, loading, error, load, optimisticUpdate };
}

type VetAction = 'approve' | 'reject';

export function useMutateVeterinarian() {
  const [mutating, setMutating] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const mutate = useCallback(async (id: number, action: VetAction, reason?: string) => {
    setMutating(true);
    setLastError(null);
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
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        entity_type: 'veterinarian',
        entity_id: id,
        new_value: JSON.stringify({ verification_status: payload.verification_status }),
        timestamp: new Date().toISOString(),
        reason_for_change: reason ?? null,
      }).catch(() => {});

      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);
      throw err;
    } finally {
      setMutating(false);
    }
  }, []);

  return { mutate, mutating, lastError };
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

export function useClinics() {
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setClinics((data ?? []) as { id: number; name: string }[]);
    } catch (err) {
      console.error('Failed to load clinics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIfNotExists = useCallback(async (name: string) => {
    try {
      // Check if clinic exists
      const { data: existing } = await supabase
        .from('clinics')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (existing) return existing.id;

      // Create new clinic
      const { data: inserted, error } = await supabase
        .from('clinics')
        .insert({ name, created_at: new Date().toISOString() })
        .select('id')
        .single();
      
      if (error) throw error;
      return inserted.id;
    } catch (err) {
      console.error('Failed to create clinic:', err);
      return null;
    }
  }, []);

  return { clinics, loading, load, createIfNotExists };
}
