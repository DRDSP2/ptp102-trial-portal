import '@/index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';
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
import { ProtectedRoute } from '@/pages/ProtectedRoute';

const GOOGLE_CLIENT_ID = '632400607726-b997todqjmo3083mm5a1rjv7hnkdrae2.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
