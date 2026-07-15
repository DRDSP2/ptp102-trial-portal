import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutateAction } from '@uibakery/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/deal-portal/lib/dealPortalUtils';
import type { OfferRequest } from '@/deal-portal/types/dealPortal';
import createAuditLogAction from '@/actions/createAuditLog';

const STATUS_LABEL: Record<OfferRequest['status'], string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function AdminOfferReviewPanel() {
  const { client, user } = useAuth();
  const [createAuditLog] = useMutateAction(createAuditLogAction);

  const [offers, setOffers] = useState<OfferRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await client
      .from('offer_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (qErr) setError(qErr.message);
    else setOffers((data as OfferRequest[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const review = async (id: string, status: 'under_review' | 'approved' | 'rejected') => {
    setUpdatingId(id);
    setError(null);
    const { error: updErr } = await client
      .from('offer_requests')
      .update({
        status,
        reviewer_notes: notes[id]?.trim() || null,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updErr) {
      setError(updErr.message);
      setUpdatingId(null);
      return;
    }
    await createAuditLog({
      userId: user?.id ?? null,
      userEmail: user?.email,
      userRole: 'admin',
      action: status === 'approved' ? 'APPROVE' : status === 'rejected' ? 'REJECT' : 'UPDATE',
      entityType: 'offer_requests',
      entityId: id,
      fieldName: 'status',
      oldValue: null,
      newValue: JSON.stringify({ status, reviewer_notes: notes[id]?.trim() || null }),
      reasonForChange: 'Admin reviewed offer',
      ipAddress: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      sessionId: null,
    }).catch(() => {});
    await refresh();
    setUpdatingId(null);
  };

  if (loading) return <div className="p-8 text-center">Loading offers…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Offer Review</h2>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    No offers submitted.
                  </TableCell>
                </TableRow>
              )}
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="uppercase">{o.region}</TableCell>
                  <TableCell className="capitalize">{o.offer_type}</TableCell>
                  <TableCell className="font-mono text-xs">{o.applicant_email}</TableCell>
                  <TableCell>
                    {o.amount != null ? formatCurrency(Number(o.amount), o.currency ?? 'USD') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge>{STATUS_LABEL[o.status]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <Textarea
                      value={notes[o.id] ?? o.reviewer_notes ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [o.id]: e.target.value }))}
                      rows={2}
                      placeholder="Reviewer notes"
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {o.status !== 'under_review' && o.status !== 'approved' && o.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === o.id}
                        onClick={() => review(o.id, 'under_review')}
                      >
                        Start Review
                      </Button>
                    )}
                    {o.status !== 'approved' && (
                      <Button
                        size="sm"
                        disabled={updatingId === o.id}
                        onClick={() => review(o.id, 'approved')}
                      >
                        Approve
                      </Button>
                    )}
                    {o.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingId === o.id}
                        onClick={() => review(o.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
