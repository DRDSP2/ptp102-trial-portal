import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import addLabResultAction from '@/actions/addLabResult';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { sendWhatsAppNotification } from '@/utils/whatsappNotifications';

const labSchema = z.object({
  testDatetime: z.string().min(1, 'Date and time required'),
  wbc: z.string().optional(),
  rbc: z.string().optional(),
  hemoglobin: z.string().optional(),
  hematocrit: z.string().optional(),
  platelets: z.string().optional(),
  glucose: z.string().optional(),
  creatinine: z.string().optional(),
  bun: z.string().optional(),
  alt: z.string().optional(),
  ast: z.string().optional(),
  alkalinePhosphatase: z.string().optional(),
  totalProtein: z.string().optional(),
  albumin: z.string().optional(),
  serumAmyloidA: z.string().optional(),
  fibrinogen: z.string().optional(),
  lactate: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type AddLabResultFormProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function AddLabResultForm({ patientId, protocolHour, onSuccess }: AddLabResultFormProps) {
  const auth = useAuth();
  const [addLab, isSubmitting] = useMutateAction(addLabResultAction);

  const form = useForm<z.infer<typeof labSchema>>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      testDatetime: new Date().toISOString().slice(0, 16),
      wbc: '',
      rbc: '',
      hemoglobin: '',
      hematocrit: '',
      platelets: '',
      glucose: '',
      creatinine: '',
      bun: '',
      alt: '',
      ast: '',
      alkalinePhosphatase: '',
      totalProtein: '',
      albumin: '',
      serumAmyloidA: '',
      fibrinogen: '',
      lactate: '',
      additionalNotes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof labSchema>) => {
    console.log('AddLabResultForm: Starting submission', { patientId, protocolHour });
    
    try {
      const params = {
        patientId,
        testDatetime: new Date(values.testDatetime).toISOString(),
        protocolHour: protocolHour ?? null,
        wbc: values.wbc ? parseFloat(values.wbc) : null,
        rbc: values.rbc ? parseFloat(values.rbc) : null,
        hemoglobin: values.hemoglobin ? parseFloat(values.hemoglobin) : null,
        hematocrit: values.hematocrit ? parseFloat(values.hematocrit) : null,
        platelets: values.platelets ? parseFloat(values.platelets) : null,
        glucose: values.glucose ? parseFloat(values.glucose) : null,
        creatinine: values.creatinine ? parseFloat(values.creatinine) : null,
        bun: values.bun ? parseFloat(values.bun) : null,
        alt: values.alt ? parseFloat(values.alt) : null,
        ast: values.ast ? parseFloat(values.ast) : null,
        alkalinePhosphatase: values.alkalinePhosphatase ? parseFloat(values.alkalinePhosphatase) : null,
        totalProtein: values.totalProtein ? parseFloat(values.totalProtein) : null,
        albumin: values.albumin ? parseFloat(values.albumin) : null,
        serumAmyloidA: values.serumAmyloidA ? parseFloat(values.serumAmyloidA) : null,
        fibrinogen: values.fibrinogen ? parseFloat(values.fibrinogen) : null,
        lactate: values.lactate ? parseFloat(values.lactate) : null,
        additionalNotes: values.additionalNotes || null,
      };

      console.log('AddLabResultForm: Calling addLab with params', params);
      const result = await addLab(params);
      console.log('AddLabResultForm: Success', result);

      sendWhatsAppNotification({
        activityType: 'Lab Result Added',
        vetName: auth.email ?? 'Unknown Vet',
        patientId,
        details: {
          'WBC': values.wbc || null,
          'SAA': values.serumAmyloidA || null,
          'Fibrinogen': values.fibrinogen || null,
          'Lactate': values.lactate || null,
          'Notes': values.additionalNotes?.slice(0, 150) ?? null,
        },
      });

      supabase.functions.invoke('send-email', {
        body: {
          to: 'drdsp@pm.me',
          subject: `[PTP-102] Lab result recorded — Patient #${patientId} (Hour ${protocolHour ?? 'N/A'})`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #6b7f3a;">Lab Result Recorded</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">#${patientId}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Vet:</td><td style="padding: 6px;">${auth.email ?? 'Unknown'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Protocol Hour:</td><td style="padding: 6px;">${protocolHour ?? 'N/A'}</td></tr>
            </table>
          </div>`,
        },
      }).catch((err: unknown) => console.error('Admin alert failed (non-critical):', err));

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('AddLabResultForm: Failed to add lab results', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="testDatetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs defaultValue="cbc" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cbc">CBC</TabsTrigger>
            <TabsTrigger value="biochem">Biochemistry</TabsTrigger>
            <TabsTrigger value="inflammatory">Inflammatory</TabsTrigger>
          </TabsList>

          <TabsContent value="cbc" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="wbc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WBC (×10⁹/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="6.0-12.0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 6.0-12.0</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rbc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RBC (×10¹²/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="6.5-12.5" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 6.5-12.5</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hemoglobin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hemoglobin (g/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="11-19" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 11-19</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hematocrit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hematocrit (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="32-52" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 32-52</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platelets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platelets (×10⁹/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="100-600" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 100-600</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="biochem" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="glucose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glucose (mg/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="75-115" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 75-115</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creatinine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creatinine (mg/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1.2-1.9" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 1.2-1.9</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BUN (mg/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="10-24" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 10-24</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ALT (U/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="3-23" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 3-23</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AST (U/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="226-366" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 226-366</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alkalinePhosphatase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alk Phos (U/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="143-395" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 143-395</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalProtein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Protein (g/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="5.2-7.9" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 5.2-7.9</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="albumin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Albumin (g/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="2.6-3.7" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 2.6-3.7</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="inflammatory" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serumAmyloidA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serum Amyloid A (μg/mL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="<20" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: &lt;20</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fibrinogen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fibrinogen (mg/dL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="100-400" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 100-400</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lactate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lactate (mmol/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0.5-2.0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 0.5-2.0</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional lab observations..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : 'Save Lab Results'}
        </Button>
      </form>
    </Form>
  );
}
