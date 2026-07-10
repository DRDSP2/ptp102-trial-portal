import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCMCData } from '@/deal-portal/hooks/useCMCData';
import { CMCTimeline } from './CMCTimeline';
import { FileText } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  regulatory: 'Regulatory',
  cmc: 'CMC',
  manufacturing: 'Manufacturing',
  development_plan: 'Development Plan',
};

export function CMCDataRoom() {
  const { milestones, documents, loading } = useCMCData();

  if (loading) return <div className="p-8 text-center">Loading CMC data room...</div>;

  return (
    <div className="space-y-8">
      <CMCTimeline milestones={milestones} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} /> CMC Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Access Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryLabels[doc.category] || doc.category}</Badge>
                  </TableCell>
                  <TableCell>{doc.version || '—'}</TableCell>
                  <TableCell>
                    <Badge>{doc.access_tier_min}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {documents.length === 0 && (
            <div className="text-center text-slate-500 py-8">No CMC documents uploaded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
