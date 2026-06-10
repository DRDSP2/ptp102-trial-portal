import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VeterinarianLoginScreen } from '@/components/VeterinarianLoginScreen';
import { useAuth } from '@/context/AuthContext';

export function VetLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.role === 'vet' && auth.pendingApproval) {
      navigate('/vet/pending', { replace: true });
    } else if (auth.role === 'vet' && auth.termsAccepted) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const handleSuccess = (email: string) => {
    auth.loginVet(email);
    navigate('/dashboard');
  };

  return (
    <VeterinarianLoginScreen
      onSuccess={handleSuccess}
      onNeedRegistration={() => navigate('/vet/register')}
      onForgotPassword={() => navigate('/vet/forgot')}
      onBackToSelection={() => navigate('/')}
    />
  );
}
