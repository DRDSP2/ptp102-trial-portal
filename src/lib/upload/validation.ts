import { UPLOAD_LIMITS, type UploadCategory } from './config';

export type FileLike = {
  name: string;
  type: string;
  size: number;
};

export type ValidationResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

function matchesMimeType(fileType: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    return fileType.startsWith(pattern.slice(0, -1));
  }
  return fileType === pattern;
}

export function validateUpload(file: FileLike, category: UploadCategory): ValidationResult {
  const limits = UPLOAD_LIMITS[category];
  if (!limits) {
    return { ok: false, error: `Unknown upload category: ${category}` };
  }

  if (file.size > limits.maxBytes) {
    const maxMb = (limits.maxBytes / 1024 / 1024).toFixed(0);
    return { ok: false, error: `File exceeds maximum size of ${maxMb} MB` };
  }

  const allowed = limits.allowedMimeTypes.some((pattern) => matchesMimeType(file.type, pattern));
  if (!allowed) {
    return {
      ok: false,
      error: `File type ${file.type || 'unknown'} is not allowed for ${category}`,
    };
  }

  return { ok: true };
}
