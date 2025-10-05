import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import React from 'react';

interface Props { sessions: any[]; planned?: any[]; }

const startOfWeek = (date: Date) => {
  const d = new Date(date); const day = d.getDay(); const diff = (day===0?-6:1)-day; d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d;
};

export const WeeklyWorkoutsCard: React.FC<Props> = ({ sessions, planned = [] }) => {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = React.useState(0);
  const base = startOfWeek(new Date());
  const activeStart = new Date(base); activeStart.setDate(base.getDate()+weekOffset*7);
  const activeEnd = new Date(activeStart); activeEnd.setDate(activeStart.getDate()+7);
  const inRange = (dStr: string) => { const d = new Date(dStr); return d >= activeStart && d < activeEnd; };
  const completedInWeek = sessions.filter(s => inRange((s as any).date));
  const plannedInWeek = planned.filter(s => inRange((s as any).date));
  const combined = [...completedInWeek, ...plannedInWeek].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
  const label = weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${Math.abs(weekOffset)}w ${weekOffset>0?'ahead':'ago'}`;
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarRange className="h-4 w-4 text-primary" /> {label}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>setWeekOffset(o=>o-1)} aria-label="Previous week"><ChevronLeft className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>setWeekOffset(o=>o+1)} aria-label="Next week"><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground tracking-wide">{activeStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – {new Date(activeEnd.getTime()-86400000).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {combined.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No sessions in this range</p>}
        {combined.slice(0,6).map(s => {
          const done = (s as any).status === 'Done';
          return (
            <div key={s.session_id} className="flex items-center justify-between p-2 rounded-md border bg-background/50">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{(s as any).title || 'Workout'}</p>
                <p className="text-[10px] text-muted-foreground flex gap-1 items-center">
                  <span>{new Date((s as any).date).toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric'})}</span>
                  <span className={done? 'text-green-600 dark:text-green-400':'text-blue-600 dark:text-blue-400'}>• {done? 'Done':'Planned'}</span>
                </p>
              </div>
              <Button size="sm" className="h-7 text-[11px] px-2" variant={done? 'ghost':'outline'} onClick={()=>navigate(`/dashboard/workout/${s.session_id}`)}>Open</Button>
            </div>
          );
        })}
        {combined.length > 6 && <p className="text-[10px] text-muted-foreground">+{combined.length-6} more</p>}
        {combined.length > 0 && (
          <Button size="sm" className="h-7 text-[11px] w-full" variant="outline" onClick={()=>navigate('/dashboard/progress')}>Progress Page</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyWorkoutsCard;
