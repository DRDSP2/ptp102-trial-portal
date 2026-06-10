import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useMutateAction } from '@uibakery/data';
import veterinarianLoginAction from '@/actions/veterinarianLogin';
import googleOAuthLoginAction from '@/actions/googleOAuthLogin';
import createGoogleOAuthVetAction from '@/actions/createGoogleOAuthVet';
import updateVetLastLoginAction from '@/actions/updateVetLastLogin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ByRockLogo } from '@/components/ByRockLogo';
import { UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [login, isLoading] = useMutateAction(veterinarianLoginAction);
  const [googleLogin] = useMutateAction(googleOAuthLoginAction);
  const [createGoogleVet] = useMutateAction(createGoogleOAuthVetAction);
  const [updateLastLogin] = useMutateAction(updateVetLastLoginAction);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);

      if (!credentialResponse.credential) {
        setError('Google login failed: No credential received');
        return;
      }

      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const email = decoded.email?.toLowerCase().trim();
      const fullName = decoded.name || email;

      const existingUser = await googleLogin({ email });
      
      if (existingUser && existingUser.length > 0) {
        const user = existingUser[0];
        
        if (!user.tc_accepted) {
          setError('Please complete your profile and accept terms & conditions.');
          return;
        }
        
        if (user.verification_status === 'pending') {
          setError('Your account is pending admin approval. Redirecting...');
          setTimeout(() => {
            localStorage.setItem('pending_vet_email', email);
            window.location.reload();
          }, 1500);
          return;
        }
        
        if (user.verification_status === 'rejected') {
          setError('Your account was rejected. Please contact support@byrockvets.com');
          return;
        }
        
        try {
          await updateLastLogin({ email });
        } catch (err) {
          console.warn('Failed to update last login:', err);
        }
        
        onSuccess(email);
      } else {
        await createGoogleVet({ email, fullName });
        setError('Account created! Please complete your profile and accept terms & conditions.');
        setTimeout(() => onNeedRegistration(), 2000);
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError(`Google login failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleGoogleError = () => {
    setError('Google login was cancelled or failed');
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setError(null);
      const normalizedEmail = values.email.toLowerCase().trim();
      
      const result = await login({
        email: normalizedEmail,
        password: values.password,
      });

      if (!result || result.length === 0) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      const userData = result[0];

      if (!userData.tc_accepted) {
        setError('Your account exists but terms have not been accepted. Please complete registration.');
        return;
      }

      if (userData.verification_status === 'pending') {
        setError('Your account is pending admin approval. Redirecting...');
        setTimeout(() => {
          localStorage.setItem('pending_vet_email', normalizedEmail);
          window.location.reload();
        }, 1500);
        return;
      }

      if (userData.verification_status === 'rejected') {
        setError('Your account was rejected. Please contact support@byrockvets.com');
        return;
      }

      try {
        await updateLastLogin({ email: normalizedEmail });
      } catch (err) {
        console.warn('Failed to update last login:', err);
      }

      onSuccess(normalizedEmail);
    } catch (err) {
      console.error('Login error:', err);
      setError(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl">Veterinarian Login</CardTitle>
                <p className="text-slate-300 text-sm mt-1">PTP-102 Trial Access</p>
              </div>
            </div>
            <ByRockLogo className="h-12 w-auto" />
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

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    width="100%"
                  />
                </div>
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
