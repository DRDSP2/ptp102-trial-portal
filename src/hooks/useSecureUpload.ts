import { useCallback, useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import { supabase } from '@/lib/supabase/client';
import recordSecureUploadAction from '@/actions/recordSecureUpload';
import type { UploadCategory } from '@/lib/upload/config';

export type UseSecureUploadOptions = {
  category: UploadCategory;
  entityType: string;
  entityId: string | number;
};

export function useSecureUpload({ category, entityType, entityId }: UseSecureUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordUpload] = useMutateAction(recordSecureUploadAction);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setError(null);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error('You must be signed in to upload files');
        }

        const token = sessionData.session.access_token;
        const userId = sessionData.session.user.id;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('entityType', entityType);
        formData.append('entityId', String(entityId));

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json().catch(() => ({ error: 'Upload failed' }));
        if (!response.ok) {
          throw new Error(result.error ?? 'Upload failed');
        }

        await recordUpload({
          ownerId: userId,
          entityType,
          entityId: String(entityId),
          category,
          storagePath: result.path,
          fileName: result.fileName,
          fileSize: result.size,
          mimeType: result.mimeType,
        });

        return result.path as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [category, entityType, entityId, recordUpload],
  );

  return { upload, isUploading, error };
}
