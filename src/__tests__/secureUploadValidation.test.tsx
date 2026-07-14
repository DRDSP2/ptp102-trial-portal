import { describe, expect, it } from 'vitest';
import { validateUpload } from '@/lib/upload/validation';
import { UPLOAD_LIMITS } from '@/lib/upload/config';

describe('secure upload validation', () => {
  it('allows allowed MIME types', () => {
    expect(validateUpload({ name: 'gait.mp4', type: 'video/mp4', size: 1024 }, 'patient-media').ok).toBe(true);
    expect(validateUpload({ name: 'horse.jpg', type: 'image/jpeg', size: 1024 }, 'patient-media').ok).toBe(true);
    expect(validateUpload({ name: 'stable.png', type: 'image/png', size: 1024 }, 'site-files').ok).toBe(true);
    expect(validateUpload({ name: 'referral.pdf', type: 'application/pdf', size: 1024 }, 'patient-media').ok).toBe(true);
    expect(validateUpload({ name: 'field-note.jpg', type: 'image/jpeg', size: 1024 }, 'patient-media').ok).toBe(true);
    expect(
      validateUpload({ name: 'consent.pdf', type: 'application/pdf', size: 1024 }, 'consent-signatures').ok,
    ).toBe(true);
    expect(
      validateUpload({ name: 'protocol.pdf', type: 'application/pdf', size: 1024 }, 'trial-documents').ok,
    ).toBe(true);
  });

  it('rejects disallowed MIME types', () => {
    const result = validateUpload({ name: 'malware.exe', type: 'application/x-msdownload', size: 1024 }, 'patient-media');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('keeps non-PDFs out of consent-signatures', () => {
    // consent-signatures only accepts application/pdf
    const result = validateUpload({ name: 'lab-values.csv', type: 'text/csv', size: 1024 }, 'consent-signatures');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('keeps videos out of consent-signatures', () => {
    const result = validateUpload({ name: 'sig.mp4', type: 'video/mp4', size: 1024 }, 'consent-signatures');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects files that exceed the category size limit', () => {
    const oversized = UPLOAD_LIMITS['consent-signatures'].maxBytes + 1;
    const result = validateUpload(
      { name: 'huge.pdf', type: 'application/pdf', size: oversized },
      'consent-signatures',
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
  });

  it('accepts document attachments for patient-note-docs', () => {
    expect(validateUpload({ name: 'referral.pdf', type: 'application/pdf', size: 1024 }, 'patient-note-docs').ok).toBe(true);
    expect(validateUpload({ name: 'scan.png', type: 'image/png', size: 1024 }, 'patient-note-docs').ok).toBe(true);
    expect(validateUpload({ name: 'labs.csv', type: 'text/csv', size: 1024 }, 'patient-note-docs').ok).toBe(true);
    expect(
      validateUpload(
        { name: 'report.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024 },
        'patient-note-docs',
      ).ok,
    ).toBe(true);
    expect(
      validateUpload({ name: 'letter.doc', type: 'application/msword', size: 1024 }, 'patient-note-docs').ok,
    ).toBe(true);
  });

  it('keeps videos out of patient-note-docs', () => {
    const result = validateUpload({ name: 'gait.mp4', type: 'video/mp4', size: 1024 }, 'patient-note-docs');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('caps patient-note-docs at 50 MB', () => {
    const oversized = UPLOAD_LIMITS['patient-note-docs'].maxBytes + 1;
    const result = validateUpload(
      { name: 'huge.pdf', type: 'application/pdf', size: oversized },
      'patient-note-docs',
    );
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
