import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CMCMilestone } from '@/types/roles';

interface CMCTimelineProps {
  milestones: CMCMilestone[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-50 text-blue-700',
  complete: 'bg-green-50 text-green-700',
  blocked: 'bg-red-50 text-red-700',
};

export function CMCTimeline({ milestones }: CMCTimelineProps) {
  const byPhase = milestones.reduce<Record<string, CMCMilestone[]>>((acc, m) => {
    acc[m.phase] = acc[m.phase] || [];
    acc[m.phase].push(m);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>CMC Development Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(byPhase).map(([phase, items]) => (
          <div key={phase}>
            <h4 className="text-sm font-semibold mb-2">Phase {phase}</h4>
            <div className="space-y-3">
              {items.map((m) => (
                <div key={m.id} className="flex items-start gap-3 border-l-2 border-slate-200 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.milestone_id}</span>
                      <span className="text-sm text-slate-700">{m.title}</span>
                      <Badge variant="secondary" className={statusStyles[m.status]}>
                        {m.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {m.target_month && (
                      <div className="text-xs text-slate-500 mt-1">Target month {m.target_month}</div>
                    )}
                    {m.acceptance_criteria && (
                      <div className="text-xs text-slate-600 mt-1">{m.acceptance_criteria}</div>
                    )}
                    {m.deliverables && m.deliverables.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        Deliverables: {m.deliverables.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
