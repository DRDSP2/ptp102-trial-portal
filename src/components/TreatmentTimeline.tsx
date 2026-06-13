import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, AlertCircle, Syringe, Activity, Calendar, Timer, ChevronRight } from 'lucide-react';
import { format, addHours, differenceInSeconds, isPast, isFuture, isWithinInterval } from 'date-fns';

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  offsetHours: number;
  icon: 'dose' | 'monitor' | 'followup';
  requiresAction: boolean;
}

const PROTOCOL_STEPS: TimelineStep[] = [
  { id: 'dose1', label: 'Dose 1', description: '500mL IV infusion over 15-30 min', offsetHours: 0, icon: 'dose', requiresAction: true },
  { id: 'dose2', label: 'Dose 2', description: '500mL IV infusion 12h after Dose 1', offsetHours: 12, icon: 'dose', requiresAction: true },
  { id: 'monitor24', label: '24h Monitor', description: 'Vital signs & lameness assessment', offsetHours: 24, icon: 'monitor', requiresAction: false },
  { id: 'monitor48', label: '48h Monitor', description: 'Obel score & physical exam', offsetHours: 48, icon: 'monitor', requiresAction: false },
  { id: 'monitor72', label: '72h Primary End', description: 'End primary observation period', offsetHours: 72, icon: 'monitor', requiresAction: false },
  { id: 'followup', label: 'Day 10-14 Follow-up', description: 'Final recovery documentation & X-rays', offsetHours: 14 * 24, icon: 'followup', requiresAction: true },
];

interface TreatmentTimelineProps {
  patientId: string;
  horseName: string;
  firstDoseAt: string | null;
  completedSteps: string[];
  onMarkComplete: (stepId: string, timestamp: string) => void;
  onReportAdverseEvent: () => void;
}

