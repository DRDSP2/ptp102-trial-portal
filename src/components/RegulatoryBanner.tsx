import { AlertTriangle } from 'lucide-react';

export function RegulatoryBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="container mx-auto max-w-7xl flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          PTP-102 is an investigational new animal drug (INAD) under FDA CVM review. 
          It has not been approved as safe or effective. All use is investigational only.
        </p>
      </div>
    </div>
  );
}
