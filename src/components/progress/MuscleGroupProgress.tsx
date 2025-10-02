import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, TrendingUp } from 'lucide-react';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertTotalVolume } from '@/lib/units';
import { ExerciseProgressChart } from './ExerciseProgressChart';

interface Log {
  log_id: string;
  session_id: string;
  exercise_id: string;
  sets?: number | null;
  weight_per_set?: string | null;
  reps_per_set?: string | null;
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

interface Session {
  session_id: string;
  date: string;
}

interface Props {
  logs: Log[];
  sessions: Session[];
}

interface MuscleGroupData {
  muscleGroup: string;
  exercises: {
    exerciseId: string;
    name: string;
    count: number;
    totalVolume: number;
    metricWeight?: boolean;
    metricReps?: boolean;
    metricTime?: boolean;
    metricDistance?: boolean;
  }[];
  totalVolume: number;
  totalExercises: number;
}

export const MuscleGroupProgress: React.FC<Props> = ({ logs, sessions }) => {
  const { unit } = useUnitPreference();

  const muscleGroupData = useMemo(() => {
    const groups: Record<string, MuscleGroupData> = {};

    logs.forEach(log => {
      const muscleGroup = log.exercise?.muscle_group || 'Other';
      
      if (!groups[muscleGroup]) {
        groups[muscleGroup] = {
          muscleGroup,
          exercises: [],
          totalVolume: 0,
          totalExercises: 0
        };
      }

      // Calculate volume for this log
      let logVolume = 0;
      if (log.weight_per_set && log.sets) {
        const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
        logVolume = weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
      }

      // Find or create exercise entry
      let exerciseEntry = groups[muscleGroup].exercises.find(e => e.exerciseId === log.exercise_id);
      if (!exerciseEntry) {
        exerciseEntry = {
          exerciseId: log.exercise_id,
          name: log.exercise?.name || 'Unknown Exercise',
          count: 0,
          totalVolume: 0,
          metricWeight: log.exercise?.metric_weight !== false,
          metricReps: log.exercise?.metric_reps !== false,
          metricTime: log.exercise?.metric_time === true,
          metricDistance: log.exercise?.metric_distance === true,
        };
        groups[muscleGroup].exercises.push(exerciseEntry);
      }

      exerciseEntry.count++;
      exerciseEntry.totalVolume += logVolume;
      groups[muscleGroup].totalVolume += logVolume;
      groups[muscleGroup].totalExercises++;
    });

    // Sort exercises within each group by count
    Object.values(groups).forEach(group => {
      group.exercises.sort((a, b) => b.count - a.count);
    });

    return Object.values(groups).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [logs]);

  if (muscleGroupData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Progress by Muscle Group
          </CardTitle>
          <CardDescription>Track your progress across different muscle groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No exercise data yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start logging workouts to see muscle group progress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Progress by Muscle Group
          </CardTitle>
          <CardDescription>Track your progress across different muscle groups from your exercise library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {muscleGroupData.map((group) => (
              <div key={group.muscleGroup} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{group.muscleGroup}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.totalExercises} total exercises logged
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {convertTotalVolume(group.totalVolume, unit).toLocaleString()} {unit}
                  </Badge>
                </div>

                <div className="space-y-4 pl-4">
                  {group.exercises.slice(0, 5).map((exercise) => (
                    <div key={exercise.exerciseId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {exercise.count} sessions · {convertTotalVolume(exercise.totalVolume, unit).toLocaleString()} {unit} total
                          </p>
                        </div>
                      </div>
                      {exercise.count >= 2 && (
                        <div className="pl-4">
                          <ExerciseProgressChart
                            exerciseId={exercise.exerciseId}
                            exerciseName={exercise.name}
                            metricWeight={exercise.metricWeight}
                            metricReps={exercise.metricReps}
                            metricTime={exercise.metricTime}
                            metricDistance={exercise.metricDistance}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
