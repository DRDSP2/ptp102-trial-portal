import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { ByrockLogo } from '@/components/ByrockLogo';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuditLogPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  if (auth.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
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
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ByrockLogo variant="icon" height={32} />
            <div>
              <p className="text-sm font-medium text-slate-900">PTP-102 Laminitis Trial</p>
              <p className="text-xs text-slate-500">Audit Trail</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">FDA-Ready Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Immutable, tamper-evident log of all system actions. Entries cannot be edited or deleted.
          </p>
        </div>
        <AuditLogViewer />
      </main>
    </div>
  );
}
