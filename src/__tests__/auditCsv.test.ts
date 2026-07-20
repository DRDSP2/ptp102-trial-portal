import { describe, expect, it } from 'vitest';
import { buildAuditCsv } from '@/lib/auditCsv';
import { auditDateSlug, formatAuditTimestamp } from '@/lib/datetime';

describe('audit timestamp and CSV export', () => {
  it('declares GMT for winter audit records', () => {
    expect(formatAuditTimestamp('2026-01-15T12:00:00.000Z')).toBe('15/01/2026, 12:00:00 GMT');
  });

  it('applies Irish summer time without changing the source ISO timestamp', () => {
    expect(formatAuditTimestamp('2026-07-15T12:00:00.000Z')).toBe('15/07/2026, 13:00:00 IST');
  });

  it('uses the Dublin calendar date for export filenames', () => {
    expect(auditDateSlug('2026-07-20T23:30:00.000Z')).toBe('2026-07-21');
  });

  it('exports UTC, Dublin time, timezone identity, hashes, and escaped values', () => {
    const csv = buildAuditCsv([
      {
        sequenceNumber: 42,
        timestamp: '2026-07-15T12:00:00.000Z',
        userEmail: 'vet@example.com',
        action: 'UPDATE',
        entityType: 'patient',
        reasonForChange: 'Corrected "owner, name"',
        clientHash: 'client-hash',
        previousHash: 'previous-hash',
      },
    ]);

    expect(csv).toContain('Timestamp (ISO 8601 UTC),Timestamp (Europe/Dublin),Timezone');
    expect(csv).toContain('2026-07-15T12:00:00.000Z,"15/07/2026, 13:00:00 IST",Europe/Dublin');
    expect(csv).toContain('"Corrected ""owner, name"""');
    expect(csv).toContain('client-hash,previous-hash');
  });
});
