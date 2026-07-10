import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TermSheetVersion } from '@/types/roles';
import { formatCurrency, formatPercent } from '@/deal-portal/lib/dealPortalUtils';

interface TermSheetRedlineProps {
  versions: TermSheetVersion[];
}

export function TermSheetRedline({ versions }: TermSheetRedlineProps) {
  if (versions.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-slate-500">
          At least two versions are required to show a redline comparison.
        </CardContent>
      </Card>
    );
  }

  const [latest, previous] = [versions[0], versions[1]];
  const latestContent = latest.content;
  const previousContent = previous.content;

  const fields: { label: string; key: keyof typeof latestContent }[] = [
    { label: 'Upfront Fee', key: 'upfront_fee' },
    { label: 'Royalty Rate', key: 'royalty_rate' },
    { label: 'Exclusivity (months)', key: 'exclusivity_months' },
    { label: 'Region', key: 'region' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Term Sheet Redline</span>
          <div className="flex gap-2">
            <Badge variant="outline">v{previous.version}</Badge>
            <span className="text-slate-400">→</span>
            <Badge>v{latest.version}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const oldValue = previousContent[field.key];
          const newValue = latestContent[field.key];
          const changed = oldValue !== newValue;
          return (
            <div key={field.key} className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-600">{field.label}</span>
              <div className="flex items-center gap-3">
                <span className={changed ? 'line-through text-slate-400' : ''}>
                  {field.key === 'upfront_fee'
                    ? formatCurrency(Number(oldValue) || 0)
                    : field.key === 'royalty_rate'
                    ? formatPercent(Number(oldValue) || 0)
                    : String(oldValue)}
                </span>
                {changed && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    {field.key === 'upfront_fee'
                      ? formatCurrency(Number(newValue) || 0)
                      : field.key === 'royalty_rate'
                      ? formatPercent(Number(newValue) || 0)
                      : String(newValue)}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        <div className="text-xs text-slate-500 pt-2">
          Proposed by {latest.proposed_by} on {new Date(latest.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
