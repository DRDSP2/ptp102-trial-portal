import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import type { ProtocolLabelInfo, ChecklistStatus } from '@/types/trialOperations';

export function ProtocolLabelInfoCard({
  protocol,
  isAdmin,
  onUpdate,
}: {
  protocol: ProtocolLabelInfo;
  isAdmin: boolean;
  onUpdate: (patch: Partial<ProtocolLabelInfo>) => void;
}) {
  const warnings: string[] = [];
  if (!protocol.supplyFormatConfirmed) warnings.push('Supply format is absent');
  if (!protocol.storageInstructionsOnLabel) warnings.push('Storage conditions are absent from label');
  if (!protocol.bottleSizeConfirmed) warnings.push('Bottle size inconsistent with inventory records');
  if (!protocol.infusionTimeConfirmed) warnings.push('Infusion time is missing');
  if (!protocol.bottleLabelReviewed) warnings.push('Label information is missing');

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Protocol & Bottle Label Information</CardTitle>
              <p className="text-sm text-muted-foreground">Approved dosing, handling, and label details</p>
            </div>
          </div>
          <Badge className={protocol.protocolApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
            {protocol.protocolApproved ? <ShieldCheck className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
            {protocol.protocolApproved ? 'Protocol Approved' : 'Pending Approval'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-0.5">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-blue-800 text-sm">Approved Dose</p>
          </div>
          <p className="text-blue-900 font-mono text-lg">{protocol.approvedDose}</p>
          <p className="text-blue-700 text-xs mt-1">This dose has been provided to the app and is read-only.</p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Protocol Version</Label>
              <Input value={protocol.protocolVersion} onChange={(e) => onUpdate({ protocolVersion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Infusion Time</Label>
              <Input
                value={protocol.infusionTime || ''}
                onChange={(e) => onUpdate({ infusionTime: e.target.value || null })}
                placeholder="e.g. 15-30 minutes"
              />
            </div>
            <div className="space-y-2">
              <Label>Handling Instructions</Label>
              <Textarea
                value={protocol.handlingInstructions}
                onChange={(e) => onUpdate({ handlingInstructions: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Label Text / Summary</Label>
              <Textarea
                value={protocol.labelText || ''}
                onChange={(e) => onUpdate({ labelText: e.target.value || null })}
                placeholder="Bottle label text or summary..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Administration Procedure Status</Label>
              <Select
                value={protocol.administrationProcedureStatus}
                onValueChange={(v) => onUpdate({ administrationProcedureStatus: v as ChecklistStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="na">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Protocol Approved By</Label>
              <Input
                value={protocol.protocolApprovedBy || ''}
                onChange={(e) => onUpdate({ protocolApprovedBy: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Protocol Approved Date</Label>
              <Input
                type="date"
                value={protocol.protocolApprovedDate || ''}
                onChange={(e) => onUpdate({ protocolApprovedDate: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="labelReviewed"
                  checked={protocol.bottleLabelReviewed}
                  onCheckedChange={(v) => onUpdate({ bottleLabelReviewed: v === true })}
                />
                <Label htmlFor="labelReviewed" className="cursor-pointer text-sm">
                  Bottle label reviewed
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="storageOnLabel"
                  checked={protocol.storageInstructionsOnLabel ?? false}
                  onCheckedChange={(v) => onUpdate({ storageInstructionsOnLabel: v === true })}
                />
                <Label htmlFor="storageOnLabel" className="cursor-pointer text-sm">
                  Storage instructions on label
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="supplyFormat"
                  checked={protocol.supplyFormatConfirmed ?? false}
                  onCheckedChange={(v) => onUpdate({ supplyFormatConfirmed: v === true })}
                />
                <Label htmlFor="supplyFormat" className="cursor-pointer text-sm">
                  Supply format confirmed
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bottleSizeProto"
                  checked={protocol.bottleSizeConfirmed ?? false}
                  onCheckedChange={(v) => onUpdate({ bottleSizeConfirmed: v === true })}
                />
                <Label htmlFor="bottleSizeProto" className="cursor-pointer text-sm">
                  Bottle size confirmed
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="infusionTimeProto"
                  checked={protocol.infusionTimeConfirmed ?? false}
                  onCheckedChange={(v) => onUpdate({ infusionTimeConfirmed: v === true })}
                />
                <Label htmlFor="infusionTimeProto" className="cursor-pointer text-sm">
                  Infusion time confirmed
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="protocolApproved"
                  checked={protocol.protocolApproved}
                  onCheckedChange={(v) => onUpdate({ protocolApproved: v === true })}
                />
                <Label htmlFor="protocolApproved" className="cursor-pointer text-sm font-semibold">
                  Protocol approved
                </Label>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Protocol Completeness Notes</Label>
              <Textarea
                value={protocol.protocolCompletenessNotes}
                onChange={(e) => onUpdate({ protocolCompletenessNotes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Protocol Version</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">{protocol.protocolVersion}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Infusion Time</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">{protocol.infusionTime || 'Not recorded'}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Approved By</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">{protocol.protocolApprovedBy || '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Approved Date</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">
                  {protocol.protocolApprovedDate ? new Date(protocol.protocolApprovedDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-lg">
              <p className="text-xs text-slate-500 uppercase">Handling Instructions</p>
              <p className="text-sm mt-1 text-slate-700">{protocol.handlingInstructions}</p>
            </div>
            {protocol.labelText && (
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Label Text</p>
                <p className="text-sm mt-1 text-slate-700">{protocol.labelText}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {protocol.bottleLabelReviewed && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Label Reviewed
                </Badge>
              )}
              {protocol.storageInstructionsOnLabel && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Storage on Label
                </Badge>
              )}
              {protocol.supplyFormatConfirmed && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Supply Format OK
                </Badge>
              )}
              {protocol.bottleSizeConfirmed && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Bottle Size OK
                </Badge>
              )}
              {protocol.infusionTimeConfirmed && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Infusion Time OK
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
