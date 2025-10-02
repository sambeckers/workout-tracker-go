import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { convertTotalVolume } from '@/lib/units';

interface Session {
  session_id: string;
  date: string;
  title?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
}

interface Log {
  log_id: string;
  session_id: string;
  exercise_id: string;
  sets?: number | null;
  weight_per_set?: string | null;
  exercise?: {
    name?: string | null;
    muscle_group?: string | null;
  };
}

interface Props {
  sessions: Session[];
  logs: Log[];
  navigate: (path: string) => void;
}

export const RecentWorkouts: React.FC<Props> = ({ sessions, logs, navigate }) => {
  const { unit } = useUnitPreference();

  const completedSessions = sessions.filter(s => s.status === 'Done');
  
  const recentWorkouts = completedSessions.slice(0, 10).map(session => {
    const sessionLogs = logs.filter(log => log.session_id === session.session_id);
    
    const totalVolumeKg = sessionLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    // Get muscle groups
    const muscleGroups = new Set(
      sessionLogs
        .map(log => log.exercise?.muscle_group)
        .filter(Boolean)
    );

    return {
      id: session.session_id,
      date: session.date,
      title: session.title || 'Workout',
      duration: session.duration_minutes || 0,
      exercises: sessionLogs.length,
      totalVolumeKg: Math.round(totalVolumeKg),
      muscleGroups: Array.from(muscleGroups).slice(0, 3)
    };
  });

  if (recentWorkouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Recent Workouts
          </CardTitle>
          <CardDescription>Your latest completed workout sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No completed workouts yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start logging workouts to see your history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Recent Workouts
        </CardTitle>
        <CardDescription>Your latest completed workout sessions from your schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentWorkouts.map(workout => (
            <div
              key={workout.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/dashboard/workout/${workout.id}`)}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{workout.title}</h4>
                  {workout.muscleGroups.map((group, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(workout.date), 'MMM dd, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workout.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {workout.exercises} exercises
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right mt-3 sm:mt-0 sm:ml-4">
                <div className="text-lg font-semibold">
                  {convertTotalVolume(workout.totalVolumeKg, unit).toLocaleString()} {unit}
                </div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
