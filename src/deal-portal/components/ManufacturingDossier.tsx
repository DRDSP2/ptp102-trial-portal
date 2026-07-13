import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Factory, FileCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Section {
  id: string;
  title: string;
  description: string;
}

export function ManufacturingDossier() {
  const { client } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await client.from('manufacturing_dossier_sections').select('*').order('sort_order');
      setSections((data as Section[]) || []);
      setLoading(false);
    })();
  }, [client]);

  if (loading) return <div className="text-center text-slate-500 py-8">Loading manufacturing dossier...</div>;

  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory size={20} /> Manufacturing Dossier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 font-medium mb-1">
                <FileCheck size={16} className="text-green-600" />
                {section.title}
              </div>
              <div className="text-sm text-slate-600">{section.description}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
