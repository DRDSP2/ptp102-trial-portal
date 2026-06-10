import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import loadPatientCaseDataAction from '@/actions/loadPatientCaseData';
import debugClinicalNotesAction from '@/actions/debugClinicalNotes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TreatmentTimeline } from '@/components/TreatmentTimeline';
import { QuickAddNote } from '@/components/QuickAddNote';
import { ProtocolInfoCard } from '@/components/ProtocolInfoCard';
import { MonitoringChecklist } from '@/components/MonitoringChecklist';
import { NextDoseTimer } from '@/components/NextDoseTimer';
import { InformedConsentWorkflow } from '@/components/InformedConsentWorkflow';
import { EnrollmentEligibilityScreen } from '@/components/EnrollmentEligibilityScreen';
import { AdminScreeningPanel } from '@/components/AdminScreeningPanel';
import { AddTreatmentForm } from '@/components/AddTreatmentForm';
import { AddLabResultForm } from '@/components/AddLabResultForm';
import { AddAssessmentForm } from '@/components/AddAssessmentForm';
import { ObelScoreChart } from '@/components/ObelScoreChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, Activity, FileText, FlaskConical, Stethoscope, Video, AlertCircle, Download, Shield, CheckSquare, XSquare, FileVideo } from 'lucide-react';
import { VideoUploadManager } from '@/components/VideoUploadManager';

type CaseWorkspaceProps = {
  patientId: number;
  onBack: () => void;
};

