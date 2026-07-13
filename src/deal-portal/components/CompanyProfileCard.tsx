import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, FileCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CompanyProfile {
  id: string;
  legal_name: string;
  entity_type: string;
  jurisdiction: string;
  registered_address: string;
  verified: boolean;
}

export function CompanyProfileCard() {
  const { client } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.from('company_profile').select('*').limit(1).single().then(({ data }) => {
      setProfile(data as CompanyProfile | null);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div className="p-4 text-center text-sm text-slate-500">Loading company info...</div>;

  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={20} /> {profile.legal_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Legal Entity</span>
          <span>{profile.entity_type}</span>
        </div>
        <div className="flex justify-between">
          <span>Jurisdiction</span>
          <span>{profile.jurisdiction}</span>
        </div>
        <div className="flex justify-between">
          <span>Registered Office</span>
          <span>{profile.registered_address}</span>
        </div>
        {profile.verified && (
          <div className="flex items-center gap-2 text-green-600 mt-4">
            <FileCheck size={16} /> Entity Verified
          </div>
        )}
      </CardContent>
    </Card>
  );
}
