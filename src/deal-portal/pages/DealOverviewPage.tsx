import { PitchDeckViewer } from '@/deal-portal/components/PitchDeckViewer';
import { CompanyProfileCard } from '@/deal-portal/components/CompanyProfileCard';

export function DealOverviewPage() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <PitchDeckViewer />
        </div>
        <div className="w-full md:w-80">
          <CompanyProfileCard />
        </div>
      </div>
    </div>
  );
}
