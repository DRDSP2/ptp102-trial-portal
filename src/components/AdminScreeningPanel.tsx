import { useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import approvePatientScreeningAction from '@/actions/approvePatientScreening';
import rejectPatientScreeningAction from '@/actions/rejectPatientScreening';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Patient } from '@/types/patient';

type AdminScreeningPanelProps = {
  patient: Patient;
  onUpdate: () => void;
};

export function AdminScreeningPanel({ patient, onUpdate }: AdminScreeningPanelProps) {
  const [notes, setNotes] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [approvePatient, isApproving] = useMutateAction(approvePatientScreeningAction);
  const [rejectPatient, isRejecting] = useMutateAction(rejectPatientScreeningAction);

  const adminEmail = localStorage.getItem('admin_email') || 'Unknown Admin';

  const handleApprove = async () => {
    try {
      await approvePatient({
        patientId: patient.id,
        adminEmail,
        notes: notes || null,
      });
      setNotes('');
      setShowApprove(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to approve patient:', error);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide rejection notes');
      return;
    }
    try {
      await rejectPatient({
        patientId: patient.id,
        adminEmail,
        notes,
      });
      setNotes('');
      setShowReject(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to reject patient:', error);
    }
  };

  const screeningStatus = (patient as any).screening_status || 'pending_screening';
  const screenedBy = (patient as any).screened_by;
  const screenedAt = (patient as any).screened_at;
  const screeningNotes = (patient as any).screening_notes;

  const patientData = patient as any;

  const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="grid grid-cols-2 gap-2">
        <span className="text-sm text-slate-600">{label}:</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    );
  };

  if (screeningStatus === 'approved') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="h-5 w-5" />
            Screening Approved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-green-800">
            <p><strong>Approved by:</strong> {screenedBy}</p>
            {screenedAt && <p><strong>Date:</strong> {new Date(screenedAt).toLocaleString()}</p>}
            {screeningNotes && (
              <div>
                <strong>Notes:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-green-200">{screeningNotes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (screeningStatus === 'rejected') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <XCircle className="h-5 w-5" />
            Screening Rejected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-red-800">
            <p><strong>Rejected by:</strong> {screenedBy}</p>
            {screenedAt && <p><strong>Date:</strong> {new Date(screenedAt).toLocaleString()}</p>}
            {screeningNotes && (
              <div>
                <strong>Rejection Reason:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-red-200">{screeningNotes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Screening Required
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            type="button"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white border-orange-300">
          <AlertDescription className="text-sm text-orange-800">
            This patient is pending admin screening approval before treatment can begin.
            Review eligibility criteria and approve or reject enrollment.
          </AlertDescription>
        </Alert>

        {showDetails && (
          <div className="bg-white p-4 rounded-lg border border-orange-200 space-y-4">
            <h4 className="font-semibold text-slate-900 border-b pb-2">Patient Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow label="Horse Name" value={patientData.horse_name} />
              <DetailRow label="Breed" value={patientData.breed} />
              <DetailRow label="Age" value={patientData.age ? `${patientData.age} years` : null} />
              <DetailRow label="Weight" value={patientData.weight ? `${patientData.weight} kg` : null} />
              <DetailRow label="Sex" value={patientData.sex} />
              <DetailRow label="Body Condition Score" value={patientData.body_condition_score} />
            </div>

            <h4 className="font-semibold text-slate-900 border-b pb-2 pt-2">Owner Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Owner Name" value={patientData.owner_name} />
              <DetailRow label="Contact" value={patientData.owner_contact} />
            </div>

            <h4 className="font-semibold text-slate-900 border-b pb-2 pt-2">Clinical Examination - Laminitis Indicators</h4>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded">
                <DetailRow label="Laminitis Grade" value={patientData.laminitis_grade} />
                <DetailRow label="Affected Limbs" value={patientData.affected_limbs} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Digital Pulse" value={patientData.digital_pulse} />
                <DetailRow label="Hoof Wall Temp" value={patientData.hoof_wall_temperature} />
                <DetailRow label="Coronary Band" value={patientData.coronary_band_condition} />
                <DetailRow label="Hoof Tester Response" value={patientData.hoof_tester_response} />
                <DetailRow label="Stance" value={patientData.stance} />
                <DetailRow label="Gait" value={patientData.gait} />
              </div>
            </div>

            <h4 className="font-semibold text-slate-900 border-b pb-2 pt-2">Vital Signs at Enrollment</h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Heart Rate" value={patientData.enrollment_heart_rate ? `${patientData.enrollment_heart_rate} bpm` : null} />
              <DetailRow label="Respiratory Rate" value={patientData.enrollment_respiratory_rate ? `${patientData.enrollment_respiratory_rate} /min` : null} />
              <DetailRow label="Temperature" value={patientData.enrollment_temperature ? `${patientData.enrollment_temperature}°C` : null} />
            </div>

            <h4 className="font-semibold text-slate-900 border-b pb-2 pt-2">Enrollment Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Enrollment Date" value={patientData.enrollment_date ? new Date(patientData.enrollment_date).toLocaleDateString() : null} />
              <DetailRow label="Consent Date" value={patientData.consent_date ? new Date(patientData.consent_date).toLocaleDateString() : null} />
              <div className="col-span-2">
                <span className="text-sm text-slate-600">Eligibility Verified: </span>
                <Badge variant={patientData.eligibility_verified ? 'default' : 'secondary'} className="ml-2">
                  {patientData.eligibility_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {!showApprove && !showReject && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowApprove(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              type="button"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve for Trial
            </Button>
            <Button
              onClick={() => setShowReject(true)}
              variant="destructive"
              className="flex-1"
              type="button"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Enrollment
            </Button>
          </div>
        )}

        {showApprove && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900">Approve Patient for Trial</h4>
            <Textarea
              placeholder="Optional approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
                type="button"
              >
                {isApproving ? 'Approving...' : 'Confirm Approval'}
              </Button>
              <Button
                onClick={() => { setShowApprove(false); setNotes(''); }}
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showReject && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900">Reject Patient Enrollment</h4>
            <Textarea
              placeholder="Rejection reason (required)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={isRejecting || !notes.trim()}
                variant="destructive"
                type="button"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button
                onClick={() => { setShowReject(false); setNotes(''); }}
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
