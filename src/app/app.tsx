import '@/index.css';

import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AuthSelectionPage } from '@/pages/AuthSelectionPage';
import { VetLoginPage } from '@/pages/VetLoginPage';
import { VetRegisterPage } from '@/pages/VetRegisterPage';
import { VetResetPage } from '@/pages/VetResetPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientCasePage } from '@/pages/PatientCasePage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { ProtectedRoute } from '@/pages/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DealSignupPage } from '@/deal-portal/pages/DealSignupPage';
import { NDASigningPage } from '@/deal-portal/pages/NDASigningPage';
import { DealTermsAcceptancePage } from '@/deal-portal/pages/DealTermsAcceptancePage';
import { DealOverviewPage } from '@/deal-portal/pages/DealOverviewPage';
import { CMCDataRoomPage } from '@/deal-portal/pages/CMCDataRoomPage';
import { LiveTrialDashboardPage } from '@/deal-portal/pages/LiveTrialDashboardPage';
import { FinancialDashboardPage } from '@/deal-portal/pages/FinancialDashboardPage';
import { CapTablePage } from '@/deal-portal/pages/CapTablePage';
import { IPPortfolioPage } from '@/deal-portal/pages/IPPortfolioPage';
import { TermSheetNegotiationPage } from '@/deal-portal/pages/TermSheetNegotiationPage';
import { RegionMarketplacePage } from '@/deal-portal/pages/RegionMarketplacePage';
import { InvestorDashboardPage } from '@/deal-portal/pages/InvestorDashboardPage';
import { AdminDealUsersPanel } from '@/admin/components/AdminDealUsersPanel';
import { AdminDocumentManager } from '@/admin/components/AdminDocumentManager';
import { AdminDealPaymentsPanel } from '@/admin/components/AdminDealPaymentsPanel';
import { AdminDealCompliancePanel } from '@/admin/components/AdminDealCompliancePanel';
import { ProtectedDealRoute } from '@/deal-portal/components/ProtectedDealRoute';

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
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <PatientCasePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <AuditLogPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            {/* Deal Portal — Public */}
            <Route path="/deal/signup" element={<DealSignupPage />} />
            <Route path="/deal/nda" element={<ErrorBoundary><NDASigningPage /></ErrorBoundary>} />
            <Route path="/deal/terms" element={<DealTermsAcceptancePage />} />

            {/* Deal Portal — Evaluation Tier */}
            <Route
              path="/deal/overview"
              element={
                <ProtectedDealRoute minimumTier="evaluation">
                  <DealOverviewPage />
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Diligence Tier */}
            <Route
              path="/deal/cmc"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <CMCDataRoomPage />
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/trials/live"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <LiveTrialDashboardPage />
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/financials"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <FinancialDashboardPage />
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/cap-table"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <CapTablePage />
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/ip-portfolio"
              element={
                <ProtectedDealRoute minimumTier="diligence">
                  <IPPortfolioPage />
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Exclusive Tier */}
            <Route
              path="/deal/term-sheet"
              element={
                <ProtectedDealRoute minimumTier="exclusive">
                  <TermSheetNegotiationPage />
                </ProtectedDealRoute>
              }
            />
            <Route
              path="/deal/regions"
              element={
                <ProtectedDealRoute minimumTier="exclusive">
                  <RegionMarketplacePage />
                </ProtectedDealRoute>
              }
            />

            {/* Deal Portal — Investor */}
            <Route
              path="/deal/investor"
              element={
                <ProtectedDealRoute minimumTier="evaluation" requireRole="investor">
                  <InvestorDashboardPage />
                </ProtectedDealRoute>
              }
            />

            {/* Admin Deal Management */}
            <Route
              path="/admin/deal-users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <AdminDealUsersPanel />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-documents"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <AdminDocumentManager />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-payments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <AdminDealPaymentsPanel />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deal-compliance"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppShell>
                    <AdminDealCompliancePanel />
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
