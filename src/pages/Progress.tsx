import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Clock, Target, Dumbbell, Download, FileText } from 'lucide-react';
import { useProgressData, useExportWorkoutData } from '@/hooks/useWorkoutData';
import { format, parseISO, subMonths, isAfter } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const Progress = () => {
  const { user } = useAuth();
  const { data: progressData, isLoading } = useProgressData();
  const exportDataMutation = useExportWorkoutData();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your progress.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading your progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sessions = [], logs = [] } = progressData || {};

  // Calculate stats from real data
  const stats = {
    totalWorkouts: sessions.length,
    totalWeight: logs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0),
    avgWorkoutTime: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length)
      : 0,
    currentStreak: sessions.filter(s => 
      isAfter(parseISO(s.date), subMonths(new Date(), 1))
    ).length
  };

  // Generate monthly progress from real data
  const monthlyProgress = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthSessions = sessions.filter(s => 
      format(parseISO(s.date), 'yyyy-MM') === format(date, 'yyyy-MM')
    );
    const monthLogs = logs.filter(log => 
      monthSessions.some(s => s.session_id === log.session_id)
    );
    const monthWeight = monthLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    monthlyProgress.push({
      month: format(date, 'MMM'),
      workouts: monthSessions.length,
      weight: Math.round(monthWeight)
    });
  }

  // Get recent workouts (last 5)
  const recentWorkouts = sessions.slice(0, 5).map(session => {
    const sessionLogs = logs.filter(log => log.session_id === session.session_id);
    const totalWeight = sessionLogs.reduce((sum, log) => {
      if (!log.weight_per_set || !log.sets) return sum;
      const weights = log.weight_per_set.split(',').map(w => parseFloat(w.trim()) || 0);
      return sum + weights.reduce((a, b) => a + b, 0) * (log.sets || 1);
    }, 0);

    return {
      id: session.session_id,
      date: session.date,
      title: session.title || 'Workout',
      duration: session.duration_minutes || 0,
      exercises: sessionLogs.length,
      totalWeight: Math.round(totalWeight)
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress & Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your fitness journey and improvements</p>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => exportDataMutation.mutate()}
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight Lifted</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalWeight).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">lbs total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{stats.avgWorkoutTime}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Recent Workouts</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">last month</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Progress
            </CardTitle>
            <CardDescription>
              Your workout activity over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="workouts" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent Exercise Activity
            </CardTitle>
            <CardDescription>
              Your workout activity from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.slice(0, 5).map((log, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{log.exercise?.name || 'Unknown Exercise'}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.sets} sets • {log.reps_per_set} reps • {log.weight_per_set} lbs
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(log.created_at), 'MMM dd')}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No exercise logs found. Start tracking your workouts to see progress here.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Workout History
          </CardTitle>
          <CardDescription>
            Your latest completed workouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-4">
              {recentWorkouts.length > 0 ? recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{workout.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(workout.date), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {workout.duration} min
                      </span>
                      <span>{workout.exercises} exercises</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{workout.totalWeight.toLocaleString()} lbs</div>
                    <div className="text-sm text-muted-foreground">Total Volume</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  No workout history found. Complete some workouts to see your progress here.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;