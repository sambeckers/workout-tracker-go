import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, Target, Play, Edit, Trash2, Plus, Download, Dumbbell, CheckSquare, Search } from 'lucide-react';
import { useWorkoutSessions, useCreateWorkoutSession, useUpdateWorkoutSession, useDeleteWorkoutSession, useExportWorkoutData, useExercises, useBulkCreateExerciseLogs } from '@/hooks/useWorkoutData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { GenerateRandomWorkout } from '@/components/dashboard/GenerateRandomWorkout';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: workouts = [], isLoading } = useWorkoutSessions();
  const createWorkoutMutation = useCreateWorkoutSession();
  const updateWorkoutMutation = useUpdateWorkoutSession();
  const deleteWorkoutMutation = useDeleteWorkoutSession();
  const exportDataMutation = useExportWorkoutData();
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const bulkCreateLogs = useBulkCreateExerciseLogs();

  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());

  const uniqueMuscleGroups = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach(ex => {
      if (ex.muscle_group) {
        ex.muscle_group.split(',').map(g => g.trim()).filter(Boolean).forEach(g => set.add(g));
      }
    });
    return Array.from(set).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
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
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const session = await createWorkoutMutation.mutateAsync({
        date: dateStr,
        title: `Planned Workout (${selectedExerciseIds.size})`,
        status: 'Planned',
        notes: 'Auto-created from Schedule quick add'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-500';
      case 'Planned':
        return 'bg-blue-500';
      case 'Skipped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCreateWorkout = () => {
    navigate('/dashboard/workout/plan');
  };

  const handleQuickSession = () => {
    navigate('/dashboard/workout/quick');
  };

  const handleToggleWorkoutStatus = (sessionId: string, currentStatus: string) => {
    const markingDone = currentStatus !== 'Done';
    const newStatus = markingDone ? 'Done' : 'Planned';
    updateWorkoutMutation.mutate({
      sessionId,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        if (markingDone) {
          // Light celebratory confetti
          confetti({
            particleCount: 80,
            spread: 55,
            origin: { y: 0.3 }
          });
        }
      }
    });
  };

  const handleDeleteWorkout = (sessionId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteWorkoutMutation.mutate(sessionId);
    }
  };

  // Filter for selected date first
  const normalizeDate = (d: string) => {
    // Accept ISO or date-only; fallback to today if invalid
    try {
      const parsed = parseISO(d);
      if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
    } catch {}
    return format(new Date(), 'yyyy-MM-dd');
  };

  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = workouts.filter(workout => normalizeDate(workout.date) === selectedDayKey);

  // Upcoming week (next 7 days including today) for separate display
  const now = new Date();
  const weekAhead = new Date();
  weekAhead.setDate(now.getDate() + 7);
  const upcomingWeekWorkouts = workouts.filter(w => {
    const d = parseISO(w.date);
    return d >= now && d <= weekAhead;
  }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const visibleUpcoming = showAllUpcoming ? upcomingWeekWorkouts : upcomingWeekWorkouts.slice(0, 5);

  if (!user) {
    return (
  <div className="app-container p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your workout schedule.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workout Schedule</h1>
          <p className="text-muted-foreground mt-2">Plan and track your fitness routine</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <Button 
            onClick={() => exportDataMutation.mutate()}
            variant="outline"
            className="flex items-center gap-2"
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <GenerateRandomWorkout />
          <Button 
            onClick={handleCreateWorkout}
            className="flex items-center gap-2"
            title="Plan a detailed workout with exercises, sets, and schedule"
          >
            <Plus className="h-4 w-4" />
            Plan Workout
          </Button>
          <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" title="Quick add exercises to a new planned session for this date">
                <Play className="h-4 w-4" /> Quick Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Select Exercises {selectedExerciseIds.size > 0 && (<span className="text-xs font-normal text-muted-foreground">({selectedExerciseIds.size} selected)</span>)}</DialogTitle>
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
                <div className="text-xs text-muted-foreground">{selectedExerciseIds.size === 0 ? 'No exercises selected yet' : `${selectedExerciseIds.size} exercise${selectedExerciseIds.size>1?'s':''} ready • New session on ${selectedDate.toLocaleDateString()}`}</div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={() => { setSelectedExerciseIds(new Set()); }}>Clear</Button>
                  <Button type="button" disabled={createWorkoutMutation.isPending || bulkCreateLogs.isPending || selectedExerciseIds.size===0} onClick={handleAddSelectedExercises} className="flex-1 md:flex-none">
                    {createWorkoutMutation.isPending || bulkCreateLogs.isPending ? 'Saving...' : 'Add Selected'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar and Workouts */}
  <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Calendar */}
  <div className="w-full">
          <Card className="lg:sticky lg:top-4 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full mx-auto [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:text-sm [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-xs"
              />
            </CardContent>
          </Card>
        </div>

      {/* Workouts List */}
  <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          Workouts for {selectedDate.toLocaleDateString()}
        </h2>
        
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading workouts...</p>
          </Card>
        ) : dayWorkouts.length > 0 ? (
          dayWorkouts.map((workout) => (
            <Card key={workout.session_id} className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between items-start gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{workout.title || 'Untitled Workout'}</h3>
                    <Badge className={getStatusColor(workout.status)}>
                      {workout.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{workout.time ? workout.time.slice(0,5) : 'No time'} • {workout.duration_minutes || 0} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{workout.date ? format(parseISO(workout.date), 'MMM dd, yyyy') : 'No date'}</span>
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <p className="text-sm text-muted-foreground">{workout.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:justify-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => navigate(`/dashboard/workout/${workout.session_id}`)}
                    title="View/perform workout session with set tracking"
                  >
                    <Dumbbell className="h-4 w-4" />
                    Open Session
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleToggleWorkoutStatus(workout.session_id, workout.status)}
                    disabled={updateWorkoutMutation.isPending}
                    variant="outline"
                    className={workout.status === 'Done' ? 'border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20' : 'flex items-center gap-2'}
                    title={workout.status === 'Done' ? 'Click to mark as planned' : 'Click to mark as done'}
                  >
                    <CheckSquare className="h-4 w-4" />
                    {workout.status === 'Done' ? 'Done' : 'Mark Done'}
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-2 text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => handleDeleteWorkout(workout.session_id, workout.title || 'Untitled Workout')}
                    disabled={deleteWorkoutMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No workouts scheduled</h3>
            <p className="text-muted-foreground mb-4">
              You haven't scheduled any workouts for this date yet.
            </p>
            <Button 
              className="flex items-center gap-2 mx-auto"
              onClick={handleCreateWorkout}
              disabled={createWorkoutMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Plan Workout
            </Button>
          </Card>
        )}

        {/* Upcoming Week Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" /> Upcoming Week
          </h2>
          {upcomingWeekWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts planned for the next 7 days.</p>
          ) : (
            <div className="space-y-4">
              {visibleUpcoming.map(w => (
                <Card key={w.session_id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{w.title || 'Untitled Workout'}</span>
                        <Badge className={getStatusColor(w.status)}>{w.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>{w.date ? format(parseISO(w.date), 'MMM dd') : 'No date'}</span>
                        <span>{w.time ? w.time.slice(0,5) : 'No time'}</span>
                        <span>{w.duration_minutes || 0} mins</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto sm:justify-end">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/workout/${w.session_id}`)} title="Open session">
                        <Dumbbell className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleToggleWorkoutStatus(w.session_id, w.status)}
                        disabled={updateWorkoutMutation.isPending}
                        variant="outline"
                        className={w.status === 'Done' ? 'border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20' : ''}
                        title={w.status === 'Done' ? 'Click to mark as planned' : 'Click to mark as done'}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>

                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDeleteWorkout(w.session_id, w.title || 'Untitled Workout')} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {upcomingWeekWorkouts.length > 5 && (
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAllUpcoming(s => !s)}>
                    {showAllUpcoming ? 'Show Less' : 'Show More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Schedule;