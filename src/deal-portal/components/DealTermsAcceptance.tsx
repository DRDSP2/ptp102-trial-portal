import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function DealTermsAcceptance() {
  const navigate = useNavigate();
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleContinue = () => {
    if (tosAccepted && privacyAccepted) {
      navigate('/deal/nda');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-12">
      <CardHeader>
        <CardTitle>Terms of Service &amp; Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-48 overflow-y-auto border rounded p-4 text-sm text-slate-600 bg-slate-50">
          <strong>Terms of Service</strong>
          <p className="mt-2">
            The Service is for authorised veterinary pharmaceutical, device, and
            clinical-trial partners. By accessing the Byrock Clinical Ltd deal
            room you agree to keep all materials strictly confidential, not to
            reproduce or distribute documents without written permission, and to
            use information solely for the purpose of evaluating a potential
            transaction with Byrock Clinical Ltd.
          </p>
          <p className="mt-2">
            Byrock Clinical Ltd reserves the right to revoke access at any time
            for violation of these terms or applicable law.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={tosAccepted}
            onCheckedChange={(c) => setTosAccepted(c === true)}
            id="tos"
          />
          <label htmlFor="tos" className="text-sm">
            I accept the Terms of Service
          </label>
        </div>
        <div className="h-32 overflow-y-auto border rounded p-4 text-sm text-slate-600 bg-slate-50">
          <strong>Privacy Policy</strong>
          <p className="mt-2">
            We respect your privacy and are committed to protecting personal
            data. Information you provide is used to verify identity, manage
            access tiers, and communicate about the transaction. We do not sell
            personal data. All access is logged for compliance and audit
            purposes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={privacyAccepted}
            onCheckedChange={(c) => setPrivacyAccepted(c === true)}
            id="privacy"
          />
          <label htmlFor="privacy" className="text-sm">
            I accept the Privacy Policy
          </label>
        </div>
        <Button
          onClick={handleContinue}
          disabled={!tosAccepted || !privacyAccepted}
          className="w-full"
        >
          Continue to NDA
        </Button>
      </CardContent>
    </Card>
  );
}
