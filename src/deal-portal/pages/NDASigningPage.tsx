import { useState } from 'react';

import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NDA_ACKNOWLEDGEMENTS } from '@/deal-portal/lib/ndaAcknowledgements';
import { generateNdaPdf } from '@/deal-portal/lib/ndaPdf';
import {
  sendNdaPendingAdminEmail,
  sendNdaPendingInvestorEmail,
} from '@/deal-portal/lib/ndaEmail';
import type { Region } from '@/deal-portal/types/dealPortal';

const REGIONS: { value: Region; label: string }[] = [
  { value: 'north_america', label: 'North America' },
  { value: 'eu', label: 'EU' },
  { value: 'uk', label: 'UK' },
  { value: 'uae', label: 'UAE' },
  { value: 'apac', label: 'APAC' },
  { value: 'global', label: 'Global' },
];

const requiredAck = (label: string) =>
  z.boolean().refine((val) => val === true, { message: `${label} is required` });

const ndaSchema = z.object({
  // Step 1 — Entity details
  companyName: z.string().min(2, 'Legal entity name is required'),
  counterpartyEntityType: z.string().min(1, 'Entity type is required'),
  counterpartyJurisdiction: z.string().min(2, 'Jurisdiction is required'),
  counterpartyAddress: z.string().min(10, 'Full registered address is required'),
  counterpartyContactEmail: z.string().email('A valid contact email is required'),
  counterpartyContactName: z.string().min(2, 'Contact name is required'),
  counterpartyContactTitle: z.string().min(2, 'Contact title is required'),
  hasAffiliates: z.boolean().default(false),
  affiliateNames: z.string().optional(),
  representativeCount: z.string().min(1, 'Representative count is required'),
  projectPurpose: z.string().min(10, 'Project purpose is required'),
  projectRegions: z.array(z.string()).min(1, 'Select at least one region'),

  // Step 3 — Legal acknowledgements (all 19 required)
  ack_mutual_nda: requiredAck('Mutual NDA acknowledgement'),
  ack_affiliates: requiredAck('Affiliates acknowledgement'),
  ack_representatives: requiredAck('Representatives acknowledgement'),
  ack_trade_secrets: requiredAck('Trade secrets acknowledgement'),
  ack_no_competitor: requiredAck('No competitor disclosure acknowledgement'),
  ack_return_destruction: requiredAck('Return/destruction acknowledgement'),
  ack_equitable_relief: requiredAck('Equitable relief acknowledgement'),
  ack_irish_law: requiredAck('Irish law acknowledgement'),
  ack_no_warranty: requiredAck('No warranty acknowledgement'),
  ack_third_party_beneficiaries: requiredAck('Third-party beneficiaries acknowledgement'),
  ack_one_year_exchange: requiredAck('One-year exchange acknowledgement'),
  ack_five_year_protection: requiredAck('Five-year protection acknowledgement'),
  ack_perpetuity_trade_secrets: requiredAck('Perpetual trade secrets acknowledgement'),
  ack_backup_retention: requiredAck('Backup retention acknowledgement'),
  ack_notices: requiredAck('Notices acknowledgement'),
  ack_counterparts: requiredAck('Counterparts acknowledgement'),
  ack_entire_agreement: requiredAck('Entire agreement acknowledgement'),
  ack_attorneys_fees: requiredAck('Attorneys\' fees acknowledgement'),
  ack_inconvenient_forum: requiredAck('Inconvenient forum acknowledgement'),

  // Step 4 — Execution
  signerName: z.string().min(2, 'Signer full name is required'),
  signerTitle: z.string().min(2, 'Signer title is required'),
  signatureDate: z.string().min(1, 'Signature date is required'),
  electronicSignature: z.string().min(2, 'Electronic signature is required'),
});

type NDAValues = {
  companyName: string;
  counterpartyEntityType: string;
  counterpartyJurisdiction: string;
  counterpartyAddress: string;
  counterpartyContactEmail: string;
  counterpartyContactName: string;
  counterpartyContactTitle: string;
  hasAffiliates: boolean;
  affiliateNames?: string;
  representativeCount: string;
  projectPurpose: string;
  projectRegions: string[];
  ack_mutual_nda: boolean;
  ack_affiliates: boolean;
  ack_representatives: boolean;
  ack_trade_secrets: boolean;
  ack_no_competitor: boolean;
  ack_return_destruction: boolean;
  ack_equitable_relief: boolean;
  ack_irish_law: boolean;
  ack_no_warranty: boolean;
  ack_third_party_beneficiaries: boolean;
  ack_one_year_exchange: boolean;
  ack_five_year_protection: boolean;
  ack_perpetuity_trade_secrets: boolean;
  ack_backup_retention: boolean;
  ack_notices: boolean;
  ack_counterparts: boolean;
  ack_entire_agreement: boolean;
  ack_attorneys_fees: boolean;
  ack_inconvenient_forum: boolean;
  signerName: string;
  signerTitle: string;
  signatureDate: string;
  electronicSignature: string;
};

