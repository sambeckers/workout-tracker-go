import HeroGallery from "@/components/layout/HeroGallery";
import { SeedDataButton } from "@/components/dashboard/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Clock, Plus, Play, Calendar, Book, TrendingUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useProgressData, useExercises, useCreateWorkoutSession, useBulkCreateExerciseLogs } from "@/hooks/useWorkoutData";
import { DashboardNavCards } from "@/components/dashboard/DashboardNavCards";
import { TodaysWorkoutCard } from "@/components/dashboard/TodaysWorkoutCard";
import { WeeklyWorkoutsCard } from "@/components/dashboard/WeeklyWorkoutsCard";
import { CompactProgressOverview } from "@/components/dashboard/CompactProgressOverview";
import StatsCard from "@/components/dashboard/StatsCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/date-utils";
import React from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mock user for development when authentication is bypassed
  const mockUser = {
    user_metadata: { name: "Sam Beckers", avatar_url: "" },
    email: "sam@example.com"
  };
  
  const displayUser = user || mockUser;
  const userName = displayUser?.user_metadata?.name?.split(' ')[0] || displayUser?.email?.split('@')[0] || 'User';
  
  const { totalWorkouts, weeklyStreak, averageDuration, todayCompleted, todayPlanned, allCompleted, allPlanned, loading } = useDashboardStats();
  const { data: progressData } = useProgressData();
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  
  // Quick Session Dialog state
  const [showExerciseDialog, setShowExerciseDialog] = React.useState(false);
  const [exerciseSearch, setExerciseSearch] = React.useState('');
  const [muscleFilter, setMuscleFilter] = React.useState<string>('all');
  const [selectedExerciseIds, setSelectedExerciseIds] = React.useState<Set<string>>(new Set());
  const createWorkoutMutation = useCreateWorkoutSession();
  const bulkCreateLogs = useBulkCreateExerciseLogs();

  const uniqueMuscleGroups = React.useMemo(() => {
    const set = new Set<string>();
    exercises.forEach(ex => {
      if (ex.muscle_group) {
        ex.muscle_group.split(',').map(g => g.trim()).filter(Boolean).forEach(g => set.add(g));
      }
    });
    return Array.from(set).sort();
  }, [exercises]);

  const filteredExercises = React.useMemo(() => {
    return exercises.filter(ex => {
      if (exerciseSearch && !ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())) return false;
      if (muscleFilter !== 'all') {
        const groups = (ex.muscle_group || '').toLowerCase();
        if (!groups.split(',').some(g => g.trim() === muscleFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [exercises, exerciseSearch, muscleFilter]);

  const toggleExerciseSelect = (id: string) => {
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddSelectedExercises = async () => {
    if (!selectedExerciseIds.size) {
      setShowExerciseDialog(false);
      return;
    }
    try {
      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');
      const session = await createWorkoutMutation.mutateAsync({
        date: dateStr,
        title: `Planned Workout (${selectedExerciseIds.size})`,
        status: 'Planned',
        notes: 'Auto-created from Homepage quick session'
      } as any);
      if (session?.session_id) {
        const logs = Array.from(selectedExerciseIds).map(exercise_id => ({
          session_id: session.session_id,
          exercise_id,
          sets: 0,
          reps_per_set: '',
          weight_per_set: ''
        }));
        await bulkCreateLogs.mutateAsync(logs as any);
      }
    } catch (e) {
      console.error('Failed to add exercises to new session', e);
    } finally {
      setSelectedExerciseIds(new Set());
      setShowExerciseDialog(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Hero Gallery Section */}
      <div className="flex items-center justify-between mb-4">
        <div />
        <SeedDataButton />
      </div>

      {/* Hero and Action Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        {/* Hero Gallery - Takes 4 columns on large screens, matches height of 2 rows */}
        <div className="lg:col-span-4">
          <HeroGallery 
            userName={userName}
            onStartWorkout={() => navigate('/dashboard/workout/new')}
          />
        </div>

        {/* Action Cards Column - Takes 4 columns */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/workout/plan')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />
                Plan Workout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Create a detailed workout
              </p>
              <Button size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-2" />
                Plan Workout
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowExerciseDialog(true)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="h-4 w-4 text-primary" />
                Quick Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Start tracking quickly
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); setShowExerciseDialog(true); }}>
                <Play className="h-3 w-3 mr-2" />
                Quick Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards - Takes 4 columns, 2x2 grid */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3 md:gap-4">
          {[
            { icon: Calendar, label: 'Schedule', path: '/schedule' },
            { icon: Book, label: 'Exercises', path: '/exercises' },
            { icon: Dumbbell, label: 'Templates', path: '/templates' },
            { icon: TrendingUp, label: 'Progress', path: '/progress' },
          ].map(item => (
            <Card 
              key={item.path} 
              className="group cursor-pointer hover:shadow-lg transition-smooth h-full" 
              onClick={() => navigate('/dashboard'+item.path)}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-full">
                <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-smooth">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm text-center">{item.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Today's and Weekly Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-1 space-y-4">
          <TodaysWorkoutCard completed={todayCompleted} planned={todayPlanned} />
        </div>
        <div className="md:col-span-3">
          <WeeklyWorkoutsCard sessions={allCompleted} planned={allPlanned} />
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatsCard
          title="Total Workouts"
          value={totalWorkouts}
          subtitle="All time"
          icon={Dumbbell}
          variant="primary"
        />
        <StatsCard
          title="Weekly Streak"
          value={weeklyStreak}
          subtitle="Consecutive days"
          icon={Flame}
          variant="accent"
        />
        <StatsCard
          title="Avg Duration"
          value={averageDuration}
          subtitle="Per session"
          icon={Clock}
        />
      </div>

      {/* Progress Overview - Full Width */}
      {progressData && progressData.sessions.length > 0 && (
        <CompactProgressOverview 
          sessions={progressData.sessions} 
          logs={progressData.logs} 
          exercises={exercises}
        />
      )}

      {/* Quick Session Dialog */}
      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Select Exercises {selectedExerciseIds.size > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({selectedExerciseIds.size} selected)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={muscleFilter} onValueChange={setMuscleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Muscle Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {uniqueMuscleGroups.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-md h-[380px] overflow-auto p-2 space-y-2 bg-muted/40">
            {exercisesLoading && (
              <div className="text-sm text-muted-foreground p-4">Loading exercises...</div>
            )}
            {!exercisesLoading && filteredExercises.length === 0 && (
              <div className="text-sm text-muted-foreground p-4">No exercises match your search.</div>
            )}
            {!exercisesLoading && filteredExercises.map(ex => {
              const selected = selectedExerciseIds.has(ex.exercise_id);
              return (
                <button
                  type="button"
                  key={ex.exercise_id}
                  onClick={() => toggleExerciseSelect(ex.exercise_id)}
                  className={`w-full text-left p-3 rounded-md border flex flex-col gap-1 transition-smooth ${selected ? 'bg-gradient-primary text-white shadow-glow border-primary' : 'bg-background hover:bg-muted'} focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{ex.name}</span>
                    {selected && <span className="text-xs font-semibold uppercase tracking-wide">Selected</span>}
                  </div>
                  {ex.muscle_group && (
                    <div className="flex flex-wrap gap-1">
                      {ex.muscle_group.split(',').map(g => (
                        <Badge key={g.trim()} variant="secondary" className="text-[10px] px-1 py-0">{g.trim()}</Badge>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <DialogFooter className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedExerciseIds.size === 0 ? 'No exercises selected yet' : `${selectedExerciseIds.size} exercise${selectedExerciseIds.size>1?'s':''} ready • New session for today`}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={() => { setSelectedExerciseIds(new Set()); }}>
                Clear
              </Button>
              <Button 
                type="button" 
                disabled={createWorkoutMutation.isPending || bulkCreateLogs.isPending || selectedExerciseIds.size===0} 
                onClick={handleAddSelectedExercises} 
                className="flex-1 md:flex-none"
              >
                {createWorkoutMutation.isPending || bulkCreateLogs.isPending ? 'Saving...' : 'Add Selected'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
