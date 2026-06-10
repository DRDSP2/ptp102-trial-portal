import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@uibakery/data';
import updatePasswordAction from '@/actions/updatePassword';
import { hashPassword } from '@/utils/passwordHash';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ByRockLogo } from '@/components/ByRockLogo';
import { Lock, Check, X } from 'lucide-react';

const passwordResetSchema = z.object({
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-z]/, 'Password needs at least one lowercase letter')
    .regex(/[A-Z]/, 'Password needs at least one uppercase letter')
    .regex(/\d/, 'Password needs at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordResetScreenProps = {
  resetToken: string;
  onSuccess: () => void;
};

export function PasswordResetScreen({ resetToken, onSuccess }: PasswordResetScreenProps) {
  const [updatePwd, isLoading] = useMutateAction(updatePasswordAction);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');
  const passwordChecks = {
    length: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const onSubmit = async (values: z.infer<typeof passwordResetSchema>) => {
    try {
      setError(null);
      
      const hashedPassword = await hashPassword(values.password);
      
      const result = await updatePwd({
        resetToken,
        newPasswordHash: hashedPassword,
      });

      if (result && result.length > 0) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError('Reset link expired or invalid. Please request a new one.');
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
      console.error('Error updating password:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <p className="text-slate-300 text-sm mt-1">Create a secure password</p>
              </div>
            </div>
            <ByRockLogo className="h-12 w-auto" />
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-900">
                Password updated successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
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
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

                <div className="pt-4">
                  <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
