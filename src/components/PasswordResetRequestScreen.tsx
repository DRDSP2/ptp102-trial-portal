import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import requestPasswordResetAction from '@/actions/requestPasswordReset';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ByRockLogo } from '@/components/ByRockLogo';
import { KeyRound, ArrowLeft } from 'lucide-react';

const resetRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

type PasswordResetRequestScreenProps = {
  onBackToLogin: () => void;
  onResetRequested: (email: string, token: string) => void;
};

export function PasswordResetRequestScreen({ onBackToLogin, onResetRequested }: PasswordResetRequestScreenProps) {
  const [requestReset, isLoading] = useMutateAction(requestPasswordResetAction);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const generateResetToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const onSubmit = async (values: z.infer<typeof resetRequestSchema>) => {
    try {
      setError(null);
      setSuccess(false);
      const resetToken = generateResetToken();
      
      const result = await requestReset({
        email: values.email,
        resetToken,
      });

      if (result && result.length > 0) {
        setSuccess(true);
        setTimeout(() => {
          onResetRequested(values.email, resetToken);
        }, 2000);
      } else {
        setError('Email not found or account not registered.');
      }
    } catch (err) {
      setError('Failed to request password reset. Please try again.');
      console.error('Error requesting password reset:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <p className="text-slate-300 text-sm mt-1">Request password reset</p>
              </div>
            </div>
            <ByRockLogo className="h-12 w-auto" />
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-900">
                Password reset instructions have been generated. You will be redirected to set a new password.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Enter your email address and we'll help you reset your password.
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

                  {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

                  <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                      {isLoading ? 'Processing...' : 'Request Reset'}
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
