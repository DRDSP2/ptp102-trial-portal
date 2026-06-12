import { ByrockLogo } from './ByrockLogo';
import { STUDY_ID, STUDY_TITLE, SPONSOR_NAME } from '@/lib/auditTypes';

export type ConsentValues = {
  fullName?: string;
  email?: string;
  licenseNumber?: string;
  hospitalAffiliation?: string;
  signatureText?: string;
};

export type PrintConsentProps = {
  values: ConsentValues;
  printedAt?: string | null;
};

export function PrintConsent({ values, printedAt }: PrintConsentProps) {
  const printDate = printedAt ? new Date(printedAt).toISOString() : '—';
  const signatureDate = values.signatureText ? new Date().toLocaleDateString() : '—';

  return (
    <div className="bg-white text-black p-8">
      <div className="flex justify-center mb-6">
        <ByrockLogo variant="full" height={60} />
      </div>

      <h1 className="text-2xl font-bold text-center mb-2">{STUDY_TITLE}</h1>
      <p className="text-center text-sm mb-6">Investigational Drug Use Agreement</p>

      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <strong>Study ID:</strong> {STUDY_ID}
        </div>
        <div>
          <strong>Sponsor:</strong> {SPONSOR_NAME}
        </div>
        <div>
          <strong>Principal Investigator:</strong> Principal Investigator
        </div>
        <div>
          <strong>Facility:</strong> Study Facility
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <section>
          <h4 className="font-bold mb-1">1. INVESTIGATIONAL STATUS</h4>
          <p>
            PTP-102 is an investigational veterinary pharmaceutical product currently under clinical evaluation. This
            drug has not been approved by the FDA, USDA, or any other regulatory authority for veterinary use. The
            safety and efficacy profiles are still being established through controlled clinical trials.
          </p>
        </section>

        <section>
          <h4 className="font-bold mb-1">2. RISK ACKNOWLEDGMENT</h4>
          <p>As the treating veterinarian, you acknowledge that administration of PTP-102 carries inherent risks including, but not limited to:</p>
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>Unknown adverse reactions or side effects</li>
            <li>Drug interactions with concurrent medications</li>
            <li>Potential lack of therapeutic efficacy</li>
            <li>Unpredicted systemic or local reactions</li>
            <li>Long-term effects that may not yet be characterized</li>
          </ul>
        </section>

        <section>
          <h4 className="font-bold mb-1">3. TOXICITY RESEARCH</h4>
          <p>
            While robust toxicity research has been conducted in humans demonstrating excellent tolerance, species-specific
            responses in equines may differ. The available safety data cannot guarantee the absence of adverse effects in
            horses with laminitis.
          </p>
        </section>

        <section>
          <h4 className="font-bold mb-1">4. LIABILITY</h4>
          <p>By accepting these terms, you acknowledge that:</p>
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>You assume full professional liability for the administration of PTP-102</li>
            <li>You will obtain informed consent from horse owners prior to enrollment</li>
            <li>You will immediately report any adverse events or unexpected outcomes</li>
            <li>You will adhere strictly to the 72-hour protocol guidelines</li>
            <li>You maintain appropriate professional liability insurance</li>
          </ul>
        </section>

        <section>
          <h4 className="font-bold mb-1">5. PROTOCOL COMPLIANCE</h4>
          <p>
            You agree to follow all trial protocols, maintain accurate records, report data truthfully, and participate in
            any required safety monitoring or follow-up assessments.
          </p>
        </section>

        <section>
          <h4 className="font-bold mb-1">6. DATA USE</h4>
          <p>
            Clinical data collected during this trial may be used for regulatory submissions, scientific publications, and
            continuing research. Patient identifiers will be protected in accordance with applicable privacy regulations.
          </p>
        </section>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="font-bold">Veterinarian Name</p>
          <p className="border-b border-black h-6 mt-1">{values.fullName || ''}</p>
        </div>
        <div>
          <p className="font-bold">Email</p>
          <p className="border-b border-black h-6 mt-1">{values.email || ''}</p>
        </div>
        <div>
          <p className="font-bold">License Number</p>
          <p className="border-b border-black h-6 mt-1">{values.licenseNumber || ''}</p>
        </div>
        <div>
          <p className="font-bold">Hospital Affiliation</p>
          <p className="border-b border-black h-6 mt-1">{values.hospitalAffiliation || ''}</p>
        </div>
        <div>
          <p className="font-bold">Digital Signature</p>
          <p className="border-b border-black h-6 mt-1">{values.signatureText || ''}</p>
        </div>
        <div>
          <p className="font-bold">Date Signed</p>
          <p className="border-b border-black h-6 mt-1">{signatureDate}</p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-600">Printed at: {printDate}</p>
    </div>
  );
}
