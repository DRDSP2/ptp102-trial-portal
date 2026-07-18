import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ByrockLogo } from '@/components/ByrockLogo';
import { KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

const resetRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

type PasswordResetRequestScreenProps = {
  onBackToLogin: () => void;
  // Legacy prop retained for VetResetPage compatibility. The old fake-token
  // flow was removed: Supabase now emails the recovery link directly and
  // handleRecoveryRedirect() (src/lib/supabase/recovery.ts) takes it from
  // there, so this callback is no longer invoked from this screen.
  onResetRequested: (email: string, token: string) => void;
};

export function PasswordResetRequestScreen({ onBackToLogin }: PasswordResetRequestScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof resetRequestSchema>) => {
    try {
      setError(null);
      setIsLoading(true);

      // Real Supabase reset email — same pattern as ConsultantLoginScreen.
      // Confirmation is deliberately neutral: never reveal whether an
      // account exists for the given address.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        values.email.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/#/vet/login` },
      );
      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <ByrockLogo variant="full" height={60} />
      </div>
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-neutral text-neutral-content rounded-t-lg">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <p className="text-neutral-content/60 text-sm mt-1">Request password reset</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  If an account exists for this email, a reset link has been sent. Please check your inbox and follow the link to set a new password.
                </AlertDescription>
              </Alert>
              <Button type="button" variant="ghost" size="sm" onClick={onBackToLogin} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-base-content/60">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                      {isLoading ? 'Sending...' : 'Request Reset'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onBackToLogin} className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
