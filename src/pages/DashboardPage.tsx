import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PatientsList } from '@/components/PatientsList';
import { PatientEnrollmentForm } from '@/components/PatientEnrollmentForm';
import { VeterinarianManagementPanel } from '@/components/VeterinarianManagementPanel';
import { AdminStatisticsCards } from '@/components/AdminStatisticsCards';
import { RecentVetActivity } from '@/components/RecentVetActivity';
import { MasterTrialsTable } from '@/components/MasterTrialsTable';
import { Shield, BarChart3, Users, Database, Filter, UserPlus, BookOpen, Stethoscope, FileText, ShieldCheck, Package, ScrollText, Image, Handshake, AlertCircle, RefreshCw } from 'lucide-react';
import { ResearchHub } from '@/components/ResearchHub';
import { VetToolsHub } from '@/components/VetToolsHub';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { AdminDealUsersPanel } from '@/admin/components/AdminDealUsersPanel';
import { AdminDocumentManager } from '@/admin/components/AdminDocumentManager';
import { AdminDealPaymentsPanel } from '@/admin/components/AdminDealPaymentsPanel';
import { AdminDealCompliancePanel } from '@/admin/components/AdminDealCompliancePanel';
import { AdminOfferReviewPanel } from '@/admin/components/AdminOfferReviewPanel';
import { ProtocolDocumentCenter } from '@/components/ProtocolDocumentCenter';
import { AdminComplianceDashboard } from '@/components/AdminComplianceDashboard';
import { AdminSupplyPanel } from '@/components/AdminSupplyPanel';
import { AdverseEventReporter } from '@/components/AdverseEventReporter';
import { VetShipmentPanel } from '@/components/VetShipmentPanel';
import { InvestigatorOnboardingWizard } from '@/components/InvestigatorOnboardingWizard';
import { HoofXrayPortal } from '@/components/HoofXrayPortal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLoadAction } from '@uibakery/data';
import loadInvestigatorQualificationAction from '@/actions/loadInvestigatorQualification';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [qualData, qualLoading, qualError, refreshQual] = useLoadAction(loadInvestigatorQualificationAction, [], { vetEmail: auth.email ?? null });

  const handleEnrollSuccess = () => {
    setEnrollDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handlePatientDeleted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleViewDetails = (patient: any) => {
    navigate(`/patient/${patient.id}`);
  };

  const userEmail = auth.email ?? 'Unknown';
  const isAdmin = auth.role === 'admin';
  const isStaff = auth.isStaff;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="sr-only">PTP-102 Trial Dashboard</h1>
      {isStaff ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className={cn('flex w-full max-w-5xl gap-1 overflow-x-auto pb-1 scrollbar-hide')}>
              <TabsTrigger value="overview">
                <BarChart3 className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="patients">
                <Users className="mr-2 h-4 w-4" />
                Patients
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="veterinarians">
                  <Shield className="mr-2 h-4 w-4" />
                  Veterinarians
                </TabsTrigger>
              )}
              <TabsTrigger value="trials">
                <Database className="mr-2 h-4 w-4" />
                Trials Data
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Compliance
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="supply">
                  <Package className="mr-2 h-4 w-4" />
                  Supply
                </TabsTrigger>
              )}
              <TabsTrigger value="xray">
                <Image className="mr-2 h-4 w-4" />
                X-Ray
              </TabsTrigger>
              <TabsTrigger value="audit">
                <ScrollText className="mr-2 h-4 w-4" />
                Audit
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="deal">
                  <Handshake className="mr-2 h-4 w-4" />
                  Deal Room
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-6">
              <AdminStatisticsCards />
              <RecentVetActivity />
            </TabsContent>
            <TabsContent value="patients" className="mt-6">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Patient Management</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Admin view - all patients across all veterinarians</p>
                  </div>
                  {isAdmin && (
                    <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Enroll Patient
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Enroll New Patient</DialogTitle>
                        </DialogHeader>
                        <PatientEnrollmentForm onSuccess={handleEnrollSuccess} />
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending_screening">Pending Screening</SelectItem>
                        <SelectItem value="screening">Screening</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <PatientsList
                    key={refreshKey}
                    statusFilter={statusFilter === 'all' ? '' : statusFilter}
                    onViewDetails={handleViewDetails}
                    onPatientDeleted={handlePatientDeleted}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            {isAdmin && (
              <TabsContent value="veterinarians" className="mt-6">
                <VeterinarianManagementPanel />
              </TabsContent>
            )}
            <TabsContent value="trials" className="mt-6">
              <MasterTrialsTable adminEmail={userEmail} />
            </TabsContent>
            <TabsContent value="compliance" className="mt-6">
              <AdminComplianceDashboard adminEmail={userEmail} />
            </TabsContent>
            {isAdmin && (
              <TabsContent value="supply" className="mt-6 space-y-6">
                <AdminSupplyPanel />
              </TabsContent>
            )}
            <TabsContent value="xray" className="mt-6">
              <ErrorBoundary>
                <HoofXrayPortal />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="audit" className="mt-6">
              <AuditLogViewer />
            </TabsContent>
            {isAdmin && (
              <TabsContent value="deal" className="mt-6">
                <Tabs defaultValue="users">
                  <TabsList className="flex w-full max-w-2xl gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="offers">Offers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="users" className="mt-4">
                    <AdminDealUsersPanel />
                  </TabsContent>
                  <TabsContent value="documents" className="mt-4">
                    <AdminDocumentManager />
                  </TabsContent>
                  <TabsContent value="payments" className="mt-4">
                    <AdminDealPaymentsPanel />
                  </TabsContent>
                  <TabsContent value="compliance" className="mt-4">
                    <AdminDealCompliancePanel />
                  </TabsContent>
                  <TabsContent value="offers" className="mt-4">
                    <AdminOfferReviewPanel />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        ) : qualLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading qualification status...</div>
            </CardContent>
          </Card>
        ) : qualError && (!qualData || qualData.length === 0) ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {qualError instanceof Error && qualError.message
                    ? qualError.message
                    : 'Failed to load your qualification status. Check your connection and try again.'}
                </AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => refreshQual()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !qualData || qualData.length === 0 ? (
          <InvestigatorOnboardingWizard vetEmail={auth.email} onSubmitted={refreshQual} />
        ) : (
          <>
            <AdverseEventReporter vetEmail={auth.email} vetName={auth.email?.split('@')[0] ?? 'Vet'} />
            <Tabs defaultValue="patients" className="w-full">
              <TabsList className="flex w-full max-w-2xl gap-1 overflow-x-auto pb-1 scrollbar-hide">
              <TabsTrigger value="patients">
                <Users className="mr-2 h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="research">
                <BookOpen className="mr-2 h-4 w-4" />
                Research
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Stethoscope className="mr-2 h-4 w-4" />
                Vet Tools
              </TabsTrigger>
              <TabsTrigger value="protocol">
                <FileText className="mr-2 h-4 w-4" />
                Protocol
              </TabsTrigger>
              <TabsTrigger value="supply">
                <Package className="mr-2 h-4 w-4" />
                Supply
              </TabsTrigger>
              <TabsTrigger value="xray">
                <Image className="mr-2 h-4 w-4" />
                X-Ray
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="mt-6">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Patient Management</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Manage enrolled horses and treatment protocols</p>
                  </div>
                  <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Enroll Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Enroll New Patient</DialogTitle>
                      </DialogHeader>
                      <PatientEnrollmentForm onSuccess={handleEnrollSuccess} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending_screening">Pending Screening</SelectItem>
                        <SelectItem value="screening">Screening</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <PatientsList
                    key={refreshKey}
                    statusFilter={statusFilter === 'all' ? '' : statusFilter}
                    onViewDetails={handleViewDetails}
                    onPatientDeleted={handlePatientDeleted}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="research" className="mt-6">
              <ResearchHub />
            </TabsContent>

            <TabsContent value="tools" className="mt-6">
              <VetToolsHub />
            </TabsContent>

            <TabsContent value="protocol" className="mt-6">
              <ProtocolDocumentCenter isAdmin={false} />
            </TabsContent>
            <TabsContent value="supply" className="mt-6">
              <VetShipmentPanel vetEmail={auth.email ?? ''} />
            </TabsContent>
            <TabsContent value="xray" className="mt-6">
              <ErrorBoundary>
                <HoofXrayPortal />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="audit" className="mt-6">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
          </>
        )}
      </div>
   );
}
