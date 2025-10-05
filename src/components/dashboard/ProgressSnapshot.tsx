import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import React from 'react';

interface Point { label: string; value: number; }
interface Props { total: number; avgDuration: string; streak: number; trend?: Point[]; }

// Simple inline sparkline for counts
const Sparkline: React.FC<{ points: Point[] }> = ({ points }) => {
  if (!points.length) return <div className="h-10 w-full bg-muted/40 rounded" />;
  const max = Math.max(...points.map(p=>p.value), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {points.map(p => (
        <div key={p.label} className="flex-1 flex flex-col items-center">
          <div className="w-full bg-primary/60 dark:bg-primary rounded-t" style={{ height: `${(p.value/max)*100}%` }} />
        </div>
      ))}
    </div>
  );
};

export const ProgressSnapshot: React.FC<Props> = ({ total, avgDuration, streak, trend = [] }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Recent Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-muted/40">
            <p className="text-base font-semibold leading-tight">{total}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Workouts</p>
          </div>
          <div className="p-2 rounded-md bg-muted/40">
            <p className="text-base font-semibold leading-tight">{streak}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Streak</p>
          </div>
          <div className="p-2 rounded-md bg-muted/40">
            <p className="text-base font-semibold leading-tight">{avgDuration}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg Dur.</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium mb-1 text-muted-foreground tracking-wide">Last 6 Weeks</p>
          <Sparkline points={trend} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSnapshot;
