import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvestorUpdates } from '@/deal-portal/hooks/useInvestorUpdates';
import { TrendingUp, FileText, DollarSign, Briefcase } from 'lucide-react';

const typeLabels: Record<string, string> = {
  monthly_kpi: 'Monthly KPI',
  board_minutes: 'Board Minutes',
  financial_report: 'Financial Report',
  deal_pipeline: 'Deal Pipeline',
};

export function InvestorDashboard() {
  const { updates, loading } = useInvestorUpdates();

  if (loading) return <div className="p-8 text-center">Loading investor dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="text-green-600" />
            <div>
              <div className="text-xs text-slate-500">Year 1 Revenue</div>
              <div className="text-lg font-bold">$598.6M</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="text-blue-600" />
            <div>
              <div className="text-xs text-slate-500">Gross Margin</div>
              <div className="text-lg font-bold">96.5%</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Briefcase className="text-purple-600" />
            <div>
              <div className="text-xs text-slate-500">Active Regions</div>
              <div className="text-lg font-bold">6</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="text-orange-600" />
            <div>
              <div className="text-xs text-slate-500">Updates</div>
              <div className="text-lg font-bold">{updates.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investor Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {updates.length === 0 && (
            <div className="text-slate-500">No investor updates published yet.</div>
          )}
          {updates.map((update) => (
            <div key={update.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{typeLabels[update.update_type || ''] || update.update_type}</Badge>
                {update.published_at && (
                  <span className="text-xs text-slate-500">{new Date(update.published_at).toLocaleDateString()}</span>
                )}
              </div>
              <h4 className="font-medium">{update.title}</h4>
              {update.content && <p className="text-sm text-slate-600 mt-1">{update.content}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
