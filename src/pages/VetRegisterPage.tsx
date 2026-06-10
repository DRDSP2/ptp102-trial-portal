import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TermsAndConditionsScreen } from '@/components/TermsAndConditionsScreen';
import { useAuth } from '@/context/AuthContext';

export function VetRegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.role === 'vet' && auth.pendingApproval) {
      navigate('/vet/pending', { replace: true });
    } else if (auth.role === 'vet' && auth.termsAccepted) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const handleAccepted = (email: string) => {
    auth.requestVetApproval(email);
    navigate('/vet/pending');
  };

  return <TermsAndConditionsScreen onAccepted={handleAccepted} onBackToLogin={() => navigate('/vet/login')} />;
}
