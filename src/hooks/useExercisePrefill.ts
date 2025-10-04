import { useExerciseLastLog } from './useExerciseHistory';
import { classifyExercise, deriveProgressiveDefaults, ExerciseLike, ProgressiveDefaultsResult } from '@/lib/metrics';
import { useExercises } from './useWorkoutData';
import { useMemo } from 'react';

export interface PrefillResult extends ProgressiveDefaultsResult {
  loading: boolean;
  suggestion?: string;
  profile: ReturnType<typeof classifyExercise>;
}

export const useExercisePrefill = (exerciseId: string): PrefillResult => {
  const { data: exercises = [] } = useExercises();
  const exercise = exercises.find(e => e.exercise_id === exerciseId) as ExerciseLike | undefined;
  const { data: lastLog, isLoading } = useExerciseLastLog(exerciseId);

  return useMemo(() => {
    if (!exercise) {
      return {
        loading: isLoading,
        profile: classifyExercise({ exercise_id: exerciseId, name: 'Unknown', metric_weight: true, metric_reps: true }),
        target_sets: 3,
        target_reps: '10'
      };
    }
    const profile = classifyExercise(exercise);
    const defaults = deriveProgressiveDefaults(profile, lastLog || null);
    return { ...defaults, loading: isLoading, profile };
  }, [exercise, lastLog, isLoading, exerciseId]);
};
