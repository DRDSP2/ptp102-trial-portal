import { useState, useEffect } from 'react';
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
  BookOpen,
  XCircle,
  Award,
  CheckCircle,
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

  // GCP Training Module State
  const [gcpMode, setGcpMode] = useState<'training' | 'upload' | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [externalFileName, setExternalFileName] = useState('');

  const totalSlides = 8;
  const PASSING_SCORE = 80;

  const quizData = [
    {
      q: 'What is the primary purpose of Good Clinical Practice (GCP)?',
      options: [
        'To reduce the cost of clinical trials',
        'To ensure trial data are credible and subject rights are protected',
        'To speed up regulatory approval timelines',
        'To eliminate the need for monitoring visits',
      ],
      correct: 1,
    },
    {
      q: 'Under VICH GL9, who is personally accountable for all trial-related veterinary decisions?',
      options: [
        'The sponsor',
        'The regulatory authority',
        'The investigator (veterinarian)',
        'The study monitor',
      ],
      correct: 2,
    },
    {
      q: 'How soon must a Serious Adverse Event (SAE) be reported to the sponsor?',
      options: [
        'Within 7 days',
        'Within 72 hours',
        'Within 24 hours of awareness',
        'At the next scheduled monitoring visit',
      ],
      correct: 2,
    },
    {
      q: 'What must be documented when a source document entry is corrected?',
      options: [
        'Nothing — corrections are not allowed',
        'A single line through the error, the correction, reason for change, initials, and date',
        'White-out or correction fluid to maintain a clean record',
        'Only the corrected value with the investigator\'s signature',
      ],
      correct: 1,
    },
    {
      q: 'For how long must trial records be retained after study completion?',
      options: [
        '1 year',
        '2 years after NADA approval or 5 years after study completion, whichever is longer',
        '10 years from the first subject enrolled',
        'Until the sponsor requests their return',
      ],
      correct: 1,
    },
    {
      q: 'An animal owner has the right to:',
      options: [
        'Request access to other subjects\' data',
        'Modify their animal\'s treatment plan independently',
        'Withdraw their animal from the trial at any time without penalty',
        'Receive financial compensation for any adverse event',
      ],
      correct: 2,
    },
    {
      q: 'Which of the following is NOT acceptable for investigational product storage?',
      options: [
        'Storing at the temperature specified in the protocol',
        'Maintaining temperature logs',
        'Storing PTP-102 alongside commercially available drugs in the same refrigerator',
        'Following the sponsor\'s specific storage instructions',
      ],
      correct: 2,
    },
    {
      q: 'What is required before enrolling an animal in the PTP-102 trial?',
      options: [
        'A signed and dated informed consent form from the animal owner',
        'A payment processing form from the owner',
        'A guarantee of therapeutic success from the investigator',
        'A separate insurance policy for the animal',
      ],
      correct: 0,
    },
    {
      q: 'A protocol deviation must be:',
      options: [
        'Ignored if it doesn\'t affect the primary endpoint',
        'Documented and reported per the protocol requirements',
        'Corrected retroactively without notation',
        'Reported only if discovered by the monitor',
      ],
      correct: 1,
    },
    {
      q: 'Drug accountability records for PTP-102 must include all EXCEPT:',
      options: [
        'Batch/lot number and quantity received',
        'Subject ID, dose, date, and person dispensing',
        'The owner\'s credit card information for billing',
        'Remaining balance, returns, and any discrepancies',
      ],
      correct: 2,
    },
  ];

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const startTraining = () => {
    setGcpMode('training');
    setCurrentSlide(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setQuizScore(0);
    setSecondsRemaining(15 * 60);
    setTimerActive(false);
    setUploadedFileName('');
  };

  const startUpload = () => {
    setGcpMode('upload');
    setUploadedFileName('');
    setExternalFileName('');
  };

  const changeSlide = (dir: number) => {
    setCurrentSlide((prev) => {
      const next = prev + dir;
      return Math.max(0, Math.min(totalSlides - 1, next));
    });
  };

  const startQuiz = () => {
    setTimerActive(true);
  };

  const selectAnswer = (qIdx: number, aIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: aIdx }));
  };

  const submitQuiz = () => {
    setTimerActive(false);
    let correct = 0;
    quizData.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / quizData.length) * 100);
    const passed = score >= PASSING_SCORE;
    setQuizScore(score);
    setQuizSubmitted(true);
    setQuizPassed(passed);
    if (passed) {
      updateForm('gcpQuizScore', String(score));
      updateForm('gcpTrainingCompleted', true);
    }
  };

  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
    setQuizScore(0);
    setSecondsRemaining(15 * 60);
    setTimerActive(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      updateForm('gcpTrainingCompleted', true);
    }
  };

  const handleExternalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExternalFileName(file.name);
      updateForm('gcpTrainingCompleted', true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const slides = [
    {
      title: '1. Introduction to GCP',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p><strong>Good Clinical Practice (GCP)</strong> is an international ethical and scientific quality standard for designing, conducting, recording, and reporting trials that involve the participation of animal subjects.</p>
          <p>GCP ensures that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The rights, safety, and well-being of trial subjects are protected</li>
            <li>Clinical trial data are credible and accurate</li>
            <li>The study is conducted in accordance with the approved protocol</li>
          </ul>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> VICH GL9 provides a harmonized approach to GCP for veterinary clinical trials, accepted across the US, EU, Japan, and other regions.
          </div>
        </div>
      ),
    },
    {
      title: '2. Roles & Responsibilities',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>The <strong>Sponsor</strong> is responsible for initiating, managing, and financing the clinical trial. They must ensure proper monitoring and quality assurance.</p>
          <p>The <strong>Investigator</strong> (you) is responsible for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Conducting the trial according to the signed protocol</li>
            <li>Obtaining informed consent from animal owners</li>
            <li>Maintaining accurate source documents and case report forms</li>
            <li>Reporting adverse events promptly to the sponsor</li>
            <li>Ensuring trial site staff are trained and qualified</li>
          </ul>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> The investigator is personally accountable for all trial-related medical (veterinary) decisions and documentation.
          </div>
        </div>
      ),
    },
    {
      title: '3. Informed Consent from Animal Owners',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>Before enrolling any animal in the PTP-102 trial, you must obtain <strong>informed consent</strong> from the animal&apos;s owner or authorized agent.</p>
          <p>The consent process must include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A clear explanation of the investigational nature of PTP-102</li>
            <li>Potential risks and benefits of participation</li>
            <li>Alternative treatments available</li>
            <li>Right to withdraw the animal at any time without penalty</li>
            <li>Confidentiality protections for owner and animal data</li>
          </ul>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> Consent must be documented with a signed and dated consent form. A copy must be provided to the owner and retained in the study file.
          </div>
        </div>
      ),
    },
    {
      title: '4. Protocol Compliance',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>The <strong>clinical trial protocol</strong> is the core document that describes the objectives, design, methodology, and organization of the study.</p>
          <p>As an investigator, you must:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Follow the protocol precisely — do not deviate without documented approval</li>
            <li>Enroll only subjects that meet all inclusion and exclusion criteria</li>
            <li>Administer treatments at specified intervals and doses</li>
            <li>Collect data at all required timepoints</li>
          </ul>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> Any protocol deviation must be documented immediately. Significant deviations that affect subject safety or data integrity must be reported to the sponsor within 24 hours.
          </div>
        </div>
      ),
    },
    {
      title: '5. Data Integrity & Source Documents',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p><strong>Source documents</strong> are original records that contain observations, clinical findings, and data collected during the trial. These include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Veterinary medical records and examination notes</li>
            <li>Laboratory test results (serum chemistry, CBC, etc.)</li>
            <li>Imaging reports (radiographs, MRI, etc.)</li>
            <li>Dispensing logs and drug accountability records</li>
            <li>Owner communication logs</li>
          </ul>
          <p>All entries in case report forms (CRFs) must be traceable to source documents. Never:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Backdate entries or use correction fluid</li>
            <li>Leave mandatory fields blank</li>
            <li>Alter data without documenting the reason and initialing the change</li>
          </ul>
        </div>
      ),
    },
    {
      title: '6. Adverse Event Reporting',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>An <strong>Adverse Event (AE)</strong> is any untoward medical occurrence in a clinical trial subject administered an investigational product, regardless of causal relationship.</p>
          <p>Reporting requirements:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Serious AEs (SAEs):</strong> Report to sponsor within <strong>24 hours</strong> of awareness. SAEs include death, life-threatening events, hospitalization, persistent disability, or congenital anomaly.</li>
            <li><strong>Non-serious AEs:</strong> Report per the protocol schedule (typically at each visit).</li>
            <li>Follow up on all AEs until resolution or stabilization.</li>
          </ul>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> For PTP-102, any signs of worsening laminitis, injection site reaction, or unexpected systemic effects must be reported immediately as an AE.
          </div>
        </div>
      ),
    },
    {
      title: '7. Investigational Product Handling',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>PTP-102 is an <strong>investigational new animal drug (INAD)</strong> and must be handled with strict controls:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Store at the temperature specified in the protocol and labeling</li>
            <li>Maintain accurate inventory logs: receipt, dispensing, return, and disposal</li>
            <li>Only dispense to enrolled trial subjects per the protocol</li>
            <li>Return all unused product and empty containers to the sponsor or dispose per instructions</li>
          </ul>
          <p><strong>Drug accountability</strong> records must include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Product batch/lot number, quantity received, and date</li>
            <li>Subject ID, dose administered, date, and person dispensing</li>
            <li>Remaining balance, returns, and reasons for any discrepancies</li>
          </ul>
        </div>
      ),
    },
    {
      title: '8. Monitoring, Audits & Record Retention',
      content: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>The sponsor will conduct <strong>monitoring visits</strong> to verify that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The trial is conducted per the protocol, GCP, and regulatory requirements</li>
            <li>Data recorded in CRFs matches source documents</li>
            <li>Investigational product is properly stored and accounted for</li>
            <li>All AEs are reported and documented</li>
          </ul>
          <p>Regulatory authorities (e.g., FDA CVM) may also conduct inspections at any time.</p>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-slate-800">
            <strong>Key Point:</strong> All trial records must be retained for at least <strong>2 years after NADA approval</strong> or <strong>5 years after study completion</strong>, whichever is longer. This includes all source documents, CRFs, consent forms, and correspondence.
          </div>
        </div>
      ),
    },
  ];

  const [form, setForm] = useState({
    licenseNumber: '',
    licenseState: '',
    yearsExperience: '',
    laminitisCaseVolume: '',
    priorTrialExperience: false,
    priorTrialsCount: '0',
    gcpTrainingCompleted: false,
    gcpQuizScore: '',
    facilityInspectionCompleted: false,
    investigatorAgreementSigned: false,
    protocolSigned: false,
    agreementAcknowledged: false,
    protocolAcknowledged: false,
  });

  useEffect(() => {
    if (!qualification) return;
    setForm({
      licenseNumber: qualification.license_number || '',
      licenseState: qualification.license_state || '',
      yearsExperience: qualification.years_experience != null ? String(qualification.years_experience) : '',
      laminitisCaseVolume: qualification.laminitis_case_volume_per_year != null ? String(qualification.laminitis_case_volume_per_year) : '',
      priorTrialExperience: qualification.prior_clinical_trial_experience || false,
      priorTrialsCount: qualification.prior_trials_count != null ? String(qualification.prior_trials_count) : '0',
      gcpTrainingCompleted: qualification.gcp_training_completed || false,
      gcpQuizScore: qualification.gcp_quiz_score != null ? String(qualification.gcp_quiz_score) : '',
      facilityInspectionCompleted: qualification.facility_inspection_completed || false,
      investigatorAgreementSigned: qualification.investigator_agreement_signed || false,
      protocolSigned: qualification.protocol_signed || false,
      agreementAcknowledged: qualification.investigator_agreement_signed || false,
      protocolAcknowledged: qualification.protocol_signed || false,
    });
  }, [qualification]);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!vetEmail) return;

    await saveQual({
      vetEmail,
      veterinarianId: qualification?.veterinarian_id ?? 0,
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

              {!gcpMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-300" onClick={startTraining}>
                    <CardContent className="p-6 text-center space-y-3">
                      <BookOpen className="h-10 w-10 mx-auto text-blue-600" />
                      <h4 className="font-semibold text-lg">Complete Training Module</h4>
                      <p className="text-sm text-slate-500">
                        8 interactive GCP slides + 10-question quiz (15 min timer). Pass with 80% to earn a certificate.
                      </p>
                      <Button type="button">Start Training</Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-300" onClick={startUpload}>
                    <CardContent className="p-6 text-center space-y-3">
                      <Upload className="h-10 w-10 mx-auto text-emerald-600" />
                      <h4 className="font-semibold text-lg">Upload Existing Certificate</h4>
                      <p className="text-sm text-slate-500">
                        Already have a GCP certificate from another provider? Upload it here for verification.
                      </p>
                      <Button variant="outline" type="button">Upload Certificate</Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {gcpMode === 'training' && (
                <Card className="border">
                  <CardContent className="p-6 space-y-6">
                    {/* Slide Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Progress</span>
                        <span>{currentSlide + 1} / {totalSlides}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Slide Content */}
                    {currentSlide < totalSlides && !quizSubmitted && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-slate-800">{slides[currentSlide].title}</h4>
                        <div>{slides[currentSlide].content}</div>
                      </div>
                    )}

                    {/* Quiz */}
                    {currentSlide === totalSlides - 1 && !quizSubmitted && (
                      <div className="space-y-4 pt-4 border-t">
                        {!timerActive && Object.keys(quizAnswers).length === 0 && (
                          <div className="text-center space-y-3">
                            <h4 className="font-semibold text-lg">GCP Knowledge Assessment</h4>
                            <p className="text-sm text-slate-500">10 questions · 15 minutes · 80% required to pass</p>
                            <Button type="button" onClick={startQuiz}>Start Quiz</Button>
                          </div>
                        )}
                        {timerActive && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant={secondsRemaining < 120 ? 'destructive' : 'secondary'}>
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(secondsRemaining)}
                              </Badge>
                              <span className="text-xs text-slate-500">{Object.keys(quizAnswers).length} / {quizData.length} answered</span>
                            </div>
                            {quizData.map((q, qi) => (
                              <div key={qi} className="space-y-2">
                                <p className="text-sm font-medium text-slate-800">{qi + 1}. {q.q}</p>
                                <div className="space-y-1">
                                  {q.options.map((opt, ai) => (
                                    <label key={ai} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm border transition-colors ${quizAnswers[qi] === ai ? 'bg-blue-50 border-blue-300' : 'border-transparent hover:bg-slate-50'}`}>
                                      <input type="radio" name={`q-${qi}`} className="accent-blue-600" checked={quizAnswers[qi] === ai} onChange={() => selectAnswer(qi, ai)} />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <Button type="button" className="w-full" onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < quizData.length}>
                              Submit Quiz
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quiz Results */}
                    {quizSubmitted && (
                      <div className="text-center space-y-4 pt-4 border-t">
                        {quizPassed ? (
                          <>
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle className="h-8 w-8" />
                            </div>
                            <h4 className="text-xl font-bold text-emerald-700">Congratulations!</h4>
                            <p className="text-slate-600">You passed the GCP Knowledge Assessment with a score of <strong>{quizScore}%</strong>.</p>
                            <Card className="bg-slate-50 border border-slate-200 max-w-md mx-auto">
                              <CardContent className="p-6 text-center space-y-2">
                                <Award className="h-10 w-10 mx-auto text-amber-500" />
                                <h5 className="font-bold text-lg">Certificate of Completion</h5>
                                <p className="text-sm text-slate-600">Good Clinical Practice (VICH GL9)</p>
                                <p className="text-xs text-slate-500">PTP-102 Veterinary Laminitis Trial</p>
                                <p className="text-xs text-slate-400">Score: {quizScore}%</p>
                              </CardContent>
                            </Card>
                            <div className="space-y-2">
                              <p className="text-sm text-slate-500">Optionally upload a formal certificate file:</p>
                              <div className="flex items-center gap-2 justify-center">
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="training-cert-upload" onChange={handleFileUpload} />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('training-cert-upload')?.click()}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploadedFileName || 'Upload Certificate'}
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                              <XCircle className="h-8 w-8" />
                            </div>
                            <h4 className="text-xl font-bold text-red-700">Not Quite</h4>
                            <p className="text-slate-600">You scored <strong>{quizScore}%</strong>. You need 80% to pass.</p>
                            <Button type="button" variant="outline" onClick={retakeQuiz}>Retake Quiz</Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Navigation */}
                    {!quizSubmitted && (
                      <div className="flex justify-between pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => changeSlide(-1)} disabled={currentSlide === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button type="button" onClick={() => changeSlide(1)} disabled={currentSlide === totalSlides - 1 || (currentSlide === totalSlides - 1 && !timerActive)}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}

                    {/* Back to options */}
                    <div className="text-center pt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setGcpMode(null)}>
                        Back to Options
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gcpMode === 'upload' && (
                <Card className="border">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-emerald-600" />
                      <h4 className="font-semibold text-lg">Upload External GCP Certificate</h4>
                      <p className="text-sm text-slate-500">Accepted formats: PDF, PNG, JPG. Max 10MB.</p>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="external-cert-upload" onChange={handleExternalUpload} />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('external-cert-upload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        {externalFileName || 'Choose File'}
                      </Button>
                    </div>
                    {externalFileName && (
                      <div className="text-center space-y-2">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {externalFileName} uploaded
                        </Badge>
                        <p className="text-xs text-slate-500">GCP training marked as completed.</p>
                      </div>
                    )}
                    <div className="text-center pt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setGcpMode(null)}>
                        Back to Options
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
