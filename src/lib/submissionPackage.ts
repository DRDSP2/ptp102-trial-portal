/**
 * CVM submission package builder.
 *
 * Enforces the required file naming convention and generates a Table of
 * Contents (TOC.xml) with SHA-256 checksums, sizes, and ALCOA attestation
 * flags for every file in the package.
 */

export type SubmissionFileType =
  | 'dataset_statistical'
  | 'dataset_fda_audit'
  | 'define'
  | 'protocol'
  | 'fsr';

export type SubmissionFileExt = 'xml' | 'pdf' | 'xpt';

export interface ExportFile {
  content: string;
  fileType: SubmissionFileType;
  ext: SubmissionFileExt;
  description: string;
  purpose?: string;
}

export interface SubmissionPackageFile {
  filename: string;
  content: string;
  fileType: SubmissionFileType;
  ext: SubmissionFileExt;
  description: string;
  purpose: string;
  location: string;
  sizeBytes: number;
  checksum: string;
}

export interface SubmissionPackage {
  tocXml: string;
  files: { filename: string; content: string }[];
}

const PRODUCT = 'ptp102';
const PACKAGE_VERSION = '1.0';
const ALCOA_ATTESTATION = 'true';

const PURPOSE_MAP: Record<SubmissionFileType, string> = {
  dataset_statistical: 'statistical_review',
  dataset_fda_audit: 'regulatory_audit',
  define: 'data_dictionary',
  protocol: 'protocol_documentation',
  fsr: 'final_study_report',
};

const LOCATION_MAP: Record<SubmissionFileType | 'toc', string> = {
  dataset_statistical: './datasets/',
  dataset_fda_audit: './datasets/',
  define: './datasets/',
  protocol: './documents/',
  fsr: './documents/',
  toc: './',
};

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toUtcDateSlug(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid exportedAt value: ${input}`);
  }
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function sha256(content: string): Promise<string> {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : (globalThis as any).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API is not available; cannot compute SHA-256 checksums.');
  }
  const encoder = new TextEncoder();
  const buffer = await cryptoObj.subtle.digest('SHA-256', encoder.encode(content));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildFilename(
  product: string,
  studyId: string,
  fileType: string,
  dateSlug: string,
  ext: string
): string {
  return `${product}_${studyId}_${fileType}_${dateSlug}.${ext}`;
}

function assertFilenameValid(filename: string): void {
  if (filename.length > 64) {
    throw new Error(`Generated filename exceeds 64 characters: ${filename}`);
  }
  if (!/^[a-z0-9_.]+$/.test(filename)) {
    throw new Error(`Generated filename contains invalid characters: ${filename}`);
  }
}

function buildFileNode(f: SubmissionPackageFile): string {
  return `  <file>
    <filename>${escapeXml(f.filename)}</filename>
    <description>${escapeXml(f.description)}</description>
    <purpose>${escapeXml(f.purpose)}</purpose>
    <format>${escapeXml(f.ext)}</format>
    <size_bytes>${f.sizeBytes}</size_bytes>
    <checksum algorithm="SHA-256">${escapeXml(f.checksum)}</checksum>
    <location>${escapeXml(f.location)}</location>
    <alcoa_attestation>${ALCOA_ATTESTATION}</alcoa_attestation>
  </file>`;
}

export async function buildSubmissionPackage(
  studyId: string,
  files: ExportFile[],
  exportedAt?: string | Date
): Promise<SubmissionPackage> {
  if (!studyId) {
    throw new Error('studyId is required');
  }
  if (!files || files.length === 0) {
    throw new Error('At least one file is required to build a submission package');
  }

  const product = sanitizeToken(PRODUCT);
  const cleanStudyId = sanitizeToken(studyId);
  const dateSlug = toUtcDateSlug(exportedAt);

  const prepared: SubmissionPackageFile[] = [];
  for (const file of files) {
    const purpose = file.purpose ?? PURPOSE_MAP[file.fileType];
    const filename = buildFilename(product, cleanStudyId, file.fileType, dateSlug, file.ext);
    assertFilenameValid(filename);

    const sizeBytes = new TextEncoder().encode(file.content).length;
    const checksum = await sha256(file.content);

    prepared.push({
      filename,
      content: file.content,
      fileType: file.fileType,
      ext: file.ext,
      description: file.description,
      purpose,
      location: LOCATION_MAP[file.fileType],
      sizeBytes,
      checksum,
    });
  }

  const tocFilename = buildFilename(product, cleanStudyId, 'toc', dateSlug, 'xml');
  assertFilenameValid(tocFilename);

  const payloadNodes = prepared.map(buildFileNode).join('\n');

  const tocHeader = `<?xml version="1.0" encoding="UTF-8"?>
<submission_toc product="${escapeXml(product)}" study_id="${escapeXml(cleanStudyId)}" generation_date="${escapeXml(dateSlug)}" package_version="${escapeXml(PACKAGE_VERSION)}">`;

  // Assemble a draft that excludes the TOC's own size/checksum, then compute them.
  const tocPayload = `${tocHeader}\n${payloadNodes}\n</submission_toc>`;
  const tocSizeBytes = new TextEncoder().encode(tocPayload).length;
  const tocChecksum = await sha256(tocPayload);

  const tocEntry = `  <file>
    <filename>${escapeXml(tocFilename)}</filename>
    <description>Table of Contents for the CVM submission package</description>
    <purpose>package_index</purpose>
    <format>xml</format>
    <size_bytes>${tocSizeBytes}</size_bytes>
    <checksum algorithm="SHA-256">${escapeXml(tocChecksum)}</checksum>
    <location>${escapeXml(LOCATION_MAP.toc)}</location>
    <alcoa_attestation>${ALCOA_ATTESTATION}</alcoa_attestation>
  </file>`;

  const tocXml = `${tocHeader}\n${tocEntry}\n${payloadNodes}\n</submission_toc>`;

  return {
    tocXml,
    files: [
      { filename: tocFilename, content: tocXml },
      ...prepared.map((p) => ({ filename: p.filename, content: p.content })),
    ],
  };
}

export function downloadSubmissionPackage(pkg: SubmissionPackage): void {
  if (!pkg?.files?.length) return;

  pkg.files.forEach(({ filename, content }, index) => {
    setTimeout(() => {
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, index * 150);
  });
}
