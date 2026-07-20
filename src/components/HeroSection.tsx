import { ByrockLogo } from './ByrockLogo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, HeartPulse, ShieldCheck, ArrowDown } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=1920&q=80)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-[#2a3a18]/85" />
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#6b7f3a]/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#8fa860]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center mb-4">
            <ByrockLogo variant="icon" className="h-16 sm:h-20" animated />
          </div>

          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-4 py-1">
            <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
            Clinical Trial Management Platform
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            PTP-102 Laminitis Trial
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A breakthrough therapeutic solution for equine laminitis. 
            Supporting veterinarians worldwide in advancing equine healthcare.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <HeartPulse className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-semibold text-white">72-Hour Protocol</p>
                <p className="text-xs text-slate-400 mt-1">Two-dose administration with close monitoring</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-semibold text-white">Patents Pending</p>
                <p className="text-xs text-slate-400 mt-1">Europe, US & Australia coverage</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <FlaskConical className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-semibold text-white">5 mg/mL IV</p>
                <p className="text-xs text-slate-400 mt-1">500mL slow jugular infusion</p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 animate-bounce">
            <ArrowDown className="h-5 w-5 text-slate-400 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
