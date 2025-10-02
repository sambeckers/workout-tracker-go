import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Dumbbell, Activity } from 'lucide-react';
import { format, parseISO, startOfWeek, eachWeekOfInterval, subMonths } from 'date-fns';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertTotalVolume } from '@/lib/units';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Session {
  session_id: string;
  date: string;
  duration_minutes?: number | null;
  status?: string | null;
}

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
}

interface Props {
  sessions: Session[];
  logs: Log[];
}

export const MetricsTimeline: React.FC<Props> = ({ sessions, logs }) => {
  const { unit } = useUnitPreference();

  const weeklyData = useMemo(() => {
    const completedSessions = sessions.filter(s => s.status === 'Done');
    const threeMonthsAgo = subMonths(new Date(), 3);
    
    const weeks = eachWeekOfInterval({
      start: threeMonthsAgo,
      end: new Date()
    }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekSessions = completedSessions.filter(s => {
        const date = parseISO(s.date);
        return date >= weekStart && date <= weekEnd;
      });

      const weekLogs = logs.filter(log => 
        weekSessions.some(s => s.session_id === log.session_id)
      );

      // Calculate total volume
      const totalVolumeKg = weekLogs.reduce((sum, log) => {
        if (!log.weight_per_set || !log.sets) return sum;
        const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
        return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
      }, 0);

      // Calculate total distance
      const totalDistanceKm = weekLogs.reduce((sum, log) => {
        return sum + (log.distance_km ? parseFloat(log.distance_km.toString()) : 0);
      }, 0);

      // Calculate total time
      const totalMinutes = weekLogs.reduce((sum, log) => {
        return sum + (log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0);
      }, 0);

      return {
        week: format(weekStart, 'MMM d'),
        workouts: weekSessions.length,
        volume: Math.round(convertTotalVolume(totalVolumeKg, unit)),
        distance: Math.round(totalDistanceKm * 10) / 10,
        duration: totalMinutes,
        exercises: weekLogs.length
      };
    });
  }, [sessions, logs, unit]);

  const hasVolumeData = weeklyData.some(w => w.volume > 0);
  const hasDistanceData = weeklyData.some(w => w.distance > 0);
  const hasDurationData = weeklyData.some(w => w.duration > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Progress Timeline
          </CardTitle>
          <CardDescription>Track your metrics over the last 3 months by week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="workouts" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Workouts"
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="exercises" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Exercises"
                dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {hasVolumeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Volume Timeline
            </CardTitle>
            <CardDescription>Total weight lifted per week ({unit})</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(hasDistanceData || hasDurationData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasDistanceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Distance Timeline
                </CardTitle>
                <CardDescription>Total distance covered per week (km)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="week" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="distance" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {hasDurationData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Duration Timeline
                </CardTitle>
                <CardDescription>Total exercise time per week (minutes)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="week" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
