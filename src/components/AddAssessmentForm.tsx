import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import addClinicalAssessmentAction from '@/actions/addClinicalAssessment';
import createAuditLogAction from '@/actions/createAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObelGradeReference, type ObelGradeValue } from '@/components/ObelGradeReference';

const assessmentSchema = z.object({
  assessmentDatetime: z.string().min(1, 'Date and time required'),
  obelGrade: z.string().min(1, 'Obel grade required'),
  painScore: z.string().min(1, 'Pain score required'),
  mobilityScore: z.string().optional(),
  digitalPulseScore: z.string().optional(),
  hoofTemperature: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

type AddAssessmentFormProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function AddAssessmentForm({ patientId, protocolHour, onSuccess }: AddAssessmentFormProps) {
  const [addAssessment, isSubmitting] = useMutateAction(addClinicalAssessmentAction);
  const [logAudit] = useMutateAction(createAuditLogAction);

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
        veterinarianName: localStorage.getItem('veterinarian_email') || 'Unknown',
      });
      const userEmail = localStorage.getItem('veterinarian_email') || localStorage.getItem('admin_email') || 'unknown';
      try {
        await logAudit({
          userId: userEmail,
          userEmail,
          userRole: localStorage.getItem('admin_email') ? 'admin' : 'vet',
          action: 'CREATE',
          entityType: 'clinical_assessment',
          entityId: patientId,
          fieldName: null,
          oldValue: null,
          newValue: JSON.stringify({ obelGrade: values.obelGrade, painScore: values.painScore, protocolHour }),
          reasonForChange: null,
          ipAddress: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          sessionId: null,
        });
      } catch (e) {
        console.error('Audit log failed (non-blocking):', e);
      }
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to add assessment:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormLabel className="sr-only">Obel Grade (Lameness)</FormLabel>
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
