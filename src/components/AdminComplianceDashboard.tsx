import { useState } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueryState } from '@/components/ui/query-state';
import { Skeleton } from '@/components/ui/skeleton';
import loadAdminComplianceDashboardAction from '@/actions/loadAdminComplianceDashboard';
import loadAllInvestigatorQualificationsAction from '@/actions/loadAllInvestigatorQualifications';
import loadAllAdverseEventsAction from '@/actions/loadAllAdverseEvents';
import loadProtocolDeviationsAction from '@/actions/loadProtocolDeviations';
import loadNCIEShipmentsAction from '@/actions/loadNCIEShipments';
import loadFDACorrespondenceAction from '@/actions/loadFDACorrespondence';
import bulkUpdateDataLockStatusAction from '@/actions/bulkUpdateDataLockStatus';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  AlertTriangle,
  Users,
  FileText,
  FlaskConical,
  Activity,
  CheckCircle2,
  Database,
  ExternalLink,
  Lock,
  Snowflake,
  Unlock,
} from 'lucide-react';

type BulkLockProps = {
  adminEmail?: string | null;
};

export function AdminComplianceDashboard({ adminEmail = null }: BulkLockProps = {}) {
  const auth = useAuth();
  const isAdmin = auth.role === 'admin';
  const [stats, statsLoading, , refreshStats] = useLoadAction(loadAdminComplianceDashboardAction, []);
  const [investigators, invLoading, invError] = useLoadAction(loadAllInvestigatorQualificationsAction, []);
  const [aes, aeLoading, aeError] = useLoadAction(loadAllAdverseEventsAction, []);
  const [deviations, devLoading, devError] = useLoadAction(loadProtocolDeviationsAction, []);
  const [shipments, shipLoading, shipError] = useLoadAction(loadNCIEShipmentsAction, []);
  const [fdaCorr, fdaLoading, fdaError] = useLoadAction(loadFDACorrespondenceAction, []);
  const [bulkUpdateLock, isBulkUpdating] = useMutateAction(bulkUpdateDataLockStatusAction);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'frozen' | 'locked' | 'open'>('frozen');
  const [bulkScope, setBulkScope] = useState<'enrolled' | 'completed' | 'enrolled_completed' | 'all'>('enrolled_completed');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const handleBulkLockSubmit = async () => {
    if (!isAdmin) return; // defense in depth: bulk lock/freeze is admin-only
    if (!bulkReason.trim()) {
      setBulkError('A reason for change is required.');
      return;
    }
    const filter =
      bulkScope === 'enrolled'
        ? ['enrolled']
        : bulkScope === 'completed'
        ? ['completed']
        : bulkScope === 'enrolled_completed'
        ? ['enrolled', 'completed']
        : null;
    try {
      const updated = (await bulkUpdateLock({
        dataLockStatus: bulkStatus,
        trialStatusFilter: filter,
        reasonForChange: bulkReason.trim(),
        adminEmail,
      })) as unknown as Array<{ id: number }>;
      setBulkError(null);
      setBulkResult(`Updated ${updated.length} patient record${updated.length === 1 ? '' : 's'} to ${bulkStatus}.`);
      setBulkReason('');
      refreshStats();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk update failed.');
    }
  };

  const s = stats && stats.length > 0 ? stats[0] : null;

  const listSkeleton = (
    <div className="space-y-2" aria-label="Loading records">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );

  const emptyList = (message: string) => (
    <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );

  const statCards = [
    { label: 'Total Patients', value: s?.total_patients || 0, icon: <Users className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700' },
    { label: 'Enrolled', value: s?.enrolled_patients || 0, icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-50 text-green-700' },
    { label: 'Completed', value: s?.completed_patients || 0, icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total AEs', value: s?.total_aes || 0, icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-50 text-red-700' },
    { label: 'Serious AEs', value: s?.serious_aes || 0, icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
    { label: 'Pending ICFs', value: s?.pending_icfs || 0, icon: <FileText className="h-4 w-4" />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Investigators', value: s?.approved_investigators || 0, icon: <Shield className="h-4 w-4" />, color: 'bg-purple-50 text-purple-700' },
    { label: 'Deviations', value: s?.total_deviations || 0, icon: <Activity className="h-4 w-4" />, color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl p-6 text-white mb-4">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-800/80" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Regulatory Compliance Dashboard</h2>
            <p className="text-slate-300">FDA CVM oversight center for PTP-102 INAD study</p>
          </div>
        </div>
      </div>

      {/* INAD Banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <span className="font-semibold">INAD File:</span> {s ? 'INAD-PTP102-2025' : 'Loading...'} | 
          <span className="font-semibold ml-2">Protocol:</span> v{s ? '1.0' : '—'} | 
          <span className="font-semibold ml-2">Sponsor:</span> Byrock Technologies Ltd.
        </AlertDescription>
      </Alert>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className={`${card.color} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {card.icon}
                <span className="text-xs font-medium opacity-80">{card.label}</span>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="investigators" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="investigators"><Users className="h-4 w-4 mr-1" />Investigators</TabsTrigger>
          <TabsTrigger value="aes"><AlertTriangle className="h-4 w-4 mr-1" />AEs</TabsTrigger>
          <TabsTrigger value="deviations"><Activity className="h-4 w-4 mr-1" />Deviations</TabsTrigger>
          <TabsTrigger value="shipments"><FlaskConical className="h-4 w-4 mr-1" />NCIE</TabsTrigger>
          <TabsTrigger value="fda"><ExternalLink className="h-4 w-4 mr-1" />FDA</TabsTrigger>
          <TabsTrigger value="lock"><Lock className="h-4 w-4 mr-1" />Data Lock</TabsTrigger>
        </TabsList>

        <TabsContent value="investigators" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investigator Qualification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                data={investigators}
                isLoading={invLoading}
                error={invError}
                skeleton={listSkeleton}
                empty={emptyList('No investigator qualifications found.')}
              >
                {(rows) => (
                  <div className="space-y-2">
                  {rows.map((inv: any) => (
                    <div key={inv.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{inv.full_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.email} • {inv.hospital_affiliation}</p>
                      </div>
                      <Badge className={
                        inv.qualification_status === 'approved' ? 'bg-green-100 text-green-800' :
                        inv.qualification_status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                        inv.qualification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-600'
                      }>
                        {inv.qualification_status}
                      </Badge>
                    </div>
                  ))}
                  </div>
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adverse Events Log</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                data={aes}
                isLoading={aeLoading}
                error={aeError}
                skeleton={listSkeleton}
                empty={emptyList('No adverse events reported.')}
              >
                {(rows) => (
                  <div className="space-y-2">
                  {rows.map((ae: any) => (
                    <div key={ae.id} className={`p-3 border rounded-lg ${ae.severity === 'Severe' || ae.severity === 'Life-Threatening' || ae.severity === 'Fatal' ? 'border-red-300 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{ae.horse_name} ({ae.unique_id})</p>
                        <Badge className={
                          ae.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                          ae.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>{ae.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ae.event_description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">Reported: {new Date(ae.created_at).toLocaleString()} by {ae.reporter_name}</p>
                    </div>
                  ))}
                  </div>
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deviations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protocol Deviations</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                data={deviations}
                isLoading={devLoading}
                error={devError}
                skeleton={listSkeleton}
                empty={emptyList('No protocol deviations found.')}
              >
                {(rows) => (
                  <div className="space-y-2">
                  {rows.map((dev: any) => (
                    <div key={dev.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{dev.deviation_type}</p>
                        <Badge className={
                          dev.impact_assessment === 'Minor' ? 'bg-blue-100 text-blue-800' :
                          dev.impact_assessment === 'Major' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>{dev.impact_assessment}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{dev.description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">{dev.horse_name} • {new Date(dev.deviation_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  </div>
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NCIE Shipment Log</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                data={shipments}
                isLoading={shipLoading}
                error={shipError}
                skeleton={listSkeleton}
                empty={emptyList('No shipments logged.')}
              >
                {(rows) => (
                  <div className="space-y-3">
                  {rows.map((ship: any) => (
                    <div key={ship.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Batch/Lot {ship.batch_lot_number}</p>
                          <Badge variant="outline">{ship.quantity_vials} vials</Badge>
                        </div>
                        <Badge className={
                          ship.shipment_status === 'received_by_clinic' ? 'bg-green-100 text-green-800' :
                          ship.shipment_status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                          ship.shipment_status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }>{ship.shipment_status?.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p><span className="font-semibold">Vet:</span> {ship.shipped_to_veterinarian_name || ship.shipped_to_investigator || 'Unknown'}</p>
                        <p><span className="font-semibold">Email:</span> {ship.shipped_to_veterinarian_email || '—'}</p>
                        <p><span className="font-semibold">Tracking:</span> {ship.tracking_number || '—'}</p>
                        <p><span className="font-semibold">Carrier:</span> {ship.carrier || '—'}</p>
                        <p><span className="font-semibold">Shipped:</span> {ship.shipment_date ? new Date(ship.shipment_date).toLocaleDateString() : '—'}</p>
                        <p><span className="font-semibold">Expected:</span> {ship.expected_delivery_date ? new Date(ship.expected_delivery_date).toLocaleDateString() : '—'}</p>
                        {ship.received_by_clinic_date && (
                          <>
                            <p><span className="font-semibold">Received:</span> {new Date(ship.received_by_clinic_date).toLocaleDateString()}</p>
                            <p><span className="font-semibold">By:</span> {ship.received_by_clinic_name}</p>
                          </>
                        )}
                        {ship.bottles_received_at_clinic && (
                          <p className="sm:col-span-2"><span className="font-semibold">Bottles Confirmed:</span> {ship.bottles_received_at_clinic}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fda" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FDA Correspondence</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                data={fdaCorr}
                isLoading={fdaLoading}
                error={fdaError}
                skeleton={listSkeleton}
                empty={emptyList('No FDA correspondence logged.')}
              >
                {(rows) => (
                  <div className="space-y-2">
                  {rows.map((corr: any) => (
                    <div key={corr.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{corr.subject}</p>
                        <Badge variant="outline">{corr.correspondence_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{corr.description}</p>
                      <p className="text-xs text-muted-foreground/80">{corr.from_entity} → {corr.to_entity} • {new Date(corr.correspondence_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  </div>
                )}
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Study Data Lock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Freezing or locking patient records is the standard end-of-study workflow. <span className="font-semibold">Frozen</span> records remain editable but require a documented reason for change; <span className="font-semibold">locked</span> records reject all writes outright. Both states are recorded in the audit trail per 21 CFR Part 11.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Open</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{s?.patients_open ?? 0}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-amber-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Snowflake className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">Frozen</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{s?.patients_frozen ?? 0}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-red-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-700">Locked</span>
                      </div>
                      <p className="text-2xl font-bold text-red-700">{s?.patients_locked ?? 0}</p>
                    </div>
                  </div>

                  {bulkResult && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-800">{bulkResult}</AlertDescription>
                    </Alert>
                  )}

                  {isAdmin && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setBulkOpen(true);
                          setBulkResult(null);
                          setBulkError(null);
                        }}
                        aria-label="Open bulk lock dialog"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Bulk Lock / Freeze Records
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Lock / Freeze Records</DialogTitle>
            <DialogDescription>
              Apply a single lock-status change to many patient records at once. Each affected record gets its own audit-log entry tagged with this reason. Records already in the target state are skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkStatus">Target status</Label>
              <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as 'frozen' | 'locked' | 'open')}>
                <SelectTrigger id="bulkStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frozen">Freeze (soft hold; reasoned writes still allowed)</SelectItem>
                  <SelectItem value="locked">Lock (hard hold; writes rejected)</SelectItem>
                  <SelectItem value="open">Unlock (return to normal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkScope">Scope</Label>
              <Select
                value={bulkScope}
                onValueChange={(v) =>
                  setBulkScope(v as 'enrolled' | 'completed' | 'enrolled_completed' | 'all')
                }
              >
                <SelectTrigger id="bulkScope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrolled_completed">Enrolled + Completed (recommended for end-of-study)</SelectItem>
                  <SelectItem value="enrolled">Enrolled only</SelectItem>
                  <SelectItem value="completed">Completed only</SelectItem>
                  <SelectItem value="all">All patients (including screening, withdrawn)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkReason">Reason for change (required)</Label>
              <Textarea
                id="bulkReason"
                value={bulkReason}
                onChange={(e) => {
                  setBulkReason(e.target.value);
                  if (bulkError) setBulkError(null);
                }}
                placeholder="e.g. End-of-study data lock prior to FDA submission for INAD-PTP102-2025."
                rows={3}
              />
              {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={bulkStatus === 'locked' ? 'destructive' : 'default'}
              onClick={handleBulkLockSubmit}
              disabled={isBulkUpdating || !bulkReason.trim()}
            >
              {isBulkUpdating ? 'Updating...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
