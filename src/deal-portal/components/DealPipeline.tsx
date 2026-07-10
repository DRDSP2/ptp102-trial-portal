import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const pipeline = [
  { region: 'North America', licensee: 'BigPharma Inc.', status: 'term_sheet', stage: 'Negotiation' },
  { region: 'EU', licensee: 'EuroVet SA', status: 'due_diligence', stage: 'Diligence' },
  { region: 'UK', licensee: null, status: 'available', stage: 'Evaluation' },
  { region: 'APAC', licensee: 'AsiaEquine Pte', status: 'term_sheet', stage: 'Negotiation' },
];

const statusStyles: Record<string, string> = {
  available: 'bg-slate-100 text-slate-700',
  evaluation: 'bg-yellow-50 text-yellow-700',
  due_diligence: 'bg-blue-50 text-blue-700',
  term_sheet: 'bg-purple-50 text-purple-700',
  executed: 'bg-green-50 text-green-700',
};

export function DealPipeline() {
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
              <TableRow key={deal.region}>
                <TableCell>{deal.region}</TableCell>
                <TableCell>{deal.licensee || '—'}</TableCell>
                <TableCell>{deal.stage}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusStyles[deal.status]}>
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
