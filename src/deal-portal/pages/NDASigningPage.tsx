import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ndaSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  signature: z.string().min(2, 'Digital signature is required'),
  agreed: z.boolean().refine((val) => val === true, 'You must agree to the NDA terms'),
});

type NDAValues = z.infer<typeof ndaSchema>;

export function NDASigningPage() {
  const navigate = useNavigate();
  const { user, client } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NDAValues>({
    resolver: zodResolver(ndaSchema),
    defaultValues: {
      companyName: '',
      signature: '',
      agreed: false,
    },
  });

  const onSubmit = async (values: NDAValues) => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!user) {
        setError('You must be signed in to sign the NDA.');
        return;
      }

      const signedAt = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error: dbError } = await client.from('ndas').insert({
        user_id: user.id,
        company_name: values.companyName,
        signed_at: signedAt,
        expires_at: expiresAt.toISOString(),
        status: 'signed',
      });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      navigate('/deal/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NDA signing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Mutual Non-Disclosure Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-64 overflow-y-auto border rounded p-4 text-sm text-slate-600 bg-slate-50">
            <strong>Mutual Non-Disclosure Agreement</strong>
            <p className="mt-2">
              The parties acknowledge that they may receive confidential information concerning the
              PTP-102 equine laminitis platform, including financial projections, CMC data, clinical
              trial results, and intellectual property. Each party agrees to hold such information
              in strict confidence and not disclose it to any third parties without prior written
              consent.
            </p>
            <p className="mt-2">
              This agreement remains in effect for one (1) year from the date of signature and
              survives any termination of discussions.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Pharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Digital Signature (full name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agreed"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">
                      I agree to be bound by the terms of this NDA.
                    </FormLabel>
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
                {isSubmitting ? 'Signing...' : 'Sign NDA and Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
