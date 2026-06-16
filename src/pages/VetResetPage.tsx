import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordResetRequestScreen } from '@/components/PasswordResetRequestScreen';
import { PasswordResetScreen } from '@/components/PasswordResetScreen';
import { useAuth } from '@/context/AuthContext';

export function VetResetPage() {
  const [resetToken, setResetToken] = useState('');
  const [_email, setEmail] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleResetRequested = (requestEmail: string, token: string) => {
    setEmail(requestEmail);
    setResetToken(token);
  };

  useEffect(() => {
    if (auth.role === 'vet' && auth.termsAccepted) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.role, auth.termsAccepted, navigate]);

  return resetToken ? (
    <PasswordResetScreen resetToken={resetToken} onSuccess={() => navigate('/vet/login')} />
  ) : (
    <PasswordResetRequestScreen onBackToLogin={() => navigate('/vet/login')} onResetRequested={handleResetRequested} />
  );
}
