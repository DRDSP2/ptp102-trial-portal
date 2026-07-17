import { useCallback, useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import { supabase } from '@/lib/supabase/client';
import recordSecureUploadAction from '@/actions/recordSecureUpload';
import createAuditLogAction from '@/actions/createAuditLog';
import { bucketForCategory, type UploadCategory } from '@/lib/upload/config';
import { buildStoragePath } from '@/lib/upload/path';
import { validateUpload } from '@/lib/upload/validation';

export type UseSecureUploadOptions = {
  category: UploadCategory;
  entityType: string;
  entityId: string | number;
};

// Direct browser → Supabase Storage upload.
//
// Previously this hook POSTed to /api/upload, a Vercel serverless function.
// That route does not exist on static IPFS hosts (4EVERLAND, Cloudflare Pages
// without functions), and the static gateway returned 405 Method Not Allowed
// because it cannot accept POSTs to a static path. This implementation calls
// supabase.storage directly, which works from any host as long as the
// `ptp102-trial-portal` bucket has appropriate RLS policies.
//
// RLS expectations (see DEPLOYMENT.md):
//   - INSERT allowed when auth.uid() IS NOT NULL AND
//     (storage.foldername(name))[2] = auth.uid()::text
//   - SELECT/UPDATE/DELETE allowed under the same per-user condition,
//     plus an admin override based on user metadata.
export function useSecureUpload({ category, entityType, entityId }: UseSecureUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordUpload] = useMutateAction(recordSecureUploadAction);
  const [createAuditLog] = useMutateAction(createAuditLogAction);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setError(null);

      try {
        // 1. Confirm an authenticated session is available. supabase.storage
        //    will use the session's JWT automatically when anon key is bound
        //    to the client; no manual Authorization header needed.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error('You must be signed in to upload files');
        }
        const userId = sessionData.session.user.id;
        const userEmail = sessionData.session.user.email ?? 'unknown';

        // 2. Client-side size + mime checks. These are NOT a security boundary
        //    (anyone can bypass them by calling the API directly); they exist
        //    to fail fast with a friendly error before consuming bandwidth.
        //    The real boundary is RLS + bucket policies on the Supabase side.
        const validation = validateUpload(
          { name: file.name, type: file.type, size: file.size },
          category,
        );
        if (!validation.ok) {
          throw new Error(validation.error);
        }

        // 3. Build a path that RLS policies can authorize per-user.
        const storagePath = buildStoragePath({
          category,
          entityType,
          entityId,
          userId,
          fileName: file.name,
        });

        // 4. Upload. cacheControl '3600' is Supabase's default; upsert: false
        //    means a duplicate timestamp+filename collision will surface as
        //    an error rather than silently overwrite.
        const { error: uploadError } = await supabase.storage
          .from(bucketForCategory(category))
          .upload(storagePath, file, {
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          // Surface Supabase's error verbatim. Common causes: missing RLS
          // policy (403), file already exists (409), bucket not found (404).
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // 5. Mirror the upload into the localStorage mock so the rest of the
        //    UI can find it. This is the same call useSecureUpload made
        //    before; only the file-transfer mechanism changed.
        await recordUpload({
          ownerId: userId,
          entityType,
          entityId: String(entityId),
          category,
          storagePath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        // 6. Audit-log the upload
        await createAuditLog({
          action: 'UPLOAD',
          entityType: entityType as any,
          entityId: typeof entityId === 'string' ? parseInt(entityId, 10) || null : entityId,
          fieldName: 'storage_path',
          newValue: JSON.stringify({
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            category,
          }),
          reasonForChange: `File uploaded via secure upload: ${file.name}`,
        }).catch(() => {});

        // 7. Fire-and-forget admin email alert for file uploads
        supabase.functions.invoke('send-email', {
          body: {
            to: 'drdsp@pm.me',
            subject: `[PTP-102] File uploaded by ${userEmail} — ${file.name}`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #6b7f3a;">File Uploaded</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px; font-weight: bold;">File:</td><td style="padding: 6px;">${file.name}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Type:</td><td style="padding: 6px;">${file.type || 'unknown'}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Size:</td><td style="padding: 6px;">${(file.size / 1024).toFixed(1)} KB</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Category:</td><td style="padding: 6px;">${category}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">${entityType} #${entityId}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Uploaded by:</td><td style="padding: 6px;">${userEmail}</td></tr>
              </table>
            </div>`,
          },
        }).catch((err: unknown) => console.error('Upload email alert failed (non-critical):', err));

        return storagePath;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [category, entityType, entityId, recordUpload, createAuditLog],
  );

  return { upload, isUploading, error };
}
