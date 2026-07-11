import jsPDF from 'jspdf';

export type NdaPdfData = {
  companyName: string;
  counterpartyEntityType: string;
  counterpartyJurisdiction: string;
  counterpartyAddress: string;
  counterpartyContactEmail: string;
  counterpartyContactName: string;
  counterpartyContactTitle: string;
  projectPurpose: string;
  projectRegions: string[];
  signerName: string;
  signerTitle: string;
  signatureDate: string;
  electronicSignature: string;
  adminSignature?: {
    name: string;
    title: string;
    date: string;
  };
};

const fullNdaText = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of the date of electronic execution below (the "Effective Date") by and between:

Byrock Technologies Ltd
Augustine House, Oliver Bond Street, Dublin 8, Ireland
Represented by Anthony Joyce, Director
Email: info@byrocktechnologies.com
Phone: +353 (0) 87 8187492
Web: www.byrocktechnologies.com
("Byrock")

and the counterparty identified in this intake (the "Counterparty").

1. DEFINITIONS
"Affiliates" means any entity that directly or indirectly controls, is controlled by, or is under common control with a party, where "control" means ownership of more than 50% of voting securities or equivalent ownership interest.

"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by either party (the "Disclosing Party") to the other (the "Receiving Party"), whether orally, in writing, electronically, or by any other means, including but not limited to technical, financial, clinical, regulatory, commercial, and intellectual property information relating to the PTP-102 equine laminitis platform and related business opportunities.

"Representatives" means the receiving party's employees, officers, directors, agents, attorneys, accountants, advisors, consultants, contractors, and other representatives.

2. MUTUAL OBLIGATIONS
This is a mutual NDA. Each party may act as a Disclosing Party and as a Receiving Party. Each party agrees to hold all Confidential Information of the other party in strict confidence and not to disclose, publish, or disseminate it to any third party except as permitted herein.

3. PERMITTED USE AND DISCLOSURE
(a) The Receiving Party may use Confidential Information solely for the purpose of evaluating, negotiating, and potentially entering into a business relationship with the Disclosing Party (the "Project").
(b) The Receiving Party may disclose Confidential Information only to its Representatives who have a need to know and who are bound by confidentiality obligations no less protective than those contained herein. The Receiving Party shall remain liable for any breach by its Representatives.
(c) The Receiving Party shall not disclose Confidential Information to any competitor of the Disclosing Party or use it in any manner detrimental to the Disclosing Party.

4. PROTECTION PERIOD
Confidential Information may be exchanged for one (1) year from the Effective Date. Trade secrets shall be protected in perpetuity. All other Confidential Information shall be protected for a period of five (5) years from the date of disclosure.

5. RETURN / DESTRUCTION
Upon written request, the Receiving Party shall return or destroy all Confidential Information and copies within ten (10) business days, except for archival backup copies maintained in the ordinary course of business until routine deletion.

6. NO WARRANTY
All Confidential Information is provided "AS IS." Neither party makes any representation or warranty as to the accuracy, completeness, or usefulness of any Confidential Information.

7. REMEDIES
The parties acknowledge that any breach may cause irreparable harm for which monetary damages may be inadequate. The Disclosing Party shall be entitled to seek injunctive and other equitable relief without the necessity of posting a bond.

8. THIRD-PARTY BENEFICIARIES
Byrock Affiliates are express third-party beneficiaries of this Agreement and may enforce its terms directly.

9. GOVERNING LAW AND VENUE
This Agreement shall be governed by and construed in accordance with the laws of Ireland. The parties submit to the exclusive jurisdiction of the Courts of Ireland and waive any objection to venue or inconvenient forum.

10. COSTS AND ATTORNEYS' FEES
In any action to enforce this Agreement, the substantially prevailing party shall be entitled to recover its reasonable costs, including attorneys' fees, from the other party.

11. NOTICES
All notices to Byrock must be sent to info@byrocktechnologies.com or to such other address as may be designated in writing by Byrock.

12. COUNTERPARTS
This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one instrument.

13. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior agreements. Amendments must be in writing signed by both parties.

14. ELECTRONIC SIGNATURE
The parties agree that this Agreement may be executed by electronic signature, which shall have the same legal effect as an original handwritten signature.`;

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/assets/byrock-logo-full.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = splitText(doc, text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export async function generateNdaPdf(data: NdaPdfData): Promise<Blob> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;
  const lineHeight = 5;

  // Logo
  const logoDataUrl = await loadLogoDataUrl();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, y, 40, 16);
      y += 24;
    } catch {
      y += 8;
    }
  } else {
    y += 8;
  }

  // Header
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  y = addWrappedText(doc, 'Byrock Technologies Ltd · Augustine House, Oliver Bond Street, Dublin 8, Ireland · info@byrocktechnologies.com', margin, y, maxWidth, lineHeight);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Mutual Non-Disclosure Agreement v2.0', margin, y);
  y += 10;

  // Counterparty details
  doc.setFontSize(10);
  const details = [
    `Counterparty: ${data.companyName}`,
    `Entity Type: ${data.counterpartyEntityType}`,
    `Jurisdiction: ${data.counterpartyJurisdiction}`,
    `Address: ${data.counterpartyAddress}`,
    `Contact: ${data.counterpartyContactName}, ${data.counterpartyContactTitle}`,
    `Email: ${data.counterpartyContactEmail}`,
    `Project Purpose: ${data.projectPurpose}`,
    `Regions: ${data.projectRegions.join(', ')}`,
  ];
  for (const detail of details) {
    y = addWrappedText(doc, detail, margin, y, maxWidth, lineHeight);
    y += 2;
  }
  y += 6;

  // Agreement text
  const paragraphs = fullNdaText.split('\n\n');
  for (const paragraph of paragraphs) {
    const lines = splitText(doc, paragraph, maxWidth);
    if (y + lines.length * lineHeight > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 4;
  }

  // Signature blocks
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setFontSize(11);
  doc.text('COUNTERPARTY', margin, y);
  y += 8;
  doc.setFontSize(10);
  y = addWrappedText(doc, `Signed by: ${data.electronicSignature}`, margin, y, maxWidth, lineHeight);
  y = addWrappedText(doc, `Name: ${data.signerName}`, margin, y, maxWidth, lineHeight);
  y = addWrappedText(doc, `Title: ${data.signerTitle}`, margin, y, maxWidth, lineHeight);
  y = addWrappedText(doc, `Date: ${data.signatureDate}`, margin, y, maxWidth, lineHeight);

  if (data.adminSignature) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    y += 12;
    doc.setFontSize(11);
    doc.text('BYROCK TECHNOLOGIES LTD', margin, y);
    y += 8;
    doc.setFontSize(10);
    y = addWrappedText(doc, `Signed by: ${data.adminSignature.name}`, margin, y, maxWidth, lineHeight);
    y = addWrappedText(doc, `Title: ${data.adminSignature.title}`, margin, y, maxWidth, lineHeight);
    y = addWrappedText(doc, `Date: ${data.adminSignature.date}`, margin, y, maxWidth, lineHeight);
  }

  return doc.output('blob');
}
