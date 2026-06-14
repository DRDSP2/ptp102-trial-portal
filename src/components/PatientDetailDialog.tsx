import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import updatePatientAction from '@/actions/updatePatient';
import { Patient } from '@/types/patient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2 } from 'lucide-react';
import { ReasonForChangeDialog } from '@/components/ReasonForChangeDialog';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { useSecureDownloadUrl } from '@/hooks/useSecureDownloadUrl';

type UploadedImageInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

const updatePatientSchema = z.object({
  horseName: z.string().min(2),
  age: z.string().min(1),
  breed: z.string().min(2),
  weight: z.string().min(1),
  sex: z.string().min(1),
  ownerName: z.string().min(2),
  ownerContact: z.string().min(10),
  trialStatus: z.string().min(1),
  eligibilityVerified: z.string().min(1),
  consentDate: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

type PatientDetailDialogProps = {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

const CRITICAL_PATIENT_FIELDS = ['trialStatus', 'eligibilityVerified', 'consentDate', 'horseName', 'ownerName'];

export function PatientDetailDialog({ patient, open, onClose, onUpdate }: PatientDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updatePatient, isSubmitting] = useMutateAction(updatePatientAction);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof updatePatientSchema> | null>(null);

  const form = useForm<z.infer<typeof updatePatientSchema>>({
    resolver: zodResolver(updatePatientSchema),
    defaultValues: {
      horseName: patient?.horse_name || '',
      age: patient?.age?.toString() || '',
      breed: patient?.breed || '',
      weight: patient?.weight?.toString() || '',
      sex: patient?.sex || 'Gelding',
      ownerName: patient?.owner_name || '',
      ownerContact: patient?.owner_contact || '',
      trialStatus: patient?.trial_status || 'screening',
      eligibilityVerified: patient?.eligibility_verified ? 'true' : 'false',
      consentDate: patient?.consent_date || '',
      profilePictureUrl: patient?.profile_picture_url || '',
    },
  });

  const { upload, isUploading } = useSecureUpload({
    category: 'profile-image',
    entityType: 'patients',
    entityId: patient?.id ?? 'new',
  });

  const currentPicturePath = uploadedImage?.path || form.watch('profilePictureUrl') || undefined;
  const { signedUrl } = useSecureDownloadUrl(
    currentPicturePath && !currentPicturePath.startsWith('http') ? currentPicturePath : null,
  );

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

  if (!patient) return null;

  const hasCriticalFieldChanges = (values: z.infer<typeof updatePatientSchema>) => {
    if (!patient) return false;
    const original: Record<string, string | boolean | null | undefined> = {
      trialStatus: patient.trial_status,
      eligibilityVerified: patient.eligibility_verified,
      consentDate: patient.consent_date,
      horseName: patient.horse_name,
      ownerName: patient.owner_name,
    };
    const next: Record<string, string | boolean | null | undefined> = {
      trialStatus: values.trialStatus,
      eligibilityVerified: values.eligibilityVerified === 'true',
      consentDate: values.consentDate || null,
      horseName: values.horseName,
      ownerName: values.ownerName,
    };
    return CRITICAL_PATIENT_FIELDS.some((field) => original[field] !== next[field]);
  };

  const doUpdate = async (values: z.infer<typeof updatePatientSchema>, reasonForChange?: string) => {
    try {
      await updatePatient({
        patientId: patient.id,
        horseName: values.horseName,
        age: parseInt(values.age),
        breed: values.breed,
        weight: parseFloat(values.weight),
        sex: values.sex,
        ownerName: values.ownerName,
        ownerContact: values.ownerContact,
        trialStatus: values.trialStatus,
        eligibilityVerified: values.eligibilityVerified === 'true',
        consentDate: values.consentDate || null,
        profilePictureUrl: values.profilePictureUrl || null,
        reasonForChange: reasonForChange || null,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof updatePatientSchema>) => {
    if (hasCriticalFieldChanges(values)) {
      setPendingValues(values);
      setReasonDialogOpen(true);
      return;
    }
    await doUpdate(values);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Patient Details - {patient.horse_name}</DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              {patient.profile_picture_url ? (
                <img
                  src={patient.profile_picture_url}
                  alt={patient.horse_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <svg className="h-16 w-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Horse Name</p>
                <p className="font-medium">{patient.horse_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breed</p>
                <p className="font-medium">{patient.breed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{patient.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sex</p>
                <p className="font-medium">{patient.sex}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Name</p>
                <p className="font-medium">{patient.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Contact</p>
                <p className="font-medium">{patient.owner_contact}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">{new Date(patient.enrollment_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trial Status</p>
                <Badge>{patient.trial_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eligibility Verified</p>
                <Badge variant={patient.eligibility_verified ? 'default' : 'secondary'}>
                  {patient.eligibility_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
              {patient.consent_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Consent Date</p>
                  <p className="font-medium">{new Date(patient.consent_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} type="button">
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)} type="button">
                Edit Patient
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-slate-50">
                {(() => {
                  const rawUrl = uploadedImage?.path || form.watch('profilePictureUrl');
                  const imageUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : signedUrl;
                  return imageUrl ? (
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Horse profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
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
                  ) : signedUrl === null && currentPicturePath ? (
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <svg className="h-16 w-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                      </svg>
                    </div>
                  );
                })()}

                {!showUploader && !uploadedImage && !form.watch('profilePictureUrl') && (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horse Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input type="number" {...field} />
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
                        <Input type="number" step="0.01" {...field} />
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
                            <SelectValue />
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trialStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trial Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
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
                            <SelectValue />
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
                      <FormLabel>Consent Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        )}
        <ReasonForChangeDialog
          open={reasonDialogOpen}
          onOpenChange={setReasonDialogOpen}
          title="Critical Field Change"
          description="You are changing one or more regulatory-critical fields (status, eligibility, consent date, horse name, or owner name). A reason is required."
          onConfirm={(reason) => {
            if (pendingValues) {
              doUpdate(pendingValues, reason);
              setPendingValues(null);
            }
          }}
          onCancel={() => setPendingValues(null)}
        />
      </DialogContent>
    </Dialog>
  );
}
