import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertKgToUnit } from '@/lib/units';
import { format } from '@/lib/date-utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import { classifyExercise } from '@/lib/metrics';

interface ExerciseProgressChartProps {
  exerciseId: string;
  exerciseName: string;
  metricWeight?: boolean;
  metricReps?: boolean;
  metricTime?: boolean;
  metricDistance?: boolean;
}

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  exerciseId,
  exerciseName,
  metricWeight,
  metricReps,
  metricTime,
  metricDistance,
}) => {
  const { data: history = [], isLoading } = useExerciseHistory(exerciseId, 25, exerciseName);
  const { unit } = useUnitPreference();
  const profile = classifyExercise({ exercise_id: exerciseId, name: exerciseName, metric_weight: metricWeight, metric_reps: metricReps, metric_time: metricTime, metric_distance: metricDistance });
  const [mode, setMode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`exercise-chart-mode:${exerciseId}`);
      if (stored) return stored;
    }
    if (profile.type === 'cardio') return 'distance';
    if (profile.type === 'strength') return 'weight';
    if (profile.type === 'duration') return 'duration';
    if (profile.type === 'bodyweight') return 'reps';
    return 'value';
  });

  const setModePersist = (m: string) => {
    setMode(m);
    try { localStorage.setItem(`exercise-chart-mode:${exerciseId}`, m); } catch {}
  };

  const chartData = useMemo(() => {
    if (!history.length) return [];
    return history.slice().reverse().map((log: any) => {
      const date = format(new Date(log.session.date), 'MMM dd');
      const weights = log.weight_per_set ? log.weight_per_set.split(',').map((w: string) => parseFloat(w.trim())) : [];
      const reps = log.reps_per_set ? log.reps_per_set.split(',').map((r: string) => parseInt(r.trim())) : [];
      const maxWeight = weights.length ? Math.max(...weights) : 0;
      const totalReps = reps.reduce((a: number, b: number) => a + (isNaN(b) ? 0 : b), 0);
      const volume = (weights.length && reps.length) ? weights.reduce((sum, w, i) => sum + w * (reps[i] || 0), 0) : 0;
      const distanceKm = log.distance_km || 0;
      const durationMin = log.duration_seconds ? log.duration_seconds / 60 : 0;
      const paceMinPerKm = (distanceKm > 0 && durationMin > 0) ? (durationMin / distanceKm) : 0;

      let value = 0;
      switch (mode) {
        case 'weight':
          value = convertKgToUnit(maxWeight, unit);
          break;
        case 'volume':
          value = convertKgToUnit(volume, unit); // volume still in converted unit for user familiarity
          break;
        case 'reps':
          value = totalReps;
          break;
        case 'distance':
          value = distanceKm;
          break;
        case 'pace':
          value = paceMinPerKm; // minutes per km
          break;
        case 'duration':
          value = durationMin;
          break;
        default:
          value = 0;
      }

      return {
        date,
        value,
        maxWeight: convertKgToUnit(maxWeight, unit),
        volume: convertKgToUnit(volume, unit),
        totalReps,
        distanceKm,
        durationMin,
        paceMinPerKm,
      };
    });
  }, [history, unit, mode]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg animate-pulse">
        <Activity className="h-4 w-4" />
        <span>Loading history...</span>
      </div>
    );
  }

  if (!exerciseId || !history.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <Activity className="h-4 w-4" />
        <span>No history yet - start your first set!</span>
      </div>
    );
  }

  const latest = chartData[chartData.length - 1]?.value || 0;
  const first = chartData[0]?.value || 0;
  const trend = (first !== 0) ? (((latest - first) / first) * 100).toFixed(1) : '0.0';

  const modeLabelMap: Record<string, string> = {
    weight: `Max Weight (${unit})`,
    volume: `Volume (${unit}·reps)`,
    reps: 'Total Reps',
    distance: 'Distance (km)',
    pace: 'Pace (min/km)',
    duration: 'Duration (min)'
  };
  const metric = modeLabelMap[mode] || 'Progress';

  // Determine available alt modes
  const altModes: string[] = [];
  if (profile.type === 'strength') {
    altModes.push(mode === 'weight' ? 'volume' : 'weight');
  }
  if (profile.type === 'cardio') {
    altModes.push(mode === 'distance' ? 'pace' : 'distance');
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{metric}</span>
        </div>
        <div className="flex items-center gap-2">
          {altModes.map(m => (
            <button
              key={m}
              onClick={() => setModePersist(m)}
              className={`text-xs px-2 py-1 rounded border transition-smooth ${mode===m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
            >
              {modeLabelMap[m].split(' ')[0]}
            </button>
          ))}
          <div className="text-right">
            <div className="text-lg font-bold">{mode === 'pace' ? (() => { const v = latest; const min = Math.floor(v); const sec = Math.round((v - min) * 60); return isFinite(v) && v>0 ? `${min}:${sec.toString().padStart(2,'0')}` : '--'; })() : latest.toFixed(1)}</div>
            <div className={`text-xs ${parseFloat(trend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{parseFloat(trend) >= 0 ? '+' : ''}{trend}%</div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={40} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
            formatter={(value: number) => {
              if (mode === 'pace') {
                const min = Math.floor(value);
                const sec = Math.round((value - min) * 60);
                return [`${min}:${sec.toString().padStart(2,'0')}`, metric];
              }
              return [mode === 'pace' ? value.toFixed(2) : value.toFixed(1), metric];
            }}
          />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