export function CaseWorkspace({ patientId, onBack }: CaseWorkspaceProps) {
  const [caseData, loading, error, refresh] = useLoadAction(loadPatientCaseDataAction, [], { patientId });
  const [debugNotes] = useMutateAction(debugClinicalNotesAction);

  const handleRefresh = async () => {
    console.log('=== REFRESHING DATA ===');
    const debug = await debugNotes({ patientId });
    console.log('DEBUG: Clinical notes from database:', debug);
    await refresh();
    console.log('=== DATA REFRESHED ===');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading case data...</p>
      </div>
    );
  }

  if (error || !caseData || caseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error loading case data</p>
      </div>
    );
  }

  const patient = caseData[0];
  const protocolStartTime = patient.protocol_start_time ? new Date(patient.protocol_start_time) : null;
  const currentProtocolHour = protocolStartTime ? Math.floor((Date.now() - protocolStartTime.getTime()) / (1000 * 60 * 60)) : null;
  const isAdmin = !!localStorage.getItem('admin_email');
  const screeningStatus = (patient as any).screening_status || 'pending_screening';
  const needsScreening = screeningStatus === 'pending_screening';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-xl sm:text-2xl">{patient.horse_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {patient.unique_id} • {patient.breed} • {patient.age}y • {patient.sex}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={patient.trial_status === 'enrolled' ? 'default' : 'secondary'}>{patient.trial_status}</Badge>
            <Badge
              variant={screeningStatus === 'rejected' ? 'destructive' : screeningStatus === 'approved' ? 'default' : 'outline'}
              className={screeningStatus === 'pending_screening' ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
            >
              {screeningStatus === 'pending_screening' ? 'Pending Screening' : screeningStatus === 'approved' ? 'Screening Approved' : 'Screening Rejected'}
            </Badge>
            {protocolStartTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  Protocol Hour: {currentProtocolHour !== null ? currentProtocolHour : 'N/A'} / 72
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div>
            <h4 className="font-medium text-sm mb-3">Enrollment Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Owner Name</p>
                <p className="font-medium">{patient.owner_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Owner Contact</p>
                <p className="font-medium">{patient.owner_contact}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">{new Date(patient.enrollment_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Consent Date</p>
                <p className="font-medium">{patient.consent_date ? new Date(patient.consent_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              {protocolStartTime && (
                <div>
                  <p className="text-muted-foreground">Protocol Start</p>
                  <p className="font-medium">{protocolStartTime.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Eligibility Verified</p>
                <Badge variant={patient.eligibility_verified ? 'default' : 'secondary'} className="mt-1">
                  {patient.eligibility_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
              {patient.screened_by && (
                <>
                  <div>
                    <p className="text-muted-foreground">Screened By</p>
                    <p className="font-medium">{patient.screened_by}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Screening Date</p>
                    <p className="font-medium">{patient.screened_at ? new Date(patient.screened_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
            {patient.screening_notes && (
              <div className="mt-3">
                <p className="text-muted-foreground text-xs">Screening Notes</p>
                <p className="text-sm mt-1 p-2 bg-muted rounded">{patient.screening_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <AdminScreeningPanel patient={patient} onUpdate={handleRefresh} />
      )}

      {needsScreening && !isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Patient Pending Admin Screening</p>
                <p className="text-sm text-orange-800">Treatment administration is disabled until admin approval. You can still document labs, notes, and assessments.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Gates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnrollmentEligibilityScreen
          patientId={patientId}
          onComplete={(eligible) => {
            if (eligible) handleRefresh();
          }}
        />
        <InformedConsentWorkflow
          patientId={patientId}
          horseName={patient.horse_name}
          ownerName={patient.owner_name}
          onComplete={() => handleRefresh()}
        />
      </div>

      <ObelScoreChart assessments={patient.assessments || []} protocolStartTime={protocolStartTime} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <NextDoseTimer
            protocolStartTime={protocolStartTime}
            treatments={patient.treatments || []}
            patientId={patientId}
            onSuccess={handleRefresh}
          />

          {/* Protocol Sidebar */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Protocol Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-green-800 flex items-center gap-1"><CheckSquare className="h-3 w-3" /> Inclusion</p>
                  <ul className="text-xs text-green-700 mt-1 space-y-0.5">
                    <li>• Acute laminitis (Obel 1-3)</li>
                    <li>• Age 2-20 years</li>
                    <li>• Weight &gt;200 kg</li>
                  </ul>
                </div>
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="font-semibold text-red-800 flex items-center gap-1"><XSquare className="h-3 w-3" /> Exclusion</p>
                  <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                    <li>• Chronic &gt;14 days</li>
                    <li>• Pregnant/lactating</li>
                    <li>• Concurrent systemic disease</li>
                  </ul>
                </div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-semibold text-blue-800">Dosing Schedule</p>
                <p className="text-xs text-blue-700 mt-1">Dose 1: Hour 0 • Dose 2: Hour 12 • 500mL IV @ 5mg/mL</p>
              </div>
            </CardContent>
          </Card>
          
          <ProtocolInfoCard />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">72-Hour Protocol Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <TreatmentTimeline treatments={patient.treatments || []} protocolStartTime={protocolStartTime} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <MonitoringChecklist 
            protocolHour={currentProtocolHour} 
            treatments={patient.treatments || []}
            assessments={patient.assessments || []}
            labResults={patient.lab_results || []}
            clinicalNotes={patient.clinical_notes || []}
          />
          <QuickAddNote patientId={patientId} protocolHour={currentProtocolHour} onSuccess={handleRefresh} />
        </div>
      </div>

      <Tabs defaultValue="treatments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="treatments">
            <Activity className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Treatments</span>
            <span className="sm:hidden">Treat</span>
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notes</span>
            <span className="sm:hidden">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Videos</span>
            <span className="sm:hidden">Video</span>
          </TabsTrigger>
          <TabsTrigger value="labs">
            <FlaskConical className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Lab Results</span>
            <span className="sm:hidden">Labs</span>
          </TabsTrigger>
          <TabsTrigger value="assessments">
            <Stethoscope className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Assessments</span>
            <span className="sm:hidden">Assess</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Treatment Administration</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {needsScreening ? (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Treatment administration is disabled until admin screening approval.
                  </AlertDescription>
                </Alert>
              ) : (
                <AddTreatmentForm patientId={patientId} protocolHour={currentProtocolHour} onSuccess={handleRefresh} />
              )}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-medium">Treatment History</h4>
                {patient.treatments && patient.treatments.length > 0 ? (
                  <div className="space-y-2">
                    {patient.treatments.map((treatment: any) => (
                      <div key={treatment.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-base mb-1">
                              {treatment.total_volume_ml ? `${treatment.total_volume_ml}mL` : `${treatment.dosage_mg}mg`} via {treatment.route}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(treatment.administration_datetime).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {treatment.protocol_hour !== null && treatment.protocol_hour !== undefined ? `Hour ${treatment.protocol_hour}` : 'Pre-Protocol'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Administered by: <span className="font-medium text-foreground">{treatment.veterinarian_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No treatments recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {patient.clinical_notes && patient.clinical_notes.length > 0 ? (
                <div className="space-y-3">
                  {patient.clinical_notes.map((note: any) => (
                    <div key={note.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{note.note_type}</Badge>
                          {note.video_url && note.video_url.trim() !== '' && (
                            <Badge variant="outline" className="gap-1">
                              <Video className="h-3 w-3" />
                              Has Video
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {note.protocol_hour !== null ? `Protocol Hour ${note.protocol_hour}` : 'Pre-Protocol'}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3 leading-relaxed">{note.note_content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Recorded by: <span className="font-medium text-foreground">{note.veterinarian_name}</span></span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No clinical notes recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="mt-4 sm:mt-6 space-y-4">
          <VideoUploadManager
            patientId={patientId}
            protocolHour={currentProtocolHour}
            veterinarianName={localStorage.getItem('veterinarian_email') || localStorage.getItem('admin_email') || 'Unknown'}
            onSuccess={handleRefresh}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                Video Library
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {patient.clinical_notes && patient.clinical_notes.filter((note: any) => note.video_url && note.video_url.trim() !== '').length > 0 ? (
                <div className="space-y-4">
                  {patient.clinical_notes
                    .filter((note: any) => note.video_url && note.video_url.trim() !== '')
                    .map((note: any) => (
                      <div key={note.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="h-5 w-5 text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{note.video_file_name || 'Untitled Video'}</p>
                              <p className="text-xs text-muted-foreground">{note.note_content}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {note.protocol_hour !== null ? `Hour ${note.protocol_hour}` : 'Pre-Protocol'}
                          </Badge>
                        </div>
                        
                        <video
                          src={note.video_url}
                          controls
                          className="w-full rounded-md max-h-[300px] mb-3 bg-black"
                          preload="metadata"
                          controlsList="nodownload"
                        />
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            <p>Uploaded by: <span className="font-medium text-foreground">{note.veterinarian_name}</span></p>
                            <p>{new Date(note.created_at).toLocaleString()}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(note.video_url);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = note.video_file_name || `video_${note.id}.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error('Download failed:', err);
                                window.open(note.video_url, '_blank');
                              }
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileVideo className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No videos recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Use the upload panel above to add gait assessment videos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Lab Results Entry</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <AddLabResultForm patientId={patientId} protocolHour={currentProtocolHour} onSuccess={handleRefresh} />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-medium">Lab Results History</h4>
                {patient.lab_results && patient.lab_results.length > 0 ? (
                  <div className="space-y-2">
                    {patient.lab_results.map((lab: any) => (
                      <div key={lab.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium">{new Date(lab.test_datetime).toLocaleString()}</p>
                          <Badge variant="outline">
                            {lab.protocol_hour !== null ? `Hour ${lab.protocol_hour}` : 'Pre-Protocol'}
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          {(lab.wbc || lab.rbc || lab.hemoglobin || lab.hematocrit || lab.platelets) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Complete Blood Count (CBC)</p>
                              <div className="grid grid-cols-5 gap-3 text-sm">
                                {lab.wbc && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">WBC:</span>
                                    <p className="font-medium">{lab.wbc} ×10⁹/L</p>
                                  </div>
                                )}
                                {lab.rbc && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">RBC:</span>
                                    <p className="font-medium">{lab.rbc} ×10¹²/L</p>
                                  </div>
                                )}
                                {lab.hemoglobin && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Hemoglobin:</span>
                                    <p className="font-medium">{lab.hemoglobin} g/dL</p>
                                  </div>
                                )}
                                {lab.hematocrit && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Hematocrit:</span>
                                    <p className="font-medium">{lab.hematocrit}%</p>
                                  </div>
                                )}
                                {lab.platelets && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Platelets:</span>
                                    <p className="font-medium">{lab.platelets} ×10⁹/L</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {(lab.glucose || lab.creatinine || lab.bun || lab.alt || lab.ast || lab.alkaline_phosphatase || lab.total_protein || lab.albumin) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Biochemistry Panel</p>
                              <div className="grid grid-cols-4 gap-3 text-sm">
                                {lab.glucose && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Glucose:</span>
                                    <p className="font-medium">{lab.glucose} mg/dL</p>
                                  </div>
                                )}
                                {lab.creatinine && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Creatinine:</span>
                                    <p className="font-medium">{lab.creatinine} mg/dL</p>
                                  </div>
                                )}
                                {lab.bun && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">BUN:</span>
                                    <p className="font-medium">{lab.bun} mg/dL</p>
                                  </div>
                                )}
                                {lab.alt && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">ALT:</span>
                                    <p className="font-medium">{lab.alt} U/L</p>
                                  </div>
                                )}
                                {lab.ast && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">AST:</span>
                                    <p className="font-medium">{lab.ast} U/L</p>
                                  </div>
                                )}
                                {lab.alkaline_phosphatase && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Alk Phos:</span>
                                    <p className="font-medium">{lab.alkaline_phosphatase} U/L</p>
                                  </div>
                                )}
                                {lab.total_protein && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Total Protein:</span>
                                    <p className="font-medium">{lab.total_protein} g/dL</p>
                                  </div>
                                )}
                                {lab.albumin && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Albumin:</span>
                                    <p className="font-medium">{lab.albumin} g/dL</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {(lab.serum_amyloid_a || lab.fibrinogen || lab.lactate) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Inflammatory Markers</p>
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                {lab.serum_amyloid_a && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">SAA:</span>
                                    <p className="font-medium">{lab.serum_amyloid_a} μg/mL</p>
                                  </div>
                                )}
                                {lab.fibrinogen && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Fibrinogen:</span>
                                    <p className="font-medium">{lab.fibrinogen} mg/dL</p>
                                  </div>
                                )}
                                {lab.lactate && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Lactate:</span>
                                    <p className="font-medium">{lab.lactate} mmol/L</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {lab.additional_notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Additional Notes:</p>
                            <p className="text-sm">{lab.additional_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No lab results recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Clinical Assessment</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <AddAssessmentForm patientId={patientId} protocolHour={currentProtocolHour} onSuccess={handleRefresh} />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-medium">Assessment History</h4>
                {patient.assessments && patient.assessments.length > 0 ? (
                  <div className="space-y-3">
                    {[...patient.assessments].reverse().map((assessment: any) => (
                      <div key={assessment.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Obel: {assessment.obel_grade !== null ? assessment.obel_grade : 'N/A'}
                            </Badge>
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Pain: {assessment.pain_score !== null ? assessment.pain_score : 'N/A'}/10
                            </Badge>
                            {assessment.mobility_score !== null && (
                              <Badge variant="secondary" className="text-sm">
                                Mobility: {assessment.mobility_score}/10
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {assessment.protocol_hour !== null ? `Protocol Hour ${assessment.protocol_hour}` : 'Pre-Protocol'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                          {assessment.digital_pulse_score !== null && (
                            <div>
                              <span className="text-muted-foreground text-xs">Digital Pulse:</span>
                              <p className="font-medium">{assessment.digital_pulse_score}/4</p>
                            </div>
                          )}
                          {assessment.hoof_temperature && (
                            <div>
                              <span className="text-muted-foreground text-xs">Hoof Temp:</span>
                              <p className="font-medium capitalize">{assessment.hoof_temperature}</p>
                            </div>
                          )}
                          {assessment.heart_rate !== null && (
                            <div>
                              <span className="text-muted-foreground text-xs">Heart Rate:</span>
                              <p className="font-medium">{assessment.heart_rate} bpm</p>
                            </div>
                          )}
                          {assessment.respiratory_rate !== null && (
                            <div>
                              <span className="text-muted-foreground text-xs">Resp. Rate:</span>
                              <p className="font-medium">{assessment.respiratory_rate} bpm</p>
                            </div>
                          )}
                          {assessment.temperature !== null && (
                            <div>
                              <span className="text-muted-foreground text-xs">Temperature:</span>
                              <p className="font-medium">{assessment.temperature}°F</p>
                            </div>
                          )}
                        </div>
                        
                        {assessment.clinical_notes && (
                          <div className="mb-3 p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">Clinical Notes:</p>
                            <p className="text-sm">{assessment.clinical_notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Assessed by: <span className="font-medium text-foreground">{assessment.veterinarian_name}</span></span>
                          <span>{new Date(assessment.assessment_datetime).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assessments recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
