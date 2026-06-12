import { describe, it, expect } from 'vitest';
import { buildSubmissionPackage, type ExportFile } from '@/lib/submissionPackage';

async function sha256(content: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('CVM submission package builder', () => {
  const files: ExportFile[] = [
    {
      content: '<clinical>statistical</clinical>',
      fileType: 'dataset_statistical',
      ext: 'xml',
      description: 'Statistical dataset',
    },
    {
      content: '<clinical><audit/></clinical>',
      fileType: 'dataset_fda_audit',
      ext: 'xml',
      description: 'FDA audit dataset',
    },
    {
      content: '<define/>',
      fileType: 'define',
      ext: 'xml',
      description: 'Define file',
    },
  ];

  it('generates a TOC and four files with the required naming convention', async () => {
    const pkg = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');

    expect(pkg.files).toHaveLength(4);
    const names = pkg.files.map((f) => f.filename);
    expect(names).toContain('ptp102_ptp102_toc_20250612.xml');
    expect(names).toContain('ptp102_ptp102_dataset_statistical_20250612.xml');
    expect(names).toContain('ptp102_ptp102_dataset_fda_audit_20250612.xml');
    expect(names).toContain('ptp102_ptp102_define_20250612.xml');
  });

  it('produces deterministic filenames for the same study and date', async () => {
    const pkg1 = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');
    const pkg2 = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');
    expect(pkg1.files.map((f) => f.filename)).toEqual(pkg2.files.map((f) => f.filename));
  });

  it('includes valid SHA-256 checksums and byte sizes in TOC.xml', async () => {
    const pkg = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');
    const datasetFile = pkg.files.find((f) => f.filename.includes('dataset_statistical'))!;
    const expectedChecksum = await sha256(datasetFile.content);
    const expectedSize = new TextEncoder().encode(datasetFile.content).length;

    expect(pkg.tocXml).toContain(`<filename>${datasetFile.filename}</filename>`);
    expect(pkg.tocXml).toContain(`<size_bytes>${expectedSize}</size_bytes>`);
    expect(pkg.tocXml).toContain(`<checksum algorithm="SHA-256">${expectedChecksum}</checksum>`);
  });

  it('assigns controlled purposes for each file type', async () => {
    const pkg = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');
    expect(pkg.tocXml).toContain('<purpose>statistical_review</purpose>');
    expect(pkg.tocXml).toContain('<purpose>regulatory_audit</purpose>');
    expect(pkg.tocXml).toContain('<purpose>data_dictionary</purpose>');
    expect(pkg.tocXml).toContain('<purpose>package_index</purpose>');
  });

  it('marks every file with ALCOA attestation', async () => {
    const pkg = await buildSubmissionPackage('PTP-102', files, '2025-06-12T00:00:00.000Z');
    const matches = pkg.tocXml.match(/<alcoa_attestation>true<\/alcoa_attestation>/g);
    expect(matches).toHaveLength(4);
  });

  it('rejects filenames that exceed 64 characters', async () => {
    const longStudyId = 'A'.repeat(80);
    await expect(buildSubmissionPackage(longStudyId, files, '2025-06-12T00:00:00.000Z')).rejects.toThrow(
      'exceeds 64 characters'
    );
  });

  it('rejects filenames with invalid characters', async () => {
    const badFiles = [
      { content: 'x', fileType: 'protocol', ext: 'pd f', description: 'bad ext' },
    ] as any;
    await expect(buildSubmissionPackage('PTP-102', badFiles, '2025-06-12')).rejects.toThrow(
      'invalid characters'
    );
  });

  it('requires at least one file', async () => {
    await expect(buildSubmissionPackage('PTP-102', [])).rejects.toThrow(
      'At least one file is required'
    );
  });
});
