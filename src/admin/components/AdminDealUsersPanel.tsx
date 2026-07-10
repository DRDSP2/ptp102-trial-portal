import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DealProfile, DealTier } from '@/types/roles';


export function AdminDealUsersPanel() {
  const { client } = useAuth();
  const [profiles, setProfiles] = useState<DealProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await client.from('deal_profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as DealProfile[]) || []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateTier = async (userId: string, tier: DealTier) => {
    await client.from('deal_profiles').update({ tier }).eq('user_id', userId);
    await fetchProfiles();
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
                <TableHead>User ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Region of Interest</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-mono text-xs">{profile.user_id}</TableCell>
                  <TableCell>{profile.company || '—'}</TableCell>
                  <TableCell className="capitalize">{profile.role.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge>{profile.tier}</Badge>
                  </TableCell>
                  <TableCell className="uppercase">{profile.region_of_interest || '—'}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
