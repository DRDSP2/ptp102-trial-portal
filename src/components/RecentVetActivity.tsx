import { useLoadAction } from '@uibakery/data';
import loadRecentVetActivityAction from '@/actions/loadRecentVetActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type VetActivity = {
  id: number;
  full_name: string;
  email: string;
  hospital_affiliation: string;
  verification_status: string;
  last_login: string | null;
  created_at: string;
};

export function RecentVetActivity() {
  const [activities, loading, error] = useLoadAction(loadRecentVetActivityAction, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No activity to display</p>
        </CardContent>
      </Card>
    );
  }

  const vets: VetActivity[] = activities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {vets.map((vet) => (
            <div key={vet.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{vet.full_name}</p>
                  <Badge
                    variant={vet.verification_status === 'approved' ? 'default' : 'secondary'}
                    className={
                      vet.verification_status === 'approved'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {vet.verification_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{vet.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{vet.hospital_affiliation}</p>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {vet.last_login
                      ? formatDistanceToNow(new Date(vet.last_login), { addSuffix: true })
                      : formatDistanceToNow(new Date(vet.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {vet.last_login ? 'Last login' : 'Registered'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
