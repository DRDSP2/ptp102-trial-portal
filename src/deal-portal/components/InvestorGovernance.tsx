import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Users,
  LogOut,
};

interface Doc {
  id: string;
  tab_name: string;
  title: string;
  content: string;
  icon_name: string;
}

export function InvestorGovernance() {
  const { client } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.from('governance_documents').select('*').order('sort_order').then(({ data }) => {
      setDocs((data as Doc[]) || []);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div className="text-center text-slate-500 py-8">Loading governance documents...</div>;

  if (docs.length === 0) return null;

  const firstTab = docs[0]?.tab_name || 'founder';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={firstTab}>
          <TabsList className="mb-4">
            {docs.map((doc) => (
              <TabsTrigger key={doc.id} value={doc.tab_name}>
                {doc.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {docs.map((doc) => {
            const Icon = iconMap[doc.icon_name] || FileText;
            return (
              <TabsContent key={doc.id} value={doc.tab_name} className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span className="font-medium">{doc.title}</span>
                </div>
                <div className="whitespace-pre-line">{doc.content}</div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
