import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Copy,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';
import type { Shipment, ShipmentStatus } from '@/types/trialOperations';

const shipmentStatusConfig: Record<
  ShipmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending_dispatch: { label: 'Pending Dispatch', color: 'bg-slate-100 text-slate-700', icon: <Clock className="h-3 w-3" /> },
  dispatched: { label: 'Dispatched', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-3 w-3" /> },
  in_transit: { label: 'In Transit', color: 'bg-amber-100 text-amber-700', icon: <Truck className="h-3 w-3" /> },
  held_at_customs: { label: 'Held at Customs', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: <PackageCheck className="h-3 w-3" /> },
  delivery_issue: { label: 'Delivery Issue', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> },
  received_by_clinic: { label: 'Received by Clinic', color: 'bg-emerald-100 text-emerald-700', icon: <ClipboardCheck className="h-3 w-3" /> },
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const cfg = shipmentStatusConfig[status];
  return (
    <Badge className={cfg.color}>
      {cfg.icon}
      <span className="ml-1">{cfg.label}</span>
    </Badge>
  );
}

export function ProductShipmentTrackingCard({
  shipment,
  isAdmin,
  onUpdate,
  vetEmail,
}: {
  shipment: Shipment;
  isAdmin: boolean;
  onUpdate: (patch: Partial<Shipment>) => void;
  vetEmail?: string;
}) {
  const copyTracking = () => {
    if (shipment.trackingNumber) {
      navigator.clipboard.writeText(shipment.trackingNumber);
    }
  };

  const handleVetConfirmReceipt = () => {
    onUpdate({
      receivedByClinic: true,
      receivedByClinicDate: new Date().toISOString(),
      receivedByClinicName: vetEmail || 'Clinic User',
      shipmentStatus: 'received_by_clinic',
    });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Shipment Tracking</CardTitle>
              <p className="text-sm text-muted-foreground">PTP-102 delivery status and tracking</p>
            </div>
          </div>
          <ShipmentStatusBadge status={shipment.shipmentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <div className="flex gap-2">
                <Input
                  value={shipment.trackingNumber}
                  onChange={(e) => onUpdate({ trackingNumber: e.target.value })}
                  placeholder="e.g. 1Z999AA10123456784"
                />
                <Button variant="outline" size="icon" onClick={copyTracking} type="button">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Carrier / Courier</Label>
              <Input
                value={shipment.carrier}
                onChange={(e) => onUpdate({ carrier: e.target.value })}
                placeholder="e.g. FedEx, DHL, UPS"
              />
            </div>
            <div className="space-y-2">
              <Label>Shipment Status</Label>
              <Select
                value={shipment.shipmentStatus}
                onValueChange={(v) => onUpdate({ shipmentStatus: v as ShipmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_dispatch">Pending Dispatch</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="held_at_customs">Held at Customs</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delivery_issue">Delivery Issue</SelectItem>
                  <SelectItem value="received_by_clinic">Received by Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dispatch Date</Label>
              <Input
                type="date"
                value={shipment.dispatchDate || ''}
                onChange={(e) => onUpdate({ dispatchDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery</Label>
              <Input
                type="datetime-local"
                value={shipment.expectedDeliveryDate || ''}
                onChange={(e) => onUpdate({ expectedDeliveryDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Delivered Date</Label>
              <Input
                type="datetime-local"
                value={shipment.deliveredDate || ''}
                onChange={(e) => onUpdate({ deliveredDate: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Shipment Notes</Label>
              <Textarea
                value={shipment.shipmentNotes}
                onChange={(e) => onUpdate({ shipmentNotes: e.target.value })}
                placeholder="Any notes about the shipment..."
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Tracking Number</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono font-semibold text-sm text-slate-900">
                    {shipment.trackingNumber || 'Not assigned'}
                  </p>
                  {shipment.trackingNumber && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyTracking} type="button">
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Carrier</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">{shipment.carrier || 'Not assigned'}</p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Expected Delivery</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">
                  {shipment.expectedDeliveryDate
                    ? new Date(shipment.expectedDeliveryDate).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Delivered</p>
                <p className="font-semibold text-sm mt-1 text-slate-900">
                  {shipment.deliveredDate
                    ? new Date(shipment.deliveredDate).toLocaleString()
                    : 'Not yet delivered'}
                </p>
              </div>
            </div>
            {shipment.shipmentNotes && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>{shipment.shipmentNotes}</AlertDescription>
              </Alert>
            )}

            {shipment.shipmentStatus === 'delivered' && !shipment.receivedByClinic && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Shipment delivered — awaiting clinic receipt confirmation</span>
                  <Button size="sm" onClick={handleVetConfirmReceipt} type="button">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Confirm Receipt
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {shipment.receivedByClinic && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Received by {shipment.receivedByClinicName || 'clinic'} on{' '}
                  {shipment.receivedByClinicDate
                    ? new Date(shipment.receivedByClinicDate).toLocaleDateString()
                    : 'N/A'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
