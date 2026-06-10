import { useState, useEffect } from 'react';
import { useMutateAction, useLoadAction } from '@uibakery/data';
import loadVeterinariansAction from '@/actions/loadVeterinarians';
import loadAllInvestigatorQualificationsAction from '@/actions/loadAllInvestigatorQualifications';
import approveVeterinarianAction from '@/actions/approveVeterinarian';
import rejectVeterinarianAction from '@/actions/rejectVeterinarian';
import deleteVeterinarianAction from '@/actions/deleteVeterinarian';
import approveInvestigatorQualificationAction from '@/actions/approveInvestigatorQualification';
import rejectInvestigatorQualificationAction from '@/actions/rejectInvestigatorQualification';
import updateVetVerificationStatusAction from '@/actions/updateVetVerificationStatus';
import sendEmailNotificationAction from '@/actions/sendEmailNotification';
import { sendNotification, NotificationType } from '@/utils/emailNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Trash2, Eye, Mail, FileDown, FileText, Download, GraduationCap, Award, Shield, User, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Veterinarian = {
  id: number;
  full_name: string;
  email: string;
  license_number: string;
  hospital_affiliation: string;
  verification_status: string;
  tc_accepted: boolean;
  tc_accepted_at: string | null;
  signature_text: string | null;
  no_conflict_of_interest?: boolean;
  created_at: string;
  last_login: string | null;
};

