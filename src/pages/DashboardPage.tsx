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
import { ByRockLogo } from '@/components/ByRockLogo';
import { WhatsAppChatButton } from '@/components/WhatsAppChatButton';
import { VeterinarianManagementPanel } from '@/components/VeterinarianManagementPanel';
import { AdminStatisticsCards } from '@/components/AdminStatisticsCards';
import { RecentVetActivity } from '@/components/RecentVetActivity';
import { MasterTrialsTable } from '@/components/MasterTrialsTable';
import { Shield, BarChart3, Users, Database, Filter, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      <WhatsAppChatButton variant="floating" />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ByRockLogo className="h-10 w-auto" />
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
            <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-4">
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
          </Tabs>
        ) : (
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
        )}
      </div>
    </div>
  );
}
