import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { Activity, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Log {
  exercise_id: string;
  weight_per_set?: string | null;
  reps_per_set?: string | null;
  sets?: number | null;
  duration_seconds?: number | null;
  distance_km?: number | null;
  created_at: string;
  exercise?: {
    name?: string | null;
    muscle_group?: string | null;
    metric_weight?: boolean | null;
    metric_reps?: boolean | null;
    metric_time?: boolean | null;
    metric_distance?: boolean | null;
  };
}

interface Props {
  logs: Log[];
  title?: string;
  description?: string;
}

export const ExerciseProgressList: React.FC<Props> = ({ 
  logs, 
  title = "Exercise Progress",
  description = "Track your improvement across individual exercises"
}) => {
  // Group logs by exercise and get unique exercises with at least 2 logs
  const exerciseGroups = useMemo(() => {
    const groups: Record<string, { 
      exerciseId: string; 
      name: string; 
      count: number;
      latestLog: Log;
      metricWeight?: boolean;
      metricReps?: boolean;
      metricTime?: boolean;
      metricDistance?: boolean;
    }> = {};

    logs.forEach(log => {
      if (!log.exercise_id || !log.exercise?.name) return;
      
      if (!groups[log.exercise_id]) {
        groups[log.exercise_id] = {
          exerciseId: log.exercise_id,
          name: log.exercise.name,
          count: 0,
          latestLog: log,
          metricWeight: log.exercise.metric_weight !== false,
          metricReps: log.exercise.metric_reps !== false,
          metricTime: log.exercise.metric_time === true,
          metricDistance: log.exercise.metric_distance === true,
        };
      }
      
      groups[log.exercise_id].count++;
      
      // Keep the latest log
      if (new Date(log.created_at) > new Date(groups[log.exercise_id].latestLog.created_at)) {
        groups[log.exercise_id].latestLog = log;
      }
    });

    // Filter exercises with at least 2 logs for meaningful progress tracking
    return Object.values(groups)
      .filter(g => g.count >= 2)
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  if (exerciseGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No exercise progress data yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete the same exercise at least twice to see progress charts.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {exerciseGroups.slice(0, 10).map((group) => (
            <div key={group.exerciseId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{group.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {group.count} sessions logged
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {group.metricWeight && 'Weight'}
                  {group.metricDistance && 'Distance'}
                  {group.metricTime && !group.metricDistance && 'Time'}
                  {!group.metricWeight && !group.metricDistance && !group.metricTime && 'Reps'}
                </Badge>
              </div>
              <ExerciseProgressChart
                exerciseId={group.exerciseId}
                exerciseName={group.name}
                metricWeight={group.metricWeight}
                metricReps={group.metricReps}
                metricTime={group.metricTime}
                metricDistance={group.metricDistance}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

