import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { TermSheet, TermSheetVersion } from '@/types/roles';

export function useTermSheet(termSheetId?: string) {
  const { user, client } = useAuth();
  const [termSheet, setTermSheet] = useState<TermSheet | null>(null);
  const [versions, setVersions] = useState<TermSheetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTermSheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setTermSheet(null);
        setVersions([]);
        return;
      }

      let sheet: TermSheet | null = null;
      if (termSheetId) {
        const { data, error: sheetError } = await client
          .from('term_sheets')
          .select('*')
          .eq('id', termSheetId)
          .maybeSingle();
        if (sheetError) throw sheetError;
        sheet = (data as TermSheet | null) || null;
      } else {
        const { data, error: sheetError } = await client
          .from('term_sheets')
          .select('*')
          .eq('prospect_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sheetError) throw sheetError;
        sheet = (data as TermSheet | null) || null;
      }

      setTermSheet(sheet);

      if (sheet) {
        const { data: versionData, error: versionError } = await client
          .from('term_sheet_versions')
          .select('*')
          .eq('term_sheet_id', sheet.id)
          .order('version', { ascending: false });
        if (versionError) throw versionError;
        setVersions((versionData as TermSheetVersion[]) || []);
      } else {
        setVersions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load term sheet');
    } finally {
      setLoading(false);
    }
  }, [user, client, termSheetId]);

  useEffect(() => {
    fetchTermSheet();
  }, [fetchTermSheet]);

  const createTermSheet = useCallback(
    async (values: Partial<TermSheet>) => {
      if (!user) return { error: new Error('Not authenticated') };
      const { data, error } = await client.from('term_sheets').insert({
        prospect_user_id: user.id,
        created_by: user.id,
        ...values,
      }).select().single();
      if (!error) await fetchTermSheet();
      return { data, error };
    },
    [user, client, fetchTermSheet],
  );

  const proposeVersion = useCallback(
    async (content: TermSheet, proposedBy: 'prospect' | 'byrock') => {
      if (!termSheet) return { error: new Error('No term sheet loaded') };
      const nextVersion = (termSheet.current_version || 0) + 1;
      const { error } = await client.from('term_sheet_versions').insert({
        term_sheet_id: termSheet.id,
        version: nextVersion,
        content,
        proposed_by: proposedBy,
      });
      if (!error) {
        await client.from('term_sheets').update({ current_version: nextVersion }).eq('id', termSheet.id);
        await fetchTermSheet();
      }
      return { error };
    },
    [termSheet, client, fetchTermSheet],
  );

  return { termSheet, versions, loading, error, refresh: fetchTermSheet, createTermSheet, proposeVersion };
}
