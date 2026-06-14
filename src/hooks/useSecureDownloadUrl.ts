import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useSecureDownloadUrl(path: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('You must be signed in to download files');
      }

      const token = sessionData.session.access_token;
      const response = await fetch(`/api/download?path=${encodeURIComponent(path)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({ error: 'Download failed' }));
      if (!response.ok) {
        throw new Error(result.error ?? 'Download failed');
      }

      setSignedUrl(result.signedUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSignedUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { signedUrl, isLoading, error, refresh };
}
