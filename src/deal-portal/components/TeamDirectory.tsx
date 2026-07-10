import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const team = [
  { name: 'Dr. Daniel Shanahan-Prendergast', role: 'Director / IP Lead', initials: 'DS' },
  { name: 'Dr. Pamela Tiebler', role: 'Clinical Lead', initials: 'PT' },
  { name: 'Dr. Alex Byrne', role: 'Regulatory & CMC', initials: 'AB' },
  { name: "Sarah O'Connor", role: 'Operations', initials: 'SO' },
];

export function TeamDirectory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Directory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member) => (
            <div key={member.name} className="flex items-center gap-3 border rounded-lg p-3">
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
