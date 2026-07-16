import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ByrockLogo } from '@/components/ByrockLogo';
import { UserCog, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type ConsultantLoginScreenProps = {
  onSuccess: (email: string) => void;
  onBackToAccessSelection: () => void;
};

export function ConsultantLoginScreen({ onSuccess, onBackToAccessSelection }: ConsultantLoginScreenProps) {
  const auth = useAuth();
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

      await auth.loginConsultant(normalizedEmail, values.password);

      onSuccess(normalizedEmail);
    } catch (err) {
      console.error('Consultant login error:', err);
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
            <UserCog className="h-8 w-8 text-purple-400" />
            <div>
              <CardTitle className="text-2xl">Consultant Access</CardTitle>
              <p className="text-neutral-content/60 text-sm mt-1">FDA Compliance Review</p>
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
                      <Input type="email" placeholder="mark@hughesvet.com" {...field} />
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
                  {isLoading ? 'Logging in...' : 'Login as Consultant'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={onBackToAccessSelection} className="w-full">
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