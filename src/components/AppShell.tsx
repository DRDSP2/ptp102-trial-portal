import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ByrockLogo } from '@/components/ByrockLogo';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DealTier } from '@/types/roles';

type AppShellProps = {
  children: ReactNode;
};

type DealNavItem = {
  label: string;
  path: string;
  tier: DealTier;
};

export function AppShell({ children }: AppShellProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = auth.email ?? 'Unknown';
  const isAdmin = auth.role === 'admin';
  const isConsultant = auth.isConsultant;

  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard';
  const isPatientCase = location.pathname.startsWith('/patient/');
  const isAuditLog = location.pathname === '/admin/audit-log';
  const showBreadcrumb = !isDashboard;
  const isDealRoute = location.pathname.startsWith('/deal/');
  const showDealNav = isDealRoute && (auth.dealProfile || isAdmin);

  return (
    <div className="min-h-screen bg-base-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <RegulatoryBanner />

      <header className="bg-base-100 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-4">
            <ByrockLogo variant="icon" height={32} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-base-content">PTP-102 Laminitis Trial</p>
              <p className="truncate text-xs text-base-content/60">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
            {isConsultant && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-900">
                <Shield className="mr-1 h-3 w-3" />
                Consultant
              </Badge>
            )}
            {isConsultant && (
              <Button variant="outline" size="sm" onClick={() => setShowChangePw(true)}>
                Change Password
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {showDealNav && (
        <nav className="bg-base-100 border-b border-base-200 px-6 py-2">
          <div className="container mx-auto max-w-7xl flex gap-2 overflow-x-auto">
            {([
              { label: 'Overview', path: '/deal/overview', tier: 'evaluation' },
              { label: 'CMC', path: '/deal/cmc', tier: 'diligence' },
              { label: 'Trials', path: '/deal/trials/live', tier: 'diligence' },
              { label: 'Financials', path: '/deal/financials', tier: 'diligence' },
              { label: 'Cap Table', path: '/deal/cap-table', tier: 'diligence' },
              { label: 'IP', path: '/deal/ip-portfolio', tier: 'diligence' },
              { label: 'Term Sheet', path: '/deal/term-sheet', tier: 'exclusive' },
              { label: 'Regions', path: '/deal/regions', tier: 'exclusive' },
              ...(auth.isInvestor ? [{ label: 'Investor', path: '/deal/investor', tier: 'evaluation' } satisfies DealNavItem] : []),
            ] satisfies DealNavItem[])
              .filter((item) => isAdmin || auth.hasDealAccess(item.tier))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm whitespace-nowrap',
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-base-200',
                  )}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </nav>
      )}

      {showBreadcrumb && (
        <div className="bg-base-100 border-b border-base-200 px-6 py-2">
          <div className="container mx-auto max-w-7xl">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {isPatientCase && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Patient Case</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
                {isAuditLog && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Audit Trail</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>

      <ChangePasswordModal
        open={auth.mustResetPassword || showChangePw}
        forced={auth.mustResetPassword}
        onClose={() => setShowChangePw(false)}
      />
    </div>
  );
}
