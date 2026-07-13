import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCMCData } from '@/deal-portal/hooks/useCMCData';
import { CMCTimeline } from './CMCTimeline';
import { useAuth } from '@/context/AuthContext';
import { Download, FileText } from 'lucide-react';
import { ManufacturingDossier } from './ManufacturingDossier';
import { RegulatoryPackageViewer } from './RegulatoryPackageViewer';

const categoryLabels: Record<string, string> = {
  regulatory: 'Regulatory',
  cmc: 'CMC',
  manufacturing: 'Manufacturing',
  development_plan: 'Development Plan',
};

export function CMCDataRoom() {
  const { milestones, documents, loading } = useCMCData();
  const { client } = useAuth();

  const handleDownload = async (doc: { id: string; title: string; file_path: string | null }) => {
    if (!doc.file_path) return;
    try {
      const { data, error } = await client.storage
        .from('deal-room-documents')
        .createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      // silently fail — file may not exist on storage yet
    }
  };

  if (loading) return <div className="p-8 text-center">Loading CMC data room...</div>;

  return (
    <div className="space-y-8">
      <CMCTimeline milestones={milestones} />
      <ManufacturingDossier />
      <RegulatoryPackageViewer />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} /> CMC Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Access Tier</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryLabels[doc.category] || doc.category}</Badge>
                  </TableCell>
                  <TableCell>{doc.version || '—'}</TableCell>
                  <TableCell>
                    <Badge>{doc.access_tier_min}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!doc.file_path}
                      onClick={() => handleDownload(doc)}
                      title={doc.file_path ? 'Download document' : 'No file uploaded'}
                    >
                      <Download size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {documents.length === 0 && (
            <div className="text-center text-slate-500 py-8">No CMC documents uploaded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
