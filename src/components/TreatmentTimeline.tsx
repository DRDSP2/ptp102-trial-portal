import { Clock } from 'lucide-react';

type Treatment = {
  id: number;
  administration_datetime: string;
  dosage_mg: number;
  total_volume_ml?: number;
  protocol_hour: number | null;
};

type TreatmentTimelineProps = {
  treatments: Treatment[];
  protocolStartTime: Date | null;
};

export function TreatmentTimeline({ treatments, protocolStartTime }: TreatmentTimelineProps) {
  const milestones = [
    { hour: 0, label: 'Dose 1', critical: true },
    { hour: 12, label: 'Dose 2', critical: true },
    { hour: 24, label: '24h', critical: false },
    { hour: 48, label: '48h', critical: false },
    { hour: 72, label: '72h', critical: false },
  ];
  const currentHour = protocolStartTime ? Math.floor((Date.now() - protocolStartTime.getTime()) / (1000 * 60 * 60)) : null;

  const getDoseAtHour = (hour: number) => {
    return treatments.find(t => t.protocol_hour !== null && Math.abs(t.protocol_hour - hour) <= 1);
  };

  const getProtocolCompliance = (treatment: Treatment) => {
    if (treatment.protocol_hour === null || !protocolStartTime) return null;
    
    const actualTime = new Date(treatment.administration_datetime);
    const expectedTime = new Date(protocolStartTime.getTime() + treatment.protocol_hour * 60 * 60 * 1000);
    const timeDiffHours = Math.abs(actualTime.getTime() - expectedTime.getTime()) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 1) return 'on-time';
    if (timeDiffHours <= 3) return 'acceptable';
    return 'delayed';
  };

  return (
    <div className="space-y-6">
      {!protocolStartTime ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Protocol Not Yet Started</p>
          <p className="text-sm mt-2">Administer first treatment (Day 0) to begin 72-hour timeline</p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
            <p className="text-xs font-semibold text-blue-900">Two-Dose Protocol:</p>
            <p className="text-xs text-blue-800">• Day 0 (Hour 0): First dose</p>
            <p className="text-xs text-blue-800">• +12 hours: Second dose</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="flex justify-between mb-3">
            {milestones.map((milestone) => {
              const hasDose = getDoseAtHour(milestone.hour);
              return (
                <div key={milestone.hour} className="flex flex-col items-center relative">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      hasDose
                        ? 'bg-green-500 border-green-600'
                        : currentHour !== null && currentHour >= milestone.hour
                        ? 'bg-primary border-primary'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {hasDose && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="text-center mt-2">
                    <span className={`text-xs font-bold block ${milestone.critical ? 'text-orange-600' : 'text-slate-700'}`}>
                      {milestone.label}
                    </span>
                    {milestone.critical && (
                      <span className="text-[10px] text-orange-600 font-semibold">DOSE</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-3 bg-slate-200 rounded-full relative mb-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all"
              style={{
                width: currentHour !== null ? `${Math.min((currentHour / 72) * 100, 100)}%` : '0%',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
            <span>Start</span>
            <span>Primary Observation (72h)</span>
          </div>
          <div className="text-center p-3 bg-slate-100 rounded-lg">
            <p className="text-sm font-medium">
              {currentHour !== null
                ? currentHour >= 72
                  ? '✓ Primary observation period completed'
                  : `Current: Hour ${currentHour} of 72`
                : 'Calculating...'}
            </p>
            {currentHour !== null && currentHour < 72 && (
              <p className="text-xs text-muted-foreground mt-1">
                {72 - currentHour} hours remaining in primary observation
              </p>
            )}
            {currentHour !== null && currentHour >= 72 && (
              <p className="text-xs text-orange-600 mt-1">
                Continue monitoring through Day 10-14 for extended follow-up
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h4 className="font-medium mb-3">Recent Treatments</h4>
        {treatments && treatments.length > 0 ? (
          <div className="space-y-2">
            {treatments.slice(0, 5).map((treatment) => {
              const compliance = getProtocolCompliance(treatment);
              return (
                <div key={treatment.id} className="flex items-center gap-3 p-2 border-l-2 border-primary pl-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {treatment.total_volume_ml ? `${treatment.total_volume_ml}mL` : `${treatment.dosage_mg}mg`}
                      </p>
                      {compliance && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          compliance === 'on-time' ? 'bg-green-100 text-green-700' :
                          compliance === 'acceptable' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {compliance === 'on-time' ? 'On Time' : compliance === 'acceptable' ? 'Acceptable' : 'Delayed'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(treatment.administration_datetime).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {treatment.protocol_hour !== null ? `Hour ${treatment.protocol_hour}` : 'Pre-Protocol'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No treatments yet</p>
        )}
      </div>
    </div>
  );
}
