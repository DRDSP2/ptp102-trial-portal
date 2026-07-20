import { CapTableViewer } from '@/deal-portal/components/CapTableViewer';

export function CapTablePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-6">Cap Table</h1>
      <CapTableViewer />
    </div>
  );
}
