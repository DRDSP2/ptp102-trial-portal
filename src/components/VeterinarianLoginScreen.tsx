import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import updateVetLastLoginAction from '@/actions/updateVetLastLogin';
import checkVeterinarianAcceptanceAction from '@/actions/checkVeterinarianAcceptance';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ByrockLogo } from '@/components/ByrockLogo';
import { UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUPPORT_EMAIL } from '@/lib/contact';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type VeterinarianLoginScreenProps = {
  onSuccess: (email: string) => void;
  onNeedRegistration: () => void;
  onForgotPassword: () => void;
  onBackToSelection: () => void;
};

export function VeterinarianLoginScreen({ onSuccess, onNeedRegistration, onForgotPassword, onBackToSelection }: VeterinarianLoginScreenProps) {
  const auth = useAuth();
  const [checkAcceptance] = useMutateAction(checkVeterinarianAcceptanceAction);
  const [updateLastLogin] = useMutateAction(updateVetLastLoginAction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setError(null);
      setIsLoading(true);
      const normalizedEmail = values.email.toLowerCase().trim();

      // Authenticate with Supabase Auth.
      await auth.loginVet(normalizedEmail, values.password);

      // Load the local vet profile to enforce approval status.
      const result = await checkAcceptance({ email: normalizedEmail });
      const userData = result?.[0];

      if (!userData?.accepted) {
        setError('Your account exists but terms have not been accepted. Please complete registration.');
        setIsLoading(false);
        return;
      }

      if (userData.verification_status === 'pending') {
        auth.requestVetApproval(normalizedEmail);
        setError('Your account is pending admin approval. Redirecting...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      if (userData.verification_status === 'rejected') {
        setError(`Your account was rejected. Please contact support at ${SUPPORT_EMAIL}`);
        setIsLoading(false);
        return;
      }

      auth.approveVet();

      try {
        await updateLastLogin({ email: normalizedEmail });
      } catch (err) {
        console.warn('Failed to update last login:', err);
      }

      onSuccess(normalizedEmail);
    } catch (err) {
      console.error('Login error:', err);
      setError(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
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
            <LogIn className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-2xl">Veterinarian Login</CardTitle>
              <p className="text-neutral-content/60 text-sm mt-1">PTP-102 Trial Access</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Button type="button" variant="link" size="sm" onClick={onForgotPassword} className="text-xs p-0 h-auto">
                  Forgot password?
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={onNeedRegistration} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Registration
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onBackToSelection} className="w-full">
                  Back to Access Selection
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
