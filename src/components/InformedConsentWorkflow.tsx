import { useState, useEffect } from 'react';
import { useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import createInformedConsentAction from '@/actions/createInformedConsent';
import signInformedConsentAction from '@/actions/signInformedConsent';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Download,
  ShieldAlert,
} from 'lucide-react';

const ICF_SECTIONS = [
  {
    title: 'Nature of the Study',
    text: 'PTP-102 is an investigational new animal drug being studied for the treatment of acute laminitis in horses. It has NOT been approved by the FDA as safe or effective.',
  },
  {
    title: 'Voluntary Participation',
    text: "Your horse's participation is entirely voluntary. You may withdraw your horse at any time without penalty or loss of any benefits to which you are otherwise entitled.",
  },
  {
    title: 'Procedures',
    text: 'Your horse will receive two intravenous infusions of PTP-102 (or placebo) over a 72-hour period. Blood samples, hoof radiographs, and clinical assessments will be performed at defined intervals.',
  },
  {
    title: 'Risks',
    text: 'Known risks include allergic reaction, injection site reaction, and gastrointestinal upset. Unknown long-term effects may exist. Your horse will be closely monitored throughout the study.',
  },
  {
    title: 'No Guarantee of Benefit',
    text: 'There is no guarantee that your horse will benefit from this treatment. Your horse may be assigned to a placebo/control group.',
  },
  {
    title: 'Costs & Compensation',
    text: 'The study drug and protocol-required procedures are provided at no cost. Standard veterinary care costs remain the responsibility of the owner. Compensation for study-related injury will be provided per the investigator agreement.',
  },
  {
    title: 'Confidentiality',
    text: "Your horse's records will be kept confidential but may be inspected by FDA CVM and study monitors.",
  },
  {
    title: 'Contact Information',
    text: 'Principal Investigator: [Name], DVM. 24-Hour Emergency: [Phone]. Sponsor: Byrock Technologies Ltd. [Email]',
  },
  {
    title: 'Withdrawal',
    text: 'You may withdraw your horse at any time. If you withdraw, standard veterinary care will be provided at your expense.',
  },
];

export function InformedConsentWorkflow({
  patientId,
  horseName,
  ownerName,
  onComplete,
}: {
  patientId: number;
  horseName: string;
  ownerName: string;
  onComplete: () => void;
}) {
  const [createConsent, creating] = useMutateAction(createInformedConsentAction);
  const [signConsent, signing] = useMutateAction(signInformedConsentAction);

  const [step, setStep] = useState<'init' | 'viewing' | 'cooling' | 'signing' | 'complete'>('init');
  const [consentId, setConsentId] = useState<number | null>(null);
  const [canSignAfter, setCanSignAfter] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [sectionAcks, setSectionAcks] = useState<Record<number, boolean>>({});
  const [ownerSignature, setOwnerSignature] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessSignature, setWitnessSignature] = useState('');
  const [investigatorSignature, setInvestigatorSignature] = useState('');

  useEffect(() => {
    if (step === 'cooling' && canSignAfter) {
      const interval = setInterval(() => {
        const diff = canSignAfter.getTime() - Date.now();
        if (diff <= 0) {
          setStep('signing');
          setCountdown('');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, canSignAfter]);

  const handleBeginICF = async () => {
    const result = await createConsent({
      patientId,
      ownerName,
      ownerAddress: '',
      ownerPhone: '',
      ownerEmail: '',
      ownerRelationship: 'owner',
      horseName,
      horseBreed: '',
      horseAge: 0,
      horseWeight: 0,
      horseMicrochip: '',
      sectionAcknowledgments: {},
    });
    if (result && result.length > 0) {
      setConsentId(result[0].id);
      const canSign = new Date(Date.now() + 12 * 60 * 60 * 1000);
      setCanSignAfter(canSign);
      setStep('cooling');
    }
  };

  const handleSign = async () => {
    if (!consentId) return;
    await signConsent({
      consentId,
      ownerSignature,
      witnessName,
      witnessSignature,
      investigatorSignature,
      icfPdfUrl: `/icf/signed-${patientId}.pdf`,
    });
    setStep('complete');
    onComplete();
  };

  const allSectionsAcked = ICF_SECTIONS.every((_, i) => sectionAcks[i]);

  if (step === 'init') {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            Informed Consent Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Owner informed consent is required before enrolling {horseName}. 
              The owner must view the full consent document and wait 12 hours before signing.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setStep('viewing')} className="w-full" type="button">
            Begin Informed Consent Process
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'viewing') {
    return (
      <Card>
        <CardHeader className="bg-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PTP-102 INVESTIGATIONAL DRUG INFORMED CONSENT
            </CardTitle>
            <Badge variant="outline">Patient: {horseName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {ICF_SECTIONS.map((section, i) => (
              <div key={i} className="p-3 border rounded-lg bg-white">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={sectionAcks[i] || false}
                    onCheckedChange={(v) => setSectionAcks((prev) => ({ ...prev, [i]: !!v }))}
                  />
                  <div>
                    <p className="text-sm font-semibold">{section.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{section.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Alert className={allSectionsAcked ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
            <AlertDescription className="text-sm">
              {allSectionsAcked
                ? 'All sections acknowledged. You may proceed to the cooling-off period.'
                : `Please acknowledge all ${ICF_SECTIONS.length} sections before proceeding.`}
            </AlertDescription>
          </Alert>
          <Button onClick={handleBeginICF} disabled={!allSectionsAcked || creating} className="w-full" type="button">
            {creating ? 'Processing...' : 'Acknowledge All & Start 12-Hour Cooling Period'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'cooling') {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-8 text-center space-y-4">
          <Clock className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
          <h3 className="text-xl font-semibold">Cooling-Off Period Active</h3>
          <p className="text-slate-600">
            Per regulatory requirements, the owner must wait 12 hours after viewing the consent document before signing.
          </p>
          <div className="text-4xl font-mono font-bold text-blue-900">{countdown}</div>
          <p className="text-sm text-slate-500">Remaining until consent can be signed</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'signing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Digital Signatures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input value={ownerName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Owner Digital Signature (type full name) *</Label>
              <Input value={ownerSignature} onChange={(e) => setOwnerSignature(e.target.value)} placeholder="Type full legal name" />
            </div>
            <div className="space-y-2">
              <Label>Witness Name *</Label>
              <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Witness Digital Signature *</Label>
              <Input value={witnessSignature} onChange={(e) => setWitnessSignature(e.target.value)} placeholder="Type full legal name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Investigator Digital Signature *</Label>
              <Input value={investigatorSignature} onChange={(e) => setInvestigatorSignature(e.target.value)} placeholder="Type full legal name and credentials" />
            </div>
          </div>
          <Button
            onClick={handleSign}
            disabled={signing || !ownerSignature || !witnessName || !witnessSignature || !investigatorSignature}
            className="w-full"
            type="button"
          >
            {signing ? 'Recording Signatures...' : 'Sign Informed Consent'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
        <h3 className="text-lg font-semibold text-green-900">Informed Consent Complete</h3>
        <p className="text-sm text-green-700">Owner consent has been recorded for {horseName}.</p>
        <Button variant="outline" size="sm" type="button">
          <Download className="h-4 w-4 mr-2" />
          Download Signed ICF PDF
        </Button>
      </CardContent>
    </Card>
  );
}
