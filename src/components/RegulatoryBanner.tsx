import { AlertTriangle } from 'lucide-react';

/**
 * Slim regulatory disclosure that rides above the dashboard header.
 * Uses muted brass tones from the new palette so it reads as informational,
 * not alarming.
 */
export function RegulatoryBanner() {
  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2">
      <div className="container mx-auto max-w-7xl flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
        <p className="text-xs text-warning-soft">
          PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.
          It has not been approved as safe or effective. All use is investigational only.
        </p>
      </div>
    </div>
  );
}