const defaultValues: Partial<NDAValues> = {
  companyName: '',
  counterpartyEntityType: '',
  counterpartyJurisdiction: '',
  counterpartyAddress: '',
  counterpartyContactEmail: '',
  counterpartyContactName: '',
  counterpartyContactTitle: '',
  hasAffiliates: false,
  affiliateNames: '',
  representativeCount: '1-5',
  projectPurpose: '',
  projectRegions: [],
  signerName: '',
  signerTitle: '',
  signatureDate: new Date().toISOString().split('T')[0],
  electronicSignature: '',
  ...Object.fromEntries(NDA_ACKNOWLEDGEMENTS.map((ack) => [ack.id, false])),
};

export function NDASigningPage() {
  const { user, client, loading: authLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<NDAValues>({
    resolver: zodResolver(ndaSchema) as Resolver<NDAValues>,
    defaultValues: defaultValues as NDAValues,
    mode: 'onChange',
  });

  const hasAffiliates = useWatch({ control: form.control, name: 'hasAffiliates', defaultValue: false });

  const goToStep = async (target: 1 | 2 | 3 | 4) => {
    setError(null);
    if (target > step) {
      const fieldsToValidate: Record<1 | 2 | 3 | 4, (keyof NDAValues)[]> = {
        1: [],
        2: [
          'companyName',
          'counterpartyEntityType',
          'counterpartyJurisdiction',
          'counterpartyAddress',
          'counterpartyContactEmail',
          'counterpartyContactName',
          'counterpartyContactTitle',
          'representativeCount',
          'projectPurpose',
          'projectRegions',
        ],
        3: [],
        4: NDA_ACKNOWLEDGEMENTS.map((ack) => ack.id as keyof NDAValues),
      };
      const ok = await form.trigger(fieldsToValidate[target] as (keyof NDAValues)[]);
      if (!ok) {
        setError('Please complete all required fields before continuing.');
        return;
      }
      if (step === 1 && hasAffiliates && !form.getValues('affiliateNames')) {
        setError('Please list affiliate names or uncheck the affiliates box.');
        return;
      }
    }
    setStep(target);
  };

  const onSubmit = async (values: NDAValues) => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!user) {
        setError('You must be signed in to sign the NDA.');
        return;
      }

      const signedAt = new Date().toISOString();
      const ackRecord: Record<string, boolean> = {};
      for (const ack of NDA_ACKNOWLEDGEMENTS) {
        ackRecord[ack.id] = values[ack.id as keyof NDAValues] as boolean;
      }

      // Generate the signed PDF (investor signature only at this stage)
      const pdfBlob = await generateNdaPdf({
        companyName: values.companyName,
        counterpartyEntityType: values.counterpartyEntityType,
        counterpartyJurisdiction: values.counterpartyJurisdiction,
        counterpartyAddress: values.counterpartyAddress,
        counterpartyContactEmail: values.counterpartyContactEmail,
        counterpartyContactName: values.counterpartyContactName,
        counterpartyContactTitle: values.counterpartyContactTitle,
        projectPurpose: values.projectPurpose,
        projectRegions: values.projectRegions,
        signerName: values.signerName,
        signerTitle: values.signerTitle,
        signatureDate: values.signatureDate,
        electronicSignature: values.electronicSignature,
      });

      const pdfPath = `ndas/${user.id}/${Date.now()}_nda.pdf`;
      const { error: uploadError } = await client.storage
        .from('deal-room-documents')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) {
        setError('Failed to store signed NDA PDF: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = client.storage
        .from('deal-room-documents')
        .getPublicUrl(pdfPath);
      const pdfUrl = publicUrlData.publicUrl;

      const { error: dbError } = await client.from('ndas').insert({
        user_id: user.id,
        template_version: 'v2.0-byrock',
        company_name: values.companyName,
        signed_at: signedAt,
        status: 'signed',
        approval_status: 'pending',
        investor_email: values.counterpartyContactEmail,
        signed_pdf_path: pdfPath,
        counterparty_entity_type: values.counterpartyEntityType,
        counterparty_jurisdiction: values.counterpartyJurisdiction,
        counterparty_address: values.counterpartyAddress,
        counterparty_contact_email: values.counterpartyContactEmail,
        counterparty_contact_name: values.counterpartyContactName,
        counterparty_contact_title: values.counterpartyContactTitle,
        has_affiliates: values.hasAffiliates,
        affiliate_names: values.hasAffiliates ? values.affiliateNames || '' : '',
        representative_count: values.representativeCount,
        project_purpose: values.projectPurpose,
        project_regions: values.projectRegions,
        signer_name: values.signerName,
        signer_title: values.signerTitle,
        signature_date: values.signatureDate,
        electronic_signature: values.electronicSignature,
        governing_law: 'Ireland',
        venue: 'Dublin, Ireland',
        company_notice_email: 'info@byrocktechnologies.com',
        ...ackRecord,
      });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Audit log entry
      await client.from('deal_access_logs').insert({
        user_id: user.id,
        action: 'view',
        document_type: 'nda',
        action_detail: 'NDA v2.0 signed and pending approval',
      });

      const reviewUrl = `${window.location.origin}/#/deal/users`;

      await Promise.all([
        sendNdaPendingAdminEmail({
          investorEmail: values.counterpartyContactEmail,
          companyName: values.companyName,
          reviewUrl,
          pdfUrl,
        }),
        sendNdaPendingInvestorEmail({
          toEmail: values.counterpartyContactEmail,
          companyName: values.companyName,
        }),
      ]);

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NDA signing failed');
    } finally {
      setIsSubmitting(false);
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>NDA Submitted for Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Thank you for signing the Mutual Non-Disclosure Agreement. Your Byrock deal portal application is being reviewed and we will inform you once it has been approved or declined in the coming days.
            </p>
            <p className="text-sm text-muted-foreground">
              A copy of your signed NDA has been emailed to {form.getValues('counterpartyContactEmail')}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Mutual Non-Disclosure Agreement v2.0</CardTitle>
          <p className="text-sm text-muted-foreground">
            Step {step} of 4 — {step === 1 ? 'Entity Details' : step === 2 ? 'Agreement Review' : step === 3 ? 'Legal Acknowledgements' : 'Electronic Signature'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Counterparty Legal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Pharma, Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="counterpartyEntityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Corporation">Corporation</SelectItem>
                              <SelectItem value="LLC">LLC</SelectItem>
                              <SelectItem value="Partnership">Partnership</SelectItem>
                              <SelectItem value="LP">LP</SelectItem>
                              <SelectItem value="Trust">Trust</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="counterpartyJurisdiction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jurisdiction of Formation</FormLabel>
                          <FormControl>
                            <Input placeholder="Ireland" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="counterpartyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Registered Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Street, city, state/province, postal code, country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="counterpartyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="counterpartyContactTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Chief Business Officer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="counterpartyContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane.doe@acmepharma.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasAffiliates"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">The Counterparty has Affiliates that will receive Confidential Information.</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasAffiliates && (
                    <FormField
                      control={form.control}
                      name="affiliateNames"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Affiliate Names</FormLabel>
                          <FormControl>
                            <Textarea placeholder="List all affiliates that will receive Confidential Information" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="representativeCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Number of Representatives</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-5">1–5</SelectItem>
                            <SelectItem value="6-15">6–15</SelectItem>
                            <SelectItem value="16-50">16–50</SelectItem>
                            <SelectItem value="50+">50+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Purpose</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the purpose for which Confidential Information will be exchanged" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectRegions"
                    render={() => (
                      <FormItem>
                        <FormLabel>Regions of Interest</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {REGIONS.map((region) => (
                            <FormField
                              key={region.value}
                              control={form.control}
                              name="projectRegions"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(region.value)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, region.value]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== region.value));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">{region.label}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      This is a legally binding Mutual NDA. Please read the entire agreement carefully before proceeding.
                    </AlertDescription>
                  </Alert>
                  <ScrollArea className="h-96 border rounded p-4 text-sm text-slate-700 bg-slate-50 whitespace-pre-line">
                    {fullNdaText}
                  </ScrollArea>
                  <Button type="button" className="w-full" onClick={() => goToStep(3)}>
                    I Have Read the Agreement
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Each acknowledgement below is legally required. You must check all boxes to execute the NDA.
                  </p>
                  {NDA_ACKNOWLEDGEMENTS.map((ack) => (
                    <FormField
                      key={ack.id}
                      control={form.control}
                      name={ack.id as keyof NDAValues}
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm leading-5">{ack.label}</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="rounded border bg-slate-50 p-4 text-sm space-y-1">
                    {(() => {
                      const values = form.getValues();
                      return (
                        <>
                          <p><strong>Counterparty:</strong> {values.companyName}</p>
                          <p><strong>Entity Type:</strong> {values.counterpartyEntityType}</p>
                          <p><strong>Jurisdiction:</strong> {values.counterpartyJurisdiction}</p>
                          <p><strong>Contact:</strong> {values.counterpartyContactName}, {values.counterpartyContactTitle}</p>
                          <p><strong>Project:</strong> {values.projectPurpose}</p>
                          <p><strong>Regions:</strong> {values.projectRegions?.map((r) => REGIONS.find((x) => x.value === r)?.label || r).join(', ')}</p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="signerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signer Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="signerTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signer Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Chief Executive Officer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="signatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electronicSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electronic Signature</FormLabel>
                        <FormControl>
                          <Input placeholder="Type your full legal name to sign" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => goToStep((step - 1) as 1 | 2 | 3 | 4)}>
                    Back
                  </Button>
                )}
                {step < 4 && (
                  <Button type="button" className="ml-auto" onClick={() => goToStep((step + 1) as 1 | 2 | 3 | 4)}>
                    Continue
                  </Button>
                )}
                {step === 4 && (
                  <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Executing...' : 'Execute Mutual NDA'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
