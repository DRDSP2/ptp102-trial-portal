import { useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import approvePatientScreeningAction from '@/actions/approvePatientScreening';
import rejectPatientScreeningAction from '@/actions/rejectPatientScreening';
import requestPatientDetailsAction from '@/actions/requestPatientDetails';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Patient } from '@/types/patient';
import { useAuth } from '@/context/AuthContext';

type AdminScreeningPanelProps = {
  patient: Patient;
  onUpdate: () => void;
};

export function AdminScreeningPanel({ patient, onUpdate }: AdminScreeningPanelProps) {
  const auth = useAuth();
  const adminEmail = auth.email ?? 'Unknown Admin';
  const [notes, setNotes] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showAwaiting, setShowAwaiting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvePatient, isApproving] = useMutateAction(approvePatientScreeningAction);
  const [rejectPatient, isRejecting] = useMutateAction(rejectPatientScreeningAction);
  const [requestDetails, isRequesting] = useMutateAction(requestPatientDetailsAction);

  const friendlyScreeningError = (error: unknown, verb: string): string => {
    const raw = error instanceof Error ? error.message : String(error ?? '');
    const lower = raw.toLowerCase();
    if (lower.includes('row-level security') || lower.includes('rls') || lower.includes('policy')) {
      return `Permission denied — only an admin can ${verb} a patient. Sign in as an admin and retry.`;
    }
    if (lower.includes('jwt') || lower.includes('not authenticated')) {
      return 'Your admin session has expired. Please sign in again and retry.';
    }
    return raw || `Failed to ${verb} patient. Please try again.`;
  };

  const handleApprove = async () => {
    setActionError(null);
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
      setActionError(friendlyScreeningError(error, 'approve'));
    }
  };

  const handleReject = async () => {
    setActionError(null);
    if (!notes.trim()) {
      setActionError('Please provide rejection notes before confirming.');
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
      setActionError(friendlyScreeningError(error, 'reject'));
    }
  };

  const handleAwaitingDetails = async () => {
    setActionError(null);
    if (!notes.trim()) {
      setActionError('Please describe what details are missing.');
      return;
    }
    try {
      await requestDetails({
        patientId: patient.id,
        adminEmail,
        notes,
        messageToVet: notes,
      });
      setNotes('');
      setShowAwaiting(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to request details:', error);
      setActionError(friendlyScreeningError(error, 'request details for'));
    }
  };

  const screeningStatus = (patient as any).screening_status || 'pending_screening';
  const screenedBy = (patient as any).screened_by;
  const screenedAt = (patient as any).screened_at;
  const screeningNotes = (patient as any).screening_notes;
  const statusHistory = (patient as any).status_history || [];

  const patientData = patient as any;

  const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="grid grid-cols-2 gap-2">
        <span className="text-sm text-slate-700 font-medium">{label}:</span>
        <span className="text-sm font-medium text-slate-900">{value}</span>
      </div>
    );
  };

  if (screeningStatus === 'approved') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Screening Approved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-foreground">
            <p><strong>Approved by:</strong> {screenedBy}</p>
            {screenedAt && <p><strong>Date:</strong> {new Date(screenedAt).toLocaleString()}</p>}
            {screeningNotes && (
              <div>
                <strong>Notes:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-green-200 text-slate-900">{screeningNotes}</p>
              </div>
            )}
          </div>
          <StatusHistory history={statusHistory} />
        </CardContent>
      </Card>
    );
  }

  if (screeningStatus === 'rejected') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Screening Rejected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-foreground">
            <p><strong>Rejected by:</strong> {screenedBy}</p>
            {screenedAt && <p><strong>Date:</strong> {new Date(screenedAt).toLocaleString()}</p>}
            {screeningNotes && (
              <div>
                <strong>Rejection Reason:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-red-200 text-slate-900">{screeningNotes}</p>
              </div>
            )}
          </div>
          <StatusHistory history={statusHistory} />
        </CardContent>
      </Card>
    );
  }

  if (screeningStatus === 'awaiting_details') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Clock className="h-5 w-5" />
            Awaiting Further Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-white border-amber-300">
            <AlertDescription className="text-sm text-slate-900">
              This patient submission requires additional information from the veterinarian before it can be reviewed.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm text-foreground">
            <p><strong>Requested by:</strong> {screenedBy}</p>
            {screenedAt && <p><strong>Date:</strong> {new Date(screenedAt).toLocaleString()}</p>}
            {screeningNotes && (
              <div>
                <strong>Message to Vet:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-amber-200 text-slate-900">{screeningNotes}</p>
              </div>
            )}
          </div>
          <StatusHistory history={statusHistory} />

          {/* Admin can still take action */}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setShowApprove(true)} className="flex-1 bg-green-600 hover:bg-green-700" type="button">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Admit
            </Button>
            <Button onClick={() => setShowReject(true)} variant="destructive" className="flex-1" type="button">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>

          {showApprove && (
            <div className="space-y-3 p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-medium text-slate-900">Admit Patient to Trial</h4>
              <Textarea placeholder="Optional admission notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={isApproving} className="bg-green-700 hover:bg-green-800 text-white" type="button">
                  {isApproving ? 'Admitting...' : 'Confirm Admission'}
                </Button>
                <Button onClick={() => { setShowApprove(false); setNotes(''); }} variant="outline" type="button">Cancel</Button>
              </div>
            </div>
          )}

          {showReject && (
            <div className="space-y-3 p-4 bg-white rounded-lg border border-red-200">
              <h4 className="font-medium text-slate-900">Reject Patient Enrollment</h4>
              <Textarea placeholder="Rejection reason (required)..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={handleReject} disabled={isRejecting || !notes.trim()} variant="destructive" type="button">
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
                <Button onClick={() => { setShowReject(false); setNotes(''); }} variant="outline" type="button">Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Screening Required
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} type="button">
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white border-orange-300">
          <AlertDescription className="text-sm text-slate-900">
            This patient is pending admin screening. Review all fields and attachments, then choose an action.
          </AlertDescription>
        </Alert>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

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
              <DetailRow label="Owner Email" value={patientData.owner_email} />
              <DetailRow label="Owner Phone" value={patientData.owner_phone} />
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
                <span className="text-sm text-slate-700 font-medium">Eligibility Verified: </span>
                <Badge variant={patientData.eligibility_verified ? 'default' : 'secondary'} className="ml-2">
                  {patientData.eligibility_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {!showApprove && !showReject && !showAwaiting && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowApprove(true)} className="flex-1 bg-green-700 hover:bg-green-800 text-white" type="button">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Admit
            </Button>
            <Button onClick={() => setShowAwaiting(true)} variant="secondary" className="flex-1 bg-amber-700 hover:bg-amber-800 text-white" type="button">
              <Clock className="mr-2 h-4 w-4" />
              Awaiting Details
            </Button>
            <Button onClick={() => setShowReject(true)} variant="destructive" className="flex-1" type="button">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {showApprove && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium text-slate-900">Admit Patient to Trial</h4>
            <Textarea placeholder="Optional admission notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={isApproving} className="bg-green-700 hover:bg-green-800 text-white" type="button">
                {isApproving ? 'Admitting...' : 'Confirm Admission'}
              </Button>
              <Button onClick={() => { setShowApprove(false); setNotes(''); }} variant="outline" type="button">Cancel</Button>
            </div>
          </div>
        )}

        {showAwaiting && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-amber-200">
            <h4 className="font-medium text-slate-900">Request Further Details</h4>
            <Textarea placeholder="Describe what information or documents are missing..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button onClick={handleAwaitingDetails} disabled={isRequesting || !notes.trim()} className="bg-amber-700 hover:bg-amber-800 text-white" type="button">
                {isRequesting ? 'Sending...' : 'Send Request'}
              </Button>
              <Button onClick={() => { setShowAwaiting(false); setNotes(''); }} variant="outline" type="button">Cancel</Button>
            </div>
          </div>
        )}

        {showReject && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-red-200">
            <h4 className="font-medium text-slate-900">Reject Patient Enrollment</h4>
            <Textarea placeholder="Rejection reason (required)..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={isRejecting || !notes.trim()} variant="destructive" type="button">
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button onClick={() => { setShowReject(false); setNotes(''); }} variant="outline" type="button">Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusHistory({ history }: { history: { status: string; timestamp: string; admin: string; notes: string }[] }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="mt-4 bg-white/60 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-800 uppercase">Status History</p>
      <div className="space-y-1">
        {history.map((entry, i) => (
          <div key={i} className="text-xs flex justify-between items-start gap-2 text-slate-900">
            <div>
              <span className="font-medium capitalize">{entry.status.replace(/_/g, ' ')}</span>
              {entry.notes && <span className="text-slate-700 block">{entry.notes}</span>}
            </div>
            <span className="text-slate-700 whitespace-nowrap">{entry.admin} — {new Date(entry.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
