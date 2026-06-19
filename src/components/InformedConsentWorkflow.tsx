import { useState, useEffect, useRef, useCallback } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import createInformedConsentAction from '@/actions/createInformedConsent';
import signInformedConsentAction from '@/actions/signInformedConsent';
import loadInformedConsentByPatientAction from '@/actions/loadInformedConsentByPatient';
import uploadConsentDocumentAction from '@/actions/uploadConsentDocument';
import verifyInformedConsentAction from '@/actions/verifyInformedConsent';
import createAuditLogAction from '@/actions/createAuditLog';
import jsPDF from 'jspdf';
import { STUDY_ID } from '@/lib/auditTypes';
import type { Patient } from '@/types/patient';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  PenTool,
  Download,
  ShieldAlert,
  Lock,
  Eye,
} from 'lucide-react';

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

  const [digitalSignOpen, setDigitalSignOpen] = useState(false);
  const [attestations, setAttestations] = useState<Record<number, boolean>>({});
  const [typedSignature, setTypedSignature] = useState('');
  const [ownerPrintedName, setOwnerPrintedName] = useState(patient.owner_name || '');
  const [scannedFile, setScannedFile] = useState<{ dataUrl: string; name: string; size: number } | null>(null);

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
    if (digitalSignOpen) {
      setTimeout(initCanvas, 0);
    }
  }, [digitalSignOpen]);

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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    const addWrapped = (text: string, x: number, yPos: number, maxWidth: number, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPos);
      return yPos + lines.length * fontSize * 0.45;
    };

    const checkPageBreak = (needed = 30) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
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
    doc.text('PATIENT & OWNER INFORMATION', margin, y);
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
    checkPageBreak();
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT INFORMATION', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    const contactRows = [
      ['Principal Investigator:', piName || 'N/A'],
      ['PI Phone:', piPhone || 'N/A'],
      ['Sponsor:', 'Byrock Technologies Ltd'],
      ['Sponsor Email:', 'drsp@pm.me'],
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
    checkPageBreak();
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('DOSE SCHEDULE & MONITORING', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 6;
    y = addWrapped(DOSE_SCHEDULE_TEXT, margin, y, pageWidth - margin * 2, 9);

    // Cooling-off
    checkPageBreak();
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('COOLING-OFF PERIOD', margin, y);
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

    // ICF Sections 1-9
    ICF_SECTIONS.forEach((section, i) => {
      checkPageBreak(40);
      y += 4;
      doc.setFontSize(11);
      doc.setTextColor(107, 127, 58);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECTION ${i + 1} — ${section.title.toUpperCase()}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      y += 6;

      const displayText =
        i === 7
          ? `Principal Investigator: ${piName || '[Name]'}, DVM. Phone: ${piPhone || '[Phone]'}. Sponsor: Byrock Technologies Ltd. Email: drsp@pm.me`
          : section.text;
      y = addWrapped(displayText, margin, y, pageWidth - margin * 2, 9);
    });

    // Section 10 — Consent to Participate
    checkPageBreak(140);
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor(107, 127, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION 10 — CONSENT TO PARTICIPATE', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    y += 10;

    const attestations = [
      'I have read and understood this form.',
      `I have had at least ${COOLING_OFF_HOURS} hours to consider this consent.`,
      `I voluntarily agree for my horse, ${patient.horse_name}, to participate in the PTP-102 trial.`,
      'I understand my horse may receive the investigational drug or a placebo/control.',
      'I may withdraw my horse at any time without penalty.',
    ];
    doc.setFontSize(10);
    attestations.forEach((text) => {
      const box = signed ? '☑' : '☐';
      doc.text(`${box} ${text}`, margin, y);
      y += 7;
    });

    y += 6;

    const signatureDate = signed ? new Date().toLocaleString() : '_______________';

    const drawSignatureLine = (label: string, value: string, yPos: number) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 55, yPos);
      return yPos + 8;
    };

    // Owner signature
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Owner Signature:', margin, y);
    if (signed && ownerSignatureDataUrl) {
      try {
        doc.addImage(ownerSignatureDataUrl, 'PNG', margin + 45, y - 4, 60, 18);
      } catch {
        doc.setFont('helvetica', 'normal');
        doc.text('_____________________________', margin + 45, y);
      }
      y += 16;
    } else if (signed && typedSignature) {
      doc.setFont('helvetica', 'normal');
      doc.text(typedSignature, margin + 45, y);
      y += 8;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text('________________________________________', margin + 45, y);
      y += 8;
    }

    y = drawSignatureLine('Owner Printed Name:', signed ? ownerPrintedName || patient.owner_name : '________________________________________', y);
    y = drawSignatureLine('Date:', signatureDate, y);

    y += 4;
    y = drawSignatureLine('Witness Signature (optional):', signed && witnessSignature ? witnessSignature : '_________________________', y);
    y = drawSignatureLine('Witness Printed Name:', signed && witnessName ? witnessName : '_________________________', y);
    y = drawSignatureLine('Date:', signed && witnessName ? signatureDate : '_______________', y);

    y += 4;
    y = drawSignatureLine('Veterinarian/PI Signature:', signed && investigatorSignature ? investigatorSignature : '_________________________', y);
    y = drawSignatureLine('Vet Printed Name & License:', signed && investigatorSignature ? investigatorSignature : '_________________________', y);
    y = drawSignatureLine('Date:', signed && investigatorSignature ? signatureDate : '_______________', y);

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i} of ${pageCount} | Patient: ${patient.horse_name} | ${STUDY_ID} is an investigational new animal drug (INAD) under FDA CVM review.`,
        margin,
        pageHeight - 10
      );
      doc.text(
        'Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only',
        margin,
        pageHeight - 6
      );
    }

    return doc;
  };

  const handleDownloadUnsignedPdf = async () => {
    const doc = buildConsentPdf(false);
    doc.save(`${STUDY_ID}_ICF_${patient.horse_name.replace(/\s+/g, '_')}_${patientId}.pdf`);
    await createAuditLog({
      action: 'GENERATE',
      entityType: consent ? 'informed_consent' : 'patient',
      entityId: consent ? consent.id : patientId,
      patientId,
      fieldName: 'icf_pdf_url',
      newValue: JSON.stringify({ protocol: STUDY_ID, caseId: patient.unique_id, generatedAt: new Date().toISOString() }),
      reasonForChange: consent
        ? 'Generated blank informed consent PDF for owner review/signature'
        : 'Generated blank informed consent PDF before cooling-off period',
    });
  };

  const allAttestationsChecked = [0, 1, 2, 3, 4].every((i) => attestations[i]);

  const handlePrintBlankPdf = () => {
    const doc = buildConsentPdf(false);
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl);
    if (printWindow) {
      printWindow.print();
    }
  };

  const handleScannedFileChange = (file: File | null) => {
    if (!file) {
      setScannedFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScannedFile({
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDigitalSign = async () => {
    if (!consent || !canSign) return;
    if (!allAttestationsChecked) {
      alert('Please check all 5 attestations before signing.');
      return;
    }
    const signatureValue = ownerSignatureDataUrl || typedSignature.trim();
    if (!signatureValue) {
      alert('Please draw your signature or type your full name.');
      return;
    }

    const signedAt = new Date().toISOString();
    const doc = buildConsentPdf(true);
    const fileName = `${STUDY_ID}_signed_ICF_${patient.horse_name.replace(/\s+/g, '_')}_${patientId}.pdf`;
    const signedPdfUrl = doc.output('datauristring');

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

    await signConsent({
      consentId: consent.id,
      ownerSignature: signatureValue,
      witnessName: witnessName || null,
      witnessSignature: witnessSignature || null,
      investigatorSignature: investigatorSignature || null,
      icfPdfUrl: signedPdfUrl,
      scannedDocumentUrl: null,
      signatureMethod: 'digital',
    });

    await createAuditLog({
      action: 'CONSENT_DIGITALLY_SIGNED',
      entityType: 'informed_consent',
      entityId: consent.id,
      patientId,
      fieldName: 'owner_signature',
      newValue: JSON.stringify({
        method: 'digital',
        signedAt,
        ownerPrintedName: ownerPrintedName || patient.owner_name,
      }),
      reasonForChange: 'Owner digitally signed the informed consent form',
    });

    setDigitalSignOpen(false);
    setStep('verify');
    onComplete();
  };

  const handleConfirmScannedSign = async () => {
    if (!consent || !canSign || !scannedFile) {
      alert('Please upload a scanned signed consent document.');
      return;
    }

    const uploadedAt = new Date().toISOString();
    await uploadConsentDocument({
      consentId: consent.id,
      patientId,
      caseId: patient.unique_id || `PTP-102-${String(patientId).padStart(3, '0')}`,
      studyId: STUDY_ID,
      protocolVersion: '1.0',
      documentType: 'scanned_signed',
      fileUrl: scannedFile.dataUrl,
      fileName: scannedFile.name,
      fileSize: scannedFile.size,
      uploadedBy: userEmail,
      version: 0,
      previousVersionId: null,
    });

    await signConsent({
      consentId: consent.id,
      ownerSignature: '[scanned signed document uploaded]',
      witnessName: witnessName || null,
      witnessSignature: witnessSignature || null,
      investigatorSignature: investigatorSignature || null,
      icfPdfUrl: null,
      scannedDocumentUrl: scannedFile.dataUrl,
      signatureMethod: 'scanned',
    });

    await createAuditLog({
      action: 'CONSENT_SCAN_UPLOADED',
      entityType: 'informed_consent',
      entityId: consent.id,
      patientId,
      fieldName: 'scanned_document_url',
      newValue: JSON.stringify({
        method: 'printed',
        fileName: scannedFile.name,
        fileSize: scannedFile.size,
        uploadedAt,
      }),
      reasonForChange: 'Uploaded scanned signed informed consent document',
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
        <CardContent className="p-6 text-center text-silver-text">
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
            <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
            <h3 className="text-lg font-semibold text-success-soft mt-2">Informed Consent Verified & Complete</h3>
            <p className="text-sm text-silver-strong">Owner consent has been recorded and verified for {patient.horse_name}.</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-sm space-y-2 text-slate-900">
            <p><strong>Signed by:</strong> {consent.owner_signature || 'Owner'}</p>
            <p><strong>Method:</strong> {consent.signature_method === 'digital' ? 'Digital e-signature' : 'Scanned signed document'}</p>
            <p><strong>Signed at:</strong> {consent.signed_at ? new Date(consent.signed_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Verified by:</strong> {consent.admin_reviewed_by || 'N/A'}</p>
            <p><strong>Verified at:</strong> {consent.admin_reviewed_at ? new Date(consent.admin_reviewed_at).toLocaleString() : 'N/A'}</p>
          </div>
          {consent.documents && consent.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-success-soft">Document Versions</p>
              {consent.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-200 text-slate-900">
                  <span className="text-xs">{doc.file_name} (v{doc.version})</span>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
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
            <AlertDescription className="text-sm text-info-soft">
              Review the signed consent details and document before finalizing. Only finalize if all signatures and documents are correct.
            </AlertDescription>
          </Alert>
          <div className="bg-slate-50 border rounded-lg p-4 text-sm space-y-2 text-slate-900">
            <p><strong>Owner:</strong> {consent.owner_name}</p>
            <p><strong>Signature method:</strong> {consent.signature_method === 'digital' ? 'Digital e-signature' : 'Scanned signed document'}</p>
            <p><strong>Signed at:</strong> {consent.signed_at ? new Date(consent.signed_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Witness:</strong> {consent.witness_name || 'N/A'}</p>
            <p><strong>Investigator:</strong> {consent.investigator_signature || 'N/A'}</p>
            {latestDoc && (
              <p>
                <strong>Latest document:</strong>{' '}
                <a href={latestDoc.file_url} target="_blank" rel="noreferrer" className="text-info hover:underline">
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
            <ShieldAlert className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-soft text-sm">
              Owner informed consent is required before enrolling {patient.horse_name}. The owner must view the full
              consent document and wait {COOLING_OFF_HOURS} hours before signing.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setStep('viewing')} className="w-full" type="button" disabled={!canGenerate}>
            Begin Informed Consent Process
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadUnsignedPdf}
            disabled={!canGenerate}
            className="w-full"
            type="button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Blank PDF
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'cooling') {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-8 text-center space-y-4">
          <Clock className="h-12 w-12 text-info mx-auto animate-pulse" />
          <h3 className="text-xl font-semibold text-silver-strong">Cooling-Off Period Active</h3>
          <p className="text-silver-text">
            Per regulatory requirements, the owner must wait {COOLING_OFF_HOURS} hours after viewing the consent document before signing.
          </p>
          <div className="text-4xl font-mono font-bold text-info-soft">{countdown}</div>
          <p className="text-sm text-silver-text">Remaining until consent can be signed</p>
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
            <h4 className="text-sm font-semibold text-info-soft">Owner Contact Information</h4>
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
            <h4 className="text-sm font-semibold text-slate-900">Case Information (Auto-populated)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-900">
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
                    <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                    <p className="text-sm text-slate-700 mt-1">
                      {i === 7
                        ? `Principal Investigator: ${piName || '[Name]'}, DVM. Phone: ${piPhone || '[Phone]'}. Sponsor: Byrock Technologies Ltd. Email: drsp@pm.me`
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
            variant="outline"
            size="sm"
            onClick={handleDownloadUnsignedPdf}
            disabled={!canGenerate}
            className="w-full"
            type="button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Blank PDF for Owner Review/Signature
          </Button>
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

  const attestationTexts = [
    'I have read and understood this form.',
    `I have had at least ${COOLING_OFF_HOURS} hours to consider this consent.`,
    `I voluntarily agree for my horse, ${patient.horse_name}, to participate in the PTP-102 trial.`,
    'I understand my horse may receive the investigational drug or a placebo/control.',
    'I may withdraw my horse at any time without penalty.',
  ];

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
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-info-soft">
            The cooling-off period has ended. Choose how the owner will sign Section 10 of the consent form.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={() => setDigitalSignOpen(true)} disabled={!canSign} type="button">
            <PenTool className="h-4 w-4 mr-2" />
            Sign Digitally
          </Button>
          <Button variant="outline" onClick={handlePrintBlankPdf} type="button">
            <Download className="h-4 w-4 mr-2" />
            Print & Sign
          </Button>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
          <p className="text-sm text-slate-900">
            Print, sign, and upload the scanned signed copy below.
          </p>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleScannedFileChange(e.target.files?.[0] ?? null)}
            data-testid="scanned-consent-input"
          />
          {scannedFile && (
            <p className="text-xs text-green-600">Selected: {scannedFile.name}</p>
          )}
          <Button
            onClick={handleConfirmScannedSign}
            disabled={!scannedFile || signing || uploadingDoc || !canSign}
            className="w-full"
            type="button"
          >
            {signing || uploadingDoc ? 'Recording...' : 'Upload Scanned Signed Consent'}
          </Button>
        </div>

        <Dialog open={digitalSignOpen} onOpenChange={setDigitalSignOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Digital Consent Signature</DialogTitle>
              <DialogDescription>
                Check each attestation, then sign and confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
                {attestationTexts.map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Checkbox
                      checked={attestations[i] || false}
                      onCheckedChange={(v) => setAttestations((prev) => ({ ...prev, [i]: !!v }))}
                    />
                    <span className="text-sm text-slate-900">{text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Owner Signature *</Label>
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
                <Label>Or type your full name to sign electronically</Label>
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type full legal name"
                  data-testid="typed-signature-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Owner Printed Name</Label>
                <Input
                  value={ownerPrintedName}
                  onChange={(e) => setOwnerPrintedName(e.target.value)}
                  placeholder="Printed name"
                  data-testid="owner-printed-name-input"
                />
              </div>

              <div className="text-sm text-silver-text">
                Signed at: {new Date().toISOString()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Witness Name</Label>
                  <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Witness Signature</Label>
                  <Input
                    value={witnessSignature}
                    onChange={(e) => setWitnessSignature(e.target.value)}
                    placeholder="Type full legal name"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Veterinarian/PI Signature *</Label>
                  <Input
                    value={investigatorSignature}
                    onChange={(e) => setInvestigatorSignature(e.target.value)}
                    placeholder="Type full name and credentials"
                    data-testid="pi-signature-input"
                  />
                </div>
              </div>

              <Button
                onClick={handleConfirmDigitalSign}
                disabled={!canSign || signing || uploadingDoc}
                className="w-full"
                type="button"
              >
                {signing || uploadingDoc ? 'Recording...' : 'Confirm Digital Signature'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
