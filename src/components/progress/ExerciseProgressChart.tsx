import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertKgToUnit } from '@/lib/units';
import { format } from '@/lib/date-utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';

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
  const { data: history = [] } = useExerciseHistory(exerciseId, 10);
  const { unit } = useUnitPreference();

  const chartData = useMemo(() => {
    if (!history.length) return [];

    return history
      .slice()
      .reverse()
      .map((log: any) => {
        const date = format(new Date(log.session.date), 'MMM dd');
        let value = 0;
        let label = '';

        // Determine primary metric
        if (metricWeight && log.weight_per_set) {
          // Calculate max weight
          const weights = log.weight_per_set.split(',').map((w: string) => parseFloat(w.trim()));
          const maxWeight = Math.max(...weights);
          value = convertKgToUnit(maxWeight, unit);
          label = `Max Weight (${unit})`;
        } else if (metricDistance && log.distance_km) {
          // Distance
          value = log.distance_km;
          label = 'Distance (km)';
        } else if (metricTime && log.duration_seconds) {
          // Duration in minutes
          value = log.duration_seconds / 60;
          label = 'Duration (min)';
        } else if (metricReps && log.reps_per_set) {
          // Total reps
          const reps = log.reps_per_set.split(',').map((r: string) => parseInt(r.trim()));
          value = reps.reduce((sum: number, r: number) => sum + r, 0);
          label = 'Total Reps';
        }

        // Calculate volume for weight exercises
        let volume = 0;
        if (metricWeight && log.weight_per_set && log.reps_per_set) {
          const weights = log.weight_per_set.split(',').map((w: string) => parseFloat(w.trim()));
          const reps = log.reps_per_set.split(',').map((r: string) => parseInt(r.trim()));
          volume = weights.reduce((sum, w, i) => sum + (w * (reps[i] || 0)), 0);
        }

        return {
          date,
          value,
          volume: volume ? convertKgToUnit(volume, unit) : undefined,
          label,
          fullDate: log.session.date,
        };
      });
  }, [history, unit, metricWeight, metricDistance, metricTime, metricReps]);

  if (!history.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <Activity className="h-4 w-4" />
        <span>No history yet - start your first set!</span>
      </div>
    );
  }

  const metric = chartData[0]?.label || 'Progress';
  const latestValue = chartData[chartData.length - 1]?.value || 0;
  const trend = chartData.length > 1 
    ? ((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100).toFixed(1)
    : '0';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{metric}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{latestValue.toFixed(1)}</div>
          <div className={`text-xs ${parseFloat(trend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(trend) >= 0 ? '+' : ''}{trend}%
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            width={35}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value.toFixed(1), metric]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
