import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';

interface PipelineEntry {
  id: string;
  region: string;
  licensee: string | null;
  status: string;
  stage: string;
}

const statusStyles: Record<string, string> = {
  available: 'bg-slate-100 text-slate-700',
  evaluation: 'bg-yellow-50 text-yellow-700',
  due_diligence: 'bg-blue-50 text-blue-700',
  term_sheet: 'bg-purple-50 text-purple-700',
  executed: 'bg-green-50 text-green-700',
};

export function DealPipeline() {
  const { client } = useAuth();
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.from('deal_pipeline_entries').select('*').order('created_at').then(({ data }) => {
      setPipeline((data as PipelineEntry[]) || []);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div className="p-4 text-center text-sm text-slate-500">Loading pipeline...</div>;

  if (pipeline.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Licensee</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipeline.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>{deal.region}</TableCell>
                <TableCell>{deal.licensee || '—'}</TableCell>
                <TableCell>{deal.stage}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusStyles[deal.status] || ''}>
                    {deal.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
