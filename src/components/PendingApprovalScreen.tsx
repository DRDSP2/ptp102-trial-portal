import { useEffect, useState } from 'react';
import { useLoadAction } from '@uibakery/data';
import checkVeterinarianAcceptanceAction from '@/actions/checkVeterinarianAcceptance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ByRockLogo } from '@/components/ByRockLogo';
import { Clock, Mail, CheckCircle2, XCircle } from 'lucide-react';

type PendingApprovalScreenProps = {
  email: string;
  onApproved: () => void;
  onRejected: () => void;
};

export function PendingApprovalScreen({ email, onApproved, onRejected }: PendingApprovalScreenProps) {
  const [checkStatus, loading, error, refresh] = useLoadAction(checkVeterinarianAcceptanceAction, [], { email });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (checkStatus && checkStatus.length > 0) {
      const status = checkStatus[0];
      if (status.verification_status === 'approved') {
        onApproved();
      } else if (status.verification_status === 'rejected') {
        onRejected();
      }
    }
  }, [checkStatus, onApproved, onRejected]);

  const handleCheckNow = () => {
    setChecking(true);
    refresh();
    setTimeout(() => setChecking(false), 1000);
  };

  const supportEmail = 'drdsp@pm.me';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <CardTitle className="text-2xl">Pending Approval</CardTitle>
                <p className="text-slate-300 text-sm mt-1">PTP-102 Trial Access</p>
              </div>
            </div>
            <ByRockLogo className="h-12 w-auto" />
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Account Under Review</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Your account is awaiting approval by Byrock and will be activated shortly. You'll receive an email notification once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Account Email</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{email}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Status</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCheckNow}
              disabled={checking || loading}
            >
              {checking || loading ? 'Checking...' : 'Check Status Now'}
            </Button>

            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = `mailto:${supportEmail}?subject=Account Approval Status - ${email}`}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This page will automatically check for approval status every 5 seconds.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
