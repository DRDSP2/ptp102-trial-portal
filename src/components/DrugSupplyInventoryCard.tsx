import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, Beaker } from 'lucide-react';
import type { DrugSupply } from '@/types/trialOperations';

export function DrugSupplyInventoryCard({
  drugSupply,
  isAdmin,
  onUpdate,
}: {
  drugSupply: DrugSupply;
  isAdmin: boolean;
  onUpdate: (patch: Partial<DrugSupply>) => void;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Beaker className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Drug Supply / Bottle Inventory</CardTitle>
              <p className="text-sm text-muted-foreground">PTP-102 product inventory and quantities</p>
            </div>
          </div>
          {drugSupply.inventoryDiscrepancy ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Discrepancy
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Count OK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {drugSupply.inventoryDiscrepancy && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Bottle count discrepancy requires review. Expected: {drugSupply.bottlesSupplied}, Received:{' '}
              {drugSupply.bottlesReceived}.
            </AlertDescription>
          </Alert>
        )}

        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={drugSupply.productName} onChange={(e) => onUpdate({ productName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input value={drugSupply.batchNumber} onChange={(e) => onUpdate({ batchNumber: e.target.value })} placeholder="e.g. B2024001" />
            </div>
            <div className="space-y-2">
              <Label>Lot Number</Label>
              <Input value={drugSupply.lotNumber} onChange={(e) => onUpdate({ lotNumber: e.target.value })} placeholder="e.g. L2024001A" />
            </div>
            <div className="space-y-2">
              <Label>Bottle Size</Label>
              <Input value={drugSupply.bottleSize} onChange={(e) => onUpdate({ bottleSize: e.target.value })} placeholder="e.g. 1L" />
            </div>
            <div className="space-y-2">
              <Label>Bottle Volume (mL)</Label>
              <Input
                type="number"
                value={drugSupply.bottleVolumeMl ?? ''}
                onChange={(e) => onUpdate({ bottleVolumeMl: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bottles Supplied</Label>
              <Input
                type="number"
                value={drugSupply.bottlesSupplied ?? ''}
                onChange={(e) => onUpdate({ bottlesSupplied: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bottles Received</Label>
              <Input
                type="number"
                value={drugSupply.bottlesReceived ?? ''}
                onChange={(e) => onUpdate({ bottlesReceived: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bottles Remaining</Label>
              <Input
                type="number"
                value={drugSupply.bottlesRemaining ?? ''}
                onChange={(e) => onUpdate({ bottlesRemaining: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Customs Invoice Quantity</Label>
              <Input
                type="number"
                value={drugSupply.customsInvoiceQuantity ?? ''}
                onChange={(e) => onUpdate({ customsInvoiceQuantity: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Clinic Confirmed Quantity</Label>
              <Input
                type="number"
                value={drugSupply.clinicConfirmedQuantity ?? ''}
                onChange={(e) => onUpdate({ clinicConfirmedQuantity: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date Received</Label>
              <Input
                type="date"
                value={drugSupply.dateReceived || ''}
                onChange={(e) => onUpdate({ dateReceived: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Received By</Label>
              <Input value={drugSupply.receivedByWhom || ''} onChange={(e) => onUpdate({ receivedByWhom: e.target.value || null })} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Inventory Notes</Label>
              <Textarea
                value={drugSupply.inventoryNotes}
                onChange={(e) => onUpdate({ inventoryNotes: e.target.value })}
                placeholder="Any notes about inventory..."
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <BottleInventoryTable drugSupply={drugSupply} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BottleInventoryTable({ drugSupply }: { drugSupply: DrugSupply }) {
  const rows = [
    { label: 'Product Name', value: drugSupply.productName },
    { label: 'Batch Number', value: drugSupply.batchNumber || '—' },
    { label: 'Lot Number', value: drugSupply.lotNumber || '—' },
    { label: 'Bottle Size', value: drugSupply.bottleSize },
    { label: 'Bottle Volume', value: drugSupply.bottleVolumeMl ? `${drugSupply.bottleVolumeMl} mL` : '—' },
    { label: 'Bottles Supplied', value: drugSupply.bottlesSupplied ?? '—' },
    { label: 'Bottles Received', value: drugSupply.bottlesReceived ?? '—' },
    { label: 'Bottles Remaining', value: drugSupply.bottlesRemaining ?? '—' },
    { label: 'Customs Invoice Qty', value: drugSupply.customsInvoiceQuantity ?? '—' },
    { label: 'Clinic Confirmed Qty', value: drugSupply.clinicConfirmedQuantity ?? '—' },
    { label: 'Date Received', value: drugSupply.dateReceived ? new Date(drugSupply.dateReceived).toLocaleDateString() : '—' },
    { label: 'Received By', value: drugSupply.receivedByWhom || '—' },
  ];

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="text-silver-text text-sm">{row.label}</TableCell>
              <TableCell className="font-medium text-sm">
                {row.label === 'Bottles Supplied' && drugSupply.inventoryDiscrepancy && drugSupply.bottlesSupplied !== drugSupply.bottlesReceived ? (
                  <span className="flex items-center gap-2">
                    <span className="text-red-600">{row.value}</span>
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  </span>
                ) : (
                  row.value
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
