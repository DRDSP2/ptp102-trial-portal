export type NoteOcrInput = {
  file: File;
  storagePath: string;
};

export type NoteOcrResult = {
  extractedText: string;
  processedAt: string;
};

export async function processNoteOcrDocument({ file, storagePath }: NoteOcrInput): Promise<NoteOcrResult> {
  const processedAt = new Date().toISOString();

  if (file.type === 'text/plain') {
    return {
      extractedText: await file.text(),
      processedAt,
    };
  }

  return {
    extractedText: `OCR pending for ${file.name}. Source file: ${storagePath}`,
    processedAt,
  };
}
