import { describe, expect, it } from 'vitest';
import { processNoteOcrDocument } from '@/lib/ocr/noteOcr';

describe('note OCR processing', () => {
  it('returns a clear pending extraction result for images and PDFs', async () => {
    const file = new File(['fake pdf'], 'referral.pdf', { type: 'application/pdf' });

    const result = await processNoteOcrDocument({ file, storagePath: 'clinical_notes/1/note-ocr-document/referral.pdf' });

    expect(result.extractedText).toContain('OCR pending for referral.pdf');
    expect(result.extractedText).toContain('clinical_notes/1/note-ocr-document/referral.pdf');
    expect(Date.parse(result.processedAt)).not.toBeNaN();
  });
});
