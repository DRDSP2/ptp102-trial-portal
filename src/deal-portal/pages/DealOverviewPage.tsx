import { Link } from 'react-router-dom';
import { PitchDeckViewer } from '@/deal-portal/components/PitchDeckViewer';
import { CompanyProfileCard } from '@/deal-portal/components/CompanyProfileCard';
import { TeamDirectory } from '@/deal-portal/components/TeamDirectory';
import { DealPipeline } from '@/deal-portal/components/DealPipeline';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical,
  Activity,
  BarChart3,
  Table2,
  FileSearch,
  FileSignature,
  Globe,
  LineChart,
} from 'lucide-react';

interface SectionDef {
  path: string;
  label: string;
  icon: React.ElementType;
  description: string;
  tier: string;
}

const sections: SectionDef[] = [
  { path: '/deal/financials', label: 'Financial Dashboard', icon: BarChart3, description: 'Revenue projections, burn rate, P&L summary', tier: 'diligence' },
  { path: '/deal/cmc', label: 'CMC Data Room', icon: FlaskConical, description: 'CMC milestones, regulatory modules, manufacturing dossier', tier: 'diligence' },
  { path: '/deal/cap-table', label: 'Cap Table', icon: Table2, description: 'Shareholder breakdown, ESOP grants, dilution scenarios', tier: 'diligence' },
  { path: '/deal/ip-portfolio', label: 'IP Portfolio', icon: FileSearch, description: 'Patents, trademarks, biomarkers, trade secrets', tier: 'evaluation' },
  { path: '/deal/trials/live', label: 'Live Trials', icon: Activity, description: 'Real-time trial dashboard — LAM-00007', tier: 'diligence' },
  { path: '/deal/term-sheet', label: 'Term Sheet', icon: FileSignature, description: 'Term negotiation, redline comparison', tier: 'exclusive' },
  { path: '/deal/regions', label: 'Marketplace', icon: Globe, description: 'Regional licensing opportunities', tier: 'exclusive' },
  { path: '/deal/investor', label: 'Investor Dashboard', icon: LineChart, description: 'Investor updates, governance docs, pipeline overview', tier: 'evaluation' },
];

const tierPriority: Record<string, number> = { evaluation: 0, diligence: 1, exclusive: 2 };

function canAccess(userTier: string, requiredTier: string): boolean {
  return (tierPriority[userTier] ?? -1) >= (tierPriority[requiredTier] ?? 99);
}

export function DealOverviewPage() {
  const { dealTier } = useAuth();
  const userTier = dealTier || 'none';

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Top: Pitch deck + Company profile */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <PitchDeckViewer />
        </div>
        <div className="w-full md:w-80">
          <CompanyProfileCard />
        </div>
      </div>

      {/* Section quick-link cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Deal Room Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((s) => {
            const Icon = s.icon;
            const accessible = canAccess(userTier, s.tier);
            return (
              <Link key={s.path} to={accessible ? s.path : '#'} className={accessible ? '' : 'pointer-events-none opacity-50'}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Icon size={22} className="text-slate-600" />
                      <Badge variant="outline" className="text-[10px]">{s.tier}</Badge>
                    </div>
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.description}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom: Team + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DealPipeline />
        <TeamDirectory />
      </div>
    </div>
  );
}
