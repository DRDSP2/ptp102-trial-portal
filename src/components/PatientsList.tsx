import { useEffect, useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadPatientsAction from '@/actions/loadPatients';
import loadCompletePatientTrialDataAction from '@/actions/loadCompletePatientTrialData';
import deletePatientAction from '@/actions/deletePatient';
import { Patient } from '@/types/patient';
import { PatientEnrollmentForm } from '@/components/PatientEnrollmentForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Trash2, FileText, Loader2, Pencil, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generatePatientTrialReport } from '@/lib/reportGenerator';
import approvePatientScreeningAction from '@/actions/approvePatientScreening';
import rejectPatientScreeningAction from '@/actions/rejectPatientScreening';
import requestPatientDetailsAction from '@/actions/requestPatientDetails';
import sendEmailNotificationAction from '@/actions/sendEmailNotification';
import { sendNotification, NotificationType } from '@/utils/emailNotifications';

type PatientsListProps = {
  statusFilter: string;
  onViewDetails: (patient: Patient) => void;
  onPatientDeleted?: () => void;
};

export function PatientsList({ statusFilter, onViewDetails, onPatientDeleted }: PatientsListProps) {
  const [patients, loading, error, refresh] = useLoadAction(loadPatientsAction, [], { status: statusFilter || null });
  const [deletePatient, isDeleting] = useMutateAction(deletePatientAction);
  const [approvePatient, isApproving] = useMutateAction(approvePatientScreeningAction);
  const [rejectPatient, isRejecting] = useMutateAction(rejectPatientScreeningAction);
  const [requestDetails, isRequesting] = useMutateAction(requestPatientDetailsAction);
  const [sendEmail] = useMutateAction(sendEmailNotificationAction);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [exportingPatientId, setExportingPatientId] = useState<number | null>(null);
  const [patientIdForExport, setPatientIdForExport] = useState<number | null>(null);
  const [screenDialogOpen, setScreenDialogOpen] = useState(false);
  const [screenPatient, setScreenPatient] = useState<Patient | null>(null);
  const [screenAction, setScreenAction] = useState<'approve' | 'reject' | 'awaiting_details' | null>(null);
  const [screenNotes, setScreenNotes] = useState('');
  
  const [completeData, loadingComplete, completeError] = useLoadAction(
    loadCompletePatientTrialDataAction,
    [],
    { patientId: patientIdForExport }
  );
  const auth = useAuth();
  const isAdmin = auth.role === 'admin';

  useEffect(() => {
    if (!exportingPatientId) {
      return;
    }

    if (loadingComplete) {
      return;
    }

    if (completeError) {
      console.error('Error loading complete data:', completeError);
      alert('Failed to load patient data. Please try again.');
      setExportingPatientId(null);
      setPatientIdForExport(null);
      return;
    }

    if (completeData && completeData.length > 0) {
      const patientData = completeData[0];
      const patientName = patients?.find((p: Patient) => p.id === exportingPatientId)?.horse_name || 'Unknown';

      generatePatientTrialReport(patientData, patientName)
        .then(() => {
          alert(`PDF exported successfully for ${patientName}`);
        })
        .catch((err) => {
          console.error('Export failed:', err);
          alert('Export failed. Please try again.');
        })
        .finally(() => {
          setExportingPatientId(null);
          setPatientIdForExport(null);
        });
    }
  }, [completeData, completeError, exportingPatientId, loadingComplete, patients]);

  const getStatusBadge = (status: string, screeningStatus?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      screening: 'secondary',
      enrolled: 'default',
      completed: 'outline',
      withdrawn: 'destructive',
    };

    if (screeningStatus === 'pending_screening') {
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{status}</Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Pending Screening
          </Badge>
        </div>
      );
    }

    if (screeningStatus === 'approved') {
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant={variants[status] || 'default'}>{status}</Badge>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Approved
          </Badge>
        </div>
      );
    }

    if (screeningStatus === 'rejected') {
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant={variants[status] || 'destructive'}>{status}</Badge>
          <Badge variant="destructive">Rejected</Badge>
        </div>
      );
    }

    if (screeningStatus === 'awaiting_details') {
      return (
        <div className="flex flex-wrap gap-1">
          <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Awaiting Details
          </Badge>
        </div>
      );
    }

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    setPatientToEdit(patient);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setPatientToEdit(null);
    refresh();
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    
    try {
      await deletePatient({ patientId: patientToDelete.id });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
      refresh();
      if (onPatientDeleted) {
        onPatientDeleted();
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleExportPatientPDF = async (patient: Patient) => {
    console.log('Export button clicked for patient:', patient.id, patient.horse_name);
    setExportingPatientId(patient.id);
    setPatientIdForExport(patient.id);
  };

  const handleScreenClick = (patient: Patient, action: 'approve' | 'reject' | 'awaiting_details') => {
    setScreenPatient(patient);
    setScreenAction(action);
    setScreenNotes('');
    setScreenDialogOpen(true);
  };

  const handleScreenConfirm = async () => {
    if (!screenPatient || !screenAction) return;
    const adminEmail = localStorage.getItem('admin_email') || 'Unknown Admin';
    try {
      if (screenAction === 'approve') {
        await approvePatient({ patientId: screenPatient.id, adminEmail, notes: screenNotes || null });
        if (screenPatient.enrolled_by_vet_email) {
          sendNotification(
            sendEmail,
            NotificationType.VET_APPROVED,
            `✅ Patient Approved: ${screenPatient.horse_name}`,
            {
              'Horse Name': screenPatient.horse_name,
              'Breed': screenPatient.breed,
              'Status': 'Approved for PTP-102 trial',
              'Screening Notes': screenNotes || 'No notes provided',
            }
          ).catch(err => console.error('Email notification failed:', err));
        }
      } else if (screenAction === 'reject') {
        if (!screenNotes.trim()) {
          alert('Rejection notes are required');
          return;
        }
        await rejectPatient({ patientId: screenPatient.id, adminEmail, notes: screenNotes });
        if (screenPatient.enrolled_by_vet_email) {
          sendNotification(
            sendEmail,
            NotificationType.VET_REJECTED,
            `❌ Patient Rejected: ${screenPatient.horse_name}`,
            {
              'Horse Name': screenPatient.horse_name,
              'Breed': screenPatient.breed,
              'Status': 'Rejected from PTP-102 trial',
              'Reason': screenNotes,
            }
          ).catch(err => console.error('Email notification failed:', err));
        }
      } else if (screenAction === 'awaiting_details') {
        if (!screenNotes.trim()) {
          alert('Please describe what details are missing');
          return;
        }
        await requestDetails({ patientId: screenPatient.id, adminEmail, notes: screenNotes, messageToVet: screenNotes });
        if (screenPatient.enrolled_by_vet_email) {
          sendNotification(
            sendEmail,
            NotificationType.VET_REJECTED,
            `⏳ Awaiting Further Details: ${screenPatient.horse_name}`,
            {
              'Horse Name': screenPatient.horse_name,
              'Breed': screenPatient.breed,
              'Status': 'Awaiting further details from vet',
              'Message': screenNotes,
            }
          ).catch(err => console.error('Email notification failed:', err));
        }
      }
      setScreenDialogOpen(false);
      setScreenPatient(null);
      setScreenAction(null);
      setScreenNotes('');
      refresh();
    } catch (error) {
      console.error('Screening action failed:', error);
      alert(`Failed to ${screenAction} patient. Please try again.`);
    }
  };

  const handleScreenCancel = () => {
    setScreenDialogOpen(false);
    setScreenPatient(null);
    setScreenAction(null);
    setScreenNotes('');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading patients...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Error loading patients: {error.message}</div>;
  }

  if (!patients || patients.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No patients found.</div>;
  }

  const patientsList: Patient[] = patients;

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Profile</TableHead>
              <TableHead className="min-w-[120px]">Horse Name</TableHead>
              <TableHead className="hidden sm:table-cell">Breed</TableHead>
              <TableHead className="hidden md:table-cell">Age</TableHead>
              <TableHead className="hidden md:table-cell">Sex</TableHead>
              <TableHead className="hidden lg:table-cell">Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Enrollment Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patientsList.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  {patient.profile_picture_url ? (
                    <img
                      src={patient.profile_picture_url}
                      alt={patient.horse_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                      <svg className="h-6 w-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                      </svg>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <p>{patient.horse_name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{patient.breed} • {patient.age}y</p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{patient.breed}</TableCell>
                <TableCell className="hidden md:table-cell">{patient.age}</TableCell>
                <TableCell className="hidden md:table-cell">{patient.sex}</TableCell>
                <TableCell className="hidden lg:table-cell">{patient.owner_name}</TableCell>
                <TableCell>{getStatusBadge(patient.trial_status, (patient as any).screening_status)}</TableCell>
                <TableCell className="hidden sm:table-cell">{new Date(patient.enrollment_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(patient)} type="button">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditClick(patient)} 
                      type="button"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleExportPatientPDF(patient)} 
                      type="button"
                      disabled={exportingPatientId === patient.id}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {exportingPatientId === patient.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </Button>
                    {isAdmin && (
                      <>
                        {((patient as any).screening_status === 'pending_screening' || (patient as any).screening_status === 'awaiting_details') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScreenClick(patient, 'approve')}
                              type="button"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled={isApproving || isRejecting || isRequesting}
                              title="Admit"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScreenClick(patient, 'awaiting_details')}
                              type="button"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              disabled={isApproving || isRejecting || isRequesting}
                              title="Awaiting Further Details"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScreenClick(patient, 'reject')}
                              type="button"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isApproving || isRejecting || isRequesting}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteClick(patient)} 
                          type="button"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Patient</DialogTitle>
            <DialogDescription>
              Update patient details for {patientToEdit?.horse_name}.
            </DialogDescription>
          </DialogHeader>
          {patientToEdit && (
            <PatientEnrollmentForm patient={patientToEdit} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={screenDialogOpen} onOpenChange={setScreenDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {screenAction === 'approve'
                ? 'Admit Patient to Trial'
                : screenAction === 'reject'
                ? 'Reject Patient Enrollment'
                : 'Awaiting Further Details'}
            </DialogTitle>
            <DialogDescription>
              {screenAction === 'approve'
                ? `Admit ${screenPatient?.horse_name} for the PTP-102 laminitis trial.`
                : screenAction === 'reject'
                ? `Reject ${screenPatient?.horse_name} from the PTP-102 laminitis trial.`
                : `Request additional information for ${screenPatient?.horse_name} before proceeding.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {screenAction === 'approve'
                ? 'Admission Notes (optional)'
                : screenAction === 'reject'
                ? 'Rejection Reason (required)'
                : 'Message to Veterinarian (required)'}
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              placeholder={
                screenAction === 'approve'
                  ? 'Optional notes...'
                  : screenAction === 'reject'
                  ? 'Reason for rejection...'
                  : 'Describe what information or documents are missing...'
              }
              value={screenNotes}
              onChange={(e) => setScreenNotes(e.target.value)}
            />
            {screenPatient?.status_history && screenPatient.status_history.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">Status History</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {screenPatient.status_history.map((entry, i) => (
                    <div key={i} className="text-xs flex justify-between">
                      <span className="font-medium capitalize">{entry.status.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">{entry.admin} — {new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleScreenCancel} type="button">
              Cancel
            </Button>
            <Button
              variant={screenAction === 'approve' ? 'default' : screenAction === 'reject' ? 'destructive' : 'secondary'}
              onClick={handleScreenConfirm}
              type="button"
              disabled={isApproving || isRejecting || isRequesting || ((screenAction === 'reject' || screenAction === 'awaiting_details') && !screenNotes.trim())}
              className={screenAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : screenAction === 'awaiting_details' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            >
              {isApproving || isRejecting || isRequesting
                ? 'Processing...'
                : screenAction === 'approve'
                ? 'Admit'
                : screenAction === 'reject'
                ? 'Confirm Rejection'
                : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{patientToDelete?.horse_name}</strong>? 
              This will permanently remove all associated data including treatments, assessments, lab results, and clinical notes. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} type="button" disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} type="button" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
