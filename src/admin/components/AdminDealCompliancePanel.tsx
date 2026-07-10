import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComplianceItem {
  id: string;
  area: string;
  details: string | null;
  legal_reference: string | null;
  owner: string | null;
  status: 'pending' | 'complete' | 'overdue';
  evidence_url: string | null;
  review_date: string | null;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  complete: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
};

export function AdminDealCompliancePanel() {
  const { client } = useAuth();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await client.from('compliance_register').select('*').order('area');
    setItems((data as ComplianceItem[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div className="p-8 text-center">Loading compliance register...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deal Compliance Register</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Legal Reference</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.area}</TableCell>
                  <TableCell>{item.details || '—'}</TableCell>
                  <TableCell>{item.legal_reference || '—'}</TableCell>
                  <TableCell>{item.owner || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyles[item.status]}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.review_date ? new Date(item.review_date).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
