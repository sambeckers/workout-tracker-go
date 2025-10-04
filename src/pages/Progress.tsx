import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Download, Activity, Target, Dumbbell } from 'lucide-react';
import { useProgressData, useExportWorkoutData, useExercises } from '@/hooks/useWorkoutData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressOverview } from '@/components/progress/ProgressOverview';
import { MuscleGroupProgress } from '@/components/progress/MuscleGroupProgress';
import { MetricsTimeline } from '@/components/progress/MetricsTimeline';
import { RecentWorkouts } from '@/components/progress/RecentWorkouts';
import { ProgressSummaryTiles } from '@/components/progress/ProgressSummaryTiles';
import { WeightliftingDashboard } from '@/components/progress/WeightliftingDashboard';
import { CardioDashboard } from '@/components/progress/CardioDashboard';
import { WorkoutHistoryList } from '@/components/progress/WorkoutHistoryList';

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 rounded-lg bg-muted" />
      <div className="h-96 rounded-lg bg-muted" />
    </div>
  </div>
);

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: progressData, isLoading } = useProgressData();
  const exportDataMutation = useExportWorkoutData();
  const { data: exercises = [] } = useExercises();
  const [range, setRange] = React.useState<'30d'|'90d'|'all'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('progress.range');
      if (stored === '30d' || stored === '90d' || stored === 'all') return stored;
    }
    return '90d';
  });
  const now = React.useMemo(()=> new Date(), []);
  const cutoff = React.useMemo(() => {
    if (range === '30d') { const d = new Date(now); d.setDate(d.getDate()-30); return d; }
    if (range === '90d') { const d = new Date(now); d.setDate(d.getDate()-90); return d; }
    return null;
  }, [range, now]);
  const { sessions = [], logs = [] } = progressData || {};
  // range filtering moved below sessions/logs declaration
  const filteredSessions = React.useMemo(()=> {
    if (!cutoff) return sessions;
    return sessions.filter(s => new Date(s.date) >= cutoff);
  }, [sessions, cutoff]);
  const filteredLogs = React.useMemo(()=> {
    if (!cutoff) return logs;
    return logs.filter(l => {
      const dt = (l as any).session?.date || (l as any).created_at || (l as any).date;
      return dt && new Date(dt) >= cutoff;
    });
  }, [logs, cutoff]);
  const updateRange = (val: '30d'|'90d'|'all') => { setRange(val); try { localStorage.setItem('progress.range', val); } catch {} };
  const noSessions = filteredSessions.length === 0;
  const noLogs = filteredLogs.length === 0;

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
      <div className="app-container p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Progress & Analytics</h1>
            <p className="text-muted-foreground mt-2">Loading your fitness journey...</p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="app-container p-4 md:p-8 space-y-10">
      <div>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <h1 className="text-3xl font-bold mb-2 sm:mb-0">Progress Dashboard</h1>
          <div className="ml-auto flex gap-2" aria-label="Date range selector">
            {['30d','90d','all'].map(r => (
              <Button key={r} size="sm" variant={range===r?'default':'outline'} aria-pressed={range===r} onClick={()=>updateRange(r as any)}>{r}</Button>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground">Track lifting, cardio, and session history.</p>
      </div>

      {/* Summary */}
      <section className="space-y-4" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xl font-semibold">Summary</h2>
        {noSessions && noLogs ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No workout data in this range. Try expanding the range or logging a new session.
            </CardContent>
          </Card>
        ) : (
          <ProgressSummaryTiles sessions={filteredSessions} logs={filteredLogs} />
        )}
      </section>

      {/* Weightlifting */}
      <section className="space-y-4" aria-labelledby="weightlifting-heading">
        <h2 id="weightlifting-heading" className="text-xl font-semibold">Weightlifting</h2>
        {noLogs ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No strength log entries in this range.
            </CardContent>
          </Card>
        ) : (
          <WeightliftingDashboard logs={filteredLogs as any} exercises={exercises as any} />
        )}
      </section>

      {/* Cardio */}
      <section className="space-y-4" aria-labelledby="cardio-heading">
        <h2 id="cardio-heading" className="text-xl font-semibold">Cardio</h2>
        {noLogs ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No cardio log entries in this range.
            </CardContent>
          </Card>
        ) : (
          <CardioDashboard logs={filteredLogs as any} exercises={exercises as any} />
        )}
      </section>

      {/* History */}
      <section className="space-y-4" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-xl font-semibold">Workout History</h2>
        {noSessions ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No completed sessions in this range.
            </CardContent>
          </Card>
        ) : (
          <WorkoutHistoryList sessions={filteredSessions as any} logs={filteredLogs as any} exercises={exercises as any} />
        )}
      </section>
    </div>
  );
};

export default Progress;