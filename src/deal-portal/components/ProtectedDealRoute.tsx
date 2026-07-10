import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { DealTier } from '@/types/roles';

interface ProtectedDealRouteProps {
  children: React.ReactNode;
  minimumTier: DealTier;
  requireRole?: 'investor' | 'licensee';
}

export function ProtectedDealRoute({
  children,
  minimumTier,
  requireRole,
}: ProtectedDealRouteProps) {
  const { user, dealProfile, dealTier, hasDealAccess, isInvestor, isLicensee, isLoading } = useAuth();

  if (isLoading || (user && !dealProfile)) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/deal/signup" replace />;
  if (!dealProfile) return <Navigate to="/deal/signup" replace />;
  if (!hasDealAccess(minimumTier)) {
    // Users without any tier haven't completed the NDA yet.
    return <Navigate to={dealTier === 'none' ? '/deal/nda' : '/deal/overview'} replace />;
  }
  if (requireRole === 'investor' && !isInvestor) return <Navigate to="/dashboard" replace />;
  if (requireRole === 'licensee' && !isLicensee) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
