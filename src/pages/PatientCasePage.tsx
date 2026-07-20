import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CaseWorkspace } from '@/components/CaseWorkspace';

export function PatientCasePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const numericPatientId = useMemo(() => (patientId ? Number(patientId) : null), [patientId]);

  if (!numericPatientId || Number.isNaN(numericPatientId)) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="text-center text-destructive py-12">Invalid patient ID.</div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <CaseWorkspace patientId={numericPatientId} onBack={handleBack} />
    </div>
  );
}
