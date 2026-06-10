import { useLoadAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import loadAdminComplianceDashboardAction from '@/actions/loadAdminComplianceDashboard';
import loadAllInvestigatorQualificationsAction from '@/actions/loadAllInvestigatorQualifications';
import loadAllAdverseEventsAction from '@/actions/loadAllAdverseEvents';
import loadProtocolDeviationsAction from '@/actions/loadProtocolDeviations';
import loadNCIEShipmentsAction from '@/actions/loadNCIEShipments';
import loadFDACorrespondenceAction from '@/actions/loadFDACorrespondence';
import {
  Shield,
  AlertTriangle,
  Users,
  FileText,
  FlaskConical,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
} from 'lucide-react';

export function AdminComplianceDashboard() {
  const [stats, statsLoading] = useLoadAction(loadAdminComplianceDashboardAction, []);
  const [investigators, invLoading] = useLoadAction(loadAllInvestigatorQualificationsAction, []);
  const [aes, aeLoading] = useLoadAction(loadAllAdverseEventsAction, []);
  const [deviations, devLoading] = useLoadAction(loadProtocolDeviationsAction, []);
  const [shipments, shipLoading] = useLoadAction(loadNCIEShipmentsAction, []);
  const [fdaCorr, fdaLoading] = useLoadAction(loadFDACorrespondenceAction, []);

  const s = stats && stats.length > 0 ? stats[0] : null;

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="investigators"><Users className="h-4 w-4 mr-1" />Investigators</TabsTrigger>
          <TabsTrigger value="aes"><AlertTriangle className="h-4 w-4 mr-1" />AEs</TabsTrigger>
          <TabsTrigger value="deviations"><Activity className="h-4 w-4 mr-1" />Deviations</TabsTrigger>
          <TabsTrigger value="shipments"><FlaskConical className="h-4 w-4 mr-1" />NCIE</TabsTrigger>
          <TabsTrigger value="fda"><ExternalLink className="h-4 w-4 mr-1" />FDA</TabsTrigger>
        </TabsList>

        <TabsContent value="investigators" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investigator Qualification Status</CardTitle>
            </CardHeader>
            <CardContent>
              {invLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
                <div className="space-y-2">
                  {investigators?.map((inv: any) => (
                    <div key={inv.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{inv.full_name}</p>
                        <p className="text-xs text-slate-500">{inv.email} • {inv.hospital_affiliation}</p>
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
                  )) || <p className="text-sm text-slate-500">No investigator qualifications found.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adverse Events Log</CardTitle>
            </CardHeader>
            <CardContent>
              {aeLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
                <div className="space-y-2">
                  {aes?.map((ae: any) => (
                    <div key={ae.id} className={`p-3 border rounded-lg ${ae.severity === 'Severe' || ae.severity === 'Life-Threatening' || ae.severity === 'Fatal' ? 'border-red-300 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{ae.horse_name} ({ae.unique_id})</p>
                        <Badge className={
                          ae.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                          ae.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>{ae.severity}</Badge>
                      </div>
                      <p className="text-xs text-slate-600">{ae.event_description}</p>
                      <p className="text-xs text-slate-400 mt-1">Reported: {new Date(ae.created_at).toLocaleString()} by {ae.reporter_name}</p>
                    </div>
                  )) || <p className="text-sm text-slate-500">No adverse events reported.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deviations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protocol Deviations</CardTitle>
            </CardHeader>
            <CardContent>
              {devLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
                <div className="space-y-2">
                  {deviations?.map((dev: any) => (
                    <div key={dev.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{dev.deviation_type}</p>
                        <Badge className={
                          dev.impact_assessment === 'Minor' ? 'bg-blue-100 text-blue-800' :
                          dev.impact_assessment === 'Major' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>{dev.impact_assessment}</Badge>
                      </div>
                      <p className="text-xs text-slate-600">{dev.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{dev.horse_name} • {new Date(dev.deviation_date).toLocaleDateString()}</p>
                    </div>
                  )) || <p className="text-sm text-slate-500">No protocol deviations found.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NCIE Shipment Log</CardTitle>
            </CardHeader>
            <CardContent>
              {shipLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
                <div className="space-y-2">
                  {shipments?.map((ship: any) => (
                    <div key={ship.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Batch {ship.batch_lot_number}</p>
                        <p className="text-xs text-slate-500">{ship.quantity_vials} vials</p>
                      </div>
                      <p className="text-xs text-slate-600">Shipped to: {ship.shipped_to_investigator || ship.site_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">Date: {new Date(ship.shipment_date).toLocaleDateString()}</p>
                    </div>
                  )) || <p className="text-sm text-slate-500">No shipments logged.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fda" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FDA Correspondence</CardTitle>
            </CardHeader>
            <CardContent>
              {fdaLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
                <div className="space-y-2">
                  {fdaCorr?.map((corr: any) => (
                    <div key={corr.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{corr.subject}</p>
                        <Badge variant="outline">{corr.correspondence_type}</Badge>
                      </div>
                      <p className="text-xs text-slate-600">{corr.description}</p>
                      <p className="text-xs text-slate-400">{corr.from_entity} → {corr.to_entity} • {new Date(corr.correspondence_date).toLocaleDateString()}</p>
                    </div>
                  )) || <p className="text-sm text-slate-500">No FDA correspondence logged.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
