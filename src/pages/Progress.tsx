import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Clock, Target, Dumbbell, Download, FileText } from 'lucide-react';
import { useProgressData, useExportWorkoutData } from '@/hooks/useWorkoutData';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertKgToUnit, formatWeightList, convertTotalVolume } from '@/lib/units';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, subMonths, isAfter } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const WeightliftingAnalytics = React.lazy(() => import('@/components/progress/WeightliftingAnalytics'));
const CardioAnalytics = React.lazy(() => import('@/components/progress/CardioAnalytics'));

const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_,i)=> (
        <div key={i} className="h-28 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="h-72 rounded-lg bg-muted" />
    <div className="h-72 rounded-lg bg-muted" />
  </div>
);

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: progressData, isLoading } = useProgressData();
  const { unit } = useUnitPreference();
  const exportDataMutation = useExportWorkoutData();
  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'weightlifting';
    return localStorage.getItem('progress.activeTab') || 'weightlifting';
  });
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try { localStorage.setItem('progress.activeTab', value); } catch {}
  };

  const exportWeightliftingCsv = () => {
    const rows: string[] = ['date,exercise,sets,reps,weights'];
    logs.filter(l=> l.weight_per_set && /\d/.test(l.weight_per_set||'')).forEach(l => {
      rows.push(`${new Date(l.created_at).toISOString().split('T')[0]},"${l.exercise?.name||''}",${l.sets||''},"${l.reps_per_set||''}","${l.weight_per_set||''}"`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'weightlifting.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const exportCardioCsv = () => {
    const rows: string[] = ['date,exercise,sets,reps,duration_minutes'];
    const cardioPattern = /(run|row|bike|cycle|elliptical|walk|treadmill|jog|swim|cardio)/i;
    logs.filter(l=> cardioPattern.test(l.exercise?.name||''))
      .forEach(l => {
        const session = sessions.find(s => s.session_id === l.session_id);
        rows.push(`${new Date(l.created_at).toISOString().split('T')[0]},"${l.exercise?.name||''}",${l.sets||''},"${l.reps_per_set||''}",${session?.duration_minutes||''}`);
      });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cardio.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
  <div className="app-container p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your progress.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
  <div className="app-container p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading your progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sessions = [], logs = [] } = progressData || {};

  // Calculate stats from real data
  const stats = {
    totalWorkouts: sessions.length,
    // Stored weights are in kg; treat the sum as kg volume
    totalWeightKg: logs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0),
    avgWorkoutTime: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length)
      : 0,
    currentStreak: sessions.filter(s => 
      isAfter(parseISO(s.date), subMonths(new Date(), 1))
    ).length
  };

  // Generate monthly progress from real data
  const monthlyProgress = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthSessions = sessions.filter(s => 
      format(parseISO(s.date), 'yyyy-MM') === format(date, 'yyyy-MM')
    );
    const monthLogs = logs.filter(log => 
      monthSessions.some(s => s.session_id === log.session_id)
    );
    const monthWeightKg = monthLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    monthlyProgress.push({
      month: format(date, 'MMM'),
      workouts: monthSessions.length,
      weight: convertTotalVolume(monthWeightKg, unit)
    });
  }

  // Get recent workouts (last 5)
  const recentWorkouts = sessions.slice(0, 5).map(session => {
    const sessionLogs = logs.filter(log => log.session_id === session.session_id);
    const totalWeightKg = sessionLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    return {
      id: session.session_id,
      date: session.date,
      title: session.title || 'Workout',
      duration: session.duration_minutes || 0,
      exercises: sessionLogs.length,
      totalWeightKg: Math.round(totalWeightKg)
    };
  });

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress & Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your fitness journey and improvements</p>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => exportDataMutation.mutate()}
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="weightlifting">Weightlifting</TabsTrigger>
          <TabsTrigger value="cardio">Cardio</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="weightlifting" className="space-y-8">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={exportWeightliftingCsv} className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
          </div>
          <React.Suspense fallback={<AnalyticsSkeleton />}> 
            <WeightliftingAnalytics logs={logs} sessions={sessions} />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="cardio" className="space-y-8">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={exportCardioCsv} className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
          </div>
          <React.Suspense fallback={<AnalyticsSkeleton />}> 
            <CardioAnalytics logs={logs} sessions={sessions} />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="summary" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Recent Workout History</CardTitle>
              <CardDescription>Your latest completed workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWorkouts.length > 0 ? recentWorkouts.map(workout => (
                  <div key={workout.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/workout/${workout.id}`)}>
                    <div>
                      <div className="font-medium">{workout.title}</div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(parseISO(workout.date), 'MMM dd, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {workout.duration} min</span>
                        <span>{workout.exercises} exercises</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{convertTotalVolume(workout.totalWeightKg, unit).toLocaleString()} {unit}</div>
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">No workout history found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;