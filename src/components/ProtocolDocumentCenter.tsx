import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import loadProtocolVersionsAction from '@/actions/loadProtocolVersions';
import createProtocolVersionAction from '@/actions/createProtocolVersion';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Shield,
  ChevronRight,
  History,
} from 'lucide-react';

export function ProtocolDocumentCenter({ isAdmin }: { isAdmin: boolean }) {
  const [versions, loading] = useLoadAction(loadProtocolVersionsAction, []);
  const [createVersion, isCreating] = useMutateAction(createProtocolVersionAction);
  const [showUpload, setShowUpload] = useState(false);
  const [newVersion, setNewVersion] = useState({
    versionNumber: '',
    effectiveDate: '',
    description: '',
    changeSummary: '',
    pdfUrl: '',
  });

  const currentVersion = versions?.find((v: any) => v.is_current);

  const handleUpload = async () => {
    await createVersion({
      versionNumber: newVersion.versionNumber,
      effectiveDate: newVersion.effectiveDate,
      description: newVersion.description,
      pdfUrl: newVersion.pdfUrl || `protocols/PTP102-Protocol-${newVersion.versionNumber}.pdf`,
      uploadedBy: 'admin',
      previousVersion: currentVersion?.version_number || null,
      changeSummary: newVersion.changeSummary,
    });
    setShowUpload(false);
    setNewVersion({ versionNumber: '', effectiveDate: '', description: '', changeSummary: '', pdfUrl: '' });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading protocol documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Protocol Document Center</h2>
            <p className="text-sm text-slate-500">Version-controlled study protocol management</p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button type="button">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Protocol Version</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Version Number *</Label>
                  <Input value={newVersion.versionNumber} onChange={(e) => setNewVersion((p) => ({ ...p, versionNumber: e.target.value }))} placeholder="e.g. 1.1" />
                </div>
                <div className="space-y-2">
                  <Label>Effective Date *</Label>
                  <Input type="date" value={newVersion.effectiveDate} onChange={(e) => setNewVersion((p) => ({ ...p, effectiveDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newVersion.description} onChange={(e) => setNewVersion((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Change Summary</Label>
                  <Input value={newVersion.changeSummary} onChange={(e) => setNewVersion((p) => ({ ...p, changeSummary: e.target.value }))} placeholder="Summarize changes from previous version" />
                </div>
                <Button onClick={handleUpload} disabled={isCreating || !newVersion.versionNumber || !newVersion.effectiveDate} className="w-full" type="button">
                  {isCreating ? 'Uploading...' : 'Upload Protocol Version'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {currentVersion && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Current Protocol Version</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-800">Current</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Version</p>
                <p className="text-lg font-mono font-semibold">{currentVersion.version_number}</p>
              </div>
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Effective Date</p>
                <p className="text-lg font-mono font-semibold">{new Date(currentVersion.effective_date).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Uploaded By</p>
                <p className="text-lg font-semibold">{currentVersion.uploaded_by}</p>
              </div>
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Status</p>
                <p className="text-lg font-semibold text-green-700">Active</p>
              </div>
            </div>
            {currentVersion.description && (
              <p className="text-sm text-slate-600">{currentVersion.description}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => currentVersion.pdf_url && window.open(currentVersion.pdf_url, '_blank')} disabled={!currentVersion.pdf_url}>
                <FileText className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => {
                if (!currentVersion.pdf_url) return;
                const link = document.createElement('a');
                link.href = currentVersion.pdf_url;
                link.download = `PTP102-Protocol-v${currentVersion.version_number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }} disabled={!currentVersion.pdf_url}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Protocol Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {versions?.map((v: any) => (
                <div key={v.id} className={`p-3 border rounded-lg flex items-center justify-between ${v.is_current ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    {v.is_current ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-slate-400" />}
                    <div>
                      <p className="text-sm font-semibold">Version {v.version_number}</p>
                      <p className="text-xs text-slate-500">Effective: {new Date(v.effective_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.is_current && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                    <Button variant="ghost" size="sm" type="button" onClick={() => v.pdf_url && window.open(v.pdf_url, '_blank')} disabled={!v.pdf_url} title={v.pdf_url ? 'View protocol PDF' : 'No PDF available'}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!versions || versions.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No protocol versions uploaded.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-600" />
            Protocol Summary Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Inclusion Criteria</p>
              <ul className="text-slate-600 space-y-0.5 text-xs">
                <li>• Diagnosed acute laminitis (Obel 1-3)</li>
                <li>• Age 2-20 years</li>
                <li>• Weight &gt;200 kg</li>
                <li>• Owner consent obtained</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Exclusion Criteria</p>
              <ul className="text-slate-600 space-y-0.5 text-xs">
                <li>• Chronic laminitis &gt;14 days</li>
                <li>• Pregnant or lactating mare</li>
                <li>• Concurrent systemic disease</li>
                <li>• Prior investigational drug &lt;30d</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Dosing Schedule</p>
              <ul className="text-slate-600 space-y-0.5 text-xs">
                <li>• Dose 1: Hour 0 (500mL IV)</li>
                <li>• Dose 2: Hour 12 (500mL IV)</li>
                <li>• Concentration: 5 mg/mL</li>
                <li>• Infusion: 15-30 minutes</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Endpoints & Monitoring</p>
              <ul className="text-slate-600 space-y-0.5 text-xs">
                <li>• Primary: Obel grade change</li>
                <li>• Assessments: Day 0, 1, 2, 7, 14, 30</li>
                <li>• AE reporting: Within 24 hours</li>
                <li>• Radiographs: Baseline & Day 14</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
