import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { buildExerciseSeries, aggregateCardioByMuscleGroup, RawLogLike } from '@/lib/progress-metrics';
import { classifyExercise } from '@/lib/metrics';

interface Props { logs: RawLogLike[]; exercises: any[]; }

export const CardioDashboard: React.FC<Props> = ({ logs, exercises }) => {
  const cardioLogs = logs.filter(l => {
    const ex = exercises.find(e => e.exercise_id === l.exercise_id);
    if (!ex) return false;
    const profile = classifyExercise(ex);
    return profile.type === 'cardio' || profile.type === 'duration';
  });

  const exerciseFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    cardioLogs.forEach(l => { freq[l.exercise_id] = (freq[l.exercise_id]||0)+1; });
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  }, [cardioLogs]);

  const [selectedExercise, setSelectedExercise] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('progress.cardio.exercise');
      if (stored) return stored;
    }
    return exerciseFrequency[0] || '';
  });
  const exerciseObj = exercises.find(e => e.exercise_id === selectedExercise);
  const profile = exerciseObj ? classifyExercise(exerciseObj) : null;
  const hasDistance = !!exerciseObj?.metric_distance;
  const hasTime = !!exerciseObj?.metric_time;

  // Mode options derive from metrics
  const defaultMode: 'distance' | 'pace' | 'duration' = hasDistance ? 'distance' : hasTime ? 'duration' : 'distance';
  const [mode, setMode] = useState<'distance' | 'pace' | 'duration'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('progress.cardio.mode');
      if (stored === 'distance' || stored === 'pace' || stored === 'duration') return stored;
    }
    return defaultMode;
  });
  const [view, setView] = useState<'exercise' | 'muscle'>('exercise');

  const exerciseSeries = useMemo(() => selectedExercise ? buildExerciseSeries(cardioLogs, selectedExercise, mode) : [], [cardioLogs, selectedExercise, mode]);
  const muscleAggregates = useMemo(() => aggregateCardioByMuscleGroup(cardioLogs, mode), [cardioLogs, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-2">
          <Button variant={view==='exercise'?'default':'outline'} size="sm" aria-pressed={view==='exercise'} aria-label="View per exercise" onClick={()=>setView('exercise')}>Per Exercise</Button>
          <Button variant={view==='muscle'?'default':'outline'} size="sm" aria-pressed={view==='muscle'} aria-label="View per muscle group" onClick={()=>setView('muscle')}>Per Muscle Group</Button>
        </div>
        {view==='exercise' && (
          <Select value={selectedExercise} onValueChange={(v)=>{ setSelectedExercise(v); try { localStorage.setItem('progress.cardio.exercise', v); } catch {} }}>
            <SelectTrigger className="w-[220px]" aria-label="Select exercise"><SelectValue placeholder="Select Exercise" /></SelectTrigger>
            <SelectContent>
              {exerciseFrequency.map(id => {
                const ex = exercises.find(e => e.exercise_id === id);
                return <SelectItem key={id} value={id}>{ex?.name || id}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-2 ml-auto">
          {hasDistance && <Button size="sm" variant={mode==='distance'?'default':'outline'} aria-pressed={mode==='distance'} aria-label="Show distance" onClick={()=>{ setMode('distance'); try { localStorage.setItem('progress.cardio.mode','distance'); } catch {} }}>Distance</Button>}
          {hasDistance && hasTime && <Button size="sm" variant={mode==='pace'?'default':'outline'} aria-pressed={mode==='pace'} aria-label="Show pace" onClick={()=>{ setMode('pace'); try { localStorage.setItem('progress.cardio.mode','pace'); } catch {} }}>Pace</Button>}
          {hasTime && <Button size="sm" variant={mode==='duration'?'default':'outline'} aria-pressed={mode==='duration'} aria-label="Show duration" onClick={()=>{ setMode('duration'); try { localStorage.setItem('progress.cardio.mode','duration'); } catch {} }}>Time</Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {view==='exercise' ? `${exerciseObj?.name || 'Exercise'} — ${mode === 'pace' ? 'Pace (min/km)' : mode === 'distance' ? 'Distance (km)' : 'Duration (min)'} ` : `Muscle Group Averages (${mode})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view==='exercise' ? (
            exerciseSeries.length === 0 ? <div className="text-sm text-muted-foreground">No data yet.</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={exerciseSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v:number)=>[mode==='pace'? paceFormat(v): v.toFixed(2), mode]} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          ) : (
            Object.keys(muscleAggregates).length === 0 ? <div className="text-sm text-muted-foreground">No data yet.</div> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" allowDuplicatedCategory={false} />
                  <YAxis />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  {Object.entries(muscleAggregates).map(([mg, series]) => (
                    <Line key={mg} data={series} dataKey="value" name={mg} strokeWidth={2} stroke={stringToColor(mg)} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function paceFormat(val: number) {
  if (!isFinite(val) || val <= 0) return '--';
  const m = Math.floor(val); const s = Math.round((val - m) * 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function stringToColor(str: string): string { let hash = 0; for (let i=0;i<str.length;i++) hash = str.charCodeAt(i) + ((hash<<5)-hash); const h = hash % 360; return `hsl(${h},70%,55%)`; }
