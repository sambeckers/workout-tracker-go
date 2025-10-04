// Utility functions for classifying exercise metric behavior and deriving progressive defaults
// This consolidates logic so charts, planner, and progress pages stay consistent.

export type ExerciseMetricProfile = {
  type: 'strength' | 'cardio' | 'duration' | 'bodyweight';
  primary: 'weight' | 'volume' | 'reps' | 'distance' | 'duration' | 'pace';
  enabled: {
    weight: boolean;
    reps: boolean;
    time: boolean;
    distance: boolean;
  };
};

export interface ExerciseLike {
  exercise_id: string;
  name: string;
  metric_weight?: boolean;
  metric_reps?: boolean;
  metric_time?: boolean;
  metric_distance?: boolean;
}

export function classifyExercise(ex: ExerciseLike): ExerciseMetricProfile {
  const weight = ex.metric_weight !== false && !!ex.metric_weight; // default true elsewhere
  const reps = ex.metric_reps !== false && !!ex.metric_reps; // default true
  const time = !!ex.metric_time;
  const distance = !!ex.metric_distance;

  // Determine high-level type
  let type: ExerciseMetricProfile['type'] = 'strength';
  if (time && distance) type = 'cardio';
  else if (time && !distance && !weight && !reps) type = 'duration';
  else if (!weight && reps && !time && !distance) type = 'bodyweight';

  // Determine primary metric heuristic
  let primary: ExerciseMetricProfile['primary'] = 'weight';
  if (type === 'cardio') primary = 'distance';
  else if (type === 'duration') primary = 'duration';
  else if (type === 'bodyweight') primary = 'reps';
  else if (weight && reps) primary = 'weight';
  else if (weight && !reps) primary = 'weight';
  else if (!weight && reps) primary = 'reps';

  return {
    type,
    primary,
    enabled: { weight, reps, time, distance }
  };
}

export interface LastLogLike {
  sets?: number | null;
  reps_per_set?: string | null;
  weight_per_set?: string | null;
  duration_seconds?: number | null;
  distance_km?: number | null;
}

export interface ProgressiveDefaultsResult {
  target_sets?: number;
  target_reps?: string; // string to allow ranges later
  target_weight?: number; // kg
  target_duration_sec?: number; // stored canonical seconds
  target_distance_km?: number; // canonical km
  suggestion?: string; // textual suggestion for UI (stretch goal)
}

export function deriveProgressiveDefaults(profile: ExerciseMetricProfile, last: LastLogLike | null): ProgressiveDefaultsResult {
  const out: ProgressiveDefaultsResult = {};

  if (profile.type === 'strength' || profile.type === 'bodyweight') {
    // Sets
    out.target_sets = last?.sets || 3;

    // Reps
    if (profile.enabled.reps) {
      if (last?.reps_per_set) {
        // We store reps_per_set as comma separated values
        const repsArr = last.reps_per_set.split(',').map(r => parseInt(r.trim())).filter(n => !isNaN(n));
        const avg = repsArr.length ? Math.round(repsArr.reduce((a,b)=>a+b,0)/repsArr.length) : 10;
        out.target_reps = String(avg);
      } else {
        out.target_reps = '10';
      }
    }

    // Weight (only if enabled)
    if (profile.enabled.weight) {
      if (last?.weight_per_set) {
        const wArr = last.weight_per_set.split(',').map(w => parseFloat(w.trim())).filter(n => !isNaN(n));
        const top = wArr.length ? Math.max(...wArr) : 20;
        out.target_weight = top;
        // Suggest slight progressive overload
        out.suggestion = `Last top set: ${top}kg. Consider +2.5% → ${(top * 1.025).toFixed(1)}kg`;
      } else {
        out.target_weight = 20;
      }
    }
  }

  if (profile.type === 'cardio' || profile.type === 'duration') {
    // Duration
    if (profile.enabled.time) {
      const dur = last?.duration_seconds || 1800; // 30min default
      out.target_duration_sec = dur;
    }
    // Distance (cardio only)
    if (profile.type === 'cardio' && profile.enabled.distance) {
      const dist = last?.distance_km || 5; // 5km default
      out.target_distance_km = dist;
      if (last?.distance_km && last?.duration_seconds && last.duration_seconds > 0) {
        const paceSecPerKm = last.duration_seconds / last.distance_km;
        const improved = paceSecPerKm * 0.98; // 2% faster
        const paceMin = Math.floor(improved / 60);
        const paceSec = Math.round(improved % 60).toString().padStart(2,'0');
        out.suggestion = `Last pace ${(paceSecPerKm/60).toFixed(2)} min/km. Aim for ${paceMin}:${paceSec}/km`;
      }
    }
  }

  return out;
}
