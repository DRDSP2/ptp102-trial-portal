import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadAllTrialsDataAction from '@/actions/loadAllTrialsData';
import updatePatientFlagAction from '@/actions/updatePatientFlag';
import updateDataLockStatusAction from '@/actions/updateDataLockStatus';
import exportSubmissionPackageAction from '@/actions/exportSubmissionPackage';
import { downloadSubmissionPackage } from '@/lib/submissionPackage';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Flag, Filter, FileText, Loader2, FileJson, Lock, Snowflake, Unlock, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DataLockStatus = 'open' | 'locked' | 'frozen';

type TrialData = {
  id: number;
  unique_id: string;
  horse_name: string;
  age: number;
  breed: string;
  weight: number;
  trial_status: string;
  enrollment_date: string;
  laminitis_grade: number;
  affected_limbs: string;
  is_flagged: boolean;
  flag_reason: string | null;
  data_lock_status: DataLockStatus;
  veterinarian_name: string;
  veterinarian_email: string;
  hospital_affiliation: string;
  license_number: string;
  treatment_count: number;
  assessment_count: number;
};

type MasterTrialsTableProps = {
  adminEmail: string;
};

export function MasterTrialsTable({ adminEmail }: MasterTrialsTableProps) {
  const auth = useAuth();
  const isAdmin = auth.role === 'admin';
  const [vetFilter, setVetFilter] = useState<string | null>(null);
  const [flagFilter, setFlagFilter] = useState<string | null>(null);
  const [trials, loading, error, refresh] = useLoadAction(
    loadAllTrialsDataAction,
    [],
    { vetEmail: vetFilter, isFlagged: flagFilter === 'flagged' ? true : flagFilter === 'unflagged' ? false : null }
  );
  const [updateFlag, isUpdating] = useMutateAction(updatePatientFlagAction);
  const [updateLock, isLockUpdating] = useMutateAction(updateDataLockStatusAction);
  const [selectedTrial, setSelectedTrial] = useState<TrialData | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [pendingLockStatus, setPendingLockStatus] = useState<DataLockStatus>('open');
  const [lockReason, setLockReason] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPackage, setIsExportingPackage] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  // Row-level write actions (flag toggle) surface failures here, mirroring
  // the exportError inline-alert pattern — never console-only.
  const [rowActionError, setRowActionError] = useState<string | null>(null);
  // Regulatory artifacts must never depend on render timing: export handlers
  // build only from this loader's freshly awaited return value (an unfiltered
  // reload), never from render-scoped hook state.
  const [, , , loadRegulatoryData] = useLoadAction(
    loadAllTrialsDataAction,
    [],
    { vetEmail: null, isFlagged: null }
  );
  const [exportSubmissionPackage] = useMutateAction(exportSubmissionPackageAction);

  const handleFlagClick = (trial: TrialData) => {
    if (!isAdmin) return; // defense in depth: flag writes are admin-only
    setRowActionError(null);
    setSelectedTrial(trial);
    setFlagReason(trial.flag_reason || '');
    setFlagDialogOpen(true);
  };

  const handleToggleFlag = async () => {
    if (!isAdmin) return; // defense in depth: flag writes are admin-only
    if (!selectedTrial) return;

    try {
      await updateFlag({
        patientId: selectedTrial.id,
        isFlagged: !selectedTrial.is_flagged,
        flagReason: !selectedTrial.is_flagged ? flagReason : null,
        flaggedBy: adminEmail,
      });
      setFlagDialogOpen(false);
      setFlagReason('');
      setSelectedTrial(null);
      setRowActionError(null);
      refresh();
    } catch (err) {
      console.error('Failed to update flag:', err);
      setFlagDialogOpen(false);
      setRowActionError(err instanceof Error ? err.message : 'Failed to update flag. Please try again.');
    }
  };

  // Lock cycle: open -> frozen -> locked -> open. Frozen is a soft hold
  // (writes still allowed with a documented reason); locked is a hard hold
  // (writes are rejected outright).
  const nextLockStatus = (current: DataLockStatus): DataLockStatus =>
    current === 'open' ? 'frozen' : current === 'frozen' ? 'locked' : 'open';

  const handleLockClick = (trial: TrialData) => {
    if (!isAdmin) return; // defense in depth: lock/freeze writes are admin-only
    setSelectedTrial(trial);
    setPendingLockStatus(nextLockStatus(trial.data_lock_status));
    setLockReason('');
    setLockError(null);
    setLockDialogOpen(true);
  };

  const handleConfirmLock = async () => {
    if (!isAdmin) return; // defense in depth: lock/freeze writes are admin-only
    if (!selectedTrial) return;
    if (!lockReason.trim()) {
      setLockError('A reason for change is required.');
      return;
    }
    try {
      await updateLock({
        patientId: selectedTrial.id,
        dataLockStatus: pendingLockStatus,
        reasonForChange: lockReason.trim(),
        adminEmail,
      });
      setLockDialogOpen(false);
      setLockReason('');
      setLockError(null);
      setSelectedTrial(null);
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lock status';
      setLockError(message);
    }
  };

  const handleExportPackage = async () => {
    if (!trials || trials.length === 0) return;
    setIsExportingPackage(true);
    setExportError(null);
    try {
      const [result] = await exportSubmissionPackage({ exportedBy: adminEmail });
      if (result?.files) {
        downloadSubmissionPackage(result);
      }
    } catch (err) {
      console.error('Failed to export submission package:', err);
      setExportError(err instanceof Error ? err.message : 'Failed to export submission package. Please try again.');
    } finally {
      setIsExportingPackage(false);
    }
  };

  // Single fresh-data channel for regulatory artifacts. Throws instead of
  // returning an empty dataset so a failed refresh can never produce a
  // stamped 0-record FDA export.
  const fetchFreshRegulatoryData = async (): Promise<any[]> => {
    const fresh = await loadRegulatoryData();
    const rows = Array.isArray(fresh) ? (fresh as any[]) : [];
    if (rows.length === 0) {
      throw new Error('Could not refresh trial data for export. No file was downloaded — please try again.');
    }
    return rows;
  };

  const handleExportFDACSV = async () => {
    if (!trials || trials.length === 0) return;

    setIsExporting(true);
    setExportError(null);
    try {
      const regulatoryData = await fetchFreshRegulatoryData();

      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
      const exportDate = new Date().toISOString().split('T')[0];
      
      const headers = [
        'STUDY_ID',
        'SUBJECT_ID',
        'AGE_YEARS',
        'BREED',
        'SEX',
        'WEIGHT_KG',
        'ENROLLMENT_DATE',
        'CONSENT_DATE',
        'TRIAL_STATUS',
        'LAMINITIS_GRADE',
        'AFFECTED_LIMBS',
        'DIGITAL_PULSE',
        'HOOF_TEMP',
        'PROTOCOL_START',
        'ELIGIBILITY_VERIFIED',
        'SCREENING_STATUS',
        'VET_LICENSE',
        'SITE_NAME',
        'TREATMENT_COUNT',
        'ASSESSMENT_COUNT',
        'LAB_COUNT',
        'EXPORT_DATE',
        'EXPORTED_BY'
      ];

      let csv = '# PTP-102 LAMINITIS TRIAL - FDA REGULATORY EXPORT\n';
      csv += `# EXPORT DATE: ${exportDate}\n`;
      csv += `# EXPORTED BY: ${adminEmail}\n`;
      csv += `# RECORD COUNT: ${regulatoryData.length}\n`;
      csv += `# CONFIDENTIAL - FOR REGULATORY SUBMISSION ONLY\n`;
      csv += '#\n';
      csv += headers.join(',') + '\n';

      const sanitize = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      };

      regulatoryData.forEach((trial: any) => {
        const treatmentCount = trial.treatments ? trial.treatments.length : 0;
        const assessmentCount = trial.assessments ? trial.assessments.length : 0;
        const labCount = trial.lab_results ? trial.lab_results.length : 0;

        const row = [
          sanitize('PTP102'),
          sanitize(trial.unique_id),
          sanitize(trial.age),
          sanitize(trial.breed),
          sanitize(trial.sex),
          sanitize(trial.weight),
          sanitize(trial.enrollment_date),
          sanitize(trial.consent_date),
          sanitize(trial.trial_status),
          sanitize(trial.laminitis_grade),
          sanitize(trial.affected_limbs),
          sanitize(trial.digital_pulse),
          sanitize(trial.hoof_wall_temperature),
          sanitize(trial.protocol_start_time),
          sanitize(trial.eligibility_verified ? 'YES' : 'NO'),
          sanitize(trial.screening_status),
          sanitize(trial.license_number),
          sanitize(trial.hospital_affiliation),
          sanitize(treatmentCount),
          sanitize(assessmentCount),
          sanitize(labCount),
          sanitize(exportDate),
          sanitize(adminEmail)
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PTP102_FDA_EXPORT_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`FDA CSV Export completed: ${regulatoryData.length} records`);
    } catch (err) {
      console.error('FDA CSV export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!trials || trials.length === 0) return;

    setIsExporting(true);
    setExportError(null);
    try {
      const regulatoryData = await fetchFreshRegulatoryData();

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PTP-102 LAMINITIS CLINICAL TRIAL', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REGULATORY SUMMARY REPORT', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Export Date: ${new Date().toLocaleString()}`, pageWidth / 2, 29, { align: 'center' });
      doc.text(`Exported By: ${adminEmail}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Total Records: ${regulatoryData.length}`, pageWidth / 2, 39, { align: 'center' });

      const tableData = regulatoryData.map((trial: any) => [
        trial.unique_id,
        trial.horse_name,
        `${trial.age}y`,
        trial.breed,
        `Grade ${trial.laminitis_grade}`,
        trial.trial_status,
        new Date(trial.enrollment_date).toLocaleDateString(),
        trial.veterinarian_name,
        trial.hospital_affiliation,
        trial.treatments ? trial.treatments.length : 0,
        trial.assessments ? trial.assessments.length : 0
      ]);

      autoTable(doc, {
        head: [['Subject ID', 'Horse', 'Age', 'Breed', 'Grade', 'Status', 'Enrolled', 'Veterinarian', 'Site', 'Tx', 'Assess']],
        body: tableData,
        startY: 45,
        styles: { 
          fontSize: 7,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        },
        margin: { top: 45, bottom: 25, left: 10, right: 10 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 45;

      if (finalY < pageHeight - 25) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('CONFIDENTIAL - FOR REGULATORY USE ONLY', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text('This document contains proprietary clinical trial data subject to FDA regulations.', pageWidth / 2, pageHeight - 11, { align: 'center' });
        doc.text('Byrock Veterinary Research | PTP-102 Clinical Study Protocol', pageWidth / 2, pageHeight - 7, { align: 'center' });
      }

      doc.save(`PTP102_REGULATORY_REPORT_${timestamp}.pdf`);
      console.log(`PDF Export completed: ${regulatoryData.length} records`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(err instanceof Error ? err.message : 'PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading trials data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-destructive">Failed to load trials data</p>
        </CardContent>
      </Card>
    );
  }

  const data: TrialData[] = trials || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-xl sm:text-2xl">Master Trials Data</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              onClick={handleExportFDACSV} 
              disabled={data.length === 0 || isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV (FDA)
            </Button>
            <Button 
              type="button" 
              variant="default"
              onClick={handleExportPDF} 
              disabled={data.length === 0 || isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export PDF Report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPackage}
              disabled={data.length === 0 || isExportingPackage}
            >
              {isExportingPackage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              Download CVM Submission Package
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {exportError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}
          {rowActionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{rowActionError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={vetFilter || 'all'} onValueChange={(val) => setVetFilter(val === 'all' ? null : val)}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="All Veterinarians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Veterinarians</SelectItem>
                  {Array.from(
                    new Set(
                      data
                        .map((t) => t.veterinarian_email)
                        // Radix forbids empty-string SelectItem values, and trial rows
                        // whose patient has no `enrolled_by_vet_email` produce ''.
                        // Filter them so the dropdown only lists real vet emails.
                        .filter((email): email is string => Boolean(email && email.trim())),
                    ),
                  ).map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={flagFilter || 'all'} onValueChange={(val) => setFlagFilter(val === 'all' ? null : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flags</SelectItem>
                <SelectItem value="flagged">Flagged Only</SelectItem>
                <SelectItem value="unflagged">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trials data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Trial ID</TableHead>
                    <TableHead className="min-w-[120px]">Horse</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Grade</TableHead>
                    <TableHead>Veterinarian</TableHead>
                    <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                    <TableHead className="hidden md:table-cell">Enrollment</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((trial) => {
                    const lockStatus = trial.data_lock_status ?? 'open';
                    const rowBg =
                      lockStatus === 'locked'
                        ? 'bg-red-100'
                        : lockStatus === 'frozen'
                        ? 'bg-amber-50'
                        : trial.is_flagged
                        ? 'bg-red-50'
                        : '';
                    return (
                      <TableRow key={trial.id} className={rowBg}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>{trial.unique_id}</span>
                            {lockStatus === 'locked' && (
                              <Badge variant="destructive" className="gap-1 text-[10px]" title="Record is LOCKED — edits are blocked">
                                <Lock className="h-3 w-3" />
                                LOCKED
                              </Badge>
                            )}
                            {lockStatus === 'frozen' && (
                              <Badge className="gap-1 text-[10px] bg-amber-500 hover:bg-amber-600" title="Record is FROZEN — edits require a reason">
                                <Snowflake className="h-3 w-3" />
                                FROZEN
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trial.horse_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {trial.age}y {trial.breed}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{trial.trial_status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">Grade {trial.laminitis_grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{trial.veterinarian_name}</p>
                            <p className="text-xs text-muted-foreground">{trial.veterinarian_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{trial.hospital_affiliation}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">
                          {new Date(trial.enrollment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-xs space-y-1">
                            <p>{trial.treatment_count} treatments</p>
                            <p>{trial.assessment_count} assessments</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant={
                                  lockStatus === 'locked' ? 'destructive' : lockStatus === 'frozen' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => handleLockClick(trial)}
                                title={`Cycle lock: ${lockStatus} -> ${nextLockStatus(lockStatus)}`}
                                aria-label={`Cycle lock status for ${trial.unique_id}`}
                              >
                                {lockStatus === 'locked' ? (
                                  <Lock className="h-4 w-4" />
                                ) : lockStatus === 'frozen' ? (
                                  <Snowflake className="h-4 w-4" />
                                ) : (
                                  <Unlock className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant={trial.is_flagged ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => handleFlagClick(trial)}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTrial?.is_flagged ? 'Remove Flag' : 'Flag Trial Entry'}
            </DialogTitle>
            <DialogDescription>
              {selectedTrial?.is_flagged
                ? 'Remove the flag from this trial entry?'
                : 'Mark this trial entry as suspicious or requiring review.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrial && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Trial: {selectedTrial.unique_id}</p>
                <p className="text-sm text-muted-foreground">{selectedTrial.horse_name}</p>
              </div>

              {!selectedTrial.is_flagged && (
                <div className="space-y-2">
                  <Label htmlFor="flagReason">Reason for Flag</Label>
                  <Textarea
                    id="flagReason"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Describe why this entry is being flagged..."
                    rows={3}
                  />
                </div>
              )}

              {selectedTrial.is_flagged && selectedTrial.flag_reason && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-900">Current Flag Reason:</p>
                  <p className="text-sm text-yellow-800 mt-1">{selectedTrial.flag_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={selectedTrial?.is_flagged ? 'default' : 'destructive'}
              onClick={handleToggleFlag}
              disabled={isUpdating || (!selectedTrial?.is_flagged && !flagReason.trim())}
            >
              {isUpdating
                ? 'Updating...'
                : selectedTrial?.is_flagged
                ? 'Remove Flag'
                : 'Flag Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingLockStatus === 'locked'
                ? 'Lock Record'
                : pendingLockStatus === 'frozen'
                ? 'Freeze Record'
                : 'Unlock Record'}
            </DialogTitle>
            <DialogDescription>
              {pendingLockStatus === 'locked'
                ? 'Locking BLOCKS all further edits to this patient. An admin must unlock the record before any new treatment, assessment, lab result, note, or consent can be added. This action is recorded in the audit trail.'
                : pendingLockStatus === 'frozen'
                ? 'Freezing marks the record as under review. Edits remain possible but require a documented reason for change. This action is recorded in the audit trail.'
                : 'Unlocking returns the record to normal editing. This action is recorded in the audit trail.'}
            </DialogDescription>
          </DialogHeader>

          {selectedTrial && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">Trial: {selectedTrial.unique_id}</p>
                <p className="text-muted-foreground">{selectedTrial.horse_name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Current status: <span className="font-mono">{selectedTrial.data_lock_status}</span> &rarr;{' '}
                  <span className="font-mono">{pendingLockStatus}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockReason">Reason for Change (required)</Label>
                <Textarea
                  id="lockReason"
                  value={lockReason}
                  onChange={(e) => {
                    setLockReason(e.target.value);
                    if (lockError) setLockError(null);
                  }}
                  placeholder="e.g. End-of-study data freeze; investigator review pending; protocol deviation under review..."
                  rows={3}
                />
                {lockError && <p className="text-sm text-destructive">{lockError}</p>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingLockStatus === 'locked' ? 'destructive' : 'default'}
              onClick={handleConfirmLock}
              disabled={isLockUpdating || !lockReason.trim()}
            >
              {isLockUpdating
                ? 'Updating...'
                : pendingLockStatus === 'locked'
                ? 'Lock Record'
                : pendingLockStatus === 'frozen'
                ? 'Freeze Record'
                : 'Unlock Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
