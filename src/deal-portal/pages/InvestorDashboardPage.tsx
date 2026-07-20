import { InvestorDashboard } from '@/deal-portal/components/InvestorDashboard';
import { InvestorGovernance } from '@/deal-portal/components/InvestorGovernance';
import { DealPipeline } from '@/deal-portal/components/DealPipeline';
import { TeamDirectory } from '@/deal-portal/components/TeamDirectory';

export function InvestorDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-2xl font-bold">Investor Dashboard</h1>
      <InvestorDashboard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DealPipeline />
        <TeamDirectory />
      </div>
      <InvestorGovernance />
    </div>
  );
}
