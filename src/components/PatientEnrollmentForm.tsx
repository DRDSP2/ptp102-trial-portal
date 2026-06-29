import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import createPatientAction from '@/actions/createPatient';
import updatePatientAction from '@/actions/updatePatient';
import sendEmailNotificationAction from '@/actions/sendEmailNotification';
import { useAuth } from '@/context/AuthContext';
import { sendNotification, NotificationType } from '@/utils/emailNotifications';
import { Patient } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload, X, Loader2 } from 'lucide-react';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { useSecureDownloadUrl } from '@/hooks/useSecureDownloadUrl';

type UploadedImageInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

const patientSchema = z.object({
  horseName: z.string().min(2, 'Horse name must be at least 2 characters'),
  age: z.string().min(1, 'Age is required'),
  breed: z.string().min(2, 'Breed is required'),
  weight: z.string().min(1, 'Weight is required'),
  sex: z.string().min(1, 'Sex is required'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerContact: z.string().min(10, 'Contact must be at least 10 characters'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  eligibilityVerified: z.string().min(1, 'Eligibility verification is required'),
  consentDate: z.string().optional(),
  digitalPulse: z.string().optional(),
  hoofWallTemperature: z.string().optional(),
  coronaryBandCondition: z.string().optional(),
  hoofTesterResponse: z.string().optional(),
  stance: z.string().optional(),
  gait: z.string().optional(),
  enrollmentHeartRate: z.string().optional(),
  enrollmentRespiratoryRate: z.string().optional(),
  enrollmentTemperature: z.string().optional(),
  bodyConditionScore: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

type PatientEnrollmentFormProps = {
  onSuccess: () => void;
  patient?: Patient | null;
};

const toDateInputValue = (value?: string | null) => (value ? value.split('T')[0] : '');

const getDefaultValues = (patient?: Patient | null): z.infer<typeof patientSchema> => ({
  horseName: patient?.horse_name ?? '',
  age: patient?.age != null ? String(patient.age) : '',
  breed: patient?.breed ?? '',
  weight: patient?.weight != null ? String(patient.weight) : '',
  sex: patient?.sex ?? 'Gelding',
  ownerName: patient?.owner_name ?? '',
  ownerContact: patient?.owner_contact ?? '',
  enrollmentDate: toDateInputValue(patient?.enrollment_date) || new Date().toISOString().split('T')[0],
  eligibilityVerified: patient?.eligibility_verified ? 'true' : 'false',
  consentDate: toDateInputValue(patient?.consent_date),
  digitalPulse: patient?.digital_pulse ?? '',
  hoofWallTemperature: patient?.hoof_wall_temperature ?? '',
  coronaryBandCondition: patient?.coronary_band_condition ?? '',
  hoofTesterResponse: patient?.hoof_tester_response ?? '',
  stance: patient?.stance ?? '',
  gait: patient?.gait ?? '',
  enrollmentHeartRate: patient?.enrollment_heart_rate != null ? String(patient.enrollment_heart_rate) : '',
  enrollmentRespiratoryRate: patient?.enrollment_respiratory_rate != null ? String(patient.enrollment_respiratory_rate) : '',
  enrollmentTemperature: patient?.enrollment_temperature != null ? String(patient.enrollment_temperature) : '',
  bodyConditionScore: patient?.body_condition_score != null ? String(patient.body_condition_score) : '',
  profilePictureUrl: patient?.profile_picture_url ?? '',
});

export function PatientEnrollmentForm({ onSuccess, patient }: PatientEnrollmentFormProps) {
  const [createPatient, isSubmitting] = useMutateAction(createPatientAction);
  const [updatePatient, isUpdating] = useMutateAction(updatePatientAction);
  const [sendEmail] = useMutateAction(sendEmailNotificationAction);
  const isEditMode = Boolean(patient);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(
    patient?.profile_picture_url && !patient.profile_picture_url.startsWith('http')
      ? {
          path: patient.profile_picture_url,
          name: 'Current profile picture',
          size: 0,
          mimeType: 'image/*',
        }
      : null
  );
  const [showUploader, setShowUploader] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: getDefaultValues(patient),
  });

  const { upload, isUploading } = useSecureUpload({
    category: 'patient-media',
    entityType: 'patients',
    entityId: patient?.id ?? 'new',
  });

  const { signedUrl } = useSecureDownloadUrl(uploadedImage?.path ?? null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = await upload(file);
      const info: UploadedImageInfo = {
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
      setUploadedImage(info);
      form.setValue('profilePictureUrl', path);
      setShowUploader(false);
    } catch (err) {
      console.error('Profile picture upload failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Profile picture upload failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    form.setValue('profilePictureUrl', '');
  };

  const auth = useAuth();

  const friendlyWriteError = (error: unknown, verb: 'create' | 'update'): string => {
    const raw = error instanceof Error ? error.message : String(error ?? '');
    const lower = raw.toLowerCase();
    if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('policy')) {
      return 'Your session may have expired or you are not signed in. Please sign in again, then retry — only the signed-in vet (or an admin) can enroll a patient.';
    }
    if (lower.includes('jwt') || lower.includes('not authenticated') || lower.includes('unauthenticated')) {
      return 'You are no longer signed in. Please sign in again and retry.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
      return 'Network problem while saving the patient. Check your connection and try again.';
    }
    return raw || `Failed to ${verb} patient. Please try again.`;
  };

  const onSubmit = async (values: z.infer<typeof patientSchema>) => {
    setSubmitError(null);

    if (!isEditMode && !auth.email) {
      setSubmitError(
        'You must be signed in as a veterinarian to enroll a patient. Please sign in and try again.',
      );
      return;
    }

    try {
      const patientPayload = {
        horseName: values.horseName,
        age: parseInt(values.age),
        breed: values.breed,
        weight: parseFloat(values.weight),
        sex: values.sex,
        ownerName: values.ownerName,
        ownerContact: values.ownerContact,
        enrollmentDate: values.enrollmentDate,
        trialStatus: patient?.trial_status || 'screening',
        eligibilityVerified: values.eligibilityVerified === 'true',
        consentDate: values.consentDate || null,
        digitalPulse: values.digitalPulse || null,
        hoofWallTemperature: values.hoofWallTemperature || null,
        coronaryBandCondition: values.coronaryBandCondition || null,
        hoofTesterResponse: values.hoofTesterResponse || null,
        stance: values.stance || null,
        gait: values.gait || null,
        enrollmentHeartRate: values.enrollmentHeartRate ? parseInt(values.enrollmentHeartRate) : null,
        enrollmentRespiratoryRate: values.enrollmentRespiratoryRate ? parseInt(values.enrollmentRespiratoryRate) : null,
        enrollmentTemperature: values.enrollmentTemperature ? parseFloat(values.enrollmentTemperature) : null,
        bodyConditionScore: values.bodyConditionScore ? parseFloat(values.bodyConditionScore) : null,
        profilePictureUrl: values.profilePictureUrl || null,
        enrolledByVetEmail: auth.email ? auth.email.toLowerCase().trim() : null,
      };

      if (isEditMode && patient) {
        await updatePatient({
          patientId: patient.id,
          ...patientPayload,
        });
      } else {
        await createPatient(patientPayload);

        await sendNotification(
          sendEmail,
          NotificationType.NEW_PATIENT_ENROLLED,
          `🐴 New Patient Enrolled: ${values.horseName}`,
          {
            'Horse Name': values.horseName,
            'Breed': values.breed,
            'Age': values.age,
            'Owner': values.ownerName,
            'Enrollment Date': values.enrollmentDate,
          }
        );
      }

      onSuccess();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} patient:`, error);
      setSubmitError(friendlyWriteError(error, isEditMode ? 'update' : 'create'));
    }
  };

  const onInvalidSubmit = () => {
    setSubmitError(`Please complete the required Basic Information fields before ${isEditMode ? 'saving' : 'enrolling'} the patient.`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="clinical">🩺 Clinical Examination</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-slate-50">
                {uploadedImage ? (
                  <div className="relative">
                    {signedUrl ? (
                      <img
                        src={uploadedImage.path.startsWith('http') ? uploadedImage.path : signedUrl}
                        alt="Horse profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                        <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <svg className="h-16 w-16 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                    </svg>
                  </div>
                )}

                {!showUploader && !uploadedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploader(true)}
                    className="gap-2"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Profile Picture
                  </Button>
                )}

                {showUploader && !uploadedImage && (
                  <div className="w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploading ? 'Uploading...' : 'Choose Profile Picture'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUploader(false)}
                      className="mt-2 w-full"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horse Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Thunder Bay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input placeholder="Thoroughbred" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="525.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gelding">Gelding</SelectItem>
                        <SelectItem value="Mare">Mare</SelectItem>
                        <SelectItem value="Stallion">Stallion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sarah Mitchell" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="555-0101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eligibilityVerified"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eligibility Verified</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consent Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="clinical" className="space-y-4 mt-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-info" />
              <AlertDescription className="text-sm text-info-soft">
                Complete clinical examination parameters to aid in laminitis screening. Values outside normal ranges will be highlighted for admin review.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="digitalPulse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Digital (Pedal) Pulse</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="faint">Faint / Barely palpable (Normal)</SelectItem>
                        <SelectItem value="bounding">Bounding / Strong (Laminitis)</SelectItem>
                        <SelectItem value="bilateral_bounding">Bilateral bounding in forelimbs (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: Faint or barely palpable</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hoofWallTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hoof Wall Temperature</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cool_to_warm">Cool to slightly warm (Normal)</SelectItem>
                        <SelectItem value="warm">Noticeably warm (Laminitis)</SelectItem>
                        <SelectItem value="hot_coronary">Hot at coronary band (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: Cool to slightly warm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coronaryBandCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coronary Band</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smooth">Smooth contour (Normal)</SelectItem>
                        <SelectItem value="swelling">Swelling (Laminitis)</SelectItem>
                        <SelectItem value="tenderness">Tenderness (Laminitis)</SelectItem>
                        <SelectItem value="depression">Palpable depression (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: Smooth contour</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hoofTesterResponse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hoof Tester Response</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_response">No response (Normal)</SelectItem>
                        <SelectItem value="toe_positive">Positive at toe region (Laminitis)</SelectItem>
                        <SelectItem value="dorsal_toe_positive">Positive at dorsal toe (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: No response</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stance</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Normal weight-bearing (Normal)</SelectItem>
                        <SelectItem value="sawhorse">Sawhorse stance (Laminitis)</SelectItem>
                        <SelectItem value="forelimbs_forward">Forelimbs stretched forward (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: Normal weight-bearing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gait"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gait</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finding" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Normal (Normal)</SelectItem>
                        <SelectItem value="short_stilted">Short / Stilted (Laminitis)</SelectItem>
                        <SelectItem value="reluctant">Reluctant to move (Laminitis)</SelectItem>
                        <SelectItem value="worse_hard_ground">Worse on hard ground (Laminitis)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Normal: Normal gait</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentHeartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate (bpm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="28-44 normal" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 28-44 bpm; Laminitis: ≥60 bpm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentRespiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="8-16 normal" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 8-16 breaths/min</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rectal Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="37.2-38.3 normal" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 37.2-38.3°C (99-101°F)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyConditionScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Condition Score (BCS)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="1-9 scale" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Normal: 4-6/9 ideal; Risk: ≥7/9</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {submitError && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting || isUpdating}>
            {isSubmitting || isUpdating ? (isEditMode ? 'Saving...' : 'Enrolling...') : (isEditMode ? 'Save Patient' : 'Enroll Patient')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
