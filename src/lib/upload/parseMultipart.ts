import Busboy from 'busboy';
import type { IncomingMessage } from 'http';

export type ParsedFile = {
  fieldname: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
};

export type MultipartParseResult = {
  fields: Record<string, string>;
  files: ParsedFile[];
};

export function parseMultipart(req: IncomingMessage): Promise<MultipartParseResult> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: ParsedFile[] = [];

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1 GB hard guard; category limits applied later
        files: 1,
      },
    });

    busboy.on('file', (fieldname, fileStream, info) => {
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      fileStream.on('limit', () => reject(new Error('File size exceeded hard limit')));
      fileStream.on('end', () => {
        files.push({
          fieldname,
          filename: info.filename,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks),
          size: Buffer.concat(chunks).length,
        });
      });
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('error', reject);
    busboy.on('finish', () => resolve({ fields, files }));

    req.pipe(busboy);
  });
}
