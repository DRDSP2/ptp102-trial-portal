import type { AuditLogEntry } from '@/lib/auditTypes';
import { AUDIT_TIME_ZONE, auditDateSlug, formatAuditTimestamp } from '@/lib/datetime';

type AuditCsvRow = Partial<AuditLogEntry> & {
  sequenceNumber?: number;
  timestamp?: string;
};

const columns: Array<{ heading: string; value: (row: AuditCsvRow) => unknown }> = [
  { heading: 'Sequence', value: (row) => row.sequenceNumber },
  { heading: 'Timestamp (ISO 8601 UTC)', value: (row) => row.timestamp },
  {
    heading: `Timestamp (${AUDIT_TIME_ZONE})`,
    value: (row) => row.timestamp ? formatAuditTimestamp(row.timestamp) : '',
  },
  { heading: 'Timezone', value: () => AUDIT_TIME_ZONE },
  { heading: 'User Email', value: (row) => row.userEmail },
  { heading: 'User Role', value: (row) => row.userRole },
  { heading: 'Action', value: (row) => row.action },
  { heading: 'Entity Type', value: (row) => row.entityType },
  { heading: 'Entity ID', value: (row) => row.entityId },
  { heading: 'Patient ID', value: (row) => row.patientId },
  { heading: 'Study ID', value: (row) => row.studyId },
  { heading: 'Field', value: (row) => row.fieldName },
  { heading: 'Old Value', value: (row) => row.oldValue },
  { heading: 'New Value', value: (row) => row.newValue },
  { heading: 'Reason for Change', value: (row) => row.reasonForChange },
  { heading: 'Client Hash', value: (row) => row.clientHash },
  { heading: 'Previous Hash', value: (row) => row.previousHash },
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildAuditCsv(rows: AuditCsvRow[]): string {
  return [
    columns.map((column) => csvCell(column.heading)).join(','),
    ...rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(',')),
  ].join('\r\n');
}

export function downloadAuditCsv(rows: AuditCsvRow[], exportedAt: Date = new Date()): void {
  const blob = new Blob([`\uFEFF${buildAuditCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `PTP102_audit_trail_${auditDateSlug(exportedAt)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
