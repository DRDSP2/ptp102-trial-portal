import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLoginScreen } from '@/components/AdminLoginScreen';
import { AdminPasswordSetForm } from '@/components/AdminPasswordSetForm';
import { useAuth } from '@/context/AuthContext';
import { isRecoveryMode } from '@/lib/supabase/recovery';

export function AdminLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [recoveryMode] = useState(isRecoveryMode);

  useEffect(() => {
    // In recovery mode the user must set a password first, so skip
    // the automatic redirect to dashboard.
    if (!recoveryMode && auth.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate, recoveryMode]);

  const handleLoginSuccess = (email: string) => {
    auth.loginAdmin(email);
    navigate('/dashboard');
  };

  const handlePasswordSetSuccess = () => {
    // After setting the password the user already has a valid session
    // with role=admin, so navigate straight to the dashboard.
    navigate('/dashboard', { replace: true });
  };

  if (recoveryMode) {
    return <AdminPasswordSetForm onSuccess={handlePasswordSetSuccess} />;
  }

  return <AdminLoginScreen onSuccess={handleLoginSuccess} onBackToAccessSelection={() => navigate('/')} />;
}
