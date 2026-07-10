import { useState } from 'react';
import { useTermSheet } from '@/deal-portal/hooks/useTermSheet';
import { TermSheetBuilder, type TermSheetForm } from '@/deal-portal/components/TermSheetBuilder';
import { TermSheetRedline } from '@/deal-portal/components/TermSheetRedline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TermSheetNegotiationPage() {
  const { termSheet, versions, loading, error, createTermSheet, proposeVersion } = useTermSheet();
  const [proposed, setProposed] = useState(false);

  const handlePropose = async (data: TermSheetForm) => {
    if (!termSheet) {
      const { error } = await createTermSheet(data);
      if (!error) setProposed(true);
      return;
    }

    const { error } = await proposeVersion(data as any, 'prospect');
    if (!error) setProposed(true);
  };

  if (loading) return <div className="p-8 text-center">Loading term sheet...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Term Sheet Negotiation</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {proposed && (
        <Alert>
          <AlertDescription>Your proposal has been submitted to Byrock.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TermSheetBuilder
          editable
          onPropose={handlePropose}
          initialValues={termSheet ? { region: termSheet.region || 'north_america', upfront_fee: termSheet.upfront_fee || 0, royalty_rate: termSheet.royalty_rate || 0, exclusivity_months: termSheet.exclusivity_months || 6, sublicensing_allowed: termSheet.sublicensing_allowed || false } : undefined}
        />

        <Card>
          <CardHeader>
            <CardTitle>Current Term Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            {termSheet ? (
              <div className="space-y-2 text-sm">
                <div>Status: <span className="font-medium capitalize">{termSheet.status}</span></div>
                <div>Region: <span className="font-medium uppercase">{termSheet.region}</span></div>
                <div>Version: <span className="font-medium">{termSheet.current_version}</span></div>
              </div>
            ) : (
              <div className="text-slate-500">No term sheet yet. Propose one to begin negotiation.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <TermSheetRedline versions={versions} />

      {termSheet && (
        <div className="flex justify-end">
          <Button onClick={() => setProposed(false)} variant="outline">
            Revise Proposal
          </Button>
        </div>
      )}
    </div>
  );
}
