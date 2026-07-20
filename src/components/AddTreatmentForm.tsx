import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import addTreatmentAction from '@/actions/addTreatment';
import loadSupplyShipmentsByVetAction from '@/actions/loadSupplyShipmentsByVet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { sendDiscordNotification } from '@/utils/discordNotifications';
import { sendWhatsAppNotification } from '@/utils/whatsappNotifications';
import { useTrialMutation } from '@/hooks/use-trial-mutation';
import { toLocalDatetimeInputValue } from '@/lib/datetime';

const treatmentSchema = z.object({
  administrationDatetime: z.string().min(1, 'Date and time required'),
  totalVolumeMl: z.string().min(1, 'Total volume required'),
  concentrationMgMl: z.string().min(1, 'Concentration required'),
  infusionDurationMin: z.string().min(1, 'Infusion duration required'),
  route: z.string().min(1, 'Route required'),
  batchNumber: z
    .string()
    .optional()
    .refine((v) => v !== '__manual__', { message: 'Please enter a batch number' }),
  immediateReactions: z.string().optional(),
  notes: z.string().optional(),
  protocolHourOverride: z.string().optional(),
});

type AddTreatmentFormProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function AddTreatmentForm({ patientId, protocolHour, onSuccess }: AddTreatmentFormProps) {
  const auth = useAuth();
  const [addTreatment] = useMutateAction(addTreatmentAction);
  const [isManualBatch, setIsManualBatch] = useState(false);
  const vetEmail = auth.email ?? '';
  const [shipments] = useLoadAction(loadSupplyShipmentsByVetAction, [], { vetEmail });
  const activeShipments = ((shipments as any[]) ?? []).filter(
    (s) =>
      ['received', 'in_use', 'low'].includes(s.shipment_status) &&
      s.remaining_quantity > 0
  );

  const form = useForm<z.infer<typeof treatmentSchema>>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      administrationDatetime: toLocalDatetimeInputValue(),
      totalVolumeMl: '500',
      concentrationMgMl: '5',
      infusionDurationMin: '20',
      route: 'IV - Jugular',
      batchNumber: '',
      immediateReactions: '',
      notes: '',
      protocolHourOverride: protocolHour !== null ? protocolHour.toString() : '0',
    },
  });

  const treatmentMutation = useTrialMutation<z.infer<typeof treatmentSchema>, void>({
    mutationFn: async (values) => {
      const calculatedDosage = parseFloat(values.totalVolumeMl) * parseFloat(values.concentrationMgMl);
      const finalProtocolHour = values.protocolHourOverride ? parseInt(values.protocolHourOverride) : (protocolHour || 0);
      
      const detailedNotes = [
        values.notes,
        `Volume: ${values.totalVolumeMl}mL`,
        `Concentration: ${values.concentrationMgMl}mg/mL`,
        `Calculated Dosage: ${calculatedDosage}mg`,
        `Infusion Duration: ${values.infusionDurationMin} minutes`,
      ].filter(Boolean).join(' | ');

      await addTreatment({
        patientId,
        administrationDatetime: new Date(values.administrationDatetime).toISOString(),
        dosageMg: calculatedDosage,
        route: values.route,
        veterinarianName: auth.email ?? 'Unknown',
        batchNumber: values.batchNumber || null,
        immediateReactions: values.immediateReactions || null,
        notes: detailedNotes || null,
        protocolHour: finalProtocolHour,
        totalVolumeMl: parseFloat(values.totalVolumeMl),
      });

      sendWhatsAppNotification({
        activityType: 'Treatment Added',
        vetName: auth.email ?? 'Unknown Vet',
        patientId,
        details: {
          'Route': values.route,
          'Dosage (mg)': calculatedDosage,
          'Batch': values.batchNumber ?? null,
          'Notes': values.notes?.slice(0, 150) ?? null,
        },
      });

      // Admin email alerts
      const vetName = auth.email ?? 'Unknown Vet';
      if (finalProtocolHour === 0) {
        void sendDiscordNotification({
          activityType: 'Trial Started',
          actorEmail: vetName,
          details: {
            'Patient ID': patientId,
            Route: values.route,
            'Dosage (mg)': calculatedDosage,
            'Administration Time': new Date(values.administrationDatetime).toISOString(),
          },
        });

        supabase.functions.invoke('send-email', {
          body: {
            to: 'drdsp@pm.me',
            subject: `[PTP-102] Trial started — Patient #${patientId}`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #6b7f3a;">Trial Started (Hour 0)</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">#${patientId}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Vet:</td><td style="padding: 6px;">${vetName}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Route:</td><td style="padding: 6px;">${values.route}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Dosage:</td><td style="padding: 6px;">${calculatedDosage} mg</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Time:</td><td style="padding: 6px;">${new Date(values.administrationDatetime).toLocaleString()}</td></tr>
              </table>
            </div>`,
          },
        }).catch((err: unknown) => console.error('Admin alert failed (non-critical):', err));
      }
      supabase.functions.invoke('send-email', {
        body: {
          to: 'drdsp@pm.me',
          subject: `[PTP-102] Treatment recorded — Patient #${patientId} (Hour ${finalProtocolHour})`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #6b7f3a;">Treatment Recorded</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">#${patientId}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Vet:</td><td style="padding: 6px;">${vetName}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Protocol Hour:</td><td style="padding: 6px;">${finalProtocolHour}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Route:</td><td style="padding: 6px;">${values.route}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Dosage:</td><td style="padding: 6px;">${calculatedDosage} mg</td></tr>
            </table>
          </div>`,
        },
      }).catch((err: unknown) => console.error('Admin alert failed (non-critical):', err));
    },
    successToast: 'Treatment recorded.',
    errorTitle: 'Failed to save treatment',
    onSuccess: () => {
      form.reset();
      setIsManualBatch(false);
      onSuccess();
    },
  });

  const onSubmit = (values: z.infer<typeof treatmentSchema>) => {
    treatmentMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">PTP-102 Standard Protocol</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div>• 5mg/mL concentration</div>
            <div>• 500mL total volume</div>
            <div>• IV jugular vein</div>
            <div>• 15-30 min infusion</div>
          </div>
        </div>

        {protocolHour === null && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will be the first treatment (Hour 0) and will start the 72-hour protocol timeline.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="administrationDatetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Administration Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="protocolHourOverride"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Protocol Hour *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="1" 
                    placeholder="0, 12, 24, 48, 72..." 
                    {...field} 
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {protocolHour === null ? 'Set to 0 for first dose' : `Current: ${protocolHour}`}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {activeShipments.length > 0 ? (
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => {
                const selected = activeShipments.find((s) => s.batch_lot_number === field.value);
                return (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === '__manual__') {
                          setIsManualBatch(true);
                          field.onChange('');
                        } else {
                          setIsManualBatch(false);
                          field.onChange(value);
                        }
                      }}
                      value={isManualBatch ? '__manual__' : field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an active batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeShipments.map((s) => (
                          <SelectItem key={s.id} value={s.batch_lot_number}>
                            {s.batch_lot_number} ({s.remaining_quantity.toFixed(1)} remaining)
                          </SelectItem>
                        ))}
                        <SelectItem value="__manual__">Other / manual entry</SelectItem>
                      </SelectContent>
                    </Select>
                    {selected && selected.remaining_quantity <= selected.low_threshold && (
                      <p className="text-xs text-amber-600">Low stock on this batch.</p>
                    )}
                    {isManualBatch && (
                      <Input
                        className="mt-2"
                        placeholder="Enter batch number"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ) : (
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number</FormLabel>
                  <FormControl>
                    <Input placeholder="PTP102-2025-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="totalVolumeMl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Volume (mL) *</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="concentrationMgMl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concentration (mg/mL) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="infusionDurationMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Infusion Duration (min) *</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="20" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">Protocol: 15-30 minutes</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Administration Route *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IV - Jugular">IV - Jugular Vein (Protocol Standard)</SelectItem>
                    <SelectItem value="IV - Other">IV - Other Location</SelectItem>
                    <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                    <SelectItem value="SC">Subcutaneous (SC)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="immediateReactions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immediate Reactions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Note any immediate reactions or observations..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional treatment notes..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {treatmentMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to save treatment</AlertTitle>
            <AlertDescription>{treatmentMutation.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={treatmentMutation.isPending} className="w-full">
          {treatmentMutation.isPending ? 'Recording...' : 'Record Treatment'}
        </Button>
      </form>
    </Form>
  );
}
