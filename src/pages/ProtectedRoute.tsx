import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (auth.role === 'vet' && auth.pendingApproval) {
    return <Navigate to="/vet/pending" replace />;
  }

  if (auth.role === 'vet' && !auth.termsAccepted) {
    return <Navigate to="/vet/login" replace />;
  }

  return <>{children}</>;
}
