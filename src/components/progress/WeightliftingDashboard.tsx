import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { estimateOneRepMax, buildExerciseSeries, aggregateByMuscleGroup, RawLogLike } from '@/lib/progress-metrics';
import { classifyExercise } from '@/lib/metrics';

interface Props { logs: RawLogLike[]; exercises: any[]; }

export const WeightliftingDashboard: React.FC<Props> = ({ logs, exercises }) => {
  // Filter strength/bodyweight logs
  const strengthLogs = logs.filter(l => {
    const ex = exercises.find(e => e.exercise_id === l.exercise_id);
    if (!ex) return false;
    const profile = classifyExercise(ex);
    return profile.type === 'strength' || profile.type === 'bodyweight';
  });

  const exerciseFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    strengthLogs.forEach(l => { freq[l.exercise_id] = (freq[l.exercise_id]||0)+1; });
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  }, [strengthLogs]);

  const [selectedExercise, setSelectedExercise] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('progress.weight.exercise');
      if (stored) return stored;
    }
    return exerciseFrequency[0] || '';
  });
  const [mode, setMode] = useState<'1rm' | 'weight'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('progress.weight.mode');
      if (stored === '1rm' || stored === 'weight') return stored;
    }
    return '1rm';
  });
  const [view, setView] = useState<'exercise' | 'muscle'>('exercise');

  const exerciseSeries = useMemo(() => selectedExercise ? buildExerciseSeries(strengthLogs, selectedExercise, mode) : [], [strengthLogs, selectedExercise, mode]);
  const muscleAggregates = useMemo(() => aggregateByMuscleGroup(strengthLogs, mode), [strengthLogs, mode]);

  const exerciseObj = exercises.find(e => e.exercise_id === selectedExercise);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-2">
          <Button variant={view==='exercise'?'default':'outline'} size="sm" aria-pressed={view==='exercise'} aria-label="View per exercise" onClick={()=>setView('exercise')}>Per Exercise</Button>
          <Button variant={view==='muscle'?'default':'outline'} size="sm" aria-pressed={view==='muscle'} aria-label="View per muscle group" onClick={()=>setView('muscle')}>Per Muscle Group</Button>
        </div>
        {view==='exercise' && (
          <Select value={selectedExercise} onValueChange={(v)=>{ setSelectedExercise(v); try { localStorage.setItem('progress.weight.exercise', v); } catch {} }}>
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
          <Button size="sm" variant={mode==='1rm'?'default':'outline'} aria-pressed={mode==='1rm'} aria-label="Show estimated 1RM" onClick={()=>{ setMode('1rm'); try { localStorage.setItem('progress.weight.mode', '1rm'); } catch {} }}>1RM</Button>
          <Button size="sm" variant={mode==='weight'?'default':'outline'} aria-pressed={mode==='weight'} aria-label="Show top set weight" onClick={()=>{ setMode('weight'); try { localStorage.setItem('progress.weight.mode', 'weight'); } catch {} }}>Weight</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {view==='exercise' ? `${exerciseObj?.name || 'Exercise'} — ${mode === '1rm' ? 'Estimated 1RM' : 'Top Set Weight'} ` : `Muscle Group Averages (${mode === '1rm' ? '1RM' : 'Weight'})`}
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
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v:number)=>[v.toFixed(1), mode]} />
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

function stringToColor(str: string): string {
  let hash = 0; for (let i=0;i<str.length;i++) hash = str.charCodeAt(i) + ((hash<<5)-hash);
  const h = hash % 360; return `hsl(${h},70%,55%)`;
}
