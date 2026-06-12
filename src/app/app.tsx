import '@/index.css';

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
        <HashRouter>
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
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <ProtectedRoute>
                  <PatientCasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <ProtectedRoute>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
  );
}

export default App;
