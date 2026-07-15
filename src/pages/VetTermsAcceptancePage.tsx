import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { ByrockLogo } from '@/components/ByrockLogo';

export function VetTermsAcceptancePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [investigational, setInvestigational] = useState(false);
  const [risk, setRisk] = useState(false);
  const [liability, setLiability] = useState(false);
  const [noConflict, setNoConflict] = useState(false);
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.role !== 'vet') {
      navigate('/vet/login', { replace: true });
    } else if (auth.termsAccepted) {
      navigate('/dashboard', { replace: true });
    } else if (auth.pendingApproval) {
      navigate('/vet/pending', { replace: true });
    }
  }, [auth, navigate]);

  const canAccept =
    investigational && risk && liability && noConflict && signature.trim().length >= 2;

  const handleAccept = async () => {
    if (!canAccept) return;
    setIsSubmitting(true);
    try {
      await auth.acceptTerms();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('acceptTerms failed', err);
      setIsSubmitting(false);
    }
  };

  if (auth.isLoading || auth.role !== 'vet' || auth.termsAccepted || auth.pendingApproval) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-center p-4">
      <div className="w-full flex flex-col items-center">
        <div className="mb-6">
          <ByrockLogo variant="full" height={48} />
        </div>
        <Card className="max-w-4xl w-full shadow-xl">
          <CardHeader className="bg-neutral text-neutral-content rounded-t-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <div>
                <CardTitle className="text-2xl">PTP-102 Laminitis Trial - Terms & Conditions</CardTitle>
                <p className="text-neutral-content/60 text-sm mt-1">Please review and accept to continue</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-900">IMPORTANT NOTICE</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    PTP-102 is an investigational drug not yet approved by regulatory authorities. By participating in this trial, you acknowledge and accept
                    specific responsibilities and risks.
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-56 border rounded-lg p-4 bg-base-100">
              <div className="space-y-4 text-sm">
                <section>
                  <h4 className="font-semibold text-base mb-2">1. INVESTIGATIONAL STATUS</h4>
                  <p className="text-base-content/80">
                    PTP-102 is an investigational veterinary pharmaceutical product currently under clinical evaluation. This drug has not been approved by the FDA,
                    USDA, or any other regulatory authority for veterinary use. The safety and efficacy profiles are still being established through controlled
                    clinical trials.
                  </p>
                </section>
                <section>
                  <h4 className="font-semibold text-base mb-2">2. RISK ACKNOWLEDGMENT</h4>
                  <p className="text-base-content/80">
                    As the treating veterinarian, you acknowledge that administration of PTP-102 carries inherent risks including, but not limited to: unknown adverse
                    reactions, drug interactions, potential lack of therapeutic efficacy, and unpredicted systemic or local reactions.
                  </p>
                </section>
                <section>
                  <h4 className="font-semibold text-base mb-2">3. LIABILITY</h4>
                  <p className="text-base-content/80">
                    You assume full professional liability for the administration of PTP-102, will obtain informed consent from horse owners, will immediately report
                    any adverse events, and will adhere strictly to the 72-hour protocol guidelines.
                  </p>
                </section>
                <section>
                  <h4 className="font-semibold text-base mb-2">4. PROTOCOL COMPLIANCE & DATA USE</h4>
                  <p className="text-base-content/80">
                    You agree to follow all trial protocols, maintain accurate records, report data truthfully, and participate in required safety monitoring. Clinical
                    data may be used for regulatory submissions, scientific publications, and continuing research in accordance with applicable privacy regulations.
                  </p>
                </section>
              </div>
            </ScrollArea>

            <div className="space-y-4 border-t pt-4 bg-base-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-base-content/80 mb-3">Required Acknowledgments *</p>

              <label className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-base-100 cursor-pointer">
                <Checkbox data-testid="vet-terms-investigational" checked={investigational} onCheckedChange={(v) => setInvestigational(v === true)} />
                <span className="leading-none">
                  I acknowledge that PTP-102 is an <strong>investigational drug</strong> not approved by regulatory authorities
                </span>
                {investigational && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-auto" />}
              </label>

              <label className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-base-100 cursor-pointer">
                <Checkbox data-testid="vet-terms-risk" checked={risk} onCheckedChange={(v) => setRisk(v === true)} />
                <span className="leading-none">
                  I accept <strong>all treatment risks</strong> associated with administering this investigational compound
                </span>
                {risk && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-auto" />}
              </label>

              <label className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-base-100 cursor-pointer">
                <Checkbox data-testid="vet-terms-liability" checked={liability} onCheckedChange={(v) => setLiability(v === true)} />
                <span className="leading-none">
                  I acknowledge that <strong>professional liability is mine</strong> and I maintain appropriate insurance coverage
                </span>
                {liability && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-auto" />}
              </label>

              <label className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg bg-base-100 cursor-pointer">
                <Checkbox data-testid="vet-terms-no-conflict" checked={noConflict} onCheckedChange={(v) => setNoConflict(v === true)} />
                <span className="leading-none">
                  I confirm that <strong>I have no conflicts of interest</strong> in relation to PTP-102, Byrock Technologies Ltd., or this clinical trial
                </span>
                {noConflict && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-auto" />}
              </label>

              <div>
                <label className="font-medium text-sm" htmlFor="vet-terms-signature">Digital Signature *</label>
                <Input
                  id="vet-terms-signature"
                  data-testid="vet-terms-signature-text"
                  placeholder="Type your full name to sign"
                  className="font-serif text-lg mt-1"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <p className="text-xs text-base-content/60 mt-1">By typing your name, you are providing a legally binding electronic signature</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate('/vet/login')}>
                Back to Login
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print / Save as PDF
                </Button>
                <Button
                  data-testid="vet-terms-accept"
                  type="button"
                  size="lg"
                  disabled={!canAccept || isSubmitting}
                  className="min-w-[200px]"
                  onClick={handleAccept}
                >
                  {isSubmitting ? 'Processing...' : 'Accept Terms & Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
