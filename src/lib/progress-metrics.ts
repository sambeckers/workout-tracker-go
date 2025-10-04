// Progress metrics utilities: 1RM estimation, muscle group aggregation, cardio pace
import { classifyExercise } from './metrics';

export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (!weightKg || !reps) return 0;
  return parseFloat((weightKg * (1 + reps / 30)).toFixed(2)); // Epley
}

export interface RawLogLike {
  exercise_id: string;
  exercise?: { name?: string | null; muscle_group?: string | null; metric_weight?: boolean; metric_reps?: boolean; metric_time?: boolean; metric_distance?: boolean; };
  weight_per_set?: string | null;
  reps_per_set?: string | null;
  sets?: number | null;
  distance_km?: number | null;
  duration_seconds?: number | null;
  session_id?: string;
  session?: { date?: string };
}

export interface AggregatedPoint { date: string; value: number; label: string; group?: string; }

export function buildExerciseSeries(logs: RawLogLike[], exerciseId: string, mode: '1rm' | 'weight' | 'distance' | 'pace' | 'duration' | 'reps'): AggregatedPoint[] {
  const filtered = logs.filter(l => l.exercise_id === exerciseId && (l.session?.date || (l as any).created_at));
  return filtered.map(l => {
    const date = l.session?.date || (l as any).created_at?.slice(0,10) || '';
    const weights = l.weight_per_set ? l.weight_per_set.split(',').map(w => parseFloat(w.trim())).filter(n=>!isNaN(n)) : [];
    const reps = l.reps_per_set ? l.reps_per_set.split(',').map(r => parseInt(r.trim())).filter(n=>!isNaN(n)) : [];
    const topWeight = weights.length ? Math.max(...weights) : 0;
    const topReps = reps.length ? Math.max(...reps) : 0;
    const distanceKm = l.distance_km || 0;
    const durationMin = l.duration_seconds ? l.duration_seconds / 60 : 0;
    const pace = (distanceKm > 0 && durationMin > 0) ? durationMin / distanceKm : 0;

    let value = 0;
    switch (mode) {
      case '1rm': value = estimateOneRepMax(topWeight, topReps || (topWeight ? 1 : 0)); break;
      case 'weight': value = topWeight; break;
      case 'distance': value = distanceKm; break;
      case 'duration': value = durationMin; break;
      case 'pace': value = pace; break;
      case 'reps': value = reps.reduce((a,b)=>a+b,0); break;
    }

    return { date, value, label: mode };
  });
}

export function aggregateByMuscleGroup(logs: RawLogLike[], mode: '1rm' | 'weight'): Record<string, AggregatedPoint[]> {
  // Group logs by muscle group + date; compute average
  const map: Record<string, Record<string, { sum: number; count: number }>> = {};
  logs.forEach(l => {
    const mg = l.exercise?.muscle_group || 'Other';
    if (!l.session?.date) return;
    const date = l.session?.date;
    if (!map[mg]) map[mg] = {};
    if (!map[mg][date]) map[mg][date] = { sum: 0, count: 0 };

    const weights = l.weight_per_set ? l.weight_per_set.split(',').map(w => parseFloat(w.trim())).filter(n=>!isNaN(n)) : [];
    const reps = l.reps_per_set ? l.reps_per_set.split(',').map(r => parseInt(r.trim())).filter(n=>!isNaN(n)) : [];
    const topWeight = weights.length ? Math.max(...weights) : 0;
    const topReps = reps.length ? Math.max(...reps) : 0;
    const val = mode === '1rm' ? estimateOneRepMax(topWeight, topReps || (topWeight ? 1 : 0)) : topWeight;

    if (val > 0) {
      map[mg][date].sum += val;
      map[mg][date].count += 1;
    }
  });
  const result: Record<string, AggregatedPoint[]> = {};
  Object.entries(map).forEach(([mg, dates]) => {
    result[mg] = Object.entries(dates).map(([date, { sum, count }]) => ({ date, value: sum / count, label: mg, group: mg }));
    // sort by date
    result[mg].sort((a,b)=>a.date.localeCompare(b.date));
  });
  return result;
}

export function aggregateCardioByMuscleGroup(logs: RawLogLike[], mode: 'distance' | 'duration' | 'pace'): Record<string, AggregatedPoint[]> {
  const map: Record<string, Record<string, { sum: number; count: number }>> = {};
  logs.forEach(l => {
    const mg = l.exercise?.muscle_group || 'Other';
    if (!l.session?.date) return;
    const date = l.session?.date;
    if (!map[mg]) map[mg] = {};
    if (!map[mg][date]) map[mg][date] = { sum: 0, count: 0 };

    const distanceKm = l.distance_km || 0;
    const durationMin = l.duration_seconds ? l.duration_seconds / 60 : 0;
    const pace = (distanceKm > 0 && durationMin > 0) ? durationMin / distanceKm : 0;

    let val = 0;
    switch (mode) {
      case 'distance': val = distanceKm; break;
      case 'duration': val = durationMin; break;
      case 'pace': val = pace; break;
    }
    if (val > 0) {
      map[mg][date].sum += val;
      map[mg][date].count += 1;
    }
  });
  const result: Record<string, AggregatedPoint[]> = {};
  Object.entries(map).forEach(([mg, dates]) => {
    result[mg] = Object.entries(dates).map(([date, { sum, count }]) => ({ date, value: sum / count, label: mg, group: mg }));
    result[mg].sort((a,b)=>a.date.localeCompare(b.date));
  });
  return result;
}
