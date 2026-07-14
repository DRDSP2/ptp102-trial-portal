import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { bucketFromPath, SIGNED_URL_TTL_SECONDS } from '@/lib/upload/config';

// Direct browser → Supabase Storage signed-URL request.
//
// Same architectural change as useSecureUpload: the previous /api/download
// Vercel route does not exist on static IPFS hosts, so we ask Supabase
// Storage to mint a signed URL directly. RLS on the bucket determines
// whether the user is allowed to read the path; if not, createSignedUrl
// returns an error that we surface to the caller.
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

      const { data, error: signError } = await supabase.storage
        .from(bucketFromPath(path))
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      if (signError || !data?.signedUrl) {
        throw new Error(signError?.message ?? 'Failed to create signed URL');
      }

      setSignedUrl(data.signedUrl);
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
