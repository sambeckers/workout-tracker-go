import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, Activity } from 'lucide-react';
import { WeightliftingDashboard } from '@/components/progress/WeightliftingDashboard';
import { CardioDashboard } from '@/components/progress/CardioDashboard';
import { classifyExercise } from '@/lib/metrics';

interface Props { 
  sessions: any[]; 
  logs: any[]; 
  exercises: any[];
}

export const CompactProgressOverview: React.FC<Props> = ({ sessions, logs, exercises }) => {
  // Filter to last 30 days
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const filteredSessions = useMemo(() => 
    sessions.filter(s => s.status === 'Done' && new Date(s.date) >= thirtyDaysAgo)
  , [sessions, thirtyDaysAgo]);

  const filteredLogs = useMemo(() => 
    logs.filter(l => {
      const dt = (l as any).session?.date || (l as any).created_at || (l as any).date;
      return dt && new Date(dt) >= thirtyDaysAgo;
    })
  , [logs, thirtyDaysAgo]);

  const totalSessions = filteredSessions.length;

  // Sessions per week trend last 4 weeks
  const trend = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; count: number; week: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() + 1 - i * 7); // Monday start
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const count = filteredSessions.filter(s => {
        const d = new Date(s.date);
        return d >= start && d < end;
      }).length;
      const weekLabel = `Week ${4-i}`;
      weeks.push({ 
        label: `${start.getMonth()+1}/${start.getDate()}`, 
        count,
        week: weekLabel
      });
    }
    return weeks;
  }, [filteredSessions]);

  // Check for strength and cardio logs
  const hasStrengthLogs = useMemo(() => filteredLogs.some(l => {
    const ex = exercises.find(e => e.exercise_id === l.exercise_id);
    if (!ex) return false;
    const profile = classifyExercise(ex);
    return profile.type === 'strength' || profile.type === 'bodyweight';
  }), [filteredLogs, exercises]);

  const hasCardioLogs = useMemo(() => filteredLogs.some(l => {
    const ex = exercises.find(e => e.exercise_id === l.exercise_id);
    if (!ex) return false;
    const profile = classifyExercise(ex);
    return profile.type === 'cardio';
  }), [filteredLogs, exercises]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Last 30 Days Overview</h2>
        <div className="text-sm text-muted-foreground">
          {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sessions / Week</CardTitle>
            <CardDescription>Last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 flex items-end gap-2">
              {trend.map(w => {
                const maxCount = Math.max(...trend.map(t => t.count), 1);
                const heightPercent = (w.count / maxCount) * 100;
                return (
                  <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-16">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-md transition-all hover:opacity-80 relative group"
                        style={{ height: `${heightPercent}%`, minHeight: w.count > 0 ? '8px' : '0' }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-semibold text-foreground">{w.count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground">{w.week}</div>
                      <div className="text-[10px] text-muted-foreground/70">{w.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Unique Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{new Set(filteredLogs.map(l=>l.exercise_id)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Weightlifting Section */}
      {hasStrengthLogs && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Weightlifting</h3>
          <WeightliftingDashboard logs={filteredLogs as any} exercises={exercises as any} />
        </section>
      )}

      {/* Cardio Section */}
      {hasCardioLogs && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Cardio</h3>
          <CardioDashboard logs={filteredLogs as any} exercises={exercises as any} />
        </section>
      )}

      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No workout data in the last 30 days.</p>
            <p className="text-sm mt-2">Complete some workouts to see your progress here!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompactProgressOverview;
