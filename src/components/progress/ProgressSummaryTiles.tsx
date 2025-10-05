import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

interface Session { session_id: string; date: string; status?: string | null; }
interface Log { exercise_id: string; }

interface Props { sessions: Session[]; logs: Log[]; }

export const ProgressSummaryTiles: React.FC<Props> = ({ sessions, logs }) => {
  const doneSessions = sessions.filter(s => s.status === 'Done');
  const totalSessions = doneSessions.length;

  // sessions per week trend last 6 weeks
  const trend = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; count: number; week: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() + 1 - i * 7); // Monday start
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const count = doneSessions.filter(s => {
        const d = new Date(s.date);
        return d >= start && d < end;
      }).length;
      const weekLabel = `Week ${6-i}`;
      weeks.push({ 
        label: `${start.getMonth()+1}/${start.getDate()}`, 
        count,
        week: weekLabel
      });
    }
    return weeks;
  }, [doneSessions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sessions</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between"><div className="text-3xl font-bold">{totalSessions}</div><Calendar className="h-8 w-8 text-muted-foreground opacity-50" /></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sessions / Week</CardTitle><CardDescription>Last 6 weeks</CardDescription></CardHeader>
        <CardContent>
          <div className="h-28 flex items-end gap-2">
            {trend.map(w => {
              const maxCount = Math.max(...trend.map(t => t.count), 1);
              const heightPercent = (w.count / maxCount) * 100;
              return (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-20">
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
                    <div className="text-[11px] font-medium text-muted-foreground">{w.week}</div>
                    <div className="text-[9px] text-muted-foreground/70">{w.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unique Exercises</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between"><div className="text-3xl font-bold">{new Set(logs.map(l=>l.exercise_id)).size}</div><Activity className="h-8 w-8 text-muted-foreground opacity-50" /></CardContent>
      </Card>
    </div>
  );
};
