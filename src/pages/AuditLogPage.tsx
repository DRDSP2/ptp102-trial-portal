import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuditLogPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  if (auth.role !== 'admin') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h1 className="text-xl font-semibold mb-2">Admin Access Required</h1>
              <p className="text-muted-foreground mb-4">
                The audit trail is read-only and restricted to administrators.
              </p>
              <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">FDA-Ready Audit Trail</h1>
        <p className="text-sm text-muted-foreground">
          Immutable, tamper-evident log of all system actions. Entries cannot be edited or deleted.
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
