import { useState } from 'react';
import { useCapTable } from '@/deal-portal/hooks/useCapTable';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/deal-portal/lib/dealPortalUtils';

export function CapTableViewer() {
  const { entries, esopGrants, loading } = useCapTable();
  const { isInvestor } = useAuth();
  const [showFull, setShowFull] = useState(false);

  const canViewFull = isInvestor;
  const mode = showFull && canViewFull ? 'full' : 'anonymised';

  if (loading) return <div className="p-8 text-center">Loading cap table...</div>;

  const totalShares = entries.reduce((sum, e) => sum + (e.shares || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cap Table</CardTitle>
        {canViewFull && (
          <Button
            variant="outline"
            size="sm"
            aria-label={showFull ? 'Show anonymised view' : 'Show full investor view'}
            onClick={() => setShowFull((s) => !s)}
          >
            {showFull ? 'Show Anonymised' : 'Show Full'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant="secondary" className="mb-2">
          {mode === 'anonymised' ? 'Anonymised View' : 'Full Investor View'}
        </Badge>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shareholder</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {mode === 'full' ? entry.shareholder_name : 'Confidential Holder'}
                </TableCell>
                <TableCell className="capitalize">{entry.share_class}</TableCell>
                <TableCell className="text-right">
                  {mode === 'full' ? entry.shares.toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-right">{entry.percentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {mode === 'full' && esopGrants.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">ESOP Grants</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant ID</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Exercise Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {esopGrants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell className="font-mono text-xs">{grant.participant_id}</TableCell>
                    <TableCell className="text-right">{grant.units.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {grant.exercise_price ? formatCurrency(grant.exercise_price) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-between text-sm text-slate-500 pt-2">
          <span>Total Shares</span>
          <span>{totalShares.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
