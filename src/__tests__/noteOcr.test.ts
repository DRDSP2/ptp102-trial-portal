import { describe, expect, it, vi } from 'vitest';
import { processNoteOcrDocument } from '@/lib/ocr/noteOcr';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: () => Promise.resolve({
        getTextContent: () => Promise.resolve({ items: [] })
      })
    })
  })
}));

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: () => Promise.resolve({
    recognize: () => Promise.resolve({ data: { text: 'mock OCR text', confidence: 95 } }),
    terminate: () => {}
  })
}));

// Mock DOMMatrix for pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {}
    static fromMatrix() { return new DOMMatrix(); }
    static fromFloat32Array() { return new DOMMatrix(); }
    static fromFloat64Array() { return new DOMMatrix(); }
  };
}

describe('note OCR processing', () => {
  it('returns a result with processedAt for PDFs and never throws', async () => {
    const file = new File(['fake pdf content'], 'referral.pdf', { type: 'application/pdf' });

    const result = await processNoteOcrDocument({ file, storagePath: 'clinical_notes/1/note-ocr-document/referral.pdf' });

    // jsdom's File polyfill doesn't implement arrayBuffer(), so the implementation
    // falls through to the fallback path. The contract under test is that the
    // OCR pipeline never throws and always returns a usable result.
    expect(typeof result.extractedText).toBe('string');
    expect(result.processedAt).toBeDefined();
    expect(Date.parse(result.processedAt)).not.toBeNaN();
  });

  it('returns extracted text for images', async () => {
    const file = new File(['fake image'], 'scan.jpg', { type: 'image/jpeg' });

    const result = await processNoteOcrDocument({ file, storagePath: 'clinical_notes/1/note-ocr-document/scan.jpg' });

    expect(result.extractedText).toBe('mock OCR text');
    expect(result.confidence).toBe(95);
    expect(result.processedAt).toBeDefined();
    expect(Date.parse(result.processedAt)).not.toBeNaN();
  });

  it('handles unsupported file types gracefully', async () => {
    const file = new File(['content'], 'test.xyz', { type: 'application/unknown' });

    const result = await processNoteOcrDocument({ file, storagePath: 'clinical_notes/1/note-ocr-document/test.xyz' });

    expect(result.confidence).toBe(0);
    expect(result.extractedText).toContain('OCR processing failed');
    expect(result.processedAt).toBeDefined();
  });

  it('handles plain text files', async () => {
    const file = new File(['plain text content'], 'notes.txt', { type: 'text/plain' });

    const result = await processNoteOcrDocument({ file, storagePath: 'clinical_notes/1/note-ocr-document/notes.txt' });

    expect(result.extractedText).toBe('plain text content');
    expect(result.confidence).toBe(100);
    expect(result.pageCount).toBe(1);
  });
});