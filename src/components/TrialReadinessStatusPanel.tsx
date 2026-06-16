import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  PackageCheck,
  Thermometer,
  FileCheck,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import type { TrialReadinessOverallStatus } from '@/types/trialOperations';

const statusConfig: Record<
  TrialReadinessOverallStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  not_ready: { label: 'Not Ready', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  awaiting_shipment: {
    label: 'Awaiting Shipment',
    color: 'bg-amber-100 text-amber-800',
    icon: <Truck className="h-4 w-4" />,
  },
  awaiting_delivery: {
    label: 'Awaiting Delivery',
    color: 'bg-amber-100 text-amber-800',
    icon: <Truck className="h-4 w-4" />,
  },
  awaiting_storage_confirmation: {
    label: 'Awaiting Storage Confirmation',
    color: 'bg-blue-100 text-blue-800',
    icon: <Thermometer className="h-4 w-4" />,
  },
  protocol_clarification_required: {
    label: 'Protocol Clarification Required',
    color: 'bg-orange-100 text-orange-800',
    icon: <FileCheck className="h-4 w-4" />,
  },
  ready_for_enrolment: {
    label: 'Ready for Enrolment',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800', icon: <Activity className="h-4 w-4" /> },
};

export function TrialReadinessStatusPanel({
  readiness,
  overridden,
  overrideBy,
  overrideReason,
  isAdmin,
  onOverride,
}: {
  readiness: {
    overall: TrialReadinessOverallStatus;
    productShipped: boolean;
    productDelivered: boolean;
    productReceived: boolean;
    inventoryConfirmed: boolean;
    storageConfirmed: boolean;
    protocolApproved: boolean;
    adminProcedureApproved: boolean;
    infusionTimeConfirmed: boolean;
    caseEnrolmentOpen: boolean;
    unresolvedIssues: number;
    pendingItems: number;
  };
  overridden: boolean;
  overrideBy: string | null;
  overrideReason: string | null;
  isAdmin: boolean;
  onOverride: (status: TrialReadinessOverallStatus | null, reason: string) => void;
}) {
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<TrialReadinessOverallStatus>(readiness.overall);
  const [overrideNote, setOverrideNote] = useState('');

  const cfg = statusConfig[readiness.overall];

  const items = [
    { label: 'Product shipped', ok: readiness.productShipped, icon: <Truck className="h-4 w-4" /> },
    { label: 'Product delivered', ok: readiness.productDelivered, icon: <PackageCheck className="h-4 w-4" /> },
    { label: 'Product received by clinic', ok: readiness.productReceived, icon: <PackageCheck className="h-4 w-4" /> },
    { label: 'Bottle inventory confirmed', ok: readiness.inventoryConfirmed, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Storage conditions confirmed', ok: readiness.storageConfirmed, icon: <Thermometer className="h-4 w-4" /> },
    { label: 'Protocol approved', ok: readiness.protocolApproved, icon: <FileCheck className="h-4 w-4" /> },
    { label: 'Administration procedure approved', ok: readiness.adminProcedureApproved, icon: <Stethoscope className="h-4 w-4" /> },
    { label: 'Infusion time confirmed', ok: readiness.infusionTimeConfirmed, icon: <Clock className="h-4 w-4" /> },
    { label: 'Case enrolment open', ok: readiness.caseEnrolmentOpen, icon: <Activity className="h-4 w-4" /> },
  ];

  const handleApplyOverride = () => {
    onOverride(overrideStatus, overrideNote);
    setOverrideDialogOpen(false);
    setOverrideNote('');
  };

  const handleClearOverride = () => {
    onOverride(null, '');
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Activity className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Trial Readiness Status</CardTitle>
              <p className="text-sm text-muted-foreground">Site readiness summary before enrolment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cfg.color}>
              {cfg.icon}
              <span className="ml-1">{cfg.label}</span>
            </Badge>
            {overridden && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Overridden
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {overridden && overrideBy && (
          <Alert className="bg-amber-50 border-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Status overridden by {overrideBy}. {overrideReason || 'No reason provided.'}
            </AlertDescription>
          </Alert>
        )}

        {(readiness.unresolvedIssues > 0 || readiness.pendingItems > 0) && (
          <Alert variant={readiness.unresolvedIssues > 0 ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {readiness.unresolvedIssues > 0
                ? `${readiness.unresolvedIssues} unresolved issue(s) require attention. `
                : ''}
              {readiness.pendingItems > 0
                ? `${readiness.pendingItems} item(s) pending confirmation.`
                : ''}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.ok ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={item.ok ? 'text-green-600' : 'text-slate-400'}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.ok ? 'text-green-800' : 'text-slate-600'}`}>
                  {item.label}
                </p>
              </div>
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-2 pt-2">
            <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Override Readiness
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Override Trial Readiness Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Set Status To</Label>
                    <Select
                      value={overrideStatus}
                      onValueChange={(v) => setOverrideStatus(v as TrialReadinessOverallStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_ready">Not Ready</SelectItem>
                        <SelectItem value="awaiting_shipment">Awaiting Shipment</SelectItem>
                        <SelectItem value="awaiting_delivery">Awaiting Delivery</SelectItem>
                        <SelectItem value="awaiting_storage_confirmation">Awaiting Storage Confirmation</SelectItem>
                        <SelectItem value="protocol_clarification_required">Protocol Clarification Required</SelectItem>
                        <SelectItem value="ready_for_enrolment">Ready for Enrolment</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={overrideNote}
                      onChange={(e) => setOverrideNote(e.target.value)}
                      placeholder="Why are you overriding?"
                    />
                  </div>
                  <Button onClick={handleApplyOverride} className="w-full" type="button">
                    Apply Override
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {overridden && (
              <Button variant="ghost" size="sm" onClick={handleClearOverride} type="button">
                Clear Override
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
