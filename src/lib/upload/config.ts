// Bucket layout for the PTP-102 trial portal.
//
// Single Supabase Storage bucket `ptp102-trial-portal` with four top-level
// folders. The folder name is the UploadCategory used by client code.
//
// Path scheme produced by buildStoragePath(...):
//   <category>/<userId>/<entityType>/<entityId>/<timestamp>-<safeFileName>
//
// The user-id segment is the second path component so RLS policies on the
// bucket can match `(storage.foldername(name))[2] = auth.uid()::text` to
// enforce per-user write access. See DEPLOYMENT.md "Storage RLS" section
// for the SQL.

export type UploadCategory =
  | 'trial-documents'
  | 'site-files'
  | 'patient-media'
  | 'consent-signatures';

export type UploadLimits = {
  maxBytes: number;
  allowedMimeTypes: string[];
};

export const UPLOAD_LIMITS: Record<UploadCategory, UploadLimits> = {
  // Protocol PDFs, IB documents, regulatory paperwork tied to the trial as a
  // whole rather than to a specific site, vet, or patient.
  'trial-documents': {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ['application/pdf'],
  },
  // Site-level photos and PDFs: facility photos uploaded during onboarding,
  // site qualification documents, etc.
  'site-files': {
    maxBytes: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: ['image/*', 'application/pdf'],
  },
  // Anything tied to a specific horse or clinical encounter: gait videos,
  // horse profile images, OCR documents from clinical notes.
  'patient-media': {
    maxBytes: 500 * 1024 * 1024, // 500 MB (gait video ceiling)
    allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  // Signed consent / e-signature artifacts. PDF only.
  'consent-signatures': {
    maxBytes: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: ['application/pdf'],
  },
};

export const PRIVATE_BUCKET = 'ptp102-trial-portal';
export const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes
