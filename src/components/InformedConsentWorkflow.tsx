import { useState, useEffect, useRef, useCallback } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import createInformedConsentAction from '@/actions/createInformedConsent';
import signInformedConsentAction from '@/actions/signInformedConsent';
import loadInformedConsentByPatientAction from '@/actions/loadInformedConsentByPatient';
import uploadConsentDocumentAction from '@/actions/uploadConsentDocument';
import verifyInformedConsentAction from '@/actions/verifyInformedConsent';
import recordConsentSentAction from '@/actions/recordConsentSent';
import createAuditLogAction from '@/actions/createAuditLog';
import jsPDF from 'jspdf';
import { STUDY_ID } from '@/lib/auditTypes';
import type { Patient } from '@/types/patient';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Download,
  ShieldAlert,
  Upload,
  X,
  Send,
  Lock,
  Eye,
} from 'lucide-react';

type UploadcareFileInfo = {
  uuid: string;
  name: string;
  size: number;
  cdnUrl: string;
  isImage: boolean;
  mimeType: string;
};

type ConsentDocument = {
  id: number;
  document_type: 'generated_pdf' | 'signed_pdf' | 'scanned_signed';
  file_url: string;
  file_name: string;
  version: number;
  uploaded_by: string | null;
  created_at: string;
};

type ConsentRow = {
  id: number;
  patient_id: number;
  status: 'pending' | 'signed' | 'approved' | 'rejected';
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_address: string | null;
  owner_relationship: string | null;
  horse_name: string;
  horse_breed: string | null;
  horse_age: number | null;
  horse_weight: number | null;
  horse_microchip: string | null;
  signed_at: string | null;
  can_sign_after: string | null;
  section_acknowledgments?: Record<string, boolean>;
  owner_signature: string | null;
  witness_name: string | null;
  witness_signature: string | null;
  investigator_signature: string | null;
  signature_method: 'digital' | 'scanned' | null;
  admin_reviewed_by: string | null;
  admin_reviewed_at: string | null;
  sent_at: string | null;
  sent_to: string | null;
  documents?: ConsentDocument[];
};

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
    text: 'Your horse will receive two intravenous infusions of PTP-102 over a 72-hour period. Blood samples, hoof radiographs, and clinical assessments will be performed at defined intervals.',
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
    text: '',
  },
  {
    title: 'Withdrawal',
    text: 'You may withdraw your horse at any time. If you withdraw, standard veterinary care will be provided at your expense.',
  },
];

const DOSE_SCHEDULE_TEXT = 'Dose 1: Hour 0 (500 mL IV infusion over 15-30 minutes). Dose 2: Hour 12 (same volume). Monitoring at 24h, 48h, and 72h. Final follow-up Day 10-14.';
const COOLING_OFF_HOURS = 12;

function logPermissionDecision(
  role: string | null,
  permission: string,
  resourceId: number,
  decision: boolean
) {
  console.info('[InformedConsentWorkflow] permission decision', {
    role: role ?? 'none',
    permission,
    resourceId,
    decision,
    timestamp: new Date().toISOString(),
  });
}

export function InformedConsentWorkflow({
  patientId,
  patient,
  vetEmail,
  onComplete,
}: {
  patientId: number;
  patient: Patient;
  vetEmail?: string;
  onComplete: () => void;
}) {
  const auth = useAuth();
  const isAdmin = auth.role === 'admin';
  const isVet = auth.role === 'vet';
  const userEmail = auth.email ?? 'unknown';

  const canGenerate = isVet || isAdmin;
  const canSign = isVet || isAdmin;
  const canVerify = isVet || isAdmin;
  const canView = isVet || isAdmin;

  logPermissionDecision(auth.role, 'view', patientId, canView);
  logPermissionDecision(auth.role, 'create', patientId, canGenerate);
  logPermissionDecision(auth.role, 'generate', patientId, canGenerate);
  logPermissionDecision(auth.role, 'sign', patientId, canSign);
  logPermissionDecision(auth.role, 'verify', patientId, canVerify);

  const [createConsent, creating] = useMutateAction(createInformedConsentAction);
  const [signConsent, signing] = useMutateAction(signInformedConsentAction);
  const [uploadConsentDocument, uploadingDoc] = useMutateAction(uploadConsentDocumentAction);
  const [verifyConsent, verifying] = useMutateAction(verifyInformedConsentAction);
  const [recordSent, sending] = useMutateAction(recordConsentSentAction);
  const [createAuditLog] = useMutateAction(createAuditLogAction);
  const [existingConsents] = useLoadAction(loadInformedConsentByPatientAction, [], { patientId });

  const [step, setStep] = useState<'init' | 'viewing' | 'cooling' | 'signing' | 'verify' | 'complete'>('init');
  const [consent, setConsent] = useState<ConsentRow | null>(null);
  const [canSignAfter, setCanSignAfter] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [sectionAcks, setSectionAcks] = useState<Record<number, boolean>>({});

  const [ownerPhone, setOwnerPhone] = useState(patient.owner_phone || patient.owner_contact || '');
  const [ownerEmail, setOwnerEmail] = useState(patient.owner_email || '');
  const [ownerAddress, setOwnerAddress] = useState(patient.owner_address || '');
  const [ownerRelationship, setOwnerRelationship] = useState(patient.owner_relationship || 'owner');

  const [piName, setPiName] = useState('');
  const [piPhone, setPiPhone] = useState('');

  const [ownerSignatureDataUrl, setOwnerSignatureDataUrl] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [witnessSignature, setWitnessSignature] = useState('');
  const [investigatorSignature, setInvestigatorSignature] = useState('');

  const [signatureMethod, setSignatureMethod] = useState<'digital' | 'scanned'>('digital');
  const [scannedDoc, setScannedDoc] = useState<UploadcareFileInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent'>('idle');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Auto-populate vet info.
  useEffect(() => {
    if (vetEmail) {
      const vets = JSON.parse(localStorage.getItem('ptp102_mock_vets') || '[]');
      const vet = vets.find((v: any) => v.email === vetEmail);
      if (vet) {
        setPiName(vet.full_name || '');
        setPiPhone(vet.phone || '');
      }
      setInvestigatorSignature(vet?.full_name || '');
    }
  }, [vetEmail]);

  // Load existing consent.
  useEffect(() => {
    const ec = (existingConsents?.[0] as ConsentRow | undefined);
    if (ec) {
      setConsent(ec);
      setOwnerPhone(ec.owner_phone || patient.owner_phone || patient.owner_contact || '');
      setOwnerEmail(ec.owner_email || patient.owner_email || '');
      setOwnerAddress(ec.owner_address || patient.owner_address || '');
      setOwnerRelationship(ec.owner_relationship || patient.owner_relationship || 'owner');
      setSectionAcks(ec.section_acknowledgments || {});
      if (ec.status === 'approved') {
        setStep('complete');
      } else if (ec.status === 'signed') {
        setStep('verify');
        if (ec.can_sign_after) setCanSignAfter(new Date(ec.can_sign_after));
      } else if (ec.can_sign_after) {
        const cs = new Date(ec.can_sign_after);
        setCanSignAfter(cs);
        if (cs.getTime() <= Date.now()) {
          setStep('signing');
        } else {
          setStep('cooling');
        }
      }
    }
  }, [existingConsents, patient]);

  // Cooling-off countdown.
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

  // Canvas signature pad handlers.
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setOwnerSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setOwnerSignatureDataUrl(null);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (step === 'signing' && signatureMethod === 'digital') {
      setTimeout(initCanvas, 0);
    }
  }, [step, signatureMethod]);

  const handleBeginICF = async () => {
    if (!canGenerate) return;
    const result = await createConsent({
      patientId,
      ownerName: patient.owner_name,
      ownerAddress: ownerAddress || null,
      ownerPhone: ownerPhone || null,
      ownerEmail: ownerEmail || null,
      ownerRelationship: ownerRelationship || null,
      horseName: patient.horse_name,
      horseBreed: patient.breed || null,
      horseAge: patient.age ?? null,
      horseWeight: patient.weight ?? null,
      horseMicrochip: patient.horse_microchip || null,
      sectionAcknowledgments: sectionAcks,
      vetEmail: vetEmail || null,
      vetPhone: piPhone || null,
    });
    if (result && result.length > 0) {
      const newConsent = result[0] as ConsentRow;
      setConsent(newConsent);
      const canSign = new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);
      setCanSignAfter(canSign);
      setStep('cooling');
    }
  };

  const buildConsentPdf = (signed = false) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const addWrapped = (text: string, x: number, yPos: number, maxWidth: number, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPos);
      return yPos + lines.length * fontSize * 0.45;
    };

    // Header
    doc.setFillColor(107, 127, 58);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Byrock Technologies Ltd.', margin, 13);
    doc.setFontSize(10);
    doc.text('PTP-102 Laminitis Trial — Informed Consent Form', margin, 20);
    doc.text('FDA CVM INAD Review Pending', margin, 26);

    y = 38;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMED CONSENT FOR PARTICIPATION', margin, y);
    doc.text('INVESTIGATIONAL NEW ANIMAL DRUG STUDY', margin, y + 6);
    doc.setFont('helvetica', 'normal');

    y = 52;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Protocol: ${STUDY_ID}`, margin, y);
    doc.text(`Case ID: ${patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`}`, margin, y + 4);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 8);

    y = 66;
    doc.setTextColor(40, 40, 40);

    // Patient & Owner Info
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PATIENT & OWNER INFORMATION', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    const infoRows = [
      ['Horse Name:', patient.horse_name],
      ['Breed:', patient.breed || 'N/A'],
      ['Age:', patient.age ? `${patient.age} years` : 'N/A'],
      ['Weight:', patient.weight ? `${patient.weight} kg` : 'N/A'],
      ['Microchip:', patient.horse_microchip || 'N/A'],
      ['Owner Name:', patient.owner_name],
      ['Owner Phone:', ownerPhone || 'N/A'],
      ['Owner Email:', ownerEmail || 'N/A'],
      ['Owner Address:', ownerAddress || 'N/A'],
      ['Relationship:', ownerRelationship || 'owner'],
    ];
    infoRows.forEach(([label, value]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 45, y);
      y += 5;
    });

    // Contact Info
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('2. CONTACT INFORMATION', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    const contactRows = [
      ['Principal Investigator:', piName || 'N/A'],
      ['PI Phone:', piPhone || 'N/A'],
      ['Sponsor:', 'Byrock Technologies Ltd'],
      ['Sponsor Email:', 'drdsp@pm.me'],
    ];
    contactRows.forEach(([label, value]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 55, y);
      y += 5;
    });

    // Dose schedule
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DOSE SCHEDULE & MONITORING', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    y = addWrapped(DOSE_SCHEDULE_TEXT, margin, y, pageWidth - margin * 2, 9);

    // Cooling-off
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('4. COOLING-OFF PERIOD', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    y = addWrapped(
      `The owner has the right to consider this consent for at least ${COOLING_OFF_HOURS} hours before signing. Consent may not be signed before ${consent?.can_sign_after ? new Date(consent.can_sign_after).toLocaleString() : '[cooling-off not started]'}.`,
      margin,
      y,
      pageWidth - margin * 2,
      9
    );

    // Acknowledgments
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('5. SECTION ACKNOWLEDGMENTS', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    ICF_SECTIONS.forEach((section, i) => {
      const acked = sectionAcks[i] ? 'YES' : 'NO';
      const displayText = i === 7
        ? `Principal Investigator: ${piName || '[Name]'}, DVM. Phone: ${piPhone || '[Phone]'}. Sponsor: Byrock Technologies Ltd. Email: drdsp@pm.me`
        : section.text;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${section.title} [Acknowledged: ${acked}]`, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      y = addWrapped(displayText, margin + 4, y, pageWidth - margin * 2 - 4, 8);
      y += 2;
    });

    // Signatures
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('6. SIGNATURES', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;

    if (signed && ownerSignatureDataUrl) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Owner Signature:', margin, y);
      y += 4;
      try {
        doc.addImage(ownerSignatureDataUrl, 'PNG', margin, y, 60, 20);
      } catch {
        doc.text('[Signature image unavailable]', margin, y);
      }
      y += 24;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Owner Signature:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text('________________________________________', margin + 40, y);
      y += 6;
    }

    const sigRows = [
      ['Witness Name:', witnessName || 'N/A'],
      ['Witness Signature:', witnessSignature || 'N/A'],
      ['Investigator Signature:', investigatorSignature || 'N/A'],
      ['Signature Method:', signed ? 'Digital (in-portal e-signature)' : 'Pending'],
      ['Signed At:', signed ? new Date().toLocaleString() : 'Pending'],
    ];
    sigRows.forEach(([label, value]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 50, y);
      y += 5;
    });

    // Acknowledgment statement
    y += 6;
    const ackStatement = 'I, the undersigned owner or authorized agent, acknowledge that I have read and understood the informed consent document for the PTP-102 Laminitis Clinical Trial. I understand that PTP-102 is an investigational new animal drug (INAD) under FDA CVM review and has not received marketing approval. I voluntarily consent to my horse\'s participation in this study and understand the risks, benefits, and alternatives described herein. I understand that I may withdraw my horse from the study at any time without penalty.';
    y = addWrapped(ackStatement, margin, y, pageWidth - margin * 2, 9);

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i} of ${pageCount} | Patient: ${patient.horse_name} | ${STUDY_ID} is an investigational new animal drug (INAD) under FDA CVM review.`,
        margin,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        'Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only',
        margin,
        doc.internal.pageSize.height - 6
      );
    }

    return doc;
  };

  const handleDownloadUnsignedPdf = async () => {
    const doc = buildConsentPdf(false);
    doc.save(`${STUDY_ID}_ICF_${patient.horse_name.replace(/\s+/g, '_')}_${patientId}.pdf`);
    if (consent) {
      await createAuditLog({
        action: 'GENERATE',
        entityType: 'informed_consent',
        entityId: consent.id,
        patientId,
        fieldName: 'icf_pdf_url',
        newValue: JSON.stringify({ protocol: STUDY_ID, caseId: patient.unique_id, generatedAt: new Date().toISOString() }),
        reasonForChange: 'Generated blank informed consent PDF for owner review/signature',
      });
    }
  };

  const handleSendToOwner = async () => {
    if (!consent || !canGenerate) return;
    await recordSent({ consentId: consent.id, sentTo: ownerEmail || patient.owner_email || 'owner' });
    setSendStatus('sent');
  };

  const handleUploadScanned = async () => {
    if (!consent || !scannedDoc) return;
    await uploadConsentDocument({
      consentId: consent.id,
      patientId,
      caseId: patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`,
      studyId: STUDY_ID,
      protocolVersion: '1.0',
      documentType: 'scanned_signed',
      fileUrl: scannedDoc.cdnUrl,
      fileName: scannedDoc.name,
      fileSize: scannedDoc.size,
      uploadedBy: userEmail,
      version: 0,
      previousVersionId: null,
    });
  };

  const handleSign = async () => {
    if (!consent || !canSign) return;

    let signedPdfUrl = '';

    if (signatureMethod === 'digital') {
      if (!ownerSignatureDataUrl || !witnessName || !witnessSignature || !investigatorSignature) {
        alert('Owner signature, witness name, witness signature, and investigator signature are required for digital signing.');
        return;
      }
      const doc = buildConsentPdf(true);
      const fileName = `${STUDY_ID}_signed_ICF_${patient.horse_name.replace(/\s+/g, '_')}_${patientId}.pdf`;
      // Store signed PDF as a base64 data URL so it persists in the mock version store.
      signedPdfUrl = doc.output('datauristring');
      await uploadConsentDocument({
        consentId: consent.id,
        patientId,
        caseId: patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`,
        studyId: STUDY_ID,
        protocolVersion: '1.0',
        documentType: 'signed_pdf',
        fileUrl: signedPdfUrl,
        fileName,
        fileSize: signedPdfUrl.length,
        uploadedBy: userEmail,
        version: 0,
        previousVersionId: null,
      });
    } else if (signatureMethod === 'scanned') {
      if (!scannedDoc) {
        alert('Please upload a scanned signed document.');
        return;
      }
      await handleUploadScanned();
    }

    await signConsent({
      consentId: consent.id,
      ownerSignature: '[e-signature captured in portal]',
      witnessName: witnessName || null,
      witnessSignature: witnessSignature || null,
      investigatorSignature: investigatorSignature || null,
      icfPdfUrl: signedPdfUrl || null,
      scannedDocumentUrl: scannedDoc?.cdnUrl || null,
      signatureMethod,
    });
    setStep('verify');
    onComplete();
  };

  const handleVerify = async () => {
    if (!consent || !canVerify) return;
    await verifyConsent({ consentId: consent.id, verifiedBy: userEmail });
    setStep('complete');
    onComplete();
  };

  const allSectionsAcked = ICF_SECTIONS.every((_, i) => sectionAcks[i]);

  if (!canView) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          <Lock className="h-8 w-8 mx-auto mb-2" />
          You do not have permission to view the informed consent workflow.
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete' && consent) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-green-900 mt-2">Informed Consent Verified & Complete</h3>
            <p className="text-sm text-green-700">Owner consent has been recorded and verified for {patient.horse_name}.</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-sm space-y-2">
            <p><strong>Signed by:</strong> {consent.owner_signature || 'Owner'}</p>
            <p><strong>Method:</strong> {consent.signature_method === 'digital' ? 'Digital e-signature' : 'Scanned signed document'}</p>
            <p><strong>Signed at:</strong> {consent.signed_at ? new Date(consent.signed_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Verified by:</strong> {consent.admin_reviewed_by || 'N/A'}</p>
            <p><strong>Verified at:</strong> {consent.admin_reviewed_at ? new Date(consent.admin_reviewed_at).toLocaleString() : 'N/A'}</p>
          </div>
          {consent.documents && consent.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-900">Document Versions</p>
              {consent.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                  <span className="text-xs">{doc.file_name} (v{doc.version})</span>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify' && consent) {
    const latestDoc = consent.documents?.[0];
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-blue-600" />
            Verify Informed Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              Review the signed consent details and document before finalizing. Only finalize if all signatures and documents are correct.
            </AlertDescription>
          </Alert>
          <div className="bg-slate-50 border rounded-lg p-4 text-sm space-y-2">
            <p><strong>Owner:</strong> {consent.owner_name}</p>
            <p><strong>Signature method:</strong> {consent.signature_method === 'digital' ? 'Digital e-signature' : 'Scanned signed document'}</p>
            <p><strong>Signed at:</strong> {consent.signed_at ? new Date(consent.signed_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Witness:</strong> {consent.witness_name || 'N/A'}</p>
            <p><strong>Investigator:</strong> {consent.investigator_signature || 'N/A'}</p>
            {latestDoc && (
              <p>
                <strong>Latest document:</strong>{' '}
                <a href={latestDoc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {latestDoc.file_name} (v{latestDoc.version})
                </a>
              </p>
            )}
          </div>
          <Button onClick={handleVerify} disabled={!canVerify || verifying} className="w-full" type="button">
            {verifying ? 'Finalizing...' : 'Verify & Finalize Consent'}
          </Button>
        </CardContent>
      </Card>
    );
  }

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
              Owner informed consent is required before enrolling {patient.horse_name}. The owner must view the full
              consent document and wait {COOLING_OFF_HOURS} hours before signing.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setStep('viewing')} className="w-full" type="button" disabled={!canGenerate}>
            Begin Informed Consent Process
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
            Per regulatory requirements, the owner must wait {COOLING_OFF_HOURS} hours after viewing the consent document before signing.
          </p>
          <div className="text-4xl font-mono font-bold text-blue-900">{countdown}</div>
          <p className="text-sm text-slate-500">Remaining until consent can be signed</p>
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
              {STUDY_ID} INVESTIGATIONAL DRUG INFORMED CONSENT
            </CardTitle>
            <Badge variant="outline">Case: {patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-blue-900">Owner Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Owner Phone *</Label>
                <Input type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Owner Email *</Label>
                <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@email.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Owner Address</Label>
                <Input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} placeholder="Street, City, State, ZIP" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Relationship to Horse</Label>
                <Input value={ownerRelationship} onChange={(e) => setOwnerRelationship(e.target.value)} placeholder="owner" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold">Case Information (Auto-populated)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Protocol:</span> {STUDY_ID}</div>
              <div><span className="font-medium">Case ID:</span> {patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`}</div>
              <div><span className="font-medium">Horse:</span> {patient.horse_name} ({patient.breed}, {patient.age}y, {patient.weight}kg)</div>
              <div><span className="font-medium">Owner:</span> {patient.owner_name}</div>
              <div><span className="font-medium">Principal Investigator:</span> {piName || 'N/A'}</div>
              <div><span className="font-medium">PI Phone:</span> {piPhone || 'N/A'}</div>
            </div>
          </div>

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
                    <p className="text-sm text-slate-600 mt-1">
                      {i === 7
                        ? `Principal Investigator: ${piName || '[Name]'}, DVM. Phone: ${piPhone || '[Phone]'}. Sponsor: Byrock Technologies Ltd. Email: drdsp@pm.me`
                        : section.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert className={allSectionsAcked && ownerPhone && ownerEmail ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
            <AlertDescription className="text-sm">
              {allSectionsAcked && ownerPhone && ownerEmail
                ? 'All sections acknowledged. You may proceed to the cooling-off period.'
                : `Please acknowledge all ${ICF_SECTIONS.length} sections and provide owner phone/email before proceeding.`}
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleBeginICF}
            disabled={!allSectionsAcked || !ownerPhone || !ownerEmail || creating || !canGenerate}
            className="w-full"
            type="button"
          >
            {creating ? 'Processing...' : `Acknowledge All & Start ${COOLING_OFF_HOURS}-Hour Cooling Period`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Signing step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Consent Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={signatureMethod} onValueChange={(v) => setSignatureMethod(v as 'digital' | 'scanned')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="digital">Digital e-Signature</TabsTrigger>
            <TabsTrigger value="scanned">Print, Sign & Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="digital" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input value={patient.owner_name} readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Owner e-Signature *</Label>
                <div className="border rounded-lg bg-white overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={120}
                    className="w-full h-32 touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearSignature} type="button">
                    Clear Signature
                  </Button>
                </div>
                {ownerSignatureDataUrl && (
                  <p className="text-xs text-green-600">Signature captured.</p>
                )}
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
          </TabsContent>

          <TabsContent value="scanned" className="space-y-4 pt-2">
            <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
              <p className="text-sm text-slate-700">
                1. Download the blank consent PDF below.<br />
                2. Have the owner print and sign it.<br />
                3. Upload the scanned signed copy here (PDF, JPEG, or PNG, max 10MB).
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadUnsignedPdf} type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Download Blank PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendToOwner} disabled={sending || sendStatus === 'sent'} type="button">
                  <Send className="h-4 w-4 mr-2" />
                  {sendStatus === 'sent' ? 'Sent' : 'Send to Owner'}
                </Button>
              </div>
            </div>

            {uploadError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-sm text-red-800">{uploadError}</AlertDescription>
              </Alert>
            )}
            {scannedDoc ? (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{scannedDoc.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setScannedDoc(null)} type="button">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {scannedDoc.isImage && (
                  <img src={scannedDoc.cdnUrl} alt="Scanned document" className="w-full h-48 object-contain border rounded" />
                )}
                <p className="text-xs text-slate-500">Uploaded: {scannedDoc.cdnUrl}</p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-slate-50">
                <p className="text-sm text-slate-600 mb-3">
                  Upload a scanned copy of the signed informed consent document (PDF, JPEG, or PNG, max 10MB).
                </p>
                <FileUploaderRegular
                  pubkey="65522fb5ee7036edf97b"
                  classNameUploader="uc-light uc-purple"
                  sourceList="local, camera, gdrive"
                  multiple={false}
                  onFileUploadSuccess={(fileInfo: any) => {
                    if (fileInfo.size > 10 * 1024 * 1024) {
                      setUploadError('File exceeds 10MB limit.');
                      return;
                    }
                    if (!fileInfo.mimeType?.match(/(image\/(jpeg|jpg|png)|application\/pdf)/i)) {
                      setUploadError('Only PDF, JPEG, and PNG files are accepted.');
                      return;
                    }
                    setUploadError(null);
                    setScannedDoc(fileInfo);
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSign}
          disabled={
            signing ||
            uploadingDoc ||
            !canSign ||
            (signatureMethod === 'digital' && (!ownerSignatureDataUrl || !witnessName || !witnessSignature || !investigatorSignature)) ||
            (signatureMethod === 'scanned' && !scannedDoc)
          }
          className="w-full"
          type="button"
        >
          {signing || uploadingDoc ? 'Recording Signatures...' : 'Sign Informed Consent'}
        </Button>
      </CardContent>
    </Card>
  );
}
