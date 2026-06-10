import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadAllTrialsDataAction from '@/actions/loadAllTrialsData';
import updatePatientFlagAction from '@/actions/updatePatientFlag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Flag, Filter, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [vetFilter, setVetFilter] = useState<string | null>(null);
  const [flagFilter, setFlagFilter] = useState<string | null>(null);
  const [trials, loading, error, refresh] = useLoadAction(
    loadAllTrialsDataAction,
    [],
    { vetEmail: vetFilter, isFlagged: flagFilter === 'flagged' ? true : flagFilter === 'unflagged' ? false : null }
  );
  const [updateFlag, isUpdating] = useMutateAction(updatePatientFlagAction);
  const [selectedTrial, setSelectedTrial] = useState<TrialData | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [regulatoryTrials, loadingRegulatory, , loadRegulatoryData] = useLoadAction(
    loadAllTrialsDataAction,
    [],
    { vetEmail: null, isFlagged: null }
  );

  const handleFlagClick = (trial: TrialData) => {
    setSelectedTrial(trial);
    setFlagReason(trial.flag_reason || '');
    setFlagDialogOpen(true);
  };

  const handleToggleFlag = async () => {
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
      refresh();
    } catch (err) {
      console.error('Failed to update flag:', err);
    }
  };

  const handleExportFDACSV = async () => {
    if (!trials || trials.length === 0) return;

    setIsExporting(true);
    try {
      await loadRegulatoryData();
      const regulatoryData = regulatoryTrials || [];

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
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!trials || trials.length === 0) return;

    setIsExporting(true);
    try {
      await loadRegulatoryData();
      const regulatoryData = regulatoryTrials || [];

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
      alert('PDF export failed. Please try again.');
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
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={vetFilter || 'all'} onValueChange={(val) => setVetFilter(val === 'all' ? null : val)}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="All Veterinarians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Veterinarians</SelectItem>
                  {Array.from(new Set(data.map((t) => t.veterinarian_email))).map((email) => (
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
                  {data.map((trial) => (
                    <TableRow key={trial.id} className={trial.is_flagged ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono text-sm">{trial.unique_id}</TableCell>
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
                        <Button
                          type="button"
                          variant={trial.is_flagged ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleFlagClick(trial)}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
    </>
  );
}
