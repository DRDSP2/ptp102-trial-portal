import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIPPortfolio } from '@/deal-portal/hooks/useIPPortfolio';
import { FileText } from 'lucide-react';

const typeLabels: Record<string, string> = {
  patent: 'Patent',
  trademark: 'Trademark',
  biomarker: 'Biomarker',
  trade_secret: 'Trade Secret',
};

export function IPPortfolioViewer() {
  const { assets, loading } = useIPPortfolio();

  if (loading) return <div className="p-8 text-center">Loading IP portfolio...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={18} /> {asset.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{typeLabels[asset.type] || asset.type}</Badge>
                {asset.status && <Badge variant="outline">{asset.status}</Badge>}
              </div>
              {asset.jurisdiction && (
                <div className="text-slate-600">Jurisdiction: {asset.jurisdiction}</div>
              )}
              {asset.assignee && (
                <div className="text-slate-600">Assignee: {asset.assignee}</div>
              )}
              {asset.application_number && (
                <div className="text-slate-600">Application: {asset.application_number}</div>
              )}
              {asset.description && (
                <div className="text-slate-600 pt-2">{asset.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center text-slate-500 py-12">No IP assets available.</div>
      )}

      {assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Chain Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.title}</TableCell>
                    <TableCell>{typeLabels[asset.type] || asset.type}</TableCell>
                    <TableCell>{asset.assignee || '—'}</TableCell>
                    <TableCell>{asset.status || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
