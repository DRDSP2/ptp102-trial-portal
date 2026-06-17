import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { clearRecoveryMode } from '@/lib/supabase/recovery';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ByrockLogo } from '@/components/ByrockLogo';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AdminPasswordSetFormProps = {
  onSuccess: () => void;
};

export function AdminPasswordSetForm({ onSuccess }: AdminPasswordSetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof setPasswordSchema>) => {
    try {
      setError(null);
      setIsLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) throw updateError;

      clearRecoveryMode();
      setSuccess(true);

      // Brief pause so the user sees the success state before redirect
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Password set error:', err);
      setError(
        `Failed to set password: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <ByrockLogo variant="full" height={60} />
      </div>
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-blue-400" />
            <div>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <p className="text-slate-300 text-sm mt-1">Choose a strong password for your admin account</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-medium text-green-700">Password updated</p>
              <p className="text-sm text-slate-500">Redirecting to admin panel...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min 8 chars, upper, lower, number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter new password" {...field} />
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

                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? 'Setting password...' : 'Set Password & Sign In'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
