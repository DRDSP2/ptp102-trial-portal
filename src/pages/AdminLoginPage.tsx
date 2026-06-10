import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLoginScreen } from '@/components/AdminLoginScreen';
import { useAuth } from '@/context/AuthContext';

export function AdminLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const handleSuccess = (email: string) => {
    auth.loginAdmin(email);
    navigate('/dashboard');
  };

  return <AdminLoginScreen onSuccess={handleSuccess} onBackToVet={() => navigate('/')} />;
}
