import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import sendEmailNotificationAction from '@/actions/sendEmailNotification';
import { sendNotification, NotificationType } from '@/utils/emailNotifications';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Check, X, Printer } from 'lucide-react';
import { ByrockLogo } from '@/components/ByrockLogo';
import { PrintConsent } from '@/components/PrintConsent';
import { Alert, AlertDescription } from '@/components/ui/alert';

const termsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Phone number is required').optional().or(z.literal('')),
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-z]/, 'Password needs at least one lowercase letter')
    .regex(/[A-Z]/, 'Password needs at least one uppercase letter')
    .regex(/\d/, 'Password needs at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
  licenseNumber: z.string()
    .min(3, 'License number must be at least 3 characters')
    .max(50, 'License number must not exceed 50 characters'),
  hospitalAffiliation: z.string().min(2, 'Hospital affiliation is required'),
  investigationalAcknowledged: z.boolean().refine((val) => val === true, 'You must acknowledge the investigational status'),
  riskAccepted: z.boolean().refine((val) => val === true, 'You must accept all treatment risks'),
  liabilityAcknowledged: z.boolean().refine((val) => val === true, 'You must acknowledge liability'),
  noConflictOfInterest: z.boolean().refine((val) => val === true, 'You must confirm no conflicts of interest'),
  signatureText: z.string().min(2, 'Digital signature is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type TermsAndConditionsScreenProps = {
  onAccepted: (email: string) => void;
  onBackToLogin?: () => void;
};

export function TermsAndConditionsScreen({ onAccepted, onBackToLogin }: TermsAndConditionsScreenProps) {
  const auth = useAuth();
  const [sendEmail] = useMutateAction(sendEmailNotificationAction);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [consentPrintedAt, setConsentPrintedAt] = useState<string | null>(null);
  const printedAtRef = useRef<string | null>(null);

  const form = useForm<z.infer<typeof termsSchema>>({
    resolver: zodResolver(termsSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      hospitalAffiliation: '',
      investigationalAcknowledged: false,
      riskAccepted: false,
      liabilityAcknowledged: false,
      noConflictOfInterest: false,
      signatureText: '',
    },
  });

  const password = form.watch('password');
  const passwordChecks = {
    length: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const onSubmit = async (values: z.infer<typeof termsSchema>) => {
    try {
      setError(null);
      setShowValidationSummary(false);
      setIsSubmitting(true);
      const normalizedEmail = values.email.toLowerCase().trim();
      const now = new Date().toISOString();
      const consentAt = printedAtRef.current ?? consentPrintedAt ?? now;

      // Step 1: create the Supabase Auth user.
      // Email confirmation should be disabled in the Supabase project settings
      // so the vet lands on the pending-approval page without clicking a link.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: values.password,
        options: {
          data: {
            role: 'vet',
            full_name: values.fullName,
            phone: values.phone || '',
            license_number: values.licenseNumber,
            hospital_affiliation: values.hospitalAffiliation,
            signature_text: values.signatureText,
            consent_printed_at: consentAt,
          },
        },
      });

      if (signUpError || !signUpData.user) {
        const message = signUpError?.message ?? 'Registration failed';
        if (
          message.toLowerCase().includes('already') ||
          message.toLowerCase().includes('duplicate') ||
          message.toLowerCase().includes('unique')
        ) {
          setError(`Email ${values.email} is already registered. Please use a different email or login instead.`);
        } else {
          setError(`Registration failed: ${message}`);
        }
        return;
      }

      // Step 2: create the veterinarian profile via Supabase Edge Function.
      // The Edge Function uses the service-role key — never exposed to the client —
      // to update app_metadata and insert the profile row.
      const { error: profileError, data: profileData } = await supabase.functions.invoke(
        'create-vet-profile',
        {
          body: {
            userId: signUpData.user.id,
            email: normalizedEmail,
            fullName: values.fullName,
            phone: values.phone || '',
            licenseNumber: values.licenseNumber,
            hospitalAffiliation: values.hospitalAffiliation,
            signatureText: values.signatureText,
            consentPrintedAt: consentAt,
          },
        },
      );

      if (profileError) {
        // profileError is a FunctionsHttpError with the function's JSON response inside.
        const resp = profileData as Record<string, unknown> | undefined;
        const message = (resp?.error as string) ?? 'Profile setup failed';
        const detail = resp?.detail ? ` (${String(resp.detail)})` : '';
        console.error('Profile creation error:', { error: profileError, response: resp });
        setError(`Account created but profile setup failed: ${message}${detail}. Please contact support.`);
        return;
      }

      await sendNotification(
        sendEmail,
        NotificationType.NEW_VET_REGISTRATION,
        `🆕 New Vet Registration: ${values.fullName}`,
        {
          'Veterinarian Name': values.fullName,
          'Email': normalizedEmail,
          'Hospital': values.hospitalAffiliation,
          'License': values.licenseNumber,
          'Status': 'Pending Approval',
        }
      );

      auth.requestVetApproval(normalizedEmail);
      onAccepted(normalizedEmail);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = () => {
    setShowValidationSummary(true);
  };

  const formErrors = form.formState.errors;
  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="hidden print:block w-full max-w-4xl">
        <PrintConsent values={form.getValues()} printedAt={consentPrintedAt} />
      </div>
      <div className="print:hidden w-full flex flex-col items-center">
        <div className="mb-6">
          <ByrockLogo variant="full" height={48} />
        </div>
        <Card className="max-w-4xl w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <div>
              <CardTitle className="text-2xl">PTP-102 Laminitis Trial - Terms & Conditions</CardTitle>
              <p className="text-slate-300 text-sm mt-1">Investigational Drug Use Agreement</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-900">IMPORTANT NOTICE</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  PTP-102 is an investigational drug not yet approved by regulatory authorities. By participating in this trial, you acknowledge and accept
                  specific responsibilities and risks.
                </p>
              </div>
            </div>
          </div>

          {showValidationSummary && hasErrors && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">Please complete all required fields:</p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  {formErrors.fullName && <li>{formErrors.fullName.message}</li>}
                  {formErrors.email && <li>{formErrors.email.message}</li>}
                  {formErrors.password && <li>{formErrors.password.message}</li>}
                  {formErrors.confirmPassword && <li>{formErrors.confirmPassword.message}</li>}
                  {formErrors.licenseNumber && <li>{formErrors.licenseNumber.message}</li>}
                  {formErrors.hospitalAffiliation && <li>{formErrors.hospitalAffiliation.message}</li>}
                  {formErrors.investigationalAcknowledged && <li>{formErrors.investigationalAcknowledged.message}</li>}
                  {formErrors.riskAccepted && <li>{formErrors.riskAccepted.message}</li>}
                  {formErrors.liabilityAcknowledged && <li>{formErrors.liabilityAcknowledged.message}</li>}
                  {formErrors.noConflictOfInterest && <li>{formErrors.noConflictOfInterest.message}</li>}
                  {formErrors.signatureText && <li>{formErrors.signatureText.message}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-64 border rounded-lg p-4 bg-white">
            <div className="space-y-4 text-sm">
              <section>
                <h4 className="font-semibold text-base mb-2">1. INVESTIGATIONAL STATUS</h4>
                <p className="text-slate-700">
                  PTP-102 is an investigational veterinary pharmaceutical product currently under clinical evaluation. This drug has not been approved by the FDA,
                  USDA, or any other regulatory authority for veterinary use. The safety and efficacy profiles are still being established through controlled
                  clinical trials.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-base mb-2">2. RISK ACKNOWLEDGMENT</h4>
                <p className="text-slate-700">
                  As the treating veterinarian, you acknowledge that administration of PTP-102 carries inherent risks including, but not limited to:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-slate-700">
                  <li>Unknown adverse reactions or side effects</li>
                  <li>Drug interactions with concurrent medications</li>
                  <li>Potential lack of therapeutic efficacy</li>
                  <li>Unpredicted systemic or local reactions</li>
                  <li>Long-term effects that may not yet be characterized</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-base mb-2">3. TOXICITY RESEARCH</h4>
                <p className="text-slate-700">
                  While robust toxicity research has been conducted in humans demonstrating excellent tolerance, species-specific responses in equines may differ.
                  The available safety data cannot guarantee the absence of adverse effects in horses with laminitis.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-base mb-2">4. LIABILITY</h4>
                <p className="text-slate-700">
                  By accepting these terms, you acknowledge that:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-slate-700">
                  <li>You assume full professional liability for the administration of PTP-102</li>
                  <li>You will obtain informed consent from horse owners prior to enrollment</li>
                  <li>You will immediately report any adverse events or unexpected outcomes</li>
                  <li>You will adhere strictly to the 72-hour protocol guidelines</li>
                  <li>You maintain appropriate professional liability insurance</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-base mb-2">5. PROTOCOL COMPLIANCE</h4>
                <p className="text-slate-700">
                  You agree to follow all trial protocols, maintain accurate records, report data truthfully, and participate in any required safety monitoring or
                  follow-up assessments.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-base mb-2">6. DATA USE</h4>
                <p className="text-slate-700">
                  Clinical data collected during this trial may be used for regulatory submissions, scientific publications, and continuing research. Patient
                  identifiers will be protected in accordance with applicable privacy regulations.
                </p>
              </section>
            </div>
          </ScrollArea>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane.smith@hospital.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 10 characters" {...field} />
                      </FormControl>
                      {password.length > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.length ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400" />
                            )}
                            <span className={passwordChecks.length ? 'text-green-600' : 'text-slate-500'}>
                              At least 10 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.uppercase ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400" />
                            )}
                            <span className={passwordChecks.uppercase ? 'text-green-600' : 'text-slate-500'}>
                              Uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.lowercase ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400" />
                            )}
                            <span className={passwordChecks.lowercase ? 'text-green-600' : 'text-slate-500'}>
                              Lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.number ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400" />
                            )}
                            <span className={passwordChecks.number ? 'text-green-600' : 'text-slate-500'}>
                              Number
                            </span>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veterinary License Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., CA123456, UK/12345/2023, etc." 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Enter your veterinary license number (any format accepted)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hospitalAffiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Affiliation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Equine Medical Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-4 bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3">Required Acknowledgments *</p>
                
                <FormField
                  control={form.control}
                  name="investigationalAcknowledged"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          I acknowledge that PTP-102 is an <strong>investigational drug</strong> not approved by regulatory authorities
                        </FormLabel>
                        {formErrors.investigationalAcknowledged && (
                          <p className="text-sm text-destructive mt-1">{formErrors.investigationalAcknowledged.message}</p>
                        )}
                      </div>
                      {field.value && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          I accept <strong>all treatment risks</strong> associated with administering this investigational compound
                        </FormLabel>
                        {formErrors.riskAccepted && (
                          <p className="text-sm text-destructive mt-1">{formErrors.riskAccepted.message}</p>
                        )}
                      </div>
                      {field.value && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="liabilityAcknowledged"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          I acknowledge that <strong>professional liability is mine</strong> and I maintain appropriate insurance coverage
                        </FormLabel>
                        {formErrors.liabilityAcknowledged && (
                          <p className="text-sm text-destructive mt-1">{formErrors.liabilityAcknowledged.message}</p>
                        )}
                      </div>
                      {field.value && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="noConflictOfInterest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-white">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          I confirm that <strong>I have no conflicts of interest</strong> in relation to PTP-102, Byrock Technologies Ltd., or this clinical trial, and I am not receiving any financial incentives, payments, or benefits from any competing pharmaceutical company or product
                        </FormLabel>
                        {formErrors.noConflictOfInterest && (
                          <p className="text-sm text-destructive mt-1">{formErrors.noConflictOfInterest.message}</p>
                        )}
                      </div>
                      {field.value && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="signatureText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Digital Signature *</FormLabel>
                    <FormControl>
                      <Input placeholder="Type your full name to sign" className="font-serif text-lg" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">By typing your name, you are providing a legally binding electronic signature</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                {onBackToLogin && (
                  <Button type="button" variant="outline" size="lg" onClick={onBackToLogin}>
                    Back to Login
                  </Button>
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const now = new Date().toISOString();
                      printedAtRef.current = now;
                      setConsentPrintedAt(now);
                      setTimeout(() => window.print(), 50);
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save as PDF
                  </Button>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px]">
                    {isSubmitting ? 'Processing...' : 'Accept Terms & Continue'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
