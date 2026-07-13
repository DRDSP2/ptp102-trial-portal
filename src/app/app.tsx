import '@/index.css';

import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AuthSelectionPage } from '@/pages/AuthSelectionPage';
import { VetLoginPage } from '@/pages/VetLoginPage';
import { VetRegisterPage } from '@/pages/VetRegisterPage';
import { VetResetPage } from '@/pages/VetResetPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { ProtectedRoute } from '@/pages/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DealSignupPage } from '@/deal-portal/pages/DealSignupPage';
import { DealLoginPage } from '@/deal-portal/pages/DealLoginPage';
import { DealTermsAcceptancePage } from '@/deal-portal/pages/DealTermsAcceptancePage';
import { ProtectedDealRoute } from '@/deal-portal/components/ProtectedDealRoute';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PatientCasePage = lazy(() => import('@/pages/PatientCasePage').then((m) => ({ default: m.PatientCasePage })));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const AdminDealUsersPanel = lazy(() => import('@/admin/components/AdminDealUsersPanel').then((m) => ({ default: m.AdminDealUsersPanel })));
const AdminDocumentManager = lazy(() => import('@/admin/components/AdminDocumentManager').then((m) => ({ default: m.AdminDocumentManager })));
const AdminDealPaymentsPanel = lazy(() => import('@/admin/components/AdminDealPaymentsPanel').then((m) => ({ default: m.AdminDealPaymentsPanel })));
const AdminDealCompliancePanel = lazy(() => import('@/admin/components/AdminDealCompliancePanel').then((m) => ({ default: m.AdminDealCompliancePanel })));
const NDASigningPage = lazy(() => import('@/deal-portal/pages/NDASigningPage').then((m) => ({ default: m.NDASigningPage })));
const DealOverviewPage = lazy(() => import('@/deal-portal/pages/DealOverviewPage').then((m) => ({ default: m.DealOverviewPage })));
const CMCDataRoomPage = lazy(() => import('@/deal-portal/pages/CMCDataRoomPage').then((m) => ({ default: m.CMCDataRoomPage })));
const LiveTrialDashboardPage = lazy(() => import('@/deal-portal/pages/LiveTrialDashboardPage').then((m) => ({ default: m.LiveTrialDashboardPage })));
const FinancialDashboardPage = lazy(() => import('@/deal-portal/pages/FinancialDashboardPage').then((m) => ({ default: m.FinancialDashboardPage })));
const CapTablePage = lazy(() => import('@/deal-portal/pages/CapTablePage').then((m) => ({ default: m.CapTablePage })));
const IPPortfolioPage = lazy(() => import('@/deal-portal/pages/IPPortfolioPage').then((m) => ({ default: m.IPPortfolioPage })));
const TermSheetNegotiationPage = lazy(() => import('@/deal-portal/pages/TermSheetNegotiationPage').then((m) => ({ default: m.TermSheetNegotiationPage })));
const RegionMarketplacePage = lazy(() => import('@/deal-portal/pages/RegionMarketplacePage').then((m) => ({ default: m.RegionMarketplacePage })));
const InvestorDashboardPage = lazy(() => import('@/deal-portal/pages/InvestorDashboardPage').then((m) => ({ default: m.InvestorDashboardPage })));

function LazyPage({ children, label = 'Loading...' }: { children: ReactNode; label?: string }) {
  return <Suspense fallback={<div className="p-8 text-center">{label}</div>}>{children}</Suspense>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <div data-theme="corporate">
      <AuthProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<AuthSelectionPage />} />
            <Route path="/vet/login" element={<VetLoginPage />} />
            <Route path="/vet/register" element={<VetRegisterPage />} />
            <Route path="/vet/forgot" element={<VetResetPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/vet/pending" element={<PendingApprovalPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <LazyPage><DashboardPage /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <LazyPage><PatientCasePage /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <LazyPage><AuditLogPage /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            {/* Deal Portal — Public */}
            <Route path="/deal/signup" element={<DealSignupPage />} />
            <Route path="/deal/login" element={<DealLoginPage />} />
            <Route path="/deal/nda" element={<ErrorBoundary><LazyPage label="Loading deal room..."><NDASigningPage /></LazyPage></ErrorBoundary>} />
            <Route path="/deal/terms" element={<DealTermsAcceptancePage />} />

            {/* Deal Portal — Evaluation Tier */}
            <Route
              path="/deal/overview"
              element={
                <ProtectedDealRoute minimumTier="evaluation">
                  <LazyPage label="Loading deal room..."><DealOverviewPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Diligence Tier */}
            <Route
              path="/deal/cmc"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LazyPage label="Loading deal room..."><CMCDataRoomPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/trials/live"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LazyPage label="Loading deal room..."><LiveTrialDashboardPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/financials"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LazyPage label="Loading deal room..."><FinancialDashboardPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/cap-table"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LazyPage label="Loading deal room..."><CapTablePage /></LazyPage>
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/ip-portfolio"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LazyPage label="Loading deal room..."><IPPortfolioPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Exclusive Tier */}
            <Route
              path="/deal/term-sheet"
              element={
                <ProtectedDealRoute minimumTier="exclusive">
                  <LazyPage label="Loading deal room..."><TermSheetNegotiationPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/regions"
              element={
                <ProtectedDealRoute minimumTier="exclusive">
                  <LazyPage label="Loading deal room..."><RegionMarketplacePage /></LazyPage>
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Investor */}
            <Route
              path="/deal/investor"
              element={
                <ProtectedDealRoute minimumTier="evaluation" requireRole="investor">
                  <LazyPage label="Loading deal room..."><InvestorDashboardPage /></LazyPage>
                </ProtectedDealRoute>
              }
            />

            {/* Admin Deal Management */}
            <Route
              path="/admin/deal-users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <LazyPage><AdminDealUsersPanel /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-documents"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <LazyPage><AdminDocumentManager /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-payments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <LazyPage><AdminDealPaymentsPanel /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-compliance"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <LazyPage><AdminDealCompliancePanel /></LazyPage>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </HashRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
