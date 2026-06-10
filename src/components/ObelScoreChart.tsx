import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Assessment = {
  id: number;
  assessment_datetime: string;
  obel_grade: number | null;
  pain_score: number | null;
  protocol_hour: number | null;
};

type ObelScoreChartProps = {
  assessments: Assessment[];
  protocolStartTime: Date | null;
};

export function ObelScoreChart({ assessments, protocolStartTime }: ObelScoreChartProps) {
  const validAssessments = assessments.filter((a) => a.obel_grade !== null);

  if (validAssessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Obel Score Progression</CardTitle>
          <CardDescription>Track lameness severity over protocol duration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No Obel scores recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  const firstScore = validAssessments[0].obel_grade!;
  const lastScore = validAssessments[validAssessments.length - 1].obel_grade!;
  const scoreDifference = lastScore - firstScore;

  const maxScore = Math.max(...validAssessments.map((a) => a.obel_grade!));
  const minScore = Math.min(...validAssessments.map((a) => a.obel_grade!));

  const getTrendIcon = () => {
    if (scoreDifference < 0) return <TrendingDown className="h-5 w-5 text-green-600" />;
    if (scoreDifference > 0) return <TrendingUp className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getTrendText = () => {
    if (scoreDifference < 0) return `Improved by ${Math.abs(scoreDifference)} grade${Math.abs(scoreDifference) > 1 ? 's' : ''}`;
    if (scoreDifference > 0) return `Worsened by ${scoreDifference} grade${scoreDifference > 1 ? 's' : ''}`;
    return 'No change';
  };

  const getTrendColor = () => {
    if (scoreDifference < 0) return 'bg-green-100 text-green-800 border-green-300';
    if (scoreDifference > 0) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getScoreColor = (score: number) => {
    if (score === 1) return 'bg-green-500';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-orange-500';
    if (score === 4) return 'bg-red-500';
    return 'bg-gray-400';
  };

  const getScoreLabel = (score: number) => {
    if (score === 1) return 'Grade 1: Walks freely but shifts weight when standing';
    if (score === 2) return 'Grade 2: Moves willingly at walk, short stride';
    if (score === 3) return 'Grade 3: Moves reluctantly, lifts feet';
    if (score === 4) return 'Grade 4: Refuses to move';
    return `Grade ${score}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Obel Score Progression</CardTitle>
            <CardDescription>Lower scores indicate improvement</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge variant="outline" className={getTrendColor()}>
              {getTrendText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-muted-foreground mb-1">Starting Score</p>
            <p className="text-2xl font-bold">{firstScore}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(validAssessments[0].assessment_datetime).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-muted-foreground mb-1">Latest Score</p>
            <p className="text-2xl font-bold">{lastScore}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(validAssessments[validAssessments.length - 1].assessment_datetime).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-end justify-between gap-1 h-48">
            {validAssessments.map((assessment, index) => {
              const score = assessment.obel_grade!;
              const height = (score / 4) * 100;
              const hour = assessment.protocol_hour;

              return (
                <div key={assessment.id} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className={`w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer ${getScoreColor(score)}`}
                      style={{ height: `${height}%` }}
                      title={getScoreLabel(score)}
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className="text-white font-bold text-sm">{score}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {hour !== null ? `H${hour}` : new Date(assessment.assessment_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute left-0 bottom-0 w-full h-px bg-border" />
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-medium mb-2">Obel Grade Reference:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">Grade 1: Walks freely, shifts weight standing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-muted-foreground">Grade 2: Moves willingly, short stride</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-muted-foreground">Grade 3: Moves reluctantly, lifts feet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Grade 4: Refuses to move</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
