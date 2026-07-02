import { type ReactNode } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ByrockLogo } from '@/components/ByrockLogo';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
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

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = auth.email ?? 'Unknown';
  const isAdmin = auth.role === 'admin';

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard';
  const isPatientCase = location.pathname.startsWith('/patient/');
  const isAuditLog = location.pathname === '/admin/audit-log';
  const showBreadcrumb = !isDashboard;

  return (
    <div className="min-h-screen bg-base-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <RegulatoryBanner />

      <header className="bg-base-100 border-b border-base-300 px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ByrockLogo variant="icon" height={32} />
            <div>
              <p className="text-sm font-medium text-base-content">PTP-102 Laminitis Trial</p>
              <p className="text-xs text-base-content/60">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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
    </div>
  );
}
