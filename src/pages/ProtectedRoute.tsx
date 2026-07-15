import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: 'admin' | 'vet';
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && auth.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (auth.role === 'vet' && auth.pendingApproval) {
    return <Navigate to="/vet/pending" replace />;
  }

  if (auth.role === 'vet' && !auth.termsAccepted) {
    return <Navigate to="/vet/terms" replace />;
  }

  return <>{children}</>;
}
