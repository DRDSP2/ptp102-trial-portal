import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsultantLoginScreen } from '@/components/ConsultantLoginScreen';
import { AdminPasswordSetForm } from '@/components/AdminPasswordSetForm';
import { useAuth } from '@/context/AuthContext';
import { isRecoveryMode } from '@/lib/supabase/recovery';

export function ConsultantLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [recoveryMode] = useState(isRecoveryMode);

  useEffect(() => {
    // In recovery mode the user must set a password first, so skip
    // the automatic redirect to dashboard.
    if (!recoveryMode && auth.role === 'consultant') {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate, recoveryMode]);

  const handleLoginSuccess = (email: string) => {
    auth.loginConsultant(email);
    navigate('/dashboard');
  };

  const handlePasswordSetSuccess = () => {
    // After setting the password the user already has a valid session
    // with role=consultant, so navigate straight to the dashboard.
    navigate('/dashboard', { replace: true });
  };

  if (recoveryMode) {
    return <AdminPasswordSetForm onSuccess={handlePasswordSetSuccess} />;
  }

  return <ConsultantLoginScreen onSuccess={handleLoginSuccess} onBackToAccessSelection={() => navigate('/')} />;
}