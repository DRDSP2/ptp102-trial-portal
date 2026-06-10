import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ByRockLogo } from '@/components/ByRockLogo';
import { Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">PTP-102 Trial</CardTitle>
              <p className="text-slate-300 text-sm mt-1">Select access type</p>
            </div>
            <ByRockLogo className="h-12 w-auto" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Button size="lg" className="w-full" onClick={() => navigate('/vet/login')}>
            <UserPlus className="mr-2 h-5 w-5" />
            Veterinarian Access
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => navigate('/admin/login')}>
            <Shield className="mr-2 h-5 w-5" />
            Admin Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
