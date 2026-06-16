import type { UploadCategory } from './config';

export type StoragePathInputs = {
  category: UploadCategory;
  entityType: string;
  entityId: string | number;
  userId: string;
  fileName: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function formatTimestamp(date = new Date()): string {
  const iso = date.toISOString();
  return iso.replace(/[-:T.Z]/g, '').slice(0, 14);
}

// Path scheme: <category>/<userId>/<entityType>/<entityId>/<timestamp>-<safeName>
//
// The userId is segment index 1 (zero-based) so an RLS policy that calls
// `(storage.foldername(name))[2] = auth.uid()::text` matches it (Postgres
// arrays are 1-based; `foldername()` returns the directory components only).
// Admins bypass the per-user check via a separate policy.
export function buildStoragePath({
  category,
  entityType,
  entityId,
  userId,
  fileName,
}: StoragePathInputs): string {
  const safeName = sanitizeFileName(fileName);
  if (!safeName) {
    throw new Error('Invalid file name');
  }
  const timestamp = formatTimestamp();
  return `${category}/${userId}/${entityType}/${entityId}/${timestamp}-${safeName}`;
}

// Convention: <category>/<userId>/<entityType>/<entityId>/<filename>
// Index 1 is the user id segment.
export function parseOwnerFromPath(path: string): string | null {
  const parts = path.split('/');
  return parts[1] ?? null;
}
