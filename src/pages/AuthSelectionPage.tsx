import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ByrockLogo } from '@/components/ByrockLogo';
import { HeroSection } from '@/components/HeroSection';
import { Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Logo Bar */}
      <div className="bg-black py-4 px-4 flex justify-center">
        <ByrockLogo variant="icon" height={32} />
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Access Selection Card */}
      <div className="px-4 py-8 -mt-4 relative z-10 flex flex-col items-center">
        <div className="mb-4">
          <ByrockLogo variant="full" height={60} />
        </div>
        <Card className="max-w-md mx-auto shadow-xl border border-slate-200 w-full">
          <CardHeader className="bg-slate-900 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">PTP-102 Trial Portal</CardTitle>
                <p className="text-slate-300 text-sm mt-1">Select access type to continue</p>
              </div>
              <ByrockLogo variant="icon" height={32} />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button size="lg" className="w-full bg-[#6b7f3a] hover:bg-[#5a6b31]" onClick={() => navigate('/vet/login')}>
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

      {/* Footer */}
      <footer className="text-center py-6 text-slate-400 text-sm">
        <p>Byrock Technologies Ltd. — Redefining Equine Health</p>
        <p className="mt-1 text-xs">PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.</p>
      </footer>
    </div>
  );
}
