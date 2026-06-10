import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListChecks, AlertTriangle, CheckCircle2, Clock, XCircle, MinusCircle } from 'lucide-react';
import type { ChecklistItem, ChecklistStatus } from '@/types/trialOperations';

function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  const config: Record<ChecklistStatus, { label: string; color: string; icon: React.ReactNode }> = {
    complete: { label: 'Complete', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
    issue: { label: 'Issue', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    na: { label: 'N/A', color: 'bg-slate-100 text-slate-600', icon: <MinusCircle className="h-3 w-3" /> },
  };
  const cfg = config[status];
  return (
    <Badge className={cfg.color}>
      {cfg.icon}
      <span className="ml-1">{cfg.label}</span>
    </Badge>
  );
}

export function AdministrationProcedureChecklist({
  checklist,
  isAdmin,
  onUpdateItem,
  userEmail,
}: {
  checklist: ChecklistItem[];
  isAdmin: boolean;
  onUpdateItem: (id: string, patch: Partial<ChecklistItem>, userEmail: string) => void;
  userEmail: string;
}) {
  const unresolved = checklist.filter((i) => i.status === 'issue' || i.status === 'pending');
  const allComplete = checklist.every((i) => i.status === 'complete' || i.status === 'na');

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ListChecks className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Administration Procedure Review</CardTitle>
              <p className="text-sm text-muted-foreground">Protocol completeness checklist before administration</p>
            </div>
          </div>
          {allComplete ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Complete
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {unresolved.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!allComplete && (
          <Alert variant={unresolved.some((i) => i.status === 'issue') ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {unresolved.some((i) => i.status === 'issue')
                ? 'Protocol clarification required before administration.'
                : 'Some checklist items are pending confirmation.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${
                item.status === 'issue'
                  ? 'bg-red-50 border-red-200'
                  : item.status === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <ChecklistStatusBadge status={item.status} />
                  </div>
                  {item.notes && <p className="text-xs text-slate-600">{item.notes}</p>}
                  {item.lastUpdated && (
                    <p className="text-xs text-slate-400 mt-1">
                      Updated {new Date(item.lastUpdated).toLocaleDateString()} by {item.updatedBy || '—'}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={item.status}
                      onValueChange={(v) => onUpdateItem(item.id, { status: v as ChecklistStatus }, userEmail)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="issue">Issue</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="mt-2">
                  <Textarea
                    value={item.notes}
                    onChange={(e) => onUpdateItem(item.id, { notes: e.target.value }, userEmail)}
                    placeholder="Notes..."
                    rows={1}
                    className="text-xs min-h-[32px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProtocolCompletenessWarningPanel({
  checklist,
  protocol,
}: {
  checklist: ChecklistItem[];
  protocol: { protocolApproved: boolean; infusionTimeConfirmed: boolean | null };
}) {
  const issues: string[] = [];

  if (!protocol.protocolApproved) issues.push('Protocol is not yet approved.');
  if (protocol.infusionTimeConfirmed !== true) issues.push('Infusion time missing from procedure.');

  const checklistIssues = checklist.filter((i) => i.status === 'issue');
  const checklistPending = checklist.filter((i) => i.status === 'pending');

  if (issues.length === 0 && checklistIssues.length === 0 && checklistPending.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-red-300">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-1">Protocol Completeness Warnings</p>
        <ul className="list-disc pl-4 space-y-0.5 text-sm">
          {issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
          {checklistIssues.map((i) => (
            <li key={i.id}>{i.label}: {i.notes || 'Issue flagged'}</li>
          ))}
          {checklistPending.map((i) => (
            <li key={i.id}>{i.label}: Pending confirmation</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
