import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CaseWorkspace } from '@/components/CaseWorkspace';
import { ByRockLogo } from '@/components/ByRockLogo';
import { WhatsAppChatButton } from '@/components/WhatsAppChatButton';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import { AdverseEventReporter } from '@/components/AdverseEventReporter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function PatientCasePage() {
  const { patientId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const numericPatientId = useMemo(() => (patientId ? Number(patientId) : null), [patientId]);

  if (!numericPatientId || Number.isNaN(numericPatientId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center text-destructive">Invalid patient ID.</div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RegulatoryBanner />
      <WhatsAppChatButton variant="floating" />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ByRockLogo className="h-10 w-auto" />
            <div>
              <p className="text-sm font-medium text-slate-900">PTP-102 Laminitis Trial</p>
              <p className="text-xs text-slate-500">{auth.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {auth.role === 'admin' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto p-6 max-w-7xl">
        <CaseWorkspace patientId={numericPatientId} onBack={handleBack} />
      </div>
      <AdverseEventReporter
        patientId={numericPatientId}
        vetEmail={auth.email || ''}
        vetName={auth.email?.split('@')[0] || 'Vet'}
      />
    </div>
  );
}
