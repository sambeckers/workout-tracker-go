import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, Activity } from 'lucide-react';

interface Session { session_id: string; date: string; status?: string | null; }
interface Log { exercise_id: string; }
interface Goal { goal_id: string; status?: string; }

interface Props { sessions: Session[]; logs: Log[]; goals?: Goal[]; }

export const ProgressSummaryTiles: React.FC<Props> = ({ sessions, logs, goals = [] }) => {
  const doneSessions = sessions.filter(s => s.status === 'Done');
  const totalSessions = doneSessions.length;

  // sessions per week trend last 6 weeks
  const trend = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() + 1 - i * 7); // Monday start
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const count = doneSessions.filter(s => {
        const d = new Date(s.date);
        return d >= start && d < end;
      }).length;
      weeks.push({ label: `${start.getMonth()+1}/${start.getDate()}`, count });
    }
    return weeks;
  }, [doneSessions]);

  const activeGoals = goals.filter(g => g.status !== 'completed').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sessions</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between"><div className="text-3xl font-bold">{totalSessions}</div><Calendar className="h-8 w-8 text-muted-foreground opacity-50" /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sessions / Week</CardTitle><CardDescription>Last 6 weeks</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-1 items-end h-16">
            {trend.map(w => (
              <div key={w.label} className="flex flex-col items-center flex-1">
                <div className="bg-primary/70 dark:bg-primary h-full rounded-t w-full relative" style={{ height: `${(w.count/Math.max(1,...trend.map(t=>t.count)))*100}%` }} />
                <span className="text-[10px] mt-1 text-muted-foreground">{w.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Goals</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between"><div className="text-3xl font-bold">{activeGoals}</div><Target className="h-8 w-8 text-muted-foreground opacity-50" /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unique Exercises</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between"><div className="text-3xl font-bold">{new Set(logs.map(l=>l.exercise_id)).size}</div><Activity className="h-8 w-8 text-muted-foreground opacity-50" /></CardContent>
      </Card>
    </div>
  );
};
