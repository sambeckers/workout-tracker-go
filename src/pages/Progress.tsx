import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Download, Activity, Target, Dumbbell } from 'lucide-react';
import { useProgressData, useExportWorkoutData } from '@/hooks/useWorkoutData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressOverview } from '@/components/progress/ProgressOverview';
import { MuscleGroupProgress } from '@/components/progress/MuscleGroupProgress';
import { MetricsTimeline } from '@/components/progress/MetricsTimeline';
import { RecentWorkouts } from '@/components/progress/RecentWorkouts';

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 rounded-lg bg-muted" />
      <div className="h-96 rounded-lg bg-muted" />
    </div>
  </div>
);

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: progressData, isLoading } = useProgressData();
  const exportDataMutation = useExportWorkoutData();
  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'overview';
    return localStorage.getItem('progress.activeTab') || 'overview';
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try { localStorage.setItem('progress.activeTab', value); } catch {}
  };

  if (!user) {
    return (
      <div className="app-container p-8">
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
      <div className="app-container p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Progress & Analytics</h1>
            <p className="text-muted-foreground mt-2">Loading your fitness journey...</p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  const { sessions = [], logs = [] } = progressData || {};

  return (
    <div className="app-container p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Progress & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Track your fitness journey across all metrics</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => exportDataMutation.mutate()}
          disabled={exportDataMutation.isPending}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="muscles" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">By Muscle</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Workouts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <ProgressOverview sessions={sessions} logs={logs} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="muscles" className="space-y-6">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <MuscleGroupProgress logs={logs} sessions={sessions} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <MetricsTimeline sessions={sessions} logs={logs} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-6">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <RecentWorkouts sessions={sessions} logs={logs} navigate={navigate} />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;