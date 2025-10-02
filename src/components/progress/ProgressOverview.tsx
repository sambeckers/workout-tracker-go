import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Dumbbell, Timer, Target } from 'lucide-react';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertTotalVolume } from '@/lib/units';
import { format, parseISO, subMonths, isAfter, startOfWeek, endOfWeek } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  exercise?: {
    name?: string | null;
    muscle_group?: string | null;
  };
}

interface Props {
  sessions: Session[];
  logs: Log[];
}

export const ProgressOverview: React.FC<Props> = ({ sessions, logs }) => {
  const { unit } = useUnitPreference();

  // Calculate overall stats
  const completedSessions = sessions.filter(s => s.status === 'Done');
  const totalWorkouts = completedSessions.length;
  
  const totalVolumeKg = logs.reduce((sum, log) => {
    if (!log.weight_per_set || !log.sets) return sum;
    const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
    return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
  }, 0);

  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  const totalExercises = logs.length;
  const uniqueExercises = new Set(logs.map(l => l.exercise_id)).size;

  // Calculate this week vs last week
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subMonths(thisWeekStart, 0);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekWorkouts = completedSessions.filter(s => 
    isAfter(parseISO(s.date), thisWeekStart)
  ).length;

  const lastWeekWorkouts = completedSessions.filter(s => {
    const date = parseISO(s.date);
    return date >= lastWeekStart && date < thisWeekStart;
  }).length;

  const weeklyChange = lastWeekWorkouts > 0 
    ? Math.round(((thisWeekWorkouts - lastWeekWorkouts) / lastWeekWorkouts) * 100)
    : thisWeekWorkouts > 0 ? 100 : 0;

  // Generate monthly data for chart
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthSessions = completedSessions.filter(s => 
      format(parseISO(s.date), 'yyyy-MM') === format(date, 'yyyy-MM')
    );
    const monthLogs = logs.filter(log => 
      monthSessions.some(s => s.session_id === log.session_id)
    );
    const monthVolumeKg = monthLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    monthlyData.push({
      month: format(date, 'MMM'),
      workouts: monthSessions.length,
      volume: Math.round(convertTotalVolume(monthVolumeKg, unit)),
      exercises: monthLogs.length
    });
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalWorkouts}</div>
                <div className="flex items-center gap-1 mt-1">
                  {weeklyChange > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">+{weeklyChange}%</span>
                    </>
                  ) : weeklyChange < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">{weeklyChange}%</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No change</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">this week</span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{convertTotalVolume(totalVolumeKg, unit).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">{unit} lifted</div>
              </div>
              <Dumbbell className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{avgDuration}</div>
                <div className="text-sm text-muted-foreground mt-1">minutes per workout</div>
              </div>
              <Timer className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{uniqueExercises}</div>
                <div className="text-sm text-muted-foreground mt-1">{totalExercises} total logs</div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workout Frequency</CardTitle>
            <CardDescription>Number of completed workouts per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Progress</CardTitle>
            <CardDescription>Total weight lifted per month ({unit})</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
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
      </div>
    </div>
  );
};
