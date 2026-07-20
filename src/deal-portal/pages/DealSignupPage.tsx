import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DealRole } from '@/types/roles';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  company: z.string().min(2, 'Company name is required'),
  role: z.enum(['investor', 'licensee_eval'] as const),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});

type SignupValues = z.infer<typeof signupSchema>;

function friendlySignupError(message?: string) {
  if (message?.toLowerCase().includes('already')) {
    return 'An account already exists for this email. Please sign in instead.';
  }
  return 'We could not create your account. Please check your details and try again.';
}

export function DealSignupPage() {
  const navigate = useNavigate();
  const { client } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      company: '',
      role: 'licensee_eval',
      password: '',
    },
  });

  const onSubmit = async (values: SignupValues) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const normalizedEmail = values.email.toLowerCase().trim();

      const { data: authData, error: authError } = await client.auth.signUp({
        email: normalizedEmail,
        password: values.password,
        options: {
          data: { role: values.role },
        },
      });

      if (authError) {
        setError(friendlySignupError(authError.message));
        return;
      }

      const user = authData.user ?? authData.session?.user;
      if (user) {
        await client.from('deal_profiles').insert({
          user_id: user.id,
          company: values.company,
          role: values.role as DealRole,
          tier: values.role === 'investor' ? 'evaluation' : 'none',
        });
      }

      navigate('/deal/terms');
    } catch (err) {
      setError(friendlySignupError(err instanceof Error ? err.message : undefined));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h1">Deal Room Access Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Pharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="licensee_eval">Potential Licensee / Partner</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Continue to Terms'}
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={() => navigate('/deal/login')}>
                Already have an account? Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
