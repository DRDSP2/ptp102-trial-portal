import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Thermometer, AlertTriangle, CheckCircle2, Snowflake, Sun, Box } from 'lucide-react';
import type { StorageConditions, StorageConfirmationStatus } from '@/types/trialOperations';

export function StorageConfirmationStatusBadge({ status }: { status: StorageConfirmationStatus }) {
  const config: Record<StorageConfirmationStatus, { label: string; color: string }> = {
    pending_confirmation: { label: 'Pending Confirmation', color: 'bg-amber-100 text-amber-800' },
    confirmed_compliant: { label: 'Confirmed Compliant', color: 'bg-green-100 text-green-800' },
    potential_issue: { label: 'Potential Issue', color: 'bg-orange-100 text-orange-800' },
    non_compliant: { label: 'Non-Compliant', color: 'bg-red-100 text-red-800' },
  };
  const cfg = config[status];
  return <Badge className={cfg.color}>{cfg.label}</Badge>;
}

export function StorageConditionsCard({
  storage,
  isAdmin,
  onUpdate,
  vetEmail,
}: {
  storage: StorageConditions;
  isAdmin: boolean;
  onUpdate: (patch: Partial<StorageConditions>) => void;
  vetEmail?: string;
}) {
  const handleVetConfirm = () => {
    onUpdate({
      storageConfirmed: true,
      storageConfirmationStatus: 'confirmed_compliant',
      storageConfirmedBy: vetEmail || 'Clinic User',
      storageConfirmedDate: new Date().toISOString(),
    });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Thermometer className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Storage Conditions</CardTitle>
              <p className="text-sm text-muted-foreground">Temperature, location, and compliance</p>
            </div>
          </div>
          <StorageConfirmationStatusBadge status={storage.storageConfirmationStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!storage.storageConfirmed && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Storage temperature pending confirmation. Please confirm actual storage conditions before use.
            </AlertDescription>
          </Alert>
        )}

        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Required Storage Temperature</Label>
              <Input
                value={storage.requiredStorageTemperature}
                onChange={(e) => onUpdate({ requiredStorageTemperature: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Actual Storage Temperature</Label>
              <Input
                value={storage.actualStorageTemperature || ''}
                onChange={(e) => onUpdate({ actualStorageTemperature: e.target.value || null })}
                placeholder="e.g. 4°C"
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Input
                value={storage.storageLocation || ''}
                onChange={(e) => onUpdate({ storageLocation: e.target.value || null })}
                placeholder="e.g. Refrigerator B, Room 101"
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Status</Label>
              <Select
                value={storage.storageConfirmationStatus}
                onValueChange={(v) => onUpdate({ storageConfirmationStatus: v as StorageConfirmationStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                  <SelectItem value="confirmed_compliant">Confirmed Compliant</SelectItem>
                  <SelectItem value="potential_issue">Potential Issue</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="refrigerated"
                checked={storage.refrigerated ?? false}
                onCheckedChange={(v) => onUpdate({ refrigerated: v === true })}
              />
              <Label htmlFor="refrigerated" className="cursor-pointer">
                <Snowflake className="h-3 w-3 inline mr-1" />
                Refrigerated
              </Label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="lightProtected"
                checked={storage.lightProtected ?? false}
                onCheckedChange={(v) => onUpdate({ lightProtected: v === true })}
              />
              <Label htmlFor="lightProtected" className="cursor-pointer">
                <Sun className="h-3 w-3 inline mr-1" />
                Light Protected
              </Label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="originalBox"
                checked={storage.originalShippingBoxRetained ?? false}
                onCheckedChange={(v) => onUpdate({ originalShippingBoxRetained: v === true })}
              />
              <Label htmlFor="originalBox" className="cursor-pointer">
                <Box className="h-3 w-3 inline mr-1" />
                Original shipping box retained
              </Label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="foil"
                checked={storage.foilWrappingRetained ?? false}
                onCheckedChange={(v) => onUpdate({ foilWrappingRetained: v === true })}
              />
              <Label htmlFor="foil" className="cursor-pointer">
                Aluminum foil / light protection retained
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Confirmed By</Label>
              <Input
                value={storage.storageConfirmedBy || ''}
                onChange={(e) => onUpdate({ storageConfirmedBy: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmed Date</Label>
              <Input
                type="date"
                value={storage.storageConfirmedDate || ''}
                onChange={(e) => onUpdate({ storageConfirmedDate: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Storage Notes</Label>
              <Textarea
                value={storage.storageNotes}
                onChange={(e) => onUpdate({ storageNotes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Required Temperature</p>
                <p className="font-semibold text-sm mt-1">{storage.requiredStorageTemperature}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Actual Temperature</p>
                <p className="font-semibold text-sm mt-1">{storage.actualStorageTemperature || 'Not recorded'}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Storage Location</p>
                <p className="font-semibold text-sm mt-1">{storage.storageLocation || 'Not recorded'}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Confirmed By</p>
                <p className="font-semibold text-sm mt-1">{storage.storageConfirmedBy || '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {storage.refrigerated === true && (
                <Badge variant="outline" className="text-cyan-700 border-cyan-300">
                  <Snowflake className="h-3 w-3 mr-1" /> Refrigerated
                </Badge>
              )}
              {storage.lightProtected === true && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  <Sun className="h-3 w-3 mr-1" /> Light Protected
                </Badge>
              )}
              {storage.originalShippingBoxRetained === true && (
                <Badge variant="outline" className="text-slate-700">
                  <Box className="h-3 w-3 mr-1" /> Original Box Retained
                </Badge>
              )}
              {storage.foilWrappingRetained === true && (
                <Badge variant="outline" className="text-slate-700">
                  Foil Wrapping Retained
                </Badge>
              )}
            </div>
            {storage.storageNotes && (
              <Alert>
                <AlertDescription>{storage.storageNotes}</AlertDescription>
              </Alert>
            )}

            {!storage.storageConfirmed && (
              <Button onClick={handleVetConfirm} type="button">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Storage Conditions
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