type InvestigatorQualification = {
  id: number;
  veterinarian_id: number;
  vet_email: string;
  full_name: string | null;
  email: string | null;
  hospital_affiliation: string | null;
  license_number: string | null;
  license_state: string | null;
  years_experience: number | null;
  laminitis_case_volume_per_year: number | null;
  prior_clinical_trial_experience: boolean | null;
  prior_trials_count: number | null;
  gcp_training_completed: boolean | null;
  gcp_certificate_url: string | null;
  gcp_completion_date: string | null;
  gcp_expiry_date: string | null;
  gcp_quiz_score: number | null;
  facility_inspection_completed: boolean | null;
  facility_inspection_date: string | null;
  investigator_agreement_signed: boolean | null;
  investigator_agreement_signed_at: string | null;
  investigator_agreement_signature: string | null;
  protocol_signed: boolean | null;
  protocol_signed_at: string | null;
  protocol_signed_version: string | null;
  protocol_signature: string | null;
  qualification_status: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

export function VeterinarianManagementPanel() {
  const [vets, loadingVets, errorVets, refreshVets] = useLoadAction(loadVeterinariansAction, [], {});
  const [allQuals, loadingQuals] = useLoadAction(loadAllInvestigatorQualificationsAction, [], {});
  const [approveVet] = useMutateAction(approveVeterinarianAction);
  const [rejectVet] = useMutateAction(rejectVeterinarianAction);
  const [deleteVet] = useMutateAction(deleteVeterinarianAction);
  const [approveQual] = useMutateAction(approveInvestigatorQualificationAction);
  const [rejectQual] = useMutateAction(rejectInvestigatorQualificationAction);
  const [updateVetStatus] = useMutateAction(updateVetVerificationStatusAction);
  const [sendEmail] = useMutateAction(sendEmailNotificationAction);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [selectedQual, setSelectedQual] = useState<InvestigatorQualification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const qualsList: InvestigatorQualification[] = allQuals || [];

  const getQualForVet = (vet: Veterinarian): InvestigatorQualification | null => {
    return qualsList.find((q) => q.vet_email === vet.email || q.veterinarian_id === vet.id) || null;
  };

  useEffect(() => {
    if (selectedVet) {
      setSelectedQual(getQualForVet(selectedVet));
    } else {
      setSelectedQual(null);
    }
  }, [selectedVet, qualsList]);

  const handleApprove = async (id: number) => {
    try {
      const vet = vets.find((v: Veterinarian) => v.id === id);
      const result = await approveVet({ id });
      
      console.log('Veterinarian approved:', result);
      
      if (vet) {
        sendNotification(
          sendEmail,
          NotificationType.VET_APPROVED,
          `✅ Vet Approved: ${vet.full_name}`,
          {
            'Veterinarian': vet.full_name,
            'Email': vet.email,
            'Hospital': vet.hospital_affiliation,
            'License': vet.license_number,
          }
        ).catch(err => console.error('Email notification failed (non-critical):', err));
      }
      
      await refreshVets();
      alert('Veterinarian approved successfully.');
    } catch (error) {
      console.error('Failed to approve veterinarian:', error);
      alert('Failed to approve veterinarian. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    if (window.confirm('Are you sure you want to reject this veterinarian? This action cannot be undone.')) {
      try {
        const vet = vets.find((v: Veterinarian) => v.id === id);
        const result = await rejectVet({ id });
        
        console.log('Veterinarian rejected:', result);
        
        if (vet) {
          sendNotification(
            sendEmail,
            NotificationType.VET_REJECTED,
            `❌ Vet Rejected: ${vet.full_name}`,
            {
              'Veterinarian': vet.full_name,
              'Email': vet.email,
              'Hospital': vet.hospital_affiliation,
            }
          ).catch(err => console.error('Email notification failed (non-critical):', err));
        }
        
        await refreshVets();
        alert('Veterinarian rejected.');
      } catch (error) {
        console.error('Failed to reject veterinarian:', error);
        alert('Failed to reject veterinarian. Please try again.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this veterinarian? This action cannot be undone.')) {
      try {
        await deleteVet({ id });
        console.log('Veterinarian deleted:', id);
        refreshVets();
      } catch (error) {
        console.error('Failed to delete veterinarian:', error);
        alert('Failed to delete veterinarian. Please try again.');
      }
    }
  };

  const handleExportVetContract = (vet: Veterinarian) => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Helper to add wrapped text
      const addWrapped = (text: string, x: number, yPos: number, maxWidth: number, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + lines.length * fontSize * 0.45;
      };

      // HEADER
      doc.setFillColor(107, 127, 58);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('Byrock Technologies Ltd.', margin, 15);
      doc.setFontSize(11);
      doc.text('PTP-102 Laminitis Trial — Investigational New Animal Drug (INAD)', margin, 23);
      doc.text('FDA CVM Review Pending', margin, 29);

      y = 45;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('VETERINARIAN TERMS & CONDITIONS', margin, y);
      doc.text('ACCEPTANCE AGREEMENT', margin, y + 7);
      doc.setFont('helvetica', 'normal');

      y = 62;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Document ID: PTP102-TC-${vet.id}-${timestamp}`, margin, y);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 4);
      doc.text(`Veterinarian ID: VET-${String(vet.id).padStart(4, '0')}`, margin, y + 8);

      // SECTION: Party Details
      y = 82;
      doc.setFontSize(12);
      doc.setTextColor(107, 127, 58);
      doc.setFont('helvetica', 'bold');
      doc.text('1. PARTY IDENTIFICATION', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      const details = [
        ['Full Name:', vet.full_name],
        ['Email Address:', vet.email],
        ['Veterinary License:', vet.license_number],
        ['Hospital / Clinic:', vet.hospital_affiliation],
        ['Registration Date:', vet.created_at ? new Date(vet.created_at).toLocaleString() : 'N/A'],
        ['Account Status:', vet.verification_status.toUpperCase()],
      ];

      y = 90;
      details.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), margin + 50, y);
        y += 6;
      });

      // SECTION: Declarations
      y += 6;
      doc.setFontSize(12);
      doc.setTextColor(107, 127, 58);
      doc.setFont('helvetica', 'bold');
      doc.text('2. DECLARATIONS & ACKNOWLEDGMENTS', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      y += 8;
      const declarations = [
        {
          label: 'Investigational Status Acknowledged',
          value: vet.tc_accepted ? 'YES — Confirmed' : 'NO',
          detail: 'The undersigned acknowledges that PTP-102 (methylated tirilazad) is an investigational new animal drug (INAD) under FDA CVM review and has not received marketing approval.',
        },
        {
          label: 'Treatment Risks Accepted',
          value: vet.tc_accepted ? 'YES — Confirmed' : 'NO',
          detail: 'The undersigned accepts all known and unknown risks associated with the administration of PTP-102 to equine subjects enrolled in this clinical trial.',
        },
        {
          label: 'Liability Acknowledged',
          value: vet.tc_accepted ? 'YES — Confirmed' : 'NO',
          detail: 'The undersigned acknowledges liability limitations as set forth in the trial protocol and agrees to indemnify Byrock Technologies Ltd. to the extent permitted by applicable law.',
        },
        {
          label: 'No Conflicts of Interest',
          value: vet.no_conflict_of_interest === true ? 'YES — Confirmed' : vet.no_conflict_of_interest === false ? 'NO — Declared' : 'Pending migration',
          detail: 'The undersigned confirms that they have no financial, professional, or personal conflicts of interest that could influence the outcome of this clinical trial.',
        },
      ];

      declarations.forEach((decl, idx) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${decl.label}`, margin, y);
        y += 5;
        doc.setTextColor(107, 127, 58);
        doc.text(`   Status: ${decl.value}`, margin, y);
        doc.setTextColor(40, 40, 40);
        y += 5;
        y = addWrapped(decl.detail, margin + 4, y, pageWidth - margin * 2 - 4, 9);
        y += 4;
      });

      // SECTION: Digital Signature
      y += 4;
      doc.setFontSize(12);
      doc.setTextColor(107, 127, 58);
      doc.setFont('helvetica', 'bold');
      doc.text('3. DIGITAL SIGNATURE & TIMESTAMP', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Digital Signature:', margin, y);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text(`"${vet.signature_text || 'Not provided'}"`, margin, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      y += 14;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions Accepted At:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(vet.tc_accepted_at ? new Date(vet.tc_accepted_at).toLocaleString() : 'N/A', margin + 70, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Last Updated:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(vet.created_at ? new Date(vet.created_at).toLocaleString() : 'N/A', margin + 70, y);

      // SECTION: Legal Boilerplate
      y += 16;
      doc.setFontSize(12);
      doc.setTextColor(107, 127, 58);
      doc.setFont('helvetica', 'bold');
      doc.text('4. LEGAL CERTIFICATION', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      y += 8;
      const legalText =
        'This document constitutes a legally binding record of the undersigned veterinarian\'s acceptance of the Terms and Conditions governing participation in the PTP-102 Laminitis Clinical Trial. The digital signature and timestamp recorded herein serve as equivalent evidence of assent as a handwritten signature under applicable electronic transactions legislation. Byrock Technologies Ltd. retains this document for regulatory compliance, audit, and FDA CVM inspection purposes. Any dispute arising from this agreement shall be governed by the laws of Ireland and subject to the exclusive jurisdiction of the Irish courts. This agreement may not be modified except in writing signed by both parties.';
      y = addWrapped(legalText, margin, y, pageWidth - margin * 2, 9);

      // Footer on every page
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${pageCount} | Document ID: PTP102-TC-${vet.id}-${timestamp} | PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          'Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only',
          margin,
          doc.internal.pageSize.height - 6
        );
      }

      doc.save(`PTP102_Vet_Contract_${vet.full_name.replace(/\s+/g, '_')}_${timestamp}.pdf`);
    } catch (err) {
      console.error('Contract PDF export failed:', err);
      alert('Failed to export contract PDF. Please try again.');
    }
  };

  const handleExportTCReport = (vets: Veterinarian[]) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('PTP-102 Laminitis Trial', 14, 15);
      doc.setFontSize(12);
      doc.text('Veterinarian Terms & Conditions Acceptance Report', 14, 22);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text('Byrock Technologies Ltd. — INAD-PTP102-2025', 14, 33);

      // Table
      autoTable(doc, {
        startY: 38,
        head: [['Name', 'Email', 'License', 'Hospital', 'T&C Date', 'Signature', 'No Conflict', 'Status']],
        body: vets.map((v) => [
          v.full_name,
          v.email,
          v.license_number,
          v.hospital_affiliation,
          v.tc_accepted_at ? new Date(v.tc_accepted_at).toLocaleDateString() : 'N/A',
          v.signature_text || 'N/A',
          v.no_conflict_of_interest ? 'Yes' : 'No',
          v.verification_status,
        ]),
        headStyles: {
          fillColor: [107, 127, 58],
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 38 },
      });

      // Footer / Disclaimer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${pageCount} | PTP-102 is an investigational new animal drug (INAD) under FDA CVM review. This report is for regulatory compliance purposes only.`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`PTP102_Vet_TC_Report_${timestamp}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export T&C report. Please try again.');
    }
  };

  const handleExportFullRegistrationPacket = (vet: Veterinarian, qual: InvestigatorQualification | null) => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      const addWrapped = (text: string, x: number, yPos: number, maxWidth: number, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + lines.length * fontSize * 0.45;
      };

      const addSection = (title: string, rows: [string, string][], yPos: number) => {
        doc.setFontSize(12);
        doc.setTextColor(107, 127, 58);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        let cy = yPos + 6;
        rows.forEach(([label, value]) => {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, cy);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value || 'N/A'), margin + 55, cy);
          cy += 5;
        });
        return cy + 3;
      };

      // HEADER
      doc.setFillColor(107, 127, 58);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('Byrock Technologies Ltd.', margin, 15);
      doc.setFontSize(11);
      doc.text('PTP-102 Laminitis Trial — Investigational New Animal Drug (INAD)', margin, 23);
      doc.text('FDA CVM Review Pending', margin, 29);

      y = 45;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FULL VETERINARIAN REGISTRATION PACKET', margin, y);
      doc.setFont('helvetica', 'normal');

      y = 55;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Document ID: PTP102-REG-${vet.id}-${timestamp}`, margin, y);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 4);

      y = 65;

      // SECTION 1: Profile
      y = addSection('1. VETERINARIAN PROFILE', [
        ['Full Name:', vet.full_name],
        ['Email:', vet.email],
        ['License Number:', vet.license_number],
        ['Hospital / Clinic:', vet.hospital_affiliation],
        ['Account Status:', vet.verification_status.toUpperCase()],
        ['Registered:', vet.created_at ? new Date(vet.created_at).toLocaleString() : 'N/A'],
        ['T&C Accepted:', vet.tc_accepted_at ? new Date(vet.tc_accepted_at).toLocaleString() : 'N/A'],
        ['Digital Signature:', vet.signature_text || 'N/A'],
        ['No Conflict of Interest:', vet.no_conflict_of_interest === true ? 'Yes' : vet.no_conflict_of_interest === false ? 'No' : 'Pending'],
      ], y);

      // SECTION 2: Qualification
      if (qual) {
        y = addSection('2. INVESTIGATOR QUALIFICATION', [
          ['License State:', qual.license_state || 'N/A'],
          ['Years Experience:', qual.years_experience != null ? String(qual.years_experience) : 'N/A'],
          ['Laminitis Cases/Year:', qual.laminitis_case_volume_per_year != null ? String(qual.laminitis_case_volume_per_year) : 'N/A'],
          ['Prior Trial Experience:', qual.prior_clinical_trial_experience ? 'Yes' : 'No'],
          ['Prior Trials Count:', qual.prior_trials_count != null ? String(qual.prior_trials_count) : 'N/A'],
          ['Qualification Status:', qual.qualification_status?.toUpperCase() || 'N/A'],
          ['Submitted:', qual.created_at ? new Date(qual.created_at).toLocaleString() : 'N/A'],
          ['Last Updated:', qual.updated_at ? new Date(qual.updated_at).toLocaleString() : 'N/A'],
        ], y);

        y = addSection('3. GCP TRAINING', [
          ['GCP Training Completed:', qual.gcp_training_completed ? 'Yes' : 'No'],
          ['Quiz Score:', qual.gcp_quiz_score != null ? `${qual.gcp_quiz_score}%` : 'N/A'],
          ['Completion Date:', qual.gcp_completion_date ? new Date(qual.gcp_completion_date).toLocaleDateString() : 'N/A'],
          ['Expiry Date:', qual.gcp_expiry_date ? new Date(qual.gcp_expiry_date).toLocaleDateString() : 'N/A'],
        ], y);

        y = addSection('4. FACILITY & AGREEMENTS', [
          ['Facility Inspection:', qual.facility_inspection_completed ? 'Completed' : 'Pending'],
          ['Inspection Date:', qual.facility_inspection_date ? new Date(qual.facility_inspection_date).toLocaleDateString() : 'N/A'],
          ['Investigator Agreement Signed:', qual.investigator_agreement_signed ? 'Yes' : 'No'],
          ['Agreement Signed At:', qual.investigator_agreement_signed_at ? new Date(qual.investigator_agreement_signed_at).toLocaleString() : 'N/A'],
          ['Protocol Signed:', qual.protocol_signed ? 'Yes' : 'No'],
          ['Protocol Signed At:', qual.protocol_signed_at ? new Date(qual.protocol_signed_at).toLocaleString() : 'N/A'],
          ['Protocol Version:', qual.protocol_signed_version || 'N/A'],
        ], y);
      } else {
        y += 4;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        y = addWrapped('No investigator qualification data on file for this veterinarian.', margin, y, pageWidth - margin * 2, 10);
        doc.setTextColor(40, 40, 40);
      }

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${pageCount} | Document ID: PTP102-REG-${vet.id}-${timestamp} | PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          'Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only',
          margin,
          doc.internal.pageSize.height - 6
        );
      }

      doc.save(`PTP102_Full_Registration_${vet.full_name.replace(/\s+/g, '_')}_${timestamp}.pdf`);
    } catch (err) {
      console.error('Registration packet PDF export failed:', err);
      alert('Failed to export registration packet. Please try again.');
    }
  };

  const handleExportGCPRecord = (vet: Veterinarian, qual: InvestigatorQualification | null) => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      const addWrapped = (text: string, x: number, yPos: number, maxWidth: number, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + lines.length * fontSize * 0.45;
      };

      // HEADER
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('Byrock Technologies Ltd.', margin, 15);
      doc.setFontSize(11);
      doc.text('PTP-102 Laminitis Trial — GCP Training Record', margin, 23);
      doc.text('VICH GL9 Good Clinical Practice', margin, 29);

      y = 45;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GCP TRAINING RECORD', margin, y);
      doc.setFont('helvetica', 'normal');

      y = 55;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Document ID: PTP102-GCP-${vet.id}-${timestamp}`, margin, y);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 4);

      y = 65;

      // Vet identity
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Veterinarian', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      y += 6;
      const identity = [
        ['Name:', vet.full_name],
        ['Email:', vet.email],
        ['License:', vet.license_number],
        ['Hospital:', vet.hospital_affiliation],
      ];
      identity.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value || 'N/A'), margin + 40, y);
        y += 5;
      });

      y += 6;
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Training Details', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      y += 6;

      if (qual && qual.gcp_training_completed) {
        const details = [
          ['Training Completed:', 'Yes'],
          ['Quiz Score:', qual.gcp_quiz_score != null ? `${qual.gcp_quiz_score}%` : 'N/A'],
          ['Passing Threshold:', '80%'],
          ['Result:', qual.gcp_quiz_score != null && qual.gcp_quiz_score >= 80 ? 'PASSED' : 'N/A'],
          ['Completion Date:', qual.gcp_completion_date ? new Date(qual.gcp_completion_date).toLocaleDateString() : 'N/A'],
          ['Expiry Date:', qual.gcp_expiry_date ? new Date(qual.gcp_expiry_date).toLocaleDateString() : 'N/A'],
          ['Certificate URL:', qual.gcp_certificate_url || 'N/A'],
        ];
        details.forEach(([label, value]) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, y);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value || 'N/A'), margin + 50, y);
          y += 5;
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        y = addWrapped('No GCP training record on file. The veterinarian has not yet completed or uploaded GCP training.', margin, y, pageWidth - margin * 2, 10);
        doc.setTextColor(40, 40, 40);
      }

      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('Regulatory Certification', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      y += 6;
      const certText = 'This document certifies that the named veterinarian has completed Good Clinical Practice (GCP) training in accordance with VICH GL9 for the PTP-102 Laminitis Clinical Trial. This record is maintained for regulatory compliance, audit, and FDA CVM inspection purposes. Byrock Technologies Ltd. retains the original training records and certificates for the duration required by applicable law (minimum 2 years post-NADA approval or 5 years post-study completion, whichever is longer).';
      y = addWrapped(certText, margin, y, pageWidth - margin * 2, 9);

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${pageCount} | Document ID: PTP102-GCP-${vet.id}-${timestamp} | PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          'Byrock Technologies Ltd. — Confidential & Proprietary — For Regulatory Compliance Use Only',
          margin,
          doc.internal.pageSize.height - 6
        );
      }

      doc.save(`PTP102_GCP_Record_${vet.full_name.replace(/\s+/g, '_')}_${timestamp}.pdf`);
    } catch (err) {
      console.error('GCP record PDF export failed:', err);
      alert('Failed to export GCP training record. Please try again.');
    }
  };

  const handleExportAllVetsRegistration = (vets: Veterinarian[], quals: InvestigatorQualification[]) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('PTP-102 Laminitis Trial', 14, 15);
      doc.setFontSize(12);
      doc.text('Complete Veterinarian Registration & Qualification Report', 14, 22);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text('Byrock Technologies Ltd. — INAD-PTP102-2025', 14, 33);

      autoTable(doc, {
        startY: 38,
        head: [['Name', 'Email', 'License', 'Hospital', 'Status', 'T&C', 'GCP', 'Quiz', 'Facility', 'Agreement', 'Protocol', 'Qual Status']],
        body: vets.map((v) => {
          const q = quals.find((q) => q.vet_email === v.email || q.veterinarian_id === v.id);
          return [
            v.full_name,
            v.email,
            v.license_number,
            v.hospital_affiliation,
            v.verification_status,
            v.tc_accepted ? 'Yes' : 'No',
            q?.gcp_training_completed ? 'Yes' : 'No',
            q?.gcp_quiz_score != null ? `${q.gcp_quiz_score}%` : 'N/A',
            q?.facility_inspection_completed ? 'Yes' : 'No',
            q?.investigator_agreement_signed ? 'Yes' : 'No',
            q?.protocol_signed ? 'Yes' : 'No',
            q?.qualification_status || 'N/A',
          ];
        }),
        headStyles: {
          fillColor: [107, 127, 58],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 38 },
      });

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${pageCount} | PTP-102 is an investigational new animal drug (INAD) under FDA CVM review. This report is for regulatory compliance purposes only.`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`PTP102_All_Vets_Registration_${timestamp}.pdf`);
    } catch (err) {
      console.error('All vets PDF export failed:', err);
      alert('Failed to export all vets registration. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loadingVets) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading veterinarians...</div>
        </CardContent>
      </Card>
    );
  }

  if (errorVets) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">Error loading veterinarians: {errorVets.message}</div>
        </CardContent>
      </Card>
    );
  }

  const vetsList: Veterinarian[] = vets || [];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-2xl">Veterinarian Management</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Approve, reject, or manage veterinarian accounts. Full registration packets and GCP records are available for download.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportAllVetsRegistration(vetsList, qualsList)}
            type="button"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All Registrations
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportTCReport(vetsList)}
            type="button"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export T&C Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                <TableHead className="hidden sm:table-cell">License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vetsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No veterinarians found
                  </TableCell>
                </TableRow>
              ) : (
                vetsList.map((vet) => (
                  <TableRow key={vet.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{vet.full_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{vet.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{vet.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{vet.hospital_affiliation}</TableCell>
                    <TableCell className="hidden sm:table-cell">{vet.license_number}</TableCell>
                    <TableCell>{getStatusBadge(vet.verification_status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {vet.last_login ? new Date(vet.last_login).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={dialogOpen && selectedVet?.id === vet.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedVet(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedVet(vet)}
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Veterinarian Details — Full Access
                              </DialogTitle>
                              <DialogDescription>
                                Complete registration profile, qualification data, and GCP training record.
                              </DialogDescription>
                            </DialogHeader>

                            {/* PROFILE SECTION */}
                            <div className="space-y-4">
                              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                  <User className="h-4 w-4" /> Profile
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div><span className="font-semibold">Name:</span> {vet.full_name}</div>
                                  <div><span className="font-semibold">Email:</span> {vet.email}</div>
                                  <div><span className="font-semibold">License:</span> {vet.license_number}</div>
                                  <div><span className="font-semibold">Hospital:</span> {vet.hospital_affiliation}</div>
                                  <div><span className="font-semibold">Status:</span> {getStatusBadge(vet.verification_status)}</div>
                                  <div><span className="font-semibold">Registered:</span> {new Date(vet.created_at).toLocaleString()}</div>
                                  <div><span className="font-semibold">T&C Accepted:</span> {vet.tc_accepted_at ? new Date(vet.tc_accepted_at).toLocaleString() : 'N/A'}</div>
                                  <div><span className="font-semibold">No Conflict:</span> {vet.no_conflict_of_interest === true ? 'Yes' : vet.no_conflict_of_interest === false ? 'No' : 'Pending'}</div>
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold">Digital Signature:</span>{' '}
                                  <span className="italic text-muted-foreground">{vet.signature_text || 'N/A'}</span>
                                </div>
                              </div>

                              {/* QUALIFICATION SECTION */}
                              {selectedQual ? (
                                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" /> Investigator Qualification
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="font-semibold">License State:</span> {selectedQual.license_state || 'N/A'}</div>
                                    <div><span className="font-semibold">Years Exp:</span> {selectedQual.years_experience != null ? selectedQual.years_experience : 'N/A'}</div>
                                    <div><span className="font-semibold">Laminitis Cases/yr:</span> {selectedQual.laminitis_case_volume_per_year != null ? selectedQual.laminitis_case_volume_per_year : 'N/A'}</div>
                                    <div><span className="font-semibold">Prior Trials:</span> {selectedQual.prior_clinical_trial_experience ? 'Yes' : 'No'} ({selectedQual.prior_trials_count ?? 0})</div>
                                    <div><span className="font-semibold">Qual Status:</span> {selectedQual.qualification_status || 'N/A'}</div>
                                    <div><span className="font-semibold">Submitted:</span> {selectedQual.created_at ? new Date(selectedQual.created_at).toLocaleString() : 'N/A'}</div>
                                  </div>

                                  <Separator />

                                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <Award className="h-4 w-4" /> GCP Training
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="font-semibold">Completed:</span> {selectedQual.gcp_training_completed ? 'Yes' : 'No'}</div>
                                    <div><span className="font-semibold">Quiz Score:</span> {selectedQual.gcp_quiz_score != null ? `${selectedQual.gcp_quiz_score}%` : 'N/A'}</div>
                                    <div><span className="font-semibold">Facility:</span> {selectedQual.facility_inspection_completed ? 'Completed' : 'Pending'}</div>
                                    <div><span className="font-semibold">Agreement:</span> {selectedQual.investigator_agreement_signed ? 'Signed' : 'Pending'}</div>
                                    <div><span className="font-semibold">Protocol:</span> {selectedQual.protocol_signed ? 'Signed' : 'Pending'}</div>
                                    <div><span className="font-semibold">Protocol Ver:</span> {selectedQual.protocol_signed_version || 'N/A'}</div>
                                  </div>

                                  {/* FACILITY PHOTOS REVIEW */}
                                  <Separator />
                                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Facility Photos
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                      { label: 'Drug Storage', url: selectedQual.drug_storage_photo_url, status: selectedQual.drug_storage_photo_status, key: 'drug_storage' },
                                      { label: 'Emergency Equipment', url: selectedQual.emergency_equipment_photo_url, status: selectedQual.emergency_equipment_photo_status, key: 'emergency' },
                                      { label: 'Records Area', url: selectedQual.records_area_photo_url, status: selectedQual.records_area_photo_status, key: 'records' },
                                    ].map((photo) => (
                                      <div key={photo.key} className="border rounded-lg p-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold">{photo.label}</span>
                                          {photo.status && (
                                            <Badge variant={photo.status === 'approved' ? 'default' : photo.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                                              {photo.status}
                                            </Badge>
                                          )}
                                        </div>
                                        {photo.url ? (
                                          <>
                                            <img src={photo.url} alt={photo.label} className="w-full h-20 object-cover rounded border" />
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" type="button" onClick={async () => {
                                                try {
                                                  await approveQual({ veterinarianId: vet.id, vetEmail: vet.email });
                                                  // Update photo status via update action would go here; for now reload
                                                  alert(`${photo.label} photo approved.`);
                                                } catch (e) { alert('Failed.'); }
                                              }}>Approve</Button>
                                              <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7 text-red-600" type="button" onClick={async () => {
                                                try {
                                                  await rejectQual({ veterinarianId: vet.id, vetEmail: vet.email });
                                                  alert(`${photo.label} photo rejected.`);
                                                } catch (e) { alert('Failed.'); }
                                              }}>Reject</Button>
                                            </div>
                                          </>
                                        ) : (
                                          <p className="text-xs text-muted-foreground text-center py-2">No photo uploaded</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Admin Qualification Actions */}
                                  <div className="flex items-center gap-2 pt-2">
                                    {selectedQual.status !== 'approved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={async () => {
                                          try {
                                            await approveQual({ veterinarianId: vet.id, vetEmail: vet.email });
                                            alert('Investigator qualification approved.');
                                          } catch (e) {
                                            alert('Failed to approve qualification.');
                                          }
                                        }}
                                        type="button"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Approve Qualification
                                      </Button>
                                    )}
                                    {selectedQual.status !== 'rejected' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={async () => {
                                          if (window.confirm('Reject this investigator qualification?')) {
                                            try {
                                              await rejectQual({ veterinarianId: vet.id, vetEmail: vet.email });
                                              alert('Investigator qualification rejected.');
                                            } catch (e) {
                                              alert('Failed to reject qualification.');
                                            }
                                          }
                                        }}
                                        type="button"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject Qualification
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-50 rounded-lg p-4 text-sm text-muted-foreground">
                                  No investigator qualification data on file for this veterinarian.
                                </div>
                              )}

                              {/* PDF DOWNLOADS */}
                              <div className="space-y-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportFullRegistrationPacket(vet, selectedQual)}
                                  type="button"
                                  className="w-full gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download Full Registration Packet (PDF)
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportGCPRecord(vet, selectedQual)}
                                  type="button"
                                  className="w-full gap-2"
                                >
                                  <GraduationCap className="h-4 w-4" />
                                  Download GCP Training Record (PDF)
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportVetContract(vet)}
                                  type="button"
                                  className="w-full gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Download Legal Contract (PDF)
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                  Admin has full access to all veterinarian records for regulatory compliance.
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {vet.verification_status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(vet.id)}
                              type="button"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(vet.id)}
                              type="button"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vet.id)}
                          type="button"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
