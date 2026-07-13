import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { approveNda, denyNda } from '@/deal-portal/lib/ndaApproval';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { DealProfile, DealTier } from '@/types/roles';

type NdaSummary = {
  id: string;
  user_id: string;
  company_name: string | null;
  approval_status: string | null;
  signed_pdf_path: string | null;
  investor_email: string | null;
};

export function AdminDealUsersPanel() {
  const { client } = useAuth();
  const [profiles, setProfiles] = useState<DealProfile[]>([]);
  const [ndas, setNdas] = useState<NdaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [denyTarget, setDenyTarget] = useState<DealProfile | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: profileData }, { data: ndaData }] = await Promise.all([
      client.from('deal_profiles').select('*').order('created_at', { ascending: false }),
      client.from('ndas').select('id, user_id, company_name, approval_status, signed_pdf_path, investor_email').eq('status', 'signed'),
    ]);
    setProfiles((profileData as DealProfile[]) || []);
    setNdas((ndaData as NdaSummary[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTier = async (userId: string, tier: DealTier) => {
    await client.from('deal_profiles').update({ tier }).eq('user_id', userId);
    await fetchData();
  };

  const handleApprove = async (profile: DealProfile) => {
    const nda = getNdaForUser(profile.user_id);
    if (!nda?.investor_email) {
      toast.error('NDA approval is missing the investor email.');
      return;
    }
    setProcessing((p) => ({ ...p, [profile.user_id]: true }));
    try {
      const baseUrl = window.location.origin;
      await approveNda({
        client,
        userId: profile.user_id,
        investorEmail: nda.investor_email,
        baseUrl,
      });
      await fetchData();
      toast.success('NDA approved and countersigned.');
    } catch (_err) {
      toast.error('NDA approval failed. Please try again or check the audit log.');
    } finally {
      setProcessing((p) => ({ ...p, [profile.user_id]: false }));
    }
  };

  const handleDeny = async (profile: DealProfile) => {
    const nda = getNdaForUser(profile.user_id);
    if (!nda?.investor_email) {
      toast.error('NDA decline is missing the investor email.');
      return;
    }
    setProcessing((p) => ({ ...p, [profile.user_id]: true }));
    try {
      await denyNda({
        client,
        userId: profile.user_id,
        investorEmail: nda.investor_email,
        companyName: profile.company || nda.investor_email,
      });
      await fetchData();
      toast.success('NDA application declined.');
    } catch (_err) {
      toast.error('NDA decline failed. Please try again.');
    } finally {
      setProcessing((p) => ({ ...p, [profile.user_id]: false }));
      setDenyTarget(null);
    }
  };

  const getNdaForUser = (userId: string) => ndas.find((n) => n.user_id === userId);

  const viewPdfUrl = (path: string | null) => {
    if (!path) return null;
    return client.storage.from('deal-room-documents').getPublicUrl(path).data.publicUrl;
  };

  if (loading) return <div className="p-8 text-center">Loading deal users...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deal Portal Users</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>NDA Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const nda = getNdaForUser(profile.user_id);
                const isPending = nda?.approval_status === 'pending';
                const isApproved = nda?.approval_status === 'approved';
                const pdfUrl = viewPdfUrl(nda?.signed_pdf_path || null);
                return (
                  <TableRow key={profile.id} className={processing[profile.user_id] ? 'opacity-60' : undefined}>
                    <TableCell className="font-medium">{profile.company || '—'}</TableCell>
                    <TableCell className="capitalize">{profile.role.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge>{profile.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      {nda ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={isPending ? 'secondary' : isApproved ? 'default' : 'destructive'}>
                            {nda.approval_status || 'signed'}
                          </Badge>
                          {pdfUrl && (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not signed</span>
                      )}
                    </TableCell>
                    <TableCell className="relative">
                      {processing[profile.user_id] && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-background/80 text-xs font-medium">
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Updating NDA...
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          onValueChange={(value) => updateTier(profile.user_id, value as DealTier)}
                          defaultValue={profile.tier}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="evaluation">Evaluation</SelectItem>
                            <SelectItem value="diligence">Diligence</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(profile)}
                              disabled={processing[profile.user_id]}
                            >
                              Approve NDA
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDenyTarget(profile)}
                              disabled={processing[profile.user_id]}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog open={!!denyTarget} onOpenChange={(open) => !open && setDenyTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this NDA application?</AlertDialogTitle>
            <AlertDialogDescription>
              The applicant will be notified and their pending NDA approval will be declined.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => denyTarget && handleDeny(denyTarget)}>
              Decline NDA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
