import { describe, it, expect } from 'vitest';
import { generateWatermark } from '@/deal-portal/lib/dealPortalUtils';

describe('Watermarking', () => {
  it('generates a watermark containing user, company and timestamp', () => {
    const watermark = generateWatermark('Jane Doe', 'Acme Pharma');
    expect(watermark).toContain('Jane Doe');
    expect(watermark).toContain('Acme Pharma');
    expect(watermark).toContain('CONFIDENTIAL — BYROCK DEAL ROOM');
    expect(watermark).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
