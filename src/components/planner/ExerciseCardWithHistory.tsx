import React, { useEffect } from 'react';
import { useExerciseLastLog } from '@/hooks/useExerciseHistory';
import { convertKgToUnit } from '@/lib/units';

interface ExerciseCardWithHistoryProps {
  exerciseId: string;
  onLoadDefaults: (defaults: {
    target_sets: number;
    target_reps: string;
    target_weight: number;
    target_duration_sec: number;
    target_distance_km: number;
  }) => void;
}

export const ExerciseCardWithHistory: React.FC<ExerciseCardWithHistoryProps> = ({
  exerciseId,
  onLoadDefaults,
}) => {
  const { data: lastLog } = useExerciseLastLog(exerciseId);

  useEffect(() => {
    if (lastLog) {
      // Parse values from last log
      const sets = lastLog.sets || 3;
      const reps = lastLog.reps_per_set || '10';
      const weights = lastLog.weight_per_set?.split(',').map(w => parseFloat(w.trim())) || [];
      const weight = weights.length > 0 ? weights[0] : 20; // Use first set's weight
      const duration = lastLog.duration_seconds || 0;
      const distance = lastLog.distance_km || 0;

      onLoadDefaults({
        target_sets: sets,
        target_reps: reps,
        target_weight: weight,
        target_duration_sec: duration,
        target_distance_km: distance,
      });
    }
  }, [lastLog, onLoadDefaults]);

  return null; // This is a utility component
};
