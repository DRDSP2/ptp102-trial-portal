import React, { useState, useMemo, useCallback } from 'react';
import { useProtocolClock } from '@/hooks/useProtocolClock';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AddTreatmentForm } from './AddTreatmentForm';
import {
  Timer,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Syringe,
  CalendarClock,
} from 'lucide-react';

type Treatment = {
  id: number;
  administration_datetime: string;
  dosage_mg: number;
  total_volume_ml?: number;
  protocol_hour: number | null;
};

type NextDoseTimerProps = {
  protocolStartTime: Date | null;
  treatments: Treatment[];
  patientId: number;
  onSuccess: () => void;
};

type DoseSchedule = {
  hour: number;
  label: string;
  doseNumber: number;
};

const DOSE_SCHEDULE: DoseSchedule[] = [
  { hour: 0, label: 'First Dose', doseNumber: 1 },
  { hour: 12, label: 'Second Dose', doseNumber: 2 },
];

function getNextDoseInfo(protocolStartTime: Date | null, treatments: Treatment[]) {
  if (!protocolStartTime) {
    return {
      status: 'not-started' as const,
      message: 'Protocol not started — administer first dose to begin',
      nextDoseHour: 0,
      nextDoseLabel: 'First Dose',
      doseNumber: 1,
      timeUntilMs: null,
      isOverdue: false,
      lastDoseTime: null,
    };
  }

  const now = Date.now();
  const startMs = protocolStartTime.getTime();

  // Find which doses have been administered
  const administeredHours = new Set<number>();
  treatments.forEach((t) => {
    if (t.protocol_hour !== null) {
      administeredHours.add(t.protocol_hour);
    }
  });

  // Check if all doses are complete
  const allDosesComplete = DOSE_SCHEDULE.every((d) =>
    treatments.some((t) => t.protocol_hour !== null && Math.abs(t.protocol_hour - d.hour) <= 1)
  );

  if (allDosesComplete) {
    const lastTreatment = treatments
      .filter((t) => t.protocol_hour !== null)
      .sort((a, b) => b.protocol_hour! - a.protocol_hour!)[0];
    return {
      status: 'complete' as const,
      message: 'All protocol doses administered',
      nextDoseHour: null,
      nextDoseLabel: null,
      doseNumber: null,
      timeUntilMs: null,
      isOverdue: false,
      lastDoseTime: lastTreatment ? new Date(lastTreatment.administration_datetime) : null,
    };
  }

  // Find next scheduled dose
  for (const dose of DOSE_SCHEDULE) {
    const hasDose = treatments.some(
      (t) => t.protocol_hour !== null && Math.abs(t.protocol_hour - dose.hour) <= 1
    );
    if (!hasDose) {
      const scheduledTimeMs = startMs + dose.hour * 60 * 60 * 1000;
      const timeUntilMs = scheduledTimeMs - now;
      const isOverdue = timeUntilMs < 0;
      const windowStartMs = scheduledTimeMs - 30 * 60 * 1000; // 30 min before
      const windowEndMs = scheduledTimeMs + 3 * 60 * 60 * 1000; // 3 hours after
      const inWindow = now >= windowStartMs && now <= windowEndMs;

      return {
        status: (isOverdue ? 'overdue' : inWindow ? 'due-soon' : 'pending') as 'overdue' | 'due-soon' | 'pending',
        message: isOverdue
          ? `${dose.label} is overdue`
          : inWindow
          ? `${dose.label} administration window is open`
          : `${dose.label} scheduled`,
        nextDoseHour: dose.hour,
        nextDoseLabel: dose.label,
        doseNumber: dose.doseNumber,
        timeUntilMs,
        isOverdue,
        lastDoseTime: null,
      };
    }
  }

  return {
    status: 'complete' as const,
    message: 'Protocol complete',
    nextDoseHour: null,
    nextDoseLabel: null,
    doseNumber: null,
    timeUntilMs: null,
    isOverdue: false,
    lastDoseTime: null,
  };
}

