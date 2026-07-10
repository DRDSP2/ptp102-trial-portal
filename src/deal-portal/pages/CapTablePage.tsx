import { CapTableViewer } from '@/deal-portal/components/CapTableViewer';

export function CapTablePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cap Table</h1>
      <CapTableViewer />
    </div>
  );
}
