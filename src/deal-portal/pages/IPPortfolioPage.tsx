import { IPPortfolioViewer } from '@/deal-portal/components/IPPortfolioViewer';

export function IPPortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-6">IP Portfolio</h1>
      <IPPortfolioViewer />
    </div>
  );
}
