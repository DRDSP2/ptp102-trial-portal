import { IPPortfolioViewer } from '@/deal-portal/components/IPPortfolioViewer';

export function IPPortfolioPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">IP Portfolio</h1>
      <IPPortfolioViewer />
    </div>
  );
}
