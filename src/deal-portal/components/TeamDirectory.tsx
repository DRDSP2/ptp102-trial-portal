import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export function TeamDirectory() {
  const { client } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.from('deal_team_members').select('*').order('created_at').then(({ data }) => {
      setMembers((data as TeamMember[]) || []);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div className="p-4 text-center text-sm text-slate-500">Loading team...</div>;

  if (members.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Directory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 border rounded-lg p-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {member.initials}
              </div>
              <div>
                <div className="font-medium text-sm">{member.name}</div>
                <div className="text-xs text-slate-500">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
