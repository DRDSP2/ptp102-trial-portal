import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadNCIEShipmentsByVetAction from '@/actions/loadNCIEShipmentsByVet';
import updateNCIEShipmentAction from '@/actions/updateNCIEShipment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Truck, PackageCheck, ClipboardCheck, Thermometer, AlertTriangle,
  CheckCircle2, Clock, Copy, Box
} from 'lucide-react';

type VetShipmentPanelProps = {
  vetEmail: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_dispatch: { label: 'Pending Dispatch', color: 'bg-slate-100 text-slate-700', icon: <Clock className="h-3 w-3" /> },
  dispatched: { label: 'Dispatched', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-3 w-3" /> },
  in_transit: { label: 'In Transit', color: 'bg-amber-100 text-amber-700', icon: <Truck className="h-3 w-3" /> },
  held_at_customs: { label: 'Held at Customs', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: <PackageCheck className="h-3 w-3" /> },
  delivery_issue: { label: 'Delivery Issue', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> },
  received_by_clinic: { label: 'Received by Clinic', color: 'bg-emerald-100 text-emerald-700', icon: <ClipboardCheck className="h-3 w-3" /> },
};

export function VetShipmentPanel({ vetEmail }: VetShipmentPanelProps) {
  const [shipments, loading, error, refresh] = useLoadAction(loadNCIEShipmentsByVetAction, [], { vetEmail });
  const [updateShipment, isUpdating] = useMutateAction(updateNCIEShipmentAction);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [receiptForm, setReceiptForm] = useState({
    bottlesReceived: '',
    condition: '',
    storageTemp: '',
    notes: '',
  });

  const handleCopyTracking = (trackingNumber: string) => {
    if (trackingNumber) navigator.clipboard.writeText(trackingNumber);
  };

  const handleConfirmReceipt = async (shipmentId: number) => {
    await updateShipment({
      shipmentId,
      shipmentStatus: 'received_by_clinic',
      receivedAt: new Date().toISOString(),
      receivedByClinicName: vetEmail,
      receivedByClinicDate: new Date().toISOString(),
      bottlesReceivedAtClinic: receiptForm.bottlesReceived ? parseInt(receiptForm.bottlesReceived) : null,
      conditionOnReceipt: receiptForm.condition || null,
      storageTemperatureCelsius: receiptForm.storageTemp ? parseFloat(receiptForm.storageTemp) : null,
      shipmentNotes: receiptForm.notes || null,
    });
    setConfirmingId(null);
    setReceiptForm({ bottlesReceived: '', condition: '', storageTemp: '', notes: '' });
    await refresh();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading your shipments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load shipments. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Box className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No shipments assigned to you yet.</p>
          <p className="text-xs text-muted-foreground mt-1">When product is dispatched, it will appear here with tracking and lot numbers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((ship: any) => {
        const cfg = statusConfig[ship.shipment_status] || statusConfig.pending_dispatch;
        const isDelivered = ship.shipment_status === 'delivered' || ship.shipment_status === 'received_by_clinic';
        const isReceived = ship.shipment_status === 'received_by_clinic';
        return (
          <Card key={ship.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Shipment #{ship.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">Batch/Lot: <span className="font-mono font-semibold">{ship.batch_lot_number}</span></p>
                  </div>
                </div>
                <Badge className={cfg.color}>
                  {cfg.icon}
                  <span className="ml-1">{cfg.label}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Tracking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono font-semibold text-sm">{ship.tracking_number || 'Not assigned'}</p>
                    {ship.tracking_number && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyTracking(ship.tracking_number)} type="button">
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Carrier</p>
                  <p className="font-semibold text-sm mt-1">{ship.carrier || 'Not assigned'}</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Quantity</p>
                  <p className="font-semibold text-sm mt-1">{ship.quantity_vials} vials ({ship.quantity_ml_total} mL total)</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Expiration</p>
                  <p className="font-semibold text-sm mt-1">{ship.expiration_date ? new Date(ship.expiration_date).toLocaleDateString() : '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Expected Delivery</p>
                  <p className="font-semibold text-sm mt-1">{ship.expected_delivery_date ? new Date(ship.expected_delivery_date).toLocaleDateString() : 'Not scheduled'}</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <p className="text-xs text-slate-500 uppercase">Shipped Date</p>
                  <p className="font-semibold text-sm mt-1">{ship.shipment_date ? new Date(ship.shipment_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              {isDelivered && !isReceived && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Shipment delivered — please confirm receipt and storage conditions</span>
                  </AlertDescription>
                </Alert>
              )}

              {isReceived && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Received by {ship.received_by_clinic_name || 'clinic'} on{' '}
                    {ship.received_by_clinic_date ? new Date(ship.received_by_clinic_date).toLocaleDateString() : 'N/A'}
                    {ship.bottles_received_at_clinic ? ` • ${ship.bottles_received_at_clinic} bottles confirmed` : ''}
                  </AlertDescription>
                </Alert>
              )}

              {confirmingId === ship.id ? (
                <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
                  <h4 className="text-sm font-semibold">Confirm Receipt</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Bottles Received</Label>
                      <Input type="number" value={receiptForm.bottlesReceived} onChange={(e) => setReceiptForm((p) => ({ ...p, bottlesReceived: e.target.value }))} placeholder="e.g. 5" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Condition on Receipt</Label>
                      <Input value={receiptForm.condition} onChange={(e) => setReceiptForm((p) => ({ ...p, condition: e.target.value }))} placeholder="e.g. Good, Damaged..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Storage Temp (°C)</Label>
                      <Input type="number" step="0.1" value={receiptForm.storageTemp} onChange={(e) => setReceiptForm((p) => ({ ...p, storageTemp: e.target.value }))} placeholder="e.g. 4.0" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input value={receiptForm.notes} onChange={(e) => setReceiptForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any notes about receipt..." />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleConfirmReceipt(ship.id)} disabled={isUpdating} type="button">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      {isUpdating ? 'Saving...' : 'Confirm Receipt'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)} type="button">Cancel</Button>
                  </div>
                </div>
              ) : (
                isDelivered && !isReceived && (
                  <Button size="sm" onClick={() => setConfirmingId(ship.id)} type="button">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Confirm Receipt
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
