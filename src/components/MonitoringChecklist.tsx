import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, CheckSquare } from 'lucide-react';

type MonitoringChecklistProps = {
  protocolHour: number | null;
  treatments: any[];
  assessments: any[];
  labResults: any[];
  clinicalNotes: any[];
};

export function MonitoringChecklist({ protocolHour, treatments, assessments, labResults, clinicalNotes }: MonitoringChecklistProps) {
  const isWithin72Hours = protocolHour !== null && protocolHour <= 72;
  
  const hasTreatmentAtCurrentHour = treatments.some((t: any) => 
    t.protocol_hour !== null && Math.abs(t.protocol_hour - (protocolHour || 0)) <= 1
  );
  
  const hasAssessmentAtCurrentHour = assessments.some((a: any) => 
    a.protocol_hour !== null && Math.abs(a.protocol_hour - (protocolHour || 0)) <= 2
  );
  
  const hasLabsAtCurrentHour = labResults.some((l: any) => 
    l.protocol_hour !== null && Math.abs(l.protocol_hour - (protocolHour || 0)) <= 4
  );
  
  const hasNotesAtCurrentHour = clinicalNotes.some((n: any) => 
    n.protocol_hour !== null && Math.abs(n.protocol_hour - (protocolHour || 0)) <= 2
  );
  
  const recentAssessment = assessments.find((a: any) => 
    a.protocol_hour !== null && Math.abs(a.protocol_hour - (protocolHour || 0)) <= 2
  );

  const checklistItems = [
    { 
      key: 'treatment', 
      label: 'Treatment Administered', 
      completed: hasTreatmentAtCurrentHour,
      required: protocolHour === 0 || protocolHour === 12,
      description: protocolHour === 0 || protocolHour === 12 ? 'Required dose' : 'As needed'
    },
    { 
      key: 'vitalSigns', 
      label: 'Vital Signs Recorded', 
      completed: recentAssessment && (recentAssessment.heart_rate || recentAssessment.respiratory_rate || recentAssessment.temperature),
      required: true,
      description: 'HR, RR, Temperature'
    },
    { 
      key: 'digitalPulse', 
      label: 'Digital Pulse Assessment', 
      completed: recentAssessment && recentAssessment.digital_pulse_score !== null,
      required: true,
      description: 'Score 0-4'
    },
    { 
      key: 'gaitAssessment', 
      label: 'Gait/Lameness Evaluation', 
      completed: recentAssessment && recentAssessment.mobility_score !== null,
      required: true,
      description: 'Mobility score'
    },
    { 
      key: 'obelGrade', 
      label: 'Obel Grade', 
      completed: recentAssessment && recentAssessment.obel_grade !== null,
      required: true,
      description: 'Grade 0-4'
    },
    { 
      key: 'painScore', 
      label: 'Pain Score', 
      completed: recentAssessment && recentAssessment.pain_score !== null,
      required: true,
      description: 'Score 0-10'
    },
    { 
      key: 'adverseEvents', 
      label: 'Adverse Events Checked', 
      completed: hasNotesAtCurrentHour,
      required: true,
      description: 'Document any concerns'
    },
    { 
      key: 'labs', 
      label: 'Lab Work Completed', 
      completed: hasLabsAtCurrentHour,
      required: false,
      description: 'If scheduled'
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const requiredCompletedCount = checklistItems.filter(item => item.required && item.completed).length;
  const totalRequired = checklistItems.filter(item => item.required).length;

  return (
    <Card className={isWithin72Hours ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Monitoring Status
            {protocolHour !== null && (
              <Badge variant={isWithin72Hours ? 'default' : 'secondary'}>
                Hour {protocolHour}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${requiredCompletedCount === totalRequired ? 'text-green-600' : 'text-slate-400'}`} />
            <span className="text-sm font-medium">{requiredCompletedCount}/{totalRequired} Required</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!protocolHour ? (
          <p className="text-sm text-muted-foreground">Protocol not yet started</p>
        ) : (
          <>
            {isWithin72Hours && (
              <div className="bg-orange-100 border border-orange-300 rounded-md p-3 mb-3">
                <p className="text-xs font-semibold text-orange-900">PRIMARY OBSERVATION PERIOD (0-72h)</p>
                <p className="text-xs text-orange-800 mt-1">Close monitoring required - document all observations</p>
              </div>
            )}
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div 
                  key={item.key} 
                  className={`flex items-start space-x-3 p-2 rounded ${item.completed ? 'bg-green-50' : 'hover:bg-slate-100'}`}
                >
                  <div className="mt-0.5">
                    {item.completed ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-slate-300 rounded" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium leading-none flex items-center gap-1">
                      {item.label}
                      {item.required && <span className="text-destructive">*</span>}
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Total completion: {completedCount}/{checklistItems.length} items
              </p>
              {requiredCompletedCount < totalRequired && (
                <p className="text-xs text-orange-600 mt-1">
                  Complete all required (*) items for protocol compliance
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
