import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, Dumbbell, Target } from 'lucide-react';
import { convertTotalVolume, formatWeightList } from '@/lib/units';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';

interface Log {
  weight_per_set?: string | null;
  sets?: number | null;
  reps_per_set?: string | null;
  created_at: string;
  exercise?: { name?: string | null; muscle_group?: string | null };
  session_id?: string;
}
interface Session { session_id: string; date: string; duration_minutes?: number | null; title?: string | null; }

interface Props {
  logs: Log[];
  sessions: Session[];
}

export const WeightliftingAnalytics: React.FC<Props> = ({ logs, sessions }) => {
  const { unit } = useUnitPreference();
  const [range, setRange] = useState<'30'|'90'|'180'|'all'>('90');
  const [query, setQuery] = useState('');

  // Filter logs that have weight data (treat as weightlifting)
  const rawLiftingLogs = logs.filter(l => l.weight_per_set && /\d/.test(l.weight_per_set));

  const cutoff = useMemo(()=> {
    if (range==='all') return 0;
    const days = parseInt(range,10);
    return Date.now() - days*24*60*60*1000;
  },[range]);

  const liftingLogs = useMemo(()=> rawLiftingLogs.filter(l => {
    const t = new Date(l.created_at).getTime();
    if (cutoff && t < cutoff) return false;
    if (query && l.exercise?.name && !l.exercise.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [rawLiftingLogs, cutoff, query]);

  const totalWeightKg = liftingLogs.reduce((sum, log) => {
    if (!log.weight_per_set || !log.sets) return sum;
    const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
    return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
  }, 0);

  // Group by month for chart
  const monthly = useMemo(() => {
    const map: Record<string, { month: string; volume: number; exercises: number }> = {};
    liftingLogs.forEach(log => {
      const monthKey = new Date(log.created_at).toISOString().slice(0,7);
      if (!map[monthKey]) {
        const d = new Date(log.created_at);
        map[monthKey] = { month: d.toLocaleString('default',{ month:'short'}), volume: 0, exercises: 0 };
      }
      if (log.weight_per_set && log.sets) {
        const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
        map[monthKey].volume += weights.reduce((a,b)=>a+b,0)*(log.sets||1);
        map[monthKey].exercises += 1;
      }
    });
    // Sort by chronological order
    return Object.values(map).sort((a,b)=> a.month.localeCompare(b.month));
  }, [liftingLogs]);

  const topRecent = liftingLogs.slice(0,5);

  const prData = useMemo(() => {
    const map: Record<string, { exercise: string; maxWeight: number; date: string }>= {};
    liftingLogs.forEach(log => {
      if (!log.exercise?.name || !log.weight_per_set) return;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim())||0);
      const maxSet = Math.max(...weights);
      const current = map[log.exercise.name];
      if (!current || maxSet > current.maxWeight) {
        map[log.exercise.name] = { exercise: log.exercise.name, maxWeight: maxSet, date: log.created_at };
      }
    });
    return Object.values(map).sort((a,b)=> b.maxWeight - a.maxWeight).slice(0,5);
  }, [liftingLogs]);

  const muscleGroupVolume = useMemo(() => {
    const map: Record<string, number> = {};
    liftingLogs.forEach(log => {
      if (!log.exercise?.muscle_group || !log.weight_per_set || !log.sets) return;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim())||0);
      const vol = weights.reduce((a,b)=>a+b,0)*(log.sets||1);
      const groups = log.exercise.muscle_group.split(',').map(g=> g.trim()).filter(Boolean);
      groups.forEach(g => { map[g] = (map[g]||0)+ vol; });
    });
    return Object.entries(map).map(([group, volume]) => ({ group, volume })).sort((a,b)=> b.volume - a.volume);
  }, [liftingLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex gap-2">
          <button onClick={()=>setRange('30')} className={`px-3 py-1 rounded text-sm border ${range==='30' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>30d</button>
          <button onClick={()=>setRange('90')} className={`px-3 py-1 rounded text-sm border ${range==='90' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>90d</button>
          <button onClick={()=>setRange('180')} className={`px-3 py-1 rounded text-sm border ${range==='180' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>180d</button>
          <button onClick={()=>setRange('all')} className={`px-3 py-1 rounded text-sm border ${range==='all' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>All</button>
        </div>
        <input
          value={query}
          onChange={e=> setQuery(e.target.value)}
          placeholder="Search exercise..."
          className="w-full md:w-64 h-10 px-3 text-sm rounded-md border bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{convertTotalVolume(totalWeightKg, unit).toLocaleString()} {unit}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weighted Exercises</p>
                <p className="text-2xl font-bold">{liftingLogs.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Volume / Lift</p>
                <p className="text-2xl font-bold">{liftingLogs.length ? Math.round(convertTotalVolume(totalWeightKg, unit)/liftingLogs.length).toLocaleString() : 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Monthly Lifting Volume</CardTitle>
          <CardDescription>Sum of set weights per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5" /> Recent Lifts</CardTitle>
          <CardDescription>Your latest weighted exercise logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRecent.map((log, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{log.exercise?.name || 'Exercise'}</div>
                  <div className="text-xs text-muted-foreground">{log.sets} sets • {log.reps_per_set} reps • {formatWeightList(log.weight_per_set || '', unit)} {unit}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString(undefined,{ month:'short', day:'numeric'})}</div>
              </div>
            ))}
            {topRecent.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No weighted exercise logs yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Top Personal Records</CardTitle>
          <CardDescription>Heaviest single-set weight per exercise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prData.map((pr,i)=>(
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{pr.exercise}</div>
                  <div className="text-xs text-muted-foreground">{convertTotalVolume(pr.maxWeight, unit).toLocaleString()} {unit} • {new Date(pr.date).toLocaleDateString(undefined,{ month:'short', day:'numeric'})}</div>
                </div>
              </div>
            ))}
            {prData.length === 0 && (<div className="text-center py-6 text-sm text-muted-foreground">No personal records yet.</div>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5" /> Muscle Group Volume</CardTitle>
          <CardDescription>Total lifting volume per muscle group</CardDescription>
        </CardHeader>
        <CardContent>
          {muscleGroupVolume.length ? (
            <div className="space-y-3">
              {muscleGroupVolume.map((m,i)=> {
                const converted = convertTotalVolume(m.volume, unit);
                const max = convertTotalVolume(muscleGroupVolume[0].volume, unit);
                const pct = max? (converted / max) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{m.group}</span>
                      <span>{converted.toLocaleString()} {unit}</span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary transition-smooth" style={{ width: pct+'%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4">No muscle group volume data yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightliftingAnalytics;
