import { useLoadAction } from '@uibakery/data';
import loadAdminStatisticsAction from '@/actions/loadAdminStatistics';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, Calendar, CheckCircle } from 'lucide-react';

type Statistics = {
  total_vets: number;
  pending_approvals: number;
  active_vets_week: number;
  trials_this_month: number;
};

export function AdminStatisticsCards() {
  const [stats, loading, error] = useLoadAction(loadAdminStatisticsAction, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats || stats.length === 0) {
    return null;
  }

  const data: Statistics = stats[0];

  const cards = [
    {
      title: 'Total Veterinarians',
      value: data.total_vets,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Approvals',
      value: data.pending_approvals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Trials This Month',
      value: data.trials_this_month,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Vets (7d)',
      value: data.active_vets_week,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-2 sm:p-3 rounded-full`}>
                  <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
