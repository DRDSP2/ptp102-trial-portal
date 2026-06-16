import { useState } from 'react';
import { useLoadAction } from '@uibakery/data';
import loadAuditLogsAction from '@/actions/loadAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, ShieldAlert, Eye } from 'lucide-react';
import { type AuditAction, type AuditEntityType } from '@/lib/auditTypes';

const AUDIT_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'EXPORT',
  'EXPORT_SUBMISSION_PACKAGE',
  'LOGIN',
  'LOGOUT',
  'LOCK',
  'UNLOCK',
  'FREEZE',
  'APPROVE',
  'REJECT',
  'REGISTER',
  'SUBMIT',
  'MARK_TIMELINE_COMPLETE',
  'DOSE_ADMINISTERED',
  'MONITORING_CHECKPOINT',
  'GENERATE',
  'SEND',
  'SIGN',
  'UPLOAD',
  'REPLACE',
  'VERIFY',
  'DISPENSE',
  'SHIPMENT_DISPATCH',
  'SHIPMENT_RECEIVE',
  'INVENTORY_ADJUST',
  'SYSTEM',
];

const ENTITY_TYPES: AuditEntityType[] = [
  'patient',
  'clinical_assessment',
  'treatment',
  'clinical_note',
  'lab_result',
  'veterinarian',
  'admin',
  'informed_consent',
  'investigator_qualification',
  'shipment',
  'protocol_version',
  'adverse_event',
  'protocol_deviation',
  'consent_document',
  'study_export',
  'inventory',
  'system',
];

export function safeStringify(value: string | null): string {
  if (!value) return 'null';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function AuditLogViewer() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');

  const [logs, loading, error] = useLoadAction(loadAuditLogsAction, [], {
    startDate: startDate || null,
    endDate: endDate || null,
    userEmail: userEmail || null,
    subjectId: subjectId || null,
    action: actionFilter || null,
    entityType: entityTypeFilter || null,
  });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      EXPORT: 'bg-purple-100 text-purple-800',
      LOGIN: 'bg-slate-100 text-slate-800',
      APPROVE: 'bg-emerald-100 text-emerald-800',
      REJECT: 'bg-orange-100 text-orange-800',
      LOCK: 'bg-amber-100 text-amber-800',
      FREEZE: 'bg-red-100 text-red-800',
      UNLOCK: 'bg-green-100 text-green-800',
    };
    return <Badge className={variants[action] || 'bg-gray-100 text-gray-800'}>{action}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="audit-start-date">Start Date</Label>
            <Input
              id="audit-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-end-date">End Date</Label>
            <Input
              id="audit-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-user">User Email</Label>
            <Input
              id="audit-user"
              placeholder="vet@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-subject">Subject ID / Patient ID</Label>
            <Input
              id="audit-subject"
              placeholder="PTP-102-001 or 1"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={actionFilter || 'all'} onValueChange={(v) => setActionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {AUDIT_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <Select value={entityTypeFilter || 'all'} onValueChange={(v) => setEntityTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entity types</SelectItem>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Seq</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-24">Chain</TableHead>
                <TableHead className="w-24">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Loading audit trail...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-destructive">
                    Error loading audit trail
                  </TableCell>
                </TableRow>
              ) : !logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No audit entries match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.sequenceNumber}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell className="text-xs">{log.userEmail}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-xs">{log.entityType}</TableCell>
                    <TableCell className="text-xs">{log.fieldName || '-'}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{log.reasonForChange || '-'}</TableCell>
                    <TableCell>
                      {log.chainValid === false ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          Broken
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-700 border-green-300 gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Valid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Entry #{selectedLog?.sequenceNumber}</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Timestamp</Label>
                      <p>{formatTimestamp(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">User</Label>
                      <p>{selectedLog.userEmail} ({selectedLog.userRole})</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Action</Label>
                      <p>{selectedLog.action}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Entity</Label>
                      <p>{selectedLog.entityType}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Entity ID</Label>
                      <p>{selectedLog.entityId ?? '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Patient ID</Label>
                      <p>{selectedLog.patientId ?? '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Study ID</Label>
                      <p>{selectedLog.studyId}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Field</Label>
                      <p>{selectedLog.fieldName || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reason for Change</Label>
                    <p className="bg-slate-50 p-2 rounded border">{selectedLog.reasonForChange || 'None provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Old Value</Label>
                      <pre className="bg-slate-50 p-2 rounded border text-xs overflow-x-auto">
                        {safeStringify(selectedLog.oldValue)}
                      </pre>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">New Value</Label>
                      <pre className="bg-slate-50 p-2 rounded border text-xs overflow-x-auto">
                        {safeStringify(selectedLog.newValue)}
                      </pre>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Client Hash</Label>
                      <p className="font-mono text-xs break-all">{selectedLog.clientHash}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Previous Hash</Label>
                      <p className="font-mono text-xs break-all">{selectedLog.previousHash}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
