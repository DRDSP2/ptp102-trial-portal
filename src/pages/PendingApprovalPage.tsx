import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PendingApprovalScreen } from '@/components/PendingApprovalScreen';
import { useAuth } from '@/context/AuthContext';

export function PendingApprovalPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.role !== 'vet') {
      navigate('/', { replace: true });
    } else if (!auth.pendingApproval) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const handleApproved = () => {
    auth.approveVet();
    navigate('/dashboard');
  };

  const handleRejected = () => {
    auth.rejectVet();
    navigate('/');
  };

  return (
    <PendingApprovalScreen
      email={auth.email ?? 'Unknown'}
      onApproved={handleApproved}
      onRejected={handleRejected}
    />
  );
}
