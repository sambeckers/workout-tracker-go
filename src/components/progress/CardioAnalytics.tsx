import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, HeartPulse, Activity } from 'lucide-react';

interface Log { created_at: string; reps_per_set?: string | null; sets?: number | null; exercise?: { name?: string | null; muscle_group?: string | null }; session_id?: string; }
interface Session { session_id: string; date: string; duration_minutes?: number | null; title?: string | null; }

interface Props { logs: Log[]; sessions: Session[]; }

// Simple heuristic: treat logs without weight info as cardio-ish placeholders until distance/time data exists
const isCardioExercise = (name?: string | null) => {
  if (!name) return false;
  const n = name.toLowerCase();
  return /(run|row|bike|cycle|elliptical|walk|treadmill|jog|swim|cardio)/.test(n);
};

export const CardioAnalytics: React.FC<Props> = ({ logs, sessions }) => {
  const cardioLogs = logs.filter(l => isCardioExercise(l.exercise?.name));

  // Duration trend from sessions that appear cardio-dominant (at least one cardio log)
  const cardioSessions = useMemo(() => {
    const ids = new Set(cardioLogs.map(l => l.session_id));
    return sessions.filter(s => ids.has(s.session_id));
  }, [cardioLogs, sessions]);

  const avgDuration = cardioSessions.length ? Math.round(cardioSessions.reduce((s,c)=> s + (c.duration_minutes || 0),0)/cardioSessions.length) : 0;

  const durationSeries = cardioSessions.slice().sort((a,b)=> new Date(a.date).getTime()-new Date(b.date).getTime()).map(s => ({
    date: new Date(s.date).toLocaleDateString(undefined,{ month:'short', day:'numeric'}),
    duration: s.duration_minutes || 0
  }));

  // Placeholder: naive distance estimate using duration * constant pace (e.g. 10 min per km => 0.1 km per minute)
  const estimatedDistanceKm = cardioSessions.reduce((s,c)=> s + ((c.duration_minutes||0) * 0.1), 0);
  const avgPace = estimatedDistanceKm ? (cardioSessions.reduce((s,c)=> s + (c.duration_minutes||0),0) / estimatedDistanceKm) : 0; // min per km

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cardio Sessions</p>
                <p className="text-2xl font-bold">{cardioSessions.length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{avgDuration}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cardio Logs</p>
                <p className="text-2xl font-bold">{cardioLogs.length}</p>
              </div>
              <HeartPulse className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Distance</p>
                <p className="text-2xl font-bold">{estimatedDistanceKm.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">km (heuristic)</p>
              </div>
              <HeartPulse className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Avg Pace (est.)</CardTitle>
            <CardDescription>Minutes per km (naive)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgPace ? avgPace.toFixed(1) : '--'}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Heuristic estimation using generic conversion. Add actual distance fields to refine.</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Implementation Note</CardTitle>
            <CardDescription>Future Cardio Metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Add distance (m) & calories columns to `exercise_logs` or dedicated `cardio_logs` table.</li>
              <li>Capture pace directly or compute from distance / duration.</li>
              <li>Allow unit switching (km/mi) with user preference.</li>
              <li>Integrate heart rate if device sync added.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Duration Trend</CardTitle>
          <CardDescription>Session duration over time (cardio-related)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5" /> Recent Cardio Activity</CardTitle>
          <CardDescription>Latest cardio-related logs by exercise pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cardioLogs.slice(0,5).map((log,i)=>(
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{log.exercise?.name || 'Cardio Exercise'}</div>
                  <div className="text-xs text-muted-foreground">{log.sets} sets • {log.reps_per_set} reps (pattern)</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString(undefined,{ month:'short', day:'numeric'})}</div>
              </div>
            ))}
            {cardioLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No cardio-like activity detected yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CardioAnalytics;
