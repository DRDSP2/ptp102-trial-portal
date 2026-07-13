import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AnonymisedTrialEvent {
  trial_id: string;
  horse_id: string;
  event_type: string;
  hour: number | null;
  dose_mg: number | null;
  outcome: string | null;
  pain_score: number | null;
  event_timestamp: string;
}

function computeStats(events: AnonymisedTrialEvent[]) {
  const uniqueHorses = new Set(events.filter((e) => e.horse_id).map((e) => e.horse_id));
  const enrolled = uniqueHorses.size;
  const responded = events.filter((e) => e.outcome && e.outcome !== 'pending').length;
  const totalWithOutcome = events.filter((e) => e.outcome !== null).length;
  const responseRate = totalWithOutcome > 0 ? Math.round((responded / totalWithOutcome) * 100) : 0;
  const adverseEvents = events.filter((e) => e.outcome?.toLowerCase().includes('adverse')).length;
  return { enrolled, responseRate, adverseEvents };
}

export function LiveTrialDashboard() {
  const { client } = useAuth();
  const [events, setEvents] = useState<AnonymisedTrialEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data } = await client
        .from('trial_events_deal_room')
        .select('*')
        .eq('trial_id', 'LAM-00007')
        .order('event_timestamp', { ascending: true });
      setEvents((data as AnonymisedTrialEvent[]) || []);
      setLoading(false);
    };
    fetchEvents();

    const channel = client
      .channel('trial-events-deal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trial_events' }, fetchEvents)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [client]);

  if (loading) return <div className="p-8 text-center">Loading trial data...</div>;

  const stats = computeStats(events);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Trial Dashboard — LAM-00007</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{stats.enrolled}</div>
              <div className="text-xs text-slate-500">Horses Enrolled</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className={`text-2xl font-bold ${stats.responseRate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                {stats.responseRate}%
              </div>
              <div className="text-xs text-slate-500">Response Rate</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className={`text-2xl font-bold ${stats.adverseEvents === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.adverseEvents}
              </div>
              <div className="text-xs text-slate-500">Adverse Events</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hour</TableHead>
                <TableHead>Horse ID</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Pain Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{e.hour !== null ? `H${e.hour}` : '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{e.horse_id}</TableCell>
                  <TableCell>{e.dose_mg ? `${e.dose_mg}mg IV` : '—'}</TableCell>
                  <TableCell>{e.outcome || '—'}</TableCell>
                  <TableCell>{e.pain_score !== null ? e.pain_score : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
