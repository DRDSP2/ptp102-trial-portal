import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutateAction } from '@uibakery/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/deal-portal/lib/dealPortalUtils';
import type { OfferRequest } from '@/deal-portal/types/dealPortal';
import createAuditLogAction from '@/actions/createAuditLog';

const REGIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'eu', label: 'European Union' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'uae', label: 'UAE' },
  { value: 'apac', label: 'APAC' },
  { value: 'global', label: 'Global' },
] as const;

const OFFER_TYPES = [
  { value: 'licence', label: 'Licence' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'investment', label: 'Investment' },
] as const;

const STATUS_LABEL: Record<OfferRequest['status'], string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function OfferSubmissionPage() {
  const { client, user, role } = useAuth();
  const [createAuditLog] = useMutateAction(createAuditLogAction);

  const [region, setRegion] = useState<string>('north_america');
  const [offerType, setOfferType] = useState<string>('licence');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [message, setMessage] = useState<string>('');

  const [offers, setOffers] = useState<OfferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: qErr } = await client
      .from('offer_requests')
      .select('*')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });
    if (qErr) setError(qErr.message);
    else setOffers((data as OfferRequest[]) || []);
    setLoading(false);
  }, [client, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    if (!region || !offerType) {
      setError('Select a region and offer type.');
      return;
    }
    const numericAmount = offerType === 'investment' ? Number(amount) : null;
    if (offerType === 'investment' && (!numericAmount || numericAmount <= 0)) {
      setError('Enter a valid investment amount.');
      return;
    }
    setSubmitting(true);
    const { data, error: insErr } = await client
      .from('offer_requests')
      .insert({
        applicant_id: user.id,
        applicant_email: user.email ?? '',
        applicant_role: role ?? null,
        region,
        offer_type: offerType,
        amount: numericAmount,
        currency,
        message: message.trim() || null,
        status: 'submitted',
      })
      .select()
      .single();
    setSubmitting(false);
    if (insErr || !data) {
      setError(insErr?.message ?? 'Failed to submit offer.');
      return;
    }
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: role,
      action: 'SUBMIT',
      entityType: 'offer_requests',
      entityId: (data as OfferRequest).id,
      fieldName: 'status',
      oldValue: null,
      newValue: JSON.stringify({ region, offerType, amount: numericAmount, currency }),
      reasonForChange: 'Offer submitted for admin review',
      ipAddress: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      sessionId: null,
    }).catch(() => {});
    setSuccess('Offer submitted for admin review.');
    setMessage('');
    setAmount('');
    await refresh();
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Submit an Offer</h1>
      <p className="text-sm text-muted-foreground">
        Select a region and offer type, then submit it for admin review. You can track
        the status of your submissions below.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Offer Type</label>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {offerType === 'investment' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Investment Amount</label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 250000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Message / Terms</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the offer, exclusivity, or any terms you would like considered."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Offer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500">
                      No offers submitted yet.
                    </TableCell>
                  </TableRow>
                )}
                {offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="uppercase">{o.region}</TableCell>
                    <TableCell className="capitalize">{o.offer_type}</TableCell>
                    <TableCell>
                      {o.amount != null ? formatCurrency(Number(o.amount), o.currency ?? 'USD') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge>{STATUS_LABEL[o.status]}</Badge>
                    </TableCell>
                    <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
