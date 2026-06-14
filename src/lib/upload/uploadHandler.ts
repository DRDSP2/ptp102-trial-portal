import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import { PRIVATE_BUCKET, type UploadCategory } from './config';
import { buildStoragePath } from './path';
import { validateUpload } from './validation';
import { getUserRole } from './access';
import type { ParsedFile } from './parseMultipart';

export type UploadRequest = {
  user: User;
  category: UploadCategory;
  entityType: string;
  entityId: string;
  file: ParsedFile;
};

export type UploadResult = {
  path: string;
  fileName: string;
  size: number;
  mimeType: string;
};

export function isUploadCategory(value: string): value is UploadCategory {
  return ['gait-video', 'profile-image', 'facility-photo', 'consent-document', 'protocol-document'].includes(value);
}

export async function handleUpload({
  user,
  category,
  entityType,
  entityId,
  file,
}: UploadRequest): Promise<UploadResult> {
  const role = getUserRole(user);
  if (!role) {
    throw new Error('User role not configured');
  }

  const validation = validateUpload(
    { name: file.filename, type: file.mimeType, size: file.size },
    category,
  );
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const storagePath = buildStoragePath({
    category,
    entityType,
    entityId,
    userId: user.id,
    fileName: file.filename,
  });

  const supabase = createServiceClient();
  const { error: uploadError } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  return {
    path: storagePath,
    fileName: file.filename,
    size: file.size,
    mimeType: file.mimeType,
  };
}
