export type UploadCategory =
  | 'gait-video'
  | 'profile-image'
  | 'facility-photo'
  | 'note-ocr-document'
  | 'consent-document'
  | 'protocol-document';

export type UploadLimits = {
  maxBytes: number;
  allowedMimeTypes: string[];
};

export const UPLOAD_LIMITS: Record<UploadCategory, UploadLimits> = {
  'gait-video': {
    maxBytes: 500 * 1024 * 1024, // 500 MB
    allowedMimeTypes: ['video/*'],
  },
  'profile-image': {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/*'],
  },
  'facility-photo': {
    maxBytes: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: ['image/*'],
  },
  'note-ocr-document': {
    maxBytes: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: ['image/*', 'application/pdf'],
  },
  'consent-document': {
    maxBytes: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: ['application/pdf'],
  },
  'protocol-document': {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ['application/pdf'],
  },
};

export const PRIVATE_BUCKET = 'private-uploads';
export const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes
