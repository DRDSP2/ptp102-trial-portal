import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Module {
  id: string;
  module_number: number;
  title: string;
  items: string[];
}

export function RegulatoryPackageViewer() {
  const { client } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await client.from('regulatory_modules').select('*').order('sort_order');
      setModules((data as Module[]) || []);
      setLoading(false);
    })();
  }, [client]);

  if (loading) return <div className="text-center text-slate-500 py-8">Loading regulatory modules...</div>;

  if (modules.length === 0) return null;

  return (
    <div className="space-y-6">
      {modules.map((m) => (
        <Card key={m.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={18} />
              Module {m.module_number}: {m.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(m.items as string[]).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle size={14} className="text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
