import { useEffect, useMemo, useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadVeterinariansAction from '@/actions/loadVeterinarians';
import loadSupplyShipmentsAction from '@/actions/loadSupplyShipments';
import loadAuditLogsAction from '@/actions/loadAuditLogs';
import createSupplyShipmentAction from '@/actions/createSupplyShipment';
import updateSupplyShipmentAction from '@/actions/updateSupplyShipment';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  Plus,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  Search,
  Box,
  History,
  RefreshCw,
} from 'lucide-react';

type Vet = {
  id: number;
  full_name: string;
  email: string;
  hospital_affiliation: string;
  verification_status: string;
};

type SupplyShipment = {
  id: number;
  product_name: string;
  batch_lot_number: string;
  quantity_vials: number;
  remaining_quantity: number;
  bottle_volume_ml: number;
  low_threshold: number;
  shipment_status: string;
  shipped_to_veterinarian_id: number | null;
  shipped_to_veterinarian_email: string | null;
  shipped_to_veterinarian_name: string | null;
  clinic_name?: string;
  vet_full_name?: string;
  tracking_number: string | null;
  carrier: string | null;
  expected_delivery_date: string | null;
  expiration_date: string | null;
  shipment_notes: string | null;
  created_at: string;
  bottles_received_at_clinic: number | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700', icon: <Box className="h-3 w-3" /> },
  shipped: { label: 'Shipped', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-3 w-3" /> },
  received: { label: 'Received', color: 'bg-green-100 text-green-700', icon: <ClipboardCheck className="h-3 w-3" /> },
  in_use: { label: 'In Use', color: 'bg-indigo-100 text-indigo-700', icon: <RefreshCw className="h-3 w-3" /> },
  low: { label: 'Low Stock', color: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="h-3 w-3" /> },
  depleted: { label: 'Depleted', color: 'bg-red-100 text-red-700', icon: <Box className="h-3 w-3" /> },
  pending_dispatch: { label: 'Pending Dispatch', color: 'bg-slate-100 text-slate-700', icon: <Box className="h-3 w-3" /> },
  dispatched: { label: 'Dispatched', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-3 w-3" /> },
  in_transit: { label: 'In Transit', color: 'bg-amber-100 text-amber-700', icon: <Truck className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: <ClipboardCheck className="h-3 w-3" /> },
  received_by_clinic: { label: 'Received by Clinic', color: 'bg-emerald-100 text-emerald-700', icon: <ClipboardCheck className="h-3 w-3" /> },
};

function formatDate(date: string | null) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

function getDefaultLowThreshold(qty: number): number {
  return Math.max(1, Math.min(2, Math.ceil(qty * 0.2)));
}

const ACTIVE_INVENTORY_STATUSES = ['received', 'in_use', 'low', 'depleted'];

export function AdminSupplyPanel() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillClinicId, setPrefillClinicId] = useState<number | null>(null);

  const [shipments, shipmentsLoading] = useLoadAction(loadSupplyShipmentsAction, [], { refreshKey });
  const [vets, vetsLoading] = useLoadAction(loadVeterinariansAction, [], { refreshKey });
  const [createShipment, creating] = useMutateAction(createSupplyShipmentAction);
  const [updateShipment, updating] = useMutateAction(updateSupplyShipmentAction);

  const approvedVets = useMemo(
    () => (vets as Vet[]).filter((v) => v.verification_status === 'approved'),
    [vets]
  );

  const allShipments = useMemo(() => (shipments as SupplyShipment[]) ?? [], [shipments]);

  const clinicSummary = useMemo(() => {
    const map = new Map<
      string,
      { clinic: string; vetName: string; shipped: number; remaining: number; low: boolean; depleted: boolean }
    >();
    allShipments.filter((s) => ACTIVE_INVENTORY_STATUSES.includes(s.shipment_status)).forEach((s) => {
      const key = String(s.shipped_to_veterinarian_id || s.shipped_to_veterinarian_email || 'unknown');
      const existing = map.get(key);
      const isLow = (s.remaining_quantity ?? 0) > 0 && (s.remaining_quantity ?? 0) <= (s.low_threshold ?? 0);
      const isDepleted = (s.remaining_quantity ?? 0) <= 0;
      if (existing) {
        existing.shipped += s.quantity_vials;
        existing.remaining += s.remaining_quantity;
        existing.low = existing.low || isLow;
        existing.depleted = existing.depleted || isDepleted;
      } else {
        map.set(key, {
          clinic: s.clinic_name || s.shipped_to_veterinarian_name || s.shipped_to_veterinarian_email || 'Unknown clinic',
          vetName: s.vet_full_name || s.shipped_to_veterinarian_name || s.shipped_to_veterinarian_email || 'Unknown vet',
          shipped: s.quantity_vials,
          remaining: s.remaining_quantity,
          low: isLow,
          depleted: isDepleted,
        });
      }
    });
    return Array.from(map.values());
  }, [allShipments]);

  const filteredShipments = useMemo(() => {
    return allShipments.filter((s) => {
      const matchesSearch =
        search.trim() === '' ||
        (s.batch_lot_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.clinic_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.vet_full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.product_name || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.shipment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allShipments, search, statusFilter]);

  const lowOrDepleted = useMemo(
    () =>
      allShipments.filter(
        (s) =>
          ACTIVE_INVENTORY_STATUSES.includes(s.shipment_status) &&
          ((s.remaining_quantity ?? 0) <= 0 || ((s.remaining_quantity ?? 0) > 0 && (s.remaining_quantity ?? 0) <= (s.low_threshold ?? 0)))
      ),
    [allShipments]
  );



  const totalShipped = useMemo(
    () => allShipments.reduce((sum, s) => sum + (s.quantity_vials || 0), 0),
    [allShipments]
  );
  const totalRemaining = useMemo(
    () => allShipments.reduce((sum, s) => sum + (s.remaining_quantity || 0), 0),
    [allShipments]
  );

  const handleMarkShipped = async (shipmentId: number) => {
    await updateShipment({
      shipmentId,
      shipmentStatus: 'shipped',
      reasonForChange: 'Marked as shipped by admin',
    });
    setRefreshKey((k) => k + 1);
  };

  const handleOpenResupply = (vetId: number | null) => {
    setPrefillClinicId(vetId);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Shipped</p>
              <p className="text-2xl font-bold">{totalShipped}</p>
              <p className="text-xs text-muted-foreground">bottles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Box className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Remaining</p>
              <p className="text-2xl font-bold">{totalRemaining.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">bottles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Low / Depleted</p>
              <p className="text-2xl font-bold">{lowOrDepleted.length}</p>
              <p className="text-xs text-muted-foreground">batches need attention</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Truck className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Clinics with Inventory</p>
              <p className="text-2xl font-bold">{clinicSummary.length}</p>
              <p className="text-xs text-muted-foreground">active locations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowOrDepleted.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-soft">
            <span className="font-semibold">{lowOrDepleted.length}</span> batch(es) are low or depleted.{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-warning-soft font-semibold underline"
              onClick={() => setStatusFilter('low')}
            >
              View low stock
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Clinic Inventory Summary</CardTitle>
            <CardDescription>Quantity shipped and remaining per clinic</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {clinicSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory has been shipped to clinics yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinicSummary.map((c, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    c.depleted ? 'bg-red-50 border-red-200' : c.low ? 'bg-amber-50 border-amber-200' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{c.clinic}</p>
                    {c.depleted ? (
                      <Badge className="bg-red-100 text-red-700">Depleted</Badge>
                    ) : c.low ? (
                      <Badge className="bg-amber-100 text-amber-700">Low</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">OK</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{c.vetName}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Shipped</p>
                      <p className="font-semibold">{c.shipped}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className={`font-semibold ${c.remaining <= 0 ? 'text-red-600' : ''}`}>
                        {c.remaining.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  {(c.low || c.depleted) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => {
                        const vet = approvedVets.find((v) => v.hospital_affiliation === c.clinic || v.full_name === c.vetName);
                        handleOpenResupply(vet?.id ?? null);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Schedule Resupply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Supply Shipments</CardTitle>
            <CardDescription>Create, dispatch, and track PTP-102 batches per clinic</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button type="button" onClick={() => setPrefillClinicId(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Shipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Supply Shipment</DialogTitle>
              </DialogHeader>
              <CreateShipmentForm
                vets={approvedVets}
                prefillVetId={prefillClinicId}
                onCreated={() => {
                  setCreateOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                createShipment={createShipment}
                creating={creating}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batch, clinic, product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="depleted">Depleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shipmentsLoading || vetsLoading ? (
            <p className="text-sm text-muted-foreground">Loading supply data...</p>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <Box className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No shipments match your filters.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Product / Batch</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((s) => {
                    const cfg = statusConfig[s.shipment_status] || statusConfig.pending;
                    const isLow = (s.remaining_quantity ?? 0) > 0 && (s.remaining_quantity ?? 0) <= (s.low_threshold ?? 0);
                    return (
                      <TableRow key={s.id} className={isLow ? 'bg-amber-50/50' : undefined}>
                        <TableCell>
                          <p className="font-medium text-sm">{s.clinic_name || s.shipped_to_veterinarian_name || 'Unknown clinic'}</p>
                          <p className="text-xs text-muted-foreground">{s.vet_full_name || s.shipped_to_veterinarian_email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{s.product_name || 'PTP-102'}</p>
                          <p className="text-xs font-mono text-muted-foreground">{s.batch_lot_number}</p>
                        </TableCell>
                        <TableCell className="text-right">{s.quantity_vials}</TableCell>
                        <TableCell className="text-right">
                          <span className={s.remaining_quantity <= 0 ? 'text-red-600 font-semibold' : ''}>
                            {(s.remaining_quantity ?? 0).toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cfg.color}>
                            {cfg.icon}
                            <span className="ml-1">{cfg.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(s.expected_delivery_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {s.shipment_status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkShipped(s.id)}
                                disabled={updating}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Ship
                              </Button>
                            )}
                            {(s.shipment_status === 'low' || s.shipment_status === 'depleted') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenResupply(s.shipped_to_veterinarian_id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Resupply
                              </Button>
                            )}
                            <ShipmentAuditTrail shipmentId={s.id} batchLotNumber={s.batch_lot_number} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateShipmentForm({
  vets,
  prefillVetId,
  onCreated,
  createShipment,
  creating,
}: {
  vets: Vet[];
  prefillVetId: number | null;
  onCreated: () => void;
  createShipment: (params: Record<string, unknown>) => Promise<unknown[]>;
  creating: boolean;
}) {
  const [form, setForm] = useState({
    productName: 'PTP-102',
    batchLotNumber: '',
    quantityVials: '10',
    bottleVolumeMl: '1000',
    lowThreshold: '',
    shippedToVeterinarianId: prefillVetId ? String(prefillVetId) : '',
    shipmentStatus: 'pending',
    expectedDeliveryDate: '',
    trackingNumber: '',
    carrier: '',
    expirationDate: '',
    shipmentNotes: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Update selected clinic when prefill changes
  useEffect(() => {
    if (prefillVetId) {
      setForm((f) => ({ ...f, shippedToVeterinarianId: String(prefillVetId) }));
    }
  }, [prefillVetId]);

  const selectedVet = vets.find((v) => String(v.id) === form.shippedToVeterinarianId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseInt(form.quantityVials, 10);
    if (!selectedVet) {
      setError('Please select a clinic.');
      return;
    }
    if (!form.batchLotNumber.trim()) {
      setError('Batch number is required.');
      return;
    }
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    const lowThreshold = form.lowThreshold ? parseInt(form.lowThreshold, 10) : getDefaultLowThreshold(qty);
    try {
      await createShipment({
        productName: form.productName,
        batchLotNumber: form.batchLotNumber.trim(),
        quantityVials: qty,
        bottleVolumeMl: parseInt(form.bottleVolumeMl, 10) || 1000,
        lowThreshold,
        shippedToVeterinarianId: selectedVet.id,
        shippedToVeterinarianEmail: selectedVet.email,
        shippedToVeterinarianName: selectedVet.full_name,
        shipmentStatus: form.shipmentStatus,
        shipmentDate: new Date().toISOString(),
        expectedDeliveryDate: form.expectedDeliveryDate || null,
        trackingNumber: form.trackingNumber.trim() || null,
        carrier: form.carrier.trim() || null,
        expirationDate: form.expirationDate || null,
        shipmentNotes: form.shipmentNotes.trim() || null,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create shipment.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product</Label>
          <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Batch Number *</Label>
          <Input
            placeholder="e.g. X775"
            value={form.batchLotNumber}
            onChange={(e) => setForm({ ...form, batchLotNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Quantity (bottles) *</Label>
          <Input
            type="number"
            min={1}
            value={form.quantityVials}
            onChange={(e) => setForm({ ...form, quantityVials: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Bottle Volume (mL)</Label>
          <Input
            type="number"
            min={1}
            value={form.bottleVolumeMl}
            onChange={(e) => setForm({ ...form, bottleVolumeMl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Low Stock Threshold (bottles)</Label>
          <Input
            type="number"
            min={0}
            placeholder={`Default: ${getDefaultLowThreshold(parseInt(form.quantityVials || '10', 10))}`}
            value={form.lowThreshold}
            onChange={(e) => setForm({ ...form, lowThreshold: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Leave blank to use default (max 2 or 20%).</p>
        </div>
        <div className="space-y-2">
          <Label>Assign to Clinic *</Label>
          <Select
            value={form.shippedToVeterinarianId}
            onValueChange={(val) => setForm({ ...form, shippedToVeterinarianId: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a registered vet clinic" />
            </SelectTrigger>
            <SelectContent>
              {vets.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.hospital_affiliation || v.full_name} ({v.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Initial Status</Label>
          <Select
            value={form.shipmentStatus}
            onValueChange={(val) => setForm({ ...form, shipmentStatus: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Expected Delivery Date</Label>
          <Input
            type="date"
            value={form.expectedDeliveryDate}
            onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tracking Number</Label>
          <Input
            value={form.trackingNumber}
            onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Carrier</Label>
          <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Expiration Date</Label>
          <Input
            type="date"
            value={form.expirationDate}
            onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Shipment Notes</Label>
        <Textarea
          value={form.shipmentNotes}
          onChange={(e) => setForm({ ...form, shipmentNotes: e.target.value })}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={creating}>
          {creating ? 'Creating...' : 'Create Shipment'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ShipmentAuditTrail({ shipmentId, batchLotNumber }: { shipmentId: number; batchLotNumber: string }) {
  const [open, setOpen] = useState(false);
  const [logs] = useLoadAction(loadAuditLogsAction, [], {
    subjectId: String(shipmentId),
    startDate: null,
    endDate: null,
    userEmail: null,
    action: null,
    entityType: null,
  });

  const filtered = useMemo(
    () =>
      ((logs as any[]) ?? []).filter(
        (l) => l.entityId === shipmentId || (l.newValue && String(l.newValue).includes(batchLotNumber))
      ),
    [logs, shipmentId, batchLotNumber]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <History className="h-3 w-3 mr-1" />
          Trail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Trail — {batchLotNumber}</DialogTitle>
        </DialogHeader>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events found for this shipment.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => (
              <div key={l.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{l.action}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {l.userEmail} • {l.userRole}
                </p>
                {l.fieldName && (
                  <p className="text-xs">
                    Field: <span className="font-mono">{l.fieldName}</span>
                  </p>
                )}
                {l.oldValue && (
                  <p className="text-xs text-red-700">Old: {String(l.oldValue).slice(0, 200)}</p>
                )}
                {l.newValue && (
                  <p className="text-xs text-green-700">New: {String(l.newValue).slice(0, 200)}</p>
                )}
                {l.reasonForChange && (
                  <p className="text-xs text-muted-foreground mt-1">Reason: {l.reasonForChange}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
