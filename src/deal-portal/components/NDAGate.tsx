import { Navigate } from 'react-router-dom';
import { useNDAStatus } from '@/deal-portal/hooks/useNDAStatus';
import { useAuth } from '@/context/AuthContext';

export function NDAGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { signed, expiresAt, loading: ndaLoading } = useNDAStatus();

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/deal/signup" />;
  if (ndaLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!signed) return <Navigate to="/deal/nda" />;
  if (expiresAt && new Date(expiresAt) < new Date()) return <Navigate to="/deal/nda" />;

  return <>{children}</>;
}
