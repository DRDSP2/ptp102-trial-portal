export type NoteOcrInput = {
  file: File;
  storagePath: string;
};

export type NoteOcrResult = {
  extractedText: string;
  processedAt: string;
  confidence?: number;
  pageCount?: number;
};

// pdfjs-dist and tesseract.js are loaded on demand to keep them out of the
// main bundle. They only run when a vet or admin actually uploads an OCR doc.
async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const { getDocument } = await import('pdfjs-dist');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  return { text: fullText.trim(), pageCount: numPages };
}

async function extractTextFromImage(file: File): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const { data } = await worker.recognize(file);
  await worker.terminate();

  return {
    text: data.text.trim(),
    confidence: data.confidence
  };
}

async function extractTextFromTextFile(file: File): Promise<{ text: string; confidence: number; pageCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        text: e.target?.result as string || '',
        confidence: 100,
        pageCount: 1
      });
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

export async function processNoteOcrDocument({ file, storagePath }: NoteOcrInput): Promise<NoteOcrResult> {
  const processedAt = new Date().toISOString();

  try {
    let result: { text: string; confidence?: number; pageCount?: number };

    if (file.type === 'application/pdf') {
      result = await extractTextFromPdf(file);
    } else if (file.type.startsWith('image/')) {
      result = await extractTextFromImage(file);
    } else if (file.type === 'text/plain') {
      result = await extractTextFromTextFile(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    return {
      extractedText: result.text,
      processedAt,
      confidence: result.confidence,
      pageCount: result.pageCount
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    // Return a fallback result so the UI can still function
    return {
      extractedText: `OCR processing failed for ${file.name}. Source file: ${storagePath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processedAt: new Date().toISOString(),
      confidence: 0,
      pageCount: 0
    };
  }
}