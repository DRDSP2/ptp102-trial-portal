import { describe, expect, it } from 'vitest';
import { validateUpload } from '@/lib/upload/validation';
import { UPLOAD_LIMITS } from '@/lib/upload/config';

describe('secure upload validation', () => {
  it('allows allowed MIME types', () => {
    expect(validateUpload({ name: 'gait.mp4', type: 'video/mp4', size: 1024 }, 'gait-video').ok).toBe(true);
    expect(validateUpload({ name: 'horse.jpg', type: 'image/jpeg', size: 1024 }, 'profile-image').ok).toBe(true);
    expect(validateUpload({ name: 'stable.png', type: 'image/png', size: 1024 }, 'facility-photo').ok).toBe(true);
    expect(validateUpload({ name: 'referral.pdf', type: 'application/pdf', size: 1024 }, 'note-ocr-document').ok).toBe(true);
    expect(validateUpload({ name: 'field-note.jpg', type: 'image/jpeg', size: 1024 }, 'note-ocr-document').ok).toBe(true);
    expect(validateUpload({ name: 'consent.pdf', type: 'application/pdf', size: 1024 }, 'consent-document').ok).toBe(
      true,
    );
  });

  it('rejects disallowed MIME types', () => {
    const result = validateUpload({ name: 'malware.exe', type: 'application/x-msdownload', size: 1024 }, 'gait-video');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('keeps OCR documents out of lab-only spreadsheet uploads', () => {
    const result = validateUpload({ name: 'lab-values.csv', type: 'text/csv', size: 1024 }, 'note-ocr-document');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects files that exceed the category size limit', () => {
    const oversized = UPLOAD_LIMITS['profile-image'].maxBytes + 1;
    const result = validateUpload({ name: 'huge.jpg', type: 'image/jpeg', size: oversized }, 'profile-image');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
  });

  it('rejects unknown categories', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateUpload({ name: 'x.txt', type: 'text/plain', size: 1 }, 'unknown-category' as any);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Unknown upload category');
  });
});
