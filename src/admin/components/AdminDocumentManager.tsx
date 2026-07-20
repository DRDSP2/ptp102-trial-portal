import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DealDocument {
  id: string;
  category: string;
  title: string;
  file_path: string | null;
  version: string;
  access_tier_min: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export function AdminDocumentManager() {
  const { client } = useAuth();
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DealDocument | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data } = await client.from('cmc_documents').select('*').order('created_at', { ascending: false });
    setDocuments((data as DealDocument[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (file: File, metadata: { title: string; category: string; access_tier_min: string }) => {
    const filePath = `deal-room/${metadata.category}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await client.storage.from('deal-room-documents').upload(filePath, file);
    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { error: dbError } = await client.from('cmc_documents').insert({
      category: metadata.category,
      title: metadata.title,
      file_path: filePath,
      version: 'v1.0',
      access_tier_min: metadata.access_tier_min,
    });
    if (dbError) {
      toast.error(`Document record could not be created: ${dbError.message}`);
      return;
    }

    setUploadOpen(false);
    fetchDocs();
  };

  const handleReplace = async (docId: string, newFile: File) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const filePath = `deal-room/${doc.category}/${Date.now()}_${newFile.name}`;
    await client.storage.from('deal-room-documents').upload(filePath, newFile);

    const versionNum = parseInt(doc.version.replace('v', '').split('.')[0]) + 1;
    await client
      .from('cmc_documents')
      .update({
        file_path: filePath,
        version: `v${versionNum}.0`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId);

    fetchDocs();
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Archive this document? It will be soft-deleted.')) return;
    await client.from('cmc_documents').update({ access_tier_min: 'archived' }).eq('id', docId);
    fetchDocs();
  };

  const handleEditMetadata = async (docId: string, updates: Partial<DealDocument>) => {
    await client.from('cmc_documents').update(updates).eq('id', docId);
    setEditDoc(null);
    fetchDocs();
  };

  const viewUrl = (filePath: string) => {
    return client.storage.from('deal-room-documents').getPublicUrl(filePath).data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Deal Room Document Manager</h1>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2" size={16} /> Upload New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <UploadForm onSubmit={handleUpload} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Access Tier</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.category}</Badge>
                  </TableCell>
                  <TableCell>{doc.version}</TableCell>
                  <TableCell>
                    <Badge>{doc.access_tier_min}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(doc.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => doc.file_path && window.open(viewUrl(doc.file_path), '_blank')}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditDoc(doc)}>
                        <Edit size={14} />
                      </Button>
                      <ReplaceButton onReplace={(file) => handleReplace(doc.id, file)} />
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {documents.length === 0 && !loading && (
            <div className="text-center text-slate-500 py-8">No documents found.</div>
          )}
        </CardContent>
      </Card>

      {editDoc && (
        <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            <EditForm doc={editDoc} onSave={handleEditMetadata} onCancel={() => setEditDoc(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function UploadForm({ onSubmit }: { onSubmit: (file: File, meta: { title: string; category: string; access_tier_min: string }) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cmc');
  const [accessTier, setAccessTier] = useState('diligence');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    onSubmit(file, { title, category, access_tier_min: accessTier });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="upload-document-title" className="text-sm font-medium">Title</label>
        <Input id="upload-document-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" required />
      </div>
      <div>
        <label htmlFor="upload-document-category" className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="upload-document-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regulatory">Regulatory</SelectItem>
            <SelectItem value="cmc">CMC</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="development_plan">Development Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="upload-document-tier" className="text-sm font-medium">Access Tier</label>
        <Select value={accessTier} onValueChange={setAccessTier}>
          <SelectTrigger id="upload-document-tier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evaluation">Evaluation</SelectItem>
            <SelectItem value="diligence">Diligence</SelectItem>
            <SelectItem value="exclusive">Exclusive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="upload-document-file" className="text-sm font-medium">File</label>
        <Input id="upload-document-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
      </div>
      <Button type="submit" disabled={!file || !title}>
        Upload
      </Button>
    </form>
  );
}

function EditForm({
  doc,
  onSave,
  onCancel,
}: {
  doc: DealDocument;
  onSave: (id: string, updates: Partial<DealDocument>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);
  const [accessTier, setAccessTier] = useState(doc.access_tier_min);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(doc.id, { title, category, access_tier_min: accessTier });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-document-title" className="text-sm font-medium">Title</label>
        <Input id="edit-document-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="edit-document-category" className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="edit-document-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regulatory">Regulatory</SelectItem>
            <SelectItem value="cmc">CMC</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="development_plan">Development Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="edit-document-tier" className="text-sm font-medium">Access Tier</label>
        <Select value={accessTier} onValueChange={setAccessTier}>
          <SelectTrigger id="edit-document-tier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evaluation">Evaluation</SelectItem>
            <SelectItem value="diligence">Diligence</SelectItem>
            <SelectItem value="exclusive">Exclusive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function ReplaceButton({ onReplace }: { onReplace: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onReplace(file);
        }}
      />
      <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload size={14} />
      </Button>
    </>
  );
}
