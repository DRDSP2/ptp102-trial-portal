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
  return `${entityType}/${entityId}/${category}/${userId}/${timestamp}-${safeName}`;
}

export function parseOwnerFromPath(path: string): string | null {
  const parts = path.split('/');
  // Convention: entityType/entityId/category/userId/fileName
  return parts[3] ?? null;
}
