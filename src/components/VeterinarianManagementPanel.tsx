import { useState } from 'react';
import { useMutateAction, useLoadAction } from '@uibakery/data';
import loadVeterinariansAction from '@/actions/loadVeterinarians';
import approveVeterinarianAction from '@/actions/approveVeterinarian';
import rejectVeterinarianAction from '@/actions/rejectVeterinarian';
import deleteVeterinarianAction from '@/actions/deleteVeterinarian';
import updateVetVerificationStatusAction from '@/actions/updateVetVerificationStatus';
import sendEmailNotificationAction from '@/actions/sendEmailNotification';
import { sendNotification, NotificationType } from '@/utils/emailNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Trash2, Eye, Mail } from 'lucide-react';

type Veterinarian = {
  id: number;
  full_name: string;
  email: string;
  license_number: string;
  hospital_affiliation: string;
  verification_status: string;
  tc_accepted: boolean;
  created_at: string;
  last_login: string | null;
};

export function VeterinarianManagementPanel() {
  const [vets, loadingVets, errorVets, refreshVets] = useLoadAction(loadVeterinariansAction, [], {});
  const [approveVet] = useMutateAction(approveVeterinarianAction);
  const [rejectVet] = useMutateAction(rejectVeterinarianAction);
  const [deleteVet] = useMutateAction(deleteVeterinarianAction);
  const [updateVetStatus] = useMutateAction(updateVetVerificationStatusAction);
  const [sendEmail] = useMutateAction(sendEmailNotificationAction);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleApprove = async (id: number) => {
    try {
      const vet = vets.find((v: Veterinarian) => v.id === id);
      const result = await approveVet({ id });
      
      console.log('Veterinarian approved:', result);
      
      if (vet) {
        sendNotification(
          sendEmail,
          NotificationType.VET_APPROVED,
          `✅ Vet Approved: ${vet.full_name}`,
          {
            'Veterinarian': vet.full_name,
            'Email': vet.email,
            'Hospital': vet.hospital_affiliation,
            'License': vet.license_number,
          }
        ).catch(err => console.error('Email notification failed (non-critical):', err));
      }
      
      refreshVets();
    } catch (error) {
      console.error('Failed to approve veterinarian:', error);
      alert('Failed to approve veterinarian. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    if (window.confirm('Are you sure you want to reject this veterinarian? This action cannot be undone.')) {
      try {
        const vet = vets.find((v: Veterinarian) => v.id === id);
        const result = await rejectVet({ id });
        
        console.log('Veterinarian rejected:', result);
        
        if (vet) {
          sendNotification(
            sendEmail,
            NotificationType.VET_REJECTED,
            `❌ Vet Rejected: ${vet.full_name}`,
            {
              'Veterinarian': vet.full_name,
              'Email': vet.email,
              'Hospital': vet.hospital_affiliation,
            }
          ).catch(err => console.error('Email notification failed (non-critical):', err));
        }
        
        refreshVets();
      } catch (error) {
        console.error('Failed to reject veterinarian:', error);
        alert('Failed to reject veterinarian. Please try again.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this veterinarian? This action cannot be undone.')) {
      try {
        await deleteVet({ id });
        console.log('Veterinarian deleted:', id);
        refreshVets();
      } catch (error) {
        console.error('Failed to delete veterinarian:', error);
        alert('Failed to delete veterinarian. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loadingVets) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading veterinarians...</div>
        </CardContent>
      </Card>
    );
  }

  if (errorVets) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">Error loading veterinarians: {errorVets.message}</div>
        </CardContent>
      </Card>
    );
  }

  const vetsList: Veterinarian[] = vets || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Veterinarian Management</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Approve, reject, or manage veterinarian accounts
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                <TableHead className="hidden sm:table-cell">License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vetsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No veterinarians found
                  </TableCell>
                </TableRow>
              ) : (
                vetsList.map((vet) => (
                  <TableRow key={vet.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{vet.full_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{vet.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{vet.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{vet.hospital_affiliation}</TableCell>
                    <TableCell className="hidden sm:table-cell">{vet.license_number}</TableCell>
                    <TableCell>{getStatusBadge(vet.verification_status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {vet.last_login ? new Date(vet.last_login).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={dialogOpen && selectedVet?.id === vet.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedVet(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedVet(vet)}
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Veterinarian Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-semibold">Name</p>
                                <p className="text-sm text-muted-foreground">{vet.full_name}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Email</p>
                                <p className="text-sm text-muted-foreground">{vet.email}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">License Number</p>
                                <p className="text-sm text-muted-foreground">{vet.license_number}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Hospital Affiliation</p>
                                <p className="text-sm text-muted-foreground">{vet.hospital_affiliation}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Status</p>
                                <p className="text-sm">{getStatusBadge(vet.verification_status)}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Registered</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(vet.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Last Login</p>
                                <p className="text-sm text-muted-foreground">
                                  {vet.last_login ? new Date(vet.last_login).toLocaleString() : 'Never'}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {vet.verification_status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(vet.id)}
                              type="button"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(vet.id)}
                              type="button"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vet.id)}
                          type="button"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
