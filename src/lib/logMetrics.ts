import { classifyExercise } from './metrics';

export interface LogWithExercise {
  exercise?: { name: string; metric_weight?: boolean; metric_reps?: boolean; metric_time?: boolean; metric_distance?: boolean };
  weight_per_set?: string | null;
  reps_per_set?: string | null;
  distance_km?: number | null;
  duration_seconds?: number | null;
}

export function computePrimaryValue(log: LogWithExercise) {
  if (!log.exercise) return { label: 'N/A', value: 0 };
  const { exercise } = log;
  const profile = classifyExercise({
    exercise_id: 'x',
    name: exercise.name,
    metric_weight: exercise.metric_weight,
    metric_reps: exercise.metric_reps,
    metric_time: exercise.metric_time,
    metric_distance: exercise.metric_distance,
  });

  const weights = log.weight_per_set ? log.weight_per_set.split(',').map(w => parseFloat(w.trim())).filter(n => !isNaN(n)) : [];
  const reps = log.reps_per_set ? log.reps_per_set.split(',').map(r => parseInt(r.trim())).filter(n => !isNaN(n)) : [];
  const distance = log.distance_km || 0;
  const durationMin = log.duration_seconds ? log.duration_seconds / 60 : 0;

  switch (profile.type) {
    case 'strength': {
      const maxWeight = weights.length ? Math.max(...weights) : 0;
      return { label: 'Max Weight (kg)', value: maxWeight };
    }
    case 'bodyweight': {
      const totalReps = reps.reduce((a,b)=>a+b,0);
      return { label: 'Total Reps', value: totalReps };
    }
    case 'cardio': {
      return { label: 'Distance (km)', value: distance };
    }
    case 'duration': {
      return { label: 'Duration (min)', value: durationMin };
    }
    default:
      return { label: 'Value', value: 0 };
  }
}
