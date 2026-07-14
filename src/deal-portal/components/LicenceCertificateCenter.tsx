import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTermSheet } from '@/deal-portal/hooks/useTermSheet';
import { useLicenceRequests } from '@/deal-portal/hooks/useLicenceRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LicenceCertificateCenter() {
  const { client } = useAuth();
  const { termSheet } = useTermSheet();
  const { requests, certificates, loading, createRequest } = useLicenceRequests();
  const [requesting, setRequesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const openRequest = requests.find((r) => r.status === 'pending' || r.status === 'approved');

  const handleRequest = async () => {
    if (!termSheet) return;
    setRequesting(true);
    setMsg(null);
    const { error } = await createRequest(termSheet.id, termSheet.region ?? undefined);
    setRequesting(false);
    setMsg(error ? `Error: ${error.message}` : 'Licence issuance requested. Awaiting admin approval.');
  };

  const downloadCert = async (documentPath: string) => {
    const { data, error } = await client.storage
      .from('licence-certificates')
      .createSignedUrl(documentPath, 3600);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Licences &amp; Certificates</h1>
        <p className="text-sm text-slate-500">
          Request formal licence issuance for your negotiated term sheet and download your certificate.
        </p>
      </div>

      {msg && (
        <Alert>
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Licence Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && (
            <div className="text-sm text-slate-500">
              No requests yet.{' '}
              {termSheet ? 'Submit a request to issue your licence.' : 'Negotiate a term sheet first.'}
            </div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="text-sm font-medium uppercase">{r.region ?? 'global'}</div>
                <div className="text-xs text-slate-500">
                  Requested {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge>{r.status}</Badge>
            </div>
          ))}
          {!openRequest && termSheet && (
            <Button onClick={handleRequest} disabled={requesting}>
              {requesting ? 'Submitting…' : 'Request Licence Issuance'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {certificates.length === 0 && (
            <div className="text-sm text-slate-500">No certificates issued yet.</div>
          )}
          {certificates.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="text-sm font-medium">{c.certificate_number}</div>
                <div className="text-xs text-slate-500 uppercase">
                  {c.region} · issued {new Date(c.issued_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{c.status}</Badge>
                {c.document_path && (
                  <Button variant="outline" size="sm" onClick={() => downloadCert(c.document_path!)}>
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
