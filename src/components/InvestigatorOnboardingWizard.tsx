import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import loadInvestigatorQualificationAction from '@/actions/loadInvestigatorQualification';
import saveInvestigatorQualificationAction from '@/actions/saveInvestigatorQualification';
import {
  UserCircle,
  GraduationCap,
  Building2,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  Shield,
  Clock,
} from 'lucide-react';

const AGREEMENT_TEXT = `I, the undersigned veterinarian, agree to serve as a qualified investigator for the PTP-102 Laminitis Pilot Study. I will:

(a) conduct the study only per the approved protocol;
(b) personally supervise all drug administration;
(c) maintain complete records of all doses, outcomes, and adverse events;
(d) report adverse events within 24 hours;
(e) allow monitoring visits and FDA inspections;
(f) not represent PTP-102 as safe or effective;
(g) ensure all horse owners sign informed consent before enrollment.`;

export function InvestigatorOnboardingWizard({ vetEmail }: { vetEmail: string }) {
  const [qualData, qualLoading] = useLoadAction(loadInvestigatorQualificationAction, [], { vetEmail });
  const [saveQual, isSaving] = useMutateAction(saveInvestigatorQualificationAction);

  const [step, setStep] = useState(1);
  const qualification = qualData && qualData.length > 0 ? qualData[0] : null;

  const [form, setForm] = useState({
    licenseNumber: qualification?.license_number || '',
    licenseState: qualification?.license_state || '',
    yearsExperience: qualification?.years_experience || '',
    laminitisCaseVolume: qualification?.laminitis_case_volume_per_year || '',
    priorTrialExperience: qualification?.prior_clinical_trial_experience || false,
    priorTrialsCount: qualification?.prior_trials_count || '0',
    gcpTrainingCompleted: qualification?.gcp_training_completed || false,
    gcpQuizScore: qualification?.gcp_quiz_score || '',
    facilityInspectionCompleted: qualification?.facility_inspection_completed || false,
    investigatorAgreementSigned: qualification?.investigator_agreement_signed || false,
    protocolSigned: qualification?.protocol_signed || false,
    agreementAcknowledged: false,
    protocolAcknowledged: false,
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const vetId = qualification?.veterinarian_id;
    if (!vetId) return;

    await saveQual({
      veterinarianId: vetId,
      licenseNumber: form.licenseNumber,
      licenseState: form.licenseState,
      yearsExperience: parseInt(form.yearsExperience) || 0,
      laminitisCaseVolume: parseInt(form.laminitisCaseVolume) || 0,
      priorTrialExperience: form.priorTrialExperience,
      priorTrialsCount: parseInt(form.priorTrialsCount) || 0,
      gcpTrainingCompleted: form.gcpTrainingCompleted,
      gcpQuizScore: form.gcpQuizScore ? parseFloat(form.gcpQuizScore) : null,
      facilityInspectionCompleted: form.facilityInspectionCompleted,
      investigatorAgreementSigned: form.investigatorAgreementSigned,
      investigatorAgreementSignedAt: form.investigatorAgreementSigned ? new Date().toISOString() : null,
      investigatorAgreementSignature: form.investigatorAgreementSigned ? `${vetEmail}-agreement` : null,
      protocolSigned: form.protocolSigned,
      protocolSignedAt: form.protocolSigned ? new Date().toISOString() : null,
      protocolSignedVersion: form.protocolSigned ? '1.0' : null,
      protocolSignature: form.protocolSigned ? `${vetEmail}-protocol` : null,
      qualificationStatus: form.investigatorAgreementSigned && form.protocolSigned ? 'pending_review' : 'pending_submission',
    });
  };

  const status = qualification?.qualification_status || 'pending_submission';
  const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending_submission: { color: 'bg-slate-100 text-slate-700', label: 'Pending Submission', icon: <Clock className="h-4 w-4" /> },
    pending_review: { color: 'bg-amber-100 text-amber-700', label: 'Pending Qualification Review', icon: <AlertCircle className="h-4 w-4" /> },
    approved: { color: 'bg-green-100 text-green-700', label: 'Approved Investigator', icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected', icon: <AlertCircle className="h-4 w-4" /> },
    expired: { color: 'bg-gray-100 text-gray-700', label: 'Expired', icon: <Clock className="h-4 w-4" /> },
  };

  if (qualLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading qualification status...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Credentials', icon: <UserCircle className="h-4 w-4" /> },
    { num: 2, title: 'GCP Training', icon: <GraduationCap className="h-4 w-4" /> },
    { num: 3, title: 'Facility', icon: <Building2 className="h-4 w-4" /> },
    { num: 4, title: 'Agreement', icon: <FileSignature className="h-4 w-4" /> },
    { num: 5, title: 'Protocol', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investigator Qualification</h2>
          <p className="text-sm text-slate-500">Complete all steps before accessing patient data</p>
        </div>
        <Badge className={statusConfig[status]?.color}>
          <span className="flex items-center gap-1">
            {statusConfig[status]?.icon}
            {statusConfig[status]?.label}
          </span>
        </Badge>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === s.num
                  ? 'bg-slate-900 text-white'
                  : s.num < step
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {s.num < step ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Step 1: Professional Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Veterinary License Number *</Label>
                  <Input value={form.licenseNumber} onChange={(e) => updateForm('licenseNumber', e.target.value)} placeholder="e.g. VET-12345" />
                </div>
                <div className="space-y-2">
                  <Label>State of Licensure *</Label>
                  <Input value={form.licenseState} onChange={(e) => updateForm('licenseState', e.target.value)} placeholder="e.g. Kentucky" />
                </div>
                <div className="space-y-2">
                  <Label>Years of Practice *</Label>
                  <Input type="number" value={form.yearsExperience} onChange={(e) => updateForm('yearsExperience', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Laminitis Cases per Year *</Label>
                  <Input type="number" value={form.laminitisCaseVolume} onChange={(e) => updateForm('laminitisCaseVolume', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.priorTrialExperience} onCheckedChange={(v) => updateForm('priorTrialExperience', !!v)} />
                    <Label className="font-normal">I have prior clinical trial experience</Label>
                  </div>
                  {form.priorTrialExperience && (
                    <Input
                      className="mt-2"
                      type="number"
                      value={form.priorTrialsCount}
                      onChange={(e) => updateForm('priorTrialsCount', e.target.value)}
                      placeholder="Number of prior trials"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Step 2: GCP Training
              </h3>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  Good Clinical Practice (GCP) training is required per VICH GL9. 
                  Upload your certificate or complete the in-app training module.
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.gcpTrainingCompleted} onCheckedChange={(v) => updateForm('gcpTrainingCompleted', !!v)} />
                  <Label className="font-normal">I have completed GCP training for this study</Label>
                </div>
                {form.gcpTrainingCompleted && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label>Training Quiz Score (%)</Label>
                      <Input type="number" value={form.gcpQuizScore} onChange={(e) => updateForm('gcpQuizScore', e.target.value)} placeholder="e.g. 85" />
                    </div>
                    <div className="space-y-2">
                      <Label>Certificate Upload</Label>
                      <Button variant="outline" className="w-full" type="button">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 3: Facility Inspection
              </h3>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  Confirm your facility meets the study requirements for drug storage, emergency equipment, and record-keeping.
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                {[
                  { key: 'facilityInspectionCompleted', label: 'Facility inspection completed and meets study requirements' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={form[item.key as keyof typeof form] as boolean}
                      onCheckedChange={(v) => updateForm(item.key, !!v)}
                    />
                    <Label className="font-normal">{item.label}</Label>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Drug Storage Area', desc: 'Refrigerated, secure, locked' },
                    { label: 'Emergency Equipment', desc: 'Crash kit, oxygen, defibrillator' },
                    { label: 'Records Area', desc: 'Secure filing, fire-safe' },
                  ].map((item) => (
                    <div key={item.label} className="border rounded-lg p-3 text-center space-y-2">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                      <Button variant="outline" size="sm" className="w-full" type="button">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Photo
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Step 4: Investigator Agreement
              </h3>
              <div className="bg-slate-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{AGREEMENT_TEXT}</p>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={form.agreementAcknowledged}
                  onCheckedChange={(v) => updateForm('agreementAcknowledged', !!v)}
                />
                <Label className="font-normal text-sm">
                  I have read, understood, and agree to the Investigator Agreement above. 
                  I understand this constitutes a legally binding commitment.
                </Label>
              </div>
              {form.agreementAcknowledged && (
                <div className="flex items-center gap-2 pl-6">
                  <Checkbox
                    checked={form.investigatorAgreementSigned}
                    onCheckedChange={(v) => updateForm('investigatorAgreementSigned', !!v)}
                  />
                  <Label className="font-normal text-sm font-semibold text-slate-900">
                    I digitally sign this agreement ({vetEmail})
                  </Label>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Step 5: Study Protocol Acknowledgment
              </h3>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  Protocol Version 1.0 — Effective Date: {new Date().toLocaleDateString()}
                </AlertDescription>
              </Alert>
              <div className="bg-slate-50 border rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  By signing below, you acknowledge that you have received, read, and understood 
                  the current version of the PTP-102 Laminitis Pilot Study Protocol. You agree to 
                  conduct all study activities in strict accordance with this protocol and applicable 
                  regulations (21 CFR Part 511, VICH GL9).
                </p>
                <p className="text-sm text-slate-700 mt-2">
                  If the protocol is amended, you will be notified and required to re-sign before 
                  continuing study activities.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={form.protocolAcknowledged}
                  onCheckedChange={(v) => updateForm('protocolAcknowledged', !!v)}
                />
                <Label className="font-normal text-sm">
                  I have read and understand the study protocol.
                </Label>
              </div>
              {form.protocolAcknowledged && (
                <div className="flex items-center gap-2 pl-6">
                  <Checkbox
                    checked={form.protocolSigned}
                    onCheckedChange={(v) => updateForm('protocolSigned', !!v)}
                  />
                  <Label className="font-normal text-sm font-semibold text-slate-900">
                    I digitally sign the protocol ({vetEmail})
                  </Label>
                </div>
              )}
            </div>
          )}

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              type="button"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {step < 5 ? (
                <Button onClick={() => setStep((s) => s + 1)} type="button">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving} type="button">
                  {isSaving ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
