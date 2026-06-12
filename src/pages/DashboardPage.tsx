import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PatientsList } from '@/components/PatientsList';
import { PatientEnrollmentForm } from '@/components/PatientEnrollmentForm';
import { ByrockLogo } from '@/components/ByrockLogo';
import { WhatsAppChatButton } from '@/components/WhatsAppChatButton';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import { VeterinarianManagementPanel } from '@/components/VeterinarianManagementPanel';
import { AdminStatisticsCards } from '@/components/AdminStatisticsCards';
import { RecentVetActivity } from '@/components/RecentVetActivity';
import { MasterTrialsTable } from '@/components/MasterTrialsTable';
import { Shield, BarChart3, Users, Database, Filter, UserPlus, LogOut, BookOpen, Stethoscope, FileText, ShieldCheck, Package, ScrollText } from 'lucide-react';
import { ResearchHub } from '@/components/ResearchHub';
import { VetToolsHub } from '@/components/VetToolsHub';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { ProtocolDocumentCenter } from '@/components/ProtocolDocumentCenter';
import { AdminComplianceDashboard } from '@/components/AdminComplianceDashboard';
import { VetShipmentPanel } from '@/components/VetShipmentPanel';
import { AdverseEventReporter } from '@/components/AdverseEventReporter';
import { TrialOperationsHub } from '@/components/TrialOperationsHub';
import { InvestigatorOnboardingWizard } from '@/components/InvestigatorOnboardingWizard';
import { useLoadAction } from '@uibakery/data';
import loadInvestigatorQualificationAction from '@/actions/loadInvestigatorQualification';
import { useAuth } from '@/context/AuthContext';

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [qualData, qualLoading] = useLoadAction(loadInvestigatorQualificationAction, [], { vetEmail: auth.email || '' });

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

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const userEmail = auth.email || 'Unknown';
  const isAdmin = auth.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <RegulatoryBanner />
      <WhatsAppChatButton variant="floating" />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ByrockLogo variant="icon" height={32} />
            <div>
              <p className="text-sm font-medium text-slate-900">PTP-102 Laminitis Trial</p>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        {isAdmin ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-4xl grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="overview">
                <BarChart3 className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="patients">
                <Users className="mr-2 h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="veterinarians">
                <Shield className="mr-2 h-4 w-4" />
                Veterinarians
              </TabsTrigger>
              <TabsTrigger value="trials">
                <Database className="mr-2 h-4 w-4" />
                Trials Data
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="supply">
                <Package className="mr-2 h-4 w-4" />
                Supply
              </TabsTrigger>
              <TabsTrigger value="audit">
                <ScrollText className="mr-2 h-4 w-4" />
                Audit
              </TabsTrigger>
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
            <TabsContent value="veterinarians" className="mt-6">
              <VeterinarianManagementPanel />
            </TabsContent>
            <TabsContent value="trials" className="mt-6">
              <MasterTrialsTable adminEmail={userEmail} />
            </TabsContent>
            <TabsContent value="compliance" className="mt-6">
              <AdminComplianceDashboard />
            </TabsContent>
            <TabsContent value="supply" className="mt-6 space-y-6">
              <VetShipmentPanel vetEmail={auth.email || ''} />
              <TrialOperationsHub />
            </TabsContent>
          </Tabs>
        ) : qualLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading qualification status...</div>
            </CardContent>
          </Card>
        ) : !qualData || qualData.length === 0 ? (
          <InvestigatorOnboardingWizard vetEmail={auth.email || ''} />
        ) : (
          <>
            <AdverseEventReporter vetEmail={auth.email || ''} vetName={auth.email?.split('@')[0] || 'Vet'} />
            <Tabs defaultValue="patients" className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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
              <TrialOperationsHub />
            </TabsContent>
            <TabsContent value="audit" className="mt-6">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
