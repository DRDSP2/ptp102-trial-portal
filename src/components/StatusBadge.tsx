import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrialStatus = string;
type ScreeningStatus = 'pending_screening' | 'approved' | 'rejected' | 'awaiting_details' | null | undefined;

type StatusBadgeProps = {
  trialStatus: TrialStatus;
  screeningStatus?: ScreeningStatus;
  className?: string;
};

const trialVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  screening: 'secondary',
  enrolled: 'default',
  completed: 'outline',
  withdrawn: 'destructive',
};

export function StatusBadge({ trialStatus, screeningStatus, className }: StatusBadgeProps) {
  const trialVariant = trialVariants[trialStatus] || 'default';

  if (screeningStatus === 'pending_screening') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Badge variant="secondary">{trialStatus}</Badge>
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
          <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
          Pending Screening
        </Badge>
      </div>
    );
  }

  if (screeningStatus === 'approved') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Badge variant={trialVariant}>{trialStatus}</Badge>
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
          Approved
        </Badge>
      </div>
    );
  }

  if (screeningStatus === 'rejected') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Badge variant={trialVariant}>{trialStatus}</Badge>
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
          Rejected
        </Badge>
      </div>
    );
  }

  if (screeningStatus === 'awaiting_details') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Badge variant={trialVariant}>{trialStatus}</Badge>
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
          Awaiting Details
        </Badge>
      </div>
    );
  }

  return <Badge variant={trialVariant} className={className}>{trialStatus}</Badge>;
}
