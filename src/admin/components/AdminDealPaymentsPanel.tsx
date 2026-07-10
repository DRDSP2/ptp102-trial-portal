import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export function AdminDealPaymentsPanel() {
  const { client } = useAuth();
  const [licences, setLicences] = useState<LicencePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicences = useCallback(async () => {
    setLoading(true);
    const { data } = await client.from('licences').select('*').order('created_at', { ascending: false });
    setLicences((data as LicencePayment[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchLicences();
  }, [fetchLicences]);

  if (loading) return <div className="p-8 text-center">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deal Payments & Licences</h1>
      <Card>
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
                  <TableCell className="font-mono text-xs">{licence.stripe_payment_intent_id || '—'}</TableCell>
                  <TableCell>{licence.expires_at ? new Date(licence.expires_at).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
