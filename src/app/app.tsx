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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

function App() {
  return (
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </HashRouter>
      </AuthProvider>
  );
}

export default App;
