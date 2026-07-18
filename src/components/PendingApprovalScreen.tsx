import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ByrockLogo } from '@/components/ByrockLogo';
import { Clock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/contact';

type PendingApprovalScreenProps = {
  email: string;
  onApproved: () => void;
  onRejected: () => void;
};

type VerificationStatus = 'pending' | 'approved' | 'rejected';

export function PendingApprovalScreen({ email, onApproved, onRejected }: PendingApprovalScreenProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Poll the real Supabase-backed approval state — production registration
  // writes the veterinarians table via the create-vet-profile edge function,
  // so the old localStorage mock store could never reflect an admin decision.
  const checkStatus = useCallback(
    async (manual = false) => {
      if (manual) setChecking(true);
      try {
        const { data, error } = await supabase
          .from('veterinarians')
          .select('verification_status')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();
        if (error) throw error;
        setCheckError(null);
        setStatus((data?.verification_status as VerificationStatus | undefined) ?? null);
      } catch (err) {
        console.error('Approval status check failed:', err);
        setCheckError('Could not check your approval status. We will keep retrying automatically — you can also contact support below.');
      } finally {
        if (manual) setChecking(false);
      }
    },
    [email],
  );

  useEffect(() => {
    void checkStatus();
    const interval = setInterval(() => {
      void checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    if (status === 'approved') {
      onApproved();
    } else if (status === 'rejected') {
      onRejected();
    }
  }, [status, onApproved, onRejected]);

  const handleCheckNow = () => {
    void checkStatus(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <ByrockLogo variant="full" height={60} />
      </div>
      <Card data-testid="vet-pending-approval" className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-neutral text-neutral-content rounded-t-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-400" />
            <div>
              <CardTitle className="text-2xl">Pending Approval</CardTitle>
              <p className="text-neutral-content/60 text-sm mt-1">PTP-102 Trial Access</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {checkError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{checkError}</AlertDescription>
            </Alert>
          )}

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Account Under Review</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Your account is awaiting approval by Byrock. We've sent a confirmation email to your inbox with your signed participation agreement. You'll receive an email notification once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-base-content/60" />
                <span className="text-sm font-medium text-base-content/80">Account Email</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{email}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-base-content/80">Status</span>
              </div>
              <Badge
                className={
                  status === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : status === 'rejected'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }
              >
                {status === 'approved'
                  ? 'Approved'
                  : status === 'rejected'
                  ? 'Rejected'
                  : 'Pending Review'}
              </Badge>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCheckNow}
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Check Status Now'}
            </Button>

            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = supportMailto(`Account Approval Status - ${email}`)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This page will automatically check for approval status every 5 seconds.</p>
            <p className="mt-1">
              If the button above does not open your email client, contact{' '}
              <span className="font-medium">{SUPPORT_EMAIL}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
