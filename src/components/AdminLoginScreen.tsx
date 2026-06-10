import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import adminLoginAction from '@/actions/adminLogin';
import updateAdminLastLoginAction from '@/actions/updateAdminLastLogin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ByRockLogo } from '@/components/ByRockLogo';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginScreenProps = {
  onSuccess: (email: string) => void;
  onBackToVet: () => void;
};

export function AdminLoginScreen({ onSuccess, onBackToVet }: AdminLoginScreenProps) {
  const [login, isLoading] = useMutateAction(adminLoginAction);
  const [updateLastLogin] = useMutateAction(updateAdminLastLoginAction);
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
      const normalizedEmail = values.email.toLowerCase().trim();
      
      const result = await login({
        email: normalizedEmail,
        password: values.password,
      });

      if (!result || result.length === 0) {
        setError('Invalid email or password');
        return;
      }

      const adminUser = result[0];
      updateLastLogin({ email: normalizedEmail }).catch((err) =>
        console.warn('Failed to update admin last login (non-critical):', err)
      );
      onSuccess(normalizedEmail);
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl">Admin Access</CardTitle>
                <p className="text-slate-300 text-sm mt-1">PTP-102 Trial Management</p>
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
                      <Input type="email" placeholder="admin@example.com" {...field} />
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
                      <Input type="password" placeholder="Enter password" {...field} />
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
                  {isLoading ? 'Logging in...' : 'Login as Admin'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={onBackToVet} className="w-full">
                  Back to Veterinarian Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