export const TreatmentTimeline: React.FC<TreatmentTimelineProps> = ({
  patientId,
  horseName,
  firstDoseAt,
  completedSteps = [],
  onMarkComplete,
  onReportAdverseEvent,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stepsWithStatus = useMemo(() => {
    if (!firstDoseAt) {
      return PROTOCOL_STEPS.map((s) => ({ ...s, status: 'pending' as const, targetAt: null as Date | null }));
    }

    const base = new Date(firstDoseAt);
    return PROTOCOL_STEPS.map((step) => {
      const targetAt = addHours(base, step.offsetHours);
      const isDone = completedSteps.includes(step.id);
      const isOverdue = isPast(targetAt) && !isDone;
      const isCurrent = !isDone && !isOverdue && isWithinInterval(now, { start: addHours(targetAt, -2), end: addHours(targetAt, 2) });

      let status: 'completed' | 'current' | 'upcoming' | 'overdue' = 'upcoming';
      if (isDone) status = 'completed';
      else if (isOverdue) status = 'overdue';
      else if (isCurrent) status = 'current';

      return { ...step, status, targetAt };
    });
  }, [firstDoseAt, completedSteps, now]);

  const nextStep = stepsWithStatus.find(
    (s) => s.status === 'current' || s.status === 'overdue' || s.status === 'upcoming'
  );

  const countdown = useMemo(() => {
    if (!nextStep?.targetAt) return null;
    const diff = differenceInSeconds(nextStep.targetAt, now);
    if (diff <= 0 && nextStep.status !== 'completed') return 'OVERDUE';
    const h = Math.floor(Math.abs(diff) / 3600);
    const m = Math.floor((Math.abs(diff) % 3600) / 60);
    const s = Math.abs(diff) % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [nextStep, now]);

  const isInCriticalWindow = firstDoseAt
    ? isWithinInterval(now, {
        start: new Date(firstDoseAt),
        end: addHours(new Date(firstDoseAt), 72),
      })
    : false;

  const hasOverdueStep = stepsWithStatus.some((s) => s.status === 'overdue');

  const getIcon = (type: string) => {
    switch (type) {
      case 'dose':
        return <Syringe className="w-5 h-5" />;
      case 'monitor':
        return <Activity className="w-5 h-5" />;
      case 'followup':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const statusStyles = {
    completed: 'bg-green-50 border-green-200 text-green-700',
    current: 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-400 animate-pulse',
    upcoming: 'bg-slate-50 border-slate-200 text-slate-500',
    overdue: 'bg-red-50 border-red-300 text-red-700',
    pending: 'bg-slate-50 border-slate-200 text-slate-500',
  };

  const dotStyles = {
    completed: 'bg-green-500',
    current: 'bg-blue-500',
    upcoming: 'bg-slate-300',
    overdue: 'bg-red-500',
    pending: 'bg-slate-300',
  };

  if (!firstDoseAt) {
    return (
      <div className="p-6 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Treatment Timeline — {horseName}</h2>
          <span className="px-3 py-1 text-sm font-medium text-amber-700 bg-amber-50 rounded-full">Day 0 — Awaiting Dose 1</span>
        </div>
        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">No first dose recorded</p>
            <p className="text-sm text-amber-700">Record Dose 1 to activate the timeline and countdown.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-lg border border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Treatment Timeline — {horseName}</h2>
          <p className="text-sm text-slate-500">
            Patient ID: {patientId} • First dose: {format(new Date(firstDoseAt), 'PPp')}
          </p>
        </div>

        {nextStep && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${statusStyles[nextStep.status]}`}>
            <Timer className="w-5 h-5" />
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                {nextStep.status === 'overdue' ? 'OVERDUE' : `Next: ${nextStep.label}`}
              </p>
              <p className="text-2xl font-mono font-bold">{countdown}</p>
            </div>
          </div>
        )}
      </div>

      {/* Critical Window Banner */}
      {isInCriticalWindow && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">Primary observation window (0–72h) — Close monitoring required</p>
          <button
            onClick={onReportAdverseEvent}
            className="ml-auto px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
            type="button"
          >
            Report Adverse Event
          </button>
        </div>
      )}

      {/* Overdue Banner */}
      {hasOverdueStep && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">One or more protocol steps are overdue.</p>
          <button
            onClick={onReportAdverseEvent}
            className="ml-auto px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700"
            type="button"
          >
            Report Adverse Event
          </button>
        </div>
      )}

      {/* Timeline Steps */}
      <div className="relative">
        {/* Connecting line (desktop) */}
        <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-slate-200" />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {stepsWithStatus.map((step, idx) => (
            <div key={step.id} className="relative flex flex-col items-center">
              <div
                className={`w-full p-4 rounded-lg border-2 transition-all ${statusStyles[step.status]} ${
                  step.status === 'current' ? 'scale-105' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-full text-white ${dotStyles[step.status]}`}>{getIcon(step.icon)}</div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">{step.status}</span>
                </div>

                <h3 className="font-semibold text-sm">{step.label}</h3>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">{step.description}</p>

                {step.targetAt && <p className="text-xs font-mono mt-2 opacity-70">{format(step.targetAt, 'MMM d, HH:mm')}</p>}

                {step.requiresAction && step.status !== 'completed' && (
                  <button
                    onClick={() => onMarkComplete(step.id, new Date().toISOString())}
                    disabled={step.status === 'upcoming'}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      step.status === 'upcoming'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white border border-current hover:bg-opacity-50'
                    }`}
                    type="button"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {step.status === 'overdue' ? 'Mark Complete (Overdue)' : 'Mark Complete'}
                  </button>
                )}
              </div>

              {idx < stepsWithStatus.length - 1 && (
                <div className="md:hidden flex justify-center py-2">
                  <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
        <p>
          <strong>Protocol:</strong> 5 mg/mL concentration • 500mL per dose • IV jugular • Sterile technique • Slow
          infusion 15-30 min
        </p>
        <p className="mt-1">
          <strong>Total follow-up:</strong> 10-14 days to document recovery
        </p>
      </div>
    </div>
  );
};
