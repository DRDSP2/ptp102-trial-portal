import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/deal-portal/lib/dealPortalUtils';

interface LicencePayment {
  id: string;
  region: string;
  fee_paid: boolean;
  fee_amount: number | null;
  stripe_payment_intent_id: string | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
}

interface LicenceRequestRow {
  id: string;
  region: string | null;
  requested_by: string;
  status: string;
  created_at: string;
}

export function AdminDealPaymentsPanel() {
  const { client } = useAuth();
  const [licences, setLicences] = useState<LicencePayment[]>([]);
  const [requests, setRequests] = useState<LicenceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLicences = useCallback(async () => {
    const { data } = await client.from('licences').select('*').order('created_at', { ascending: false });
    setLicences((data as LicencePayment[]) || []);
  }, [client]);

  const fetchRequests = useCallback(async () => {
    const { data } = await client
      .from('licence_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as LicenceRequestRow[]) || []);
  }, [client]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchLicences(), fetchRequests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetchLicences, fetchRequests]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    setError(null);
    const { data, error: rpcErr } = await client.rpc('issue_licence', {
      p_request_id: id,
      p_approve: true,
      p_notes: '',
    });
    if (rpcErr || !data?.ok) {
      setError(`Approval failed: ${rpcErr?.message ?? data?.error ?? 'unknown'}`);
      setUpdatingId(null);
      return;
    }
    if (data.status === 'approved' && data.certificate_id) {
      const { error: fnErr } = await supabase.functions.invoke('generate-licence-certificate', {
        body: { certificate_id: data.certificate_id },
      });
      if (fnErr) {
        setError(`Licence issued, but certificate PDF generation failed: ${fnErr.message}`);
      }
    }
    await refreshAll();
    setUpdatingId(null);
  };

  const handleReject = async (id: string) => {
    setUpdatingId(id);
    setError(null);
    const { data, error: rpcErr } = await client.rpc('issue_licence', {
      p_request_id: id,
      p_approve: false,
    });
    if (rpcErr || !data?.ok) {
      setError(`Rejection failed: ${rpcErr?.message ?? data?.error ?? 'unknown'}`);
      setUpdatingId(null);
      return;
    }
    await refreshAll();
    setUpdatingId(null);
  };

  if (loading) return <div className="p-8 text-center">Loading payments…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deal Payments &amp; Licences</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Licence Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No licence requests.
                  </TableCell>
                </TableRow>
              )}
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="uppercase">{r.region ?? 'global'}</TableCell>
                  <TableCell className="font-mono text-xs">{r.requested_by}</TableCell>
                  <TableCell>
                    <Badge>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          disabled={updatingId === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === r.id}
                          onClick={() => handleReject(r.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issued Licences</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Stripe Payment Intent</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licences.map((licence) => (
                <TableRow key={licence.id}>
                  <TableCell className="uppercase">{licence.region}</TableCell>
                  <TableCell>
                    <Badge>{licence.status}</Badge>
                  </TableCell>
                  <TableCell>{licence.fee_amount ? formatCurrency(licence.fee_amount) : '—'}</TableCell>
                  <TableCell>{licence.fee_paid ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {licence.stripe_payment_intent_id || '—'}
                  </TableCell>
                  <TableCell>
                    {licence.expires_at ? new Date(licence.expires_at).toLocaleDateString() : '—'}
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