function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function NextDoseTimerImpl({ protocolStartTime, treatments, patientId, onSuccess }: NextDoseTimerProps) {
  const now = useProtocolClock();
  const [showAdminForm, setShowAdminForm] = useState(false);
  const handleTreatmentSuccess = useCallback(() => {
    setShowAdminForm(false);
    onSuccess();
  }, [onSuccess]);

  const doseInfo = useMemo(
    () => getNextDoseInfo(protocolStartTime, treatments),
    [protocolStartTime, treatments]
  );

  // Re-compute time until with current timestamp for display
  const displayTimeUntil = useMemo(() => {
    if (protocolStartTime && doseInfo.nextDoseHour !== null) {
      return protocolStartTime.getTime() + doseInfo.nextDoseHour * 60 * 60 * 1000 - now;
    }
    return doseInfo.timeUntilMs;
  }, [protocolStartTime, doseInfo.nextDoseHour, doseInfo.timeUntilMs, now]);

  const statusConfig = {
    'not-started': {
      bg: 'bg-slate-50 border-slate-200',
      icon: <CalendarClock className="h-5 w-5 text-slate-500" />,
      badge: <Badge variant="secondary">Not Started</Badge>,
      textColor: 'text-slate-700',
      accentColor: 'text-slate-500',
    },
    pending: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      badge: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>,
      textColor: 'text-blue-900',
      accentColor: 'text-blue-600',
    },
    'due-soon': {
      bg: 'bg-amber-50 border-amber-300',
      icon: <Timer className="h-5 w-5 text-amber-600 animate-pulse" />,
      badge: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 animate-pulse">Due Now</Badge>,
      textColor: 'text-amber-900',
      accentColor: 'text-amber-600',
    },
    overdue: {
      bg: 'bg-red-50 border-red-300',
      icon: <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />,
      badge: <Badge className="bg-red-100 text-red-800 hover:bg-red-100 animate-pulse">Overdue</Badge>,
      textColor: 'text-red-900',
      accentColor: 'text-red-600',
    },
    complete: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>,
      textColor: 'text-green-900',
      accentColor: 'text-green-600',
    },
  };

  const config = statusConfig[doseInfo.status];

  return (
    <Card className={`border-2 ${config.bg} transition-colors duration-500`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            Next Dose Administration
          </CardTitle>
          {config.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main countdown display */}
        <div className="text-center py-2">
          {doseInfo.status === 'not-started' && (
            <div className="space-y-2">
              <p className={`text-lg font-semibold ${config.textColor}`}>
                Awaiting First Dose
              </p>
              <p className="text-sm text-slate-500">
                Administer PTP-102 to initiate the 72-hour protocol
              </p>
              <Dialog open={showAdminForm} onOpenChange={setShowAdminForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="mt-2">
                    <Syringe className="h-4 w-4 mr-2" />
                    Record First Dose
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Treatment</DialogTitle>
                  </DialogHeader>
                  <AddTreatmentForm
                    patientId={patientId}
                    protocolHour={0}
                    onSuccess={handleTreatmentSuccess}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {(doseInfo.status === 'pending' || doseInfo.status === 'due-soon' || doseInfo.status === 'overdue') && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                {config.icon}
                <span className={`text-sm font-medium ${config.textColor}`}>
                  {doseInfo.nextDoseLabel}
                </span>
              </div>

              <div className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight ${config.accentColor}`}>
                {displayTimeUntil !== null ? formatDuration(displayTimeUntil) : '—'}
              </div>

              <p className={`text-sm font-medium ${config.textColor}`}>
                {doseInfo.isOverdue
                  ? `Overdue by ${displayTimeUntil !== null ? formatDuration(displayTimeUntil) : ''}`
                  : displayTimeUntil !== null && displayTimeUntil < 30 * 60 * 1000
                  ? 'Administration window is open'
                  : `until ${doseInfo.nextDoseLabel?.toLowerCase() || 'next dose'}`}
              </p>

              {doseInfo.status !== 'overdue' && displayTimeUntil !== null && displayTimeUntil <= 60 * 60 * 1000 && (
                <p className="text-xs text-slate-500">
                  Recommended window: ±30 minutes from scheduled time
                </p>
              )}

              {doseInfo.status === 'overdue' && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-800 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    Dose is overdue. Administer as soon as possible and document the delay reason.
                  </p>
                </div>
              )}
            </div>
          )}

          {doseInfo.status === 'complete' && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <p className={`text-lg font-semibold ${config.textColor}`}>
                All Doses Complete
              </p>
              <p className="text-sm text-slate-500">
                Continue monitoring through Day 10-14 for extended follow-up
              </p>
            </div>
          )}
        </div>

        {/* Dose schedule tracker */}
        {protocolStartTime && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dose Schedule</p>
              <div className="flex items-center gap-2">
                {DOSE_SCHEDULE.map((dose, index) => {
                  const hasDose = treatments.some(
                    (t) => t.protocol_hour !== null && Math.abs(t.protocol_hour - dose.hour) <= 1
                  );
                  const isNext = !hasDose && doseInfo.doseNumber === dose.doseNumber;
                  return (
                    <div key={dose.hour} className="flex-1 flex items-center gap-2">
                      <div
                        className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                          hasDose
                            ? 'bg-green-50 border-green-200'
                            : isNext
                            ? doseInfo.status === 'overdue'
                              ? 'bg-red-50 border-red-300'
                              : 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {hasDose ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : isNext ? (
                            <Timer className={`h-3.5 w-3.5 ${doseInfo.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`} />
                          ) : (
                            <CircleOutline className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          <span className={`text-xs font-semibold ${
                            hasDose ? 'text-green-700' : isNext ? doseInfo.status === 'overdue' ? 'text-red-700' : 'text-amber-700' : 'text-slate-500'
                          }`}>
                            {dose.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Hour {dose.hour}
                        </p>
                      </div>
                      {index < DOSE_SCHEDULE.length - 1 && (
                        <div className="w-4 h-px bg-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Protocol progress */}
        {protocolStartTime && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Protocol Progress</span>
              <span>
                {Math.min(Math.floor((now - protocolStartTime.getTime()) / (1000 * 60 * 60)), 72)}h / 72h
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6b7f3a] to-[#a4b86b] rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(((now - protocolStartTime.getTime()) / (1000 * 60 * 60)) / 72 * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const NextDoseTimer = React.memo(NextDoseTimerImpl);

function CircleOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
