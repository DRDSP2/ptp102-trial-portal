import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import addClinicalAssessmentAction from '@/actions/addClinicalAssessment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObelGradeReference, type ObelGradeValue } from '@/components/ObelGradeReference';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { sendWhatsAppNotification } from '@/utils/whatsappNotifications';

const assessmentSchema = z.object({
  assessmentDatetime: z.string().min(1, 'Date and time required'),
  obelGrade: z.string().refine((v) => ['0', '1', '2', '3', '4'].includes(v), {
    message: 'Obel grade must be 0–4',
  }),
  painScore: z.string().refine((v) => /^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 10, {
    message: 'Pain score must be 0–10',
  }),
  mobilityScore: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 10), {
      message: 'Mobility score must be 0–10',
    })
    .optional(),
  digitalPulseScore: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 4), {
      message: 'Digital pulse score must be 0–4',
    })
    .optional(),
  hoofTemperature: z.string().optional(),
  heartRate: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0), {
      message: 'Heart rate must be 0 or higher',
    })
    .optional(),
  respiratoryRate: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0), {
      message: 'Respiratory rate must be 0 or higher',
    })
    .optional(),
  temperature: z
    .string()
    .refine((v) => v === '' || (/^\d*\.?\d+$/.test(v) && Number(v) >= 0), {
      message: 'Temperature must be a non-negative number',
    })
    .optional(),
  clinicalNotes: z.string().optional(),
});

type AddAssessmentFormProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function AddAssessmentForm({ patientId, protocolHour, onSuccess }: AddAssessmentFormProps) {
  const auth = useAuth();
  const [addAssessment, isSubmitting] = useMutateAction(addClinicalAssessmentAction);

  const form = useForm<z.infer<typeof assessmentSchema>>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessmentDatetime: new Date().toISOString().slice(0, 16),
      obelGrade: '2',
      painScore: '',
      mobilityScore: '',
      digitalPulseScore: '',
      hoofTemperature: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      clinicalNotes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof assessmentSchema>) => {
    try {
      await addAssessment({
        patientId,
        assessmentDatetime: new Date(values.assessmentDatetime).toISOString(),
        protocolHour: protocolHour || null,
        obelGrade: parseInt(values.obelGrade),
        painScore: parseInt(values.painScore),
        mobilityScore: values.mobilityScore ? parseInt(values.mobilityScore) : null,
        digitalPulseScore: values.digitalPulseScore ? parseInt(values.digitalPulseScore) : null,
        hoofTemperature: values.hoofTemperature || null,
        heartRate: values.heartRate ? parseInt(values.heartRate) : null,
        respiratoryRate: values.respiratoryRate ? parseInt(values.respiratoryRate) : null,
        temperature: values.temperature ? parseFloat(values.temperature) : null,
        clinicalNotes: values.clinicalNotes || null,
        veterinarianName: auth.email ?? 'Unknown',
      });

      sendWhatsAppNotification({
        activityType: 'Assessment Added',
        vetName: auth.email ?? 'Unknown Vet',
        patientId,
        details: {
          'Obel Grade': values.obelGrade,
          'Pain Score': values.painScore,
          'Notes': values.clinicalNotes?.slice(0, 150) ?? null,
        },
      });

      supabase.functions.invoke('send-email', {
        body: {
          to: 'drdsp@pm.me',
          subject: `[PTP-102] Assessment recorded — Patient #${patientId} (Hour ${protocolHour ?? 'N/A'})`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #6b7f3a;">Assessment Recorded</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">#${patientId}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Vet:</td><td style="padding: 6px;">${auth.email ?? 'Unknown'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Protocol Hour:</td><td style="padding: 6px;">${protocolHour ?? 'N/A'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Obel Grade:</td><td style="padding: 6px;">${values.obelGrade}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Pain Score:</td><td style="padding: 6px;">${values.painScore}</td></tr>
            </table>
          </div>`,
        },
      }).catch((err: unknown) => console.error('Admin alert failed (non-critical):', err));

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to add assessment:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="assessmentDatetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="obelGrade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Obel Laminitis Grade (0–4)</FormLabel>
              <FormDescription className="text-xs">
                Clinician-judged gait/lameness grade. This is not calculated from pain, mobility, or vital signs.
              </FormDescription>
              <FormControl>
                <ObelGradeReference
                  value={field.value}
                  onChange={(value: ObelGradeValue) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="painScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pain Score (0-10)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[...Array(11)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} - {i === 0 ? 'No pain' : i <= 3 ? 'Mild' : i <= 6 ? 'Moderate' : 'Severe'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobilityScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobility Score (0-10)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="10" placeholder="0-10" {...field} />
                </FormControl>
                <FormDescription className="text-xs">0 = Cannot move, 10 = Normal</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="digitalPulseScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Digital Pulse (0-4)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="4" placeholder="0-4" {...field} />
                </FormControl>
                <FormDescription className="text-xs">0 = None, 4 = Bounding</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hoofTemperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hoof Temperature</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heartRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heart Rate (bpm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="28-44" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Normal: 28-44</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="respiratoryRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Respiratory Rate (bpm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10-24" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Normal: 10-24</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature (°F)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="99.0-101.0" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Normal: 99.0-101.0</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clinicalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinical Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional clinical observations..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : 'Save Assessment'}
        </Button>
      </form>
    </Form>
  );
}
