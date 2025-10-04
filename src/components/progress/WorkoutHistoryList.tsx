import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { classifyExercise } from '@/lib/metrics';

interface Session { session_id: string; date: string; title?: string | null; status?: string | null; }
interface Log { log_id: string; session_id: string; exercise_id: string; weight_per_set?: string | null; reps_per_set?: string | null; sets?: number | null; distance_km?: number | null; duration_seconds?: number | null; exercise?: any; session?: { date?: string } }
interface Props { sessions: Session[]; logs: Log[]; exercises: any[]; }

export const WorkoutHistoryList: React.FC<Props> = ({ sessions, logs, exercises }) => {
  const done = sessions.filter(s => s.status === 'Done').sort((a,b)=> b.date.localeCompare(a.date));
  const logsBySession = useMemo(() => {
    const map: Record<string, Log[]> = {};
    logs.forEach(l => { (map[l.session_id] = map[l.session_id] || []).push(l); });
    return map;
  }, [logs]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen(o => ({ ...o, [id]: !o[id] }));

  return (
    <div className="space-y-3">
      {done.map(s => {
        const sLogs = (logsBySession[s.session_id]||[]).sort((a,b)=> (a.exercise?.name||'').localeCompare(b.exercise?.name||''));
        return (
          <Card key={s.session_id}>
            <button onClick={()=>toggle(s.session_id)} className="w-full text-left">
              <CardHeader className="py-3 flex flex-row items-center gap-3">
                {open[s.session_id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>{s.title || 'Session'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</span>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                    {sLogs.slice(0,4).map(l => <span key={l.log_id}>{l.exercise?.name || 'Exercise'}</span>)}{sLogs.length>4 && <span>+{sLogs.length-4} more</span>}
                  </div>
                </div>
              </CardHeader>
            </button>
            {open[s.session_id] && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {sLogs.map(l => {
                    const ex = exercises.find(e => e.exercise_id === l.exercise_id) || l.exercise || {};
                    const profile = classifyExercise(ex);
                    let summary = '';
                    if (profile.type === 'strength' || profile.type === 'bodyweight') {
                      const weights = l.weight_per_set ? l.weight_per_set.split(',').map((w:string)=>parseFloat(w.trim())) : [];
                      const reps = l.reps_per_set ? l.reps_per_set.split(',').map((r:string)=>parseInt(r.trim())) : [];
                      const topW = weights.length ? Math.max(...weights) : 0;
                      const avgReps = reps.length ? Math.round(reps.reduce((a,b)=>a+b,0)/reps.length) : 0;
                      summary = `${reps.length || l.sets || 0} sets ${avgReps ? `@ ~${avgReps} reps` : ''} ${topW ? `top ${topW}kg` : ''}`.trim();
                    } else if (profile.type === 'cardio') {
                      const mins = l.duration_seconds ? l.duration_seconds/60 : 0;
                      if (l.distance_km && mins) {
                        const pace = mins / l.distance_km; const pm = Math.floor(pace); const ps = Math.round((pace-pm)*60).toString().padStart(2,'0');
                        summary = `${l.distance_km.toFixed(2)} km in ${Math.round(mins)} min (pace ${pm}:${ps}/km)`;
                      } else if (l.distance_km) summary = `${l.distance_km.toFixed(2)} km`;
                      else if (mins) summary = `${Math.round(mins)} min`;
                    } else if (profile.type === 'duration') {
                      const mins = l.duration_seconds ? l.duration_seconds/60 : 0;
                      summary = `${Math.round(mins)} min`;
                    }
                    return (
                      <div key={l.log_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b last:border-b-0 pb-2">
                        <div className="font-medium">{ex.name || 'Exercise'}</div>
                        <div className="text-xs text-muted-foreground">{summary}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
