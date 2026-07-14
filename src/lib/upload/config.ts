// Bucket layout for the PTP-102 trial portal.
//
// Two Supabase Storage buckets:
//   - `ptp102-trial-portal`  (file_size_limit 50 MB) holds documents:
//     trial-documents, site-files, consent-signatures, patient-note-docs.
//   - `ptp102-trial-media`   (file_size_limit 500 MB) holds gait videos/images
//     under the patient-media category.
//
// The top-level folder name is the UploadCategory used by client code.
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
  | 'consent-signatures'
  | 'patient-note-docs';

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
  // Vet note / scan document attachments (referral letters, consent forms,
  // lab printouts, spreadsheets). No OCR processing; stored as-is. The hard
  // 50 MB server-side cap is enforced by the bucket file_size_limit (1796000003).
  'patient-note-docs': {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [
      'application/pdf',
      'image/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
};

export const PRIVATE_BUCKET = 'ptp102-trial-portal';
// Gait videos / images use a separate bucket with a 500 MB ceiling so the
// documents bucket (ptp102-trial-portal) can keep a strict 50 MB limit.
export const MEDIA_BUCKET = 'ptp102-trial-media';
export const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

// Maps each upload category to the storage bucket that stores it. Lets the
// client and storage handler pick the right bucket without hard-coding names.
export const CATEGORY_BUCKETS: Record<UploadCategory, string> = {
  'trial-documents': PRIVATE_BUCKET,
  'site-files': PRIVATE_BUCKET,
  'consent-signatures': PRIVATE_BUCKET,
  'patient-note-docs': PRIVATE_BUCKET,
  'patient-media': MEDIA_BUCKET,
};

export function bucketForCategory(category: UploadCategory): string {
  return CATEGORY_BUCKETS[category];
}

export function bucketFromPath(path: string): string {
  const category = path.split('/')[0] as UploadCategory;
  return CATEGORY_BUCKETS[category] ?? PRIVATE_BUCKET;
}
