import { useState, useEffect, useRef } from "react";
import confetti from 'canvas-confetti';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Pause, Check, Timer, Dumbbell, Save, Minus, CheckSquare, Star } from "lucide-react";
import { useWorkoutSessions, useExercises, useExerciseLogs, useCreateExerciseLog, useCreateWorkoutSession, useUpdateWorkoutSession } from "@/hooks/useWorkoutData";
import { toast } from "sonner";

interface Set {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseWithSets {
  id: string;
  name: string;
  sets: Set[];
  targetWeight?: number;
  targetDurationPerSet?: number;
  advanced?: boolean;
  mode?: 'sets' | 'time';
  enableReps?: boolean;
  enableWeight?: boolean;
  durationSeconds?: number;
  timeCompleted?: boolean;
}

const WorkoutSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>([]);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem('favorite-exercises') || '[]');
      if (Array.isArray(fav)) setFavoriteExercises(fav);
      const rec = JSON.parse(localStorage.getItem('recent-exercises') || '[]');
      if (Array.isArray(rec)) setRecentExercises(rec);
    } catch {}
  }, []);
  const { unit } = useUnitPreference();
  const useLbs = unit === 'lbs';

  const { data: workoutSessions = [] } = useWorkoutSessions();
  const updateWorkoutMutation = useUpdateWorkoutSession();
  const { data: availableExercises = [] } = useExercises();
  const { data: exerciseLogs = [] } = useExerciseLogs(id !== "new" ? id : undefined);
  const createExerciseLogMutation = useCreateExerciseLog();
  const createSessionMutation = useCreateWorkoutSession();

  const currentWorkout = workoutSessions.find(w => w.session_id === id);

  const handleToggleWorkoutStatus = () => {
    if (!currentWorkout) return;
    const markingDone = currentWorkout.status !== 'Done';
    const newStatus = markingDone ? 'Done' : 'Planned';
    updateWorkoutMutation.mutate(
      {
        sessionId: currentWorkout.session_id,
        data: { status: newStatus }
      },
      {
        onSuccess: () => {
          if (markingDone) {
            confetti({ particleCount: 80, spread: 55, origin: { y: 0.3 } });
            toast.success('Workout marked as Done');
          } else {
            toast('Marked as Planned');
          }
        }
      }
    );
  };

  const autoMarkedDoneRef = useRef(false);
  useEffect(() => {
    autoMarkedDoneRef.current = false;
  }, [id]);

  // Auto-create a real session if we're on the /new route
  useEffect(() => {
    const createSession = async () => {
      if ((id === 'new' || id === 'quick') && !createSessionMutation.isPending) {
        try {
          const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
            const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
          const result: any = await createSessionMutation.mutateAsync({
            title: id === 'quick' ? 'Quick Session' : 'New Workout',
            date,
            time,
            status: id === 'quick' ? 'Planned' : 'Planned',
            duration_minutes: 0
          });
          if (result && result.session_id) {
            navigate(`/dashboard/workout/${result.session_id}`, { replace: true });
          }
        } catch (e) {
          toast.error('Failed to create workout session');
        }
      }
    };
    createSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Initialize exercises with sets when data loads
  useEffect(() => {
    if (exerciseLogs.length > 0) {
      // Group exercise logs by exercise
      const exerciseGroups = exerciseLogs.reduce((acc, log) => {
        const exerciseId = log.exercise_id;
        if (!acc[exerciseId]) {
          const savedMode = localStorage.getItem(`exercise-mode-${exerciseId}`);
          acc[exerciseId] = {
            id: exerciseId,
            name: log.exercise?.name || 'Unknown Exercise',
            sets: [],
            advanced: savedMode === 'advanced',
            mode: savedMode === 'advanced' ? 'sets' : (log.duration_seconds && (!log.sets || log.sets === 0) ? 'time' : 'sets'),
            enableReps: true,
            enableWeight: true,
            durationSeconds: log.duration_seconds || undefined,
            timeCompleted: false
          };
        }
        
        // Create sets from exercise log data
        if (log.sets) {
          const reps = log.reps_per_set ? log.reps_per_set.split(',').map(r => parseInt(r.trim())) : [];
          const weights = log.weight_per_set ? log.weight_per_set.split(',').map(w => parseInt(w.trim())) : [];
          const durationPerSet = log.duration_seconds && log.sets ? Math.round(log.duration_seconds / log.sets) : undefined;
          for (let i = 0; i < log.sets; i++) {
            acc[exerciseId].sets.push({
              setNumber: i + 1,
              reps: reps[i] || 0,
              weight: weights[i] || 0,
              completed: false
            });
          }
          acc[exerciseId].targetWeight = weights[0];
          acc[exerciseId].targetDurationPerSet = durationPerSet;
        }
        
        return acc;
      }, {} as Record<string, ExerciseWithSets>);

      setExercises(Object.values(exerciseGroups));
    } else if (id && id !== "new" && id !== "quick") {
      // Check for pre-planned exercises from WorkoutPlanner
      const plannedKey = `planned-exercises-${id}`;
      const plannedExercises = localStorage.getItem(plannedKey);
      
      if (plannedExercises) {
        try {
          const parsed = JSON.parse(plannedExercises);
          const exerciseList = parsed.map((ex: any) => {
            const repsVal = parseInt(ex.target_reps || '0') || 0;
            const weightVal = parseInt(ex.target_weight || 0) || 0;
            const savedMode = localStorage.getItem(`exercise-mode-${ex.exercise_id}`);
            return {
              id: ex.exercise_id,
              name: ex.name,
              sets: Array.from({ length: ex.target_sets }, (_, i) => ({
                setNumber: i + 1,
                reps: repsVal,
                weight: weightVal,
                completed: false
              })),
              targetWeight: weightVal,
              advanced: savedMode === 'advanced',
              mode: 'sets',
              enableReps: true,
              enableWeight: true,
              timeCompleted: false
            } as ExerciseWithSets;
          });
          setExercises(exerciseList);
          localStorage.removeItem(plannedKey); // Clean up
        } catch (e) {
          console.error('Failed to parse planned exercises:', e);
        }
      }
    } else if (id === "new") {
      // Check if exerciseId is provided in URL params
      const exerciseId = searchParams.get('exerciseId');
      let initialExercise = null;
      
      if (exerciseId && availableExercises.length > 0) {
        initialExercise = availableExercises.find(ex => ex.exercise_id === exerciseId);
      }
      
      if (initialExercise) {
        // Initialize with the selected exercise from Exercise Library
        setExercises([{
          id: initialExercise.exercise_id,
          name: initialExercise.name,
          sets: [
            { setNumber: 1, reps: 10, weight: 0, completed: false },
            { setNumber: 2, reps: 10, weight: 0, completed: false },
            { setNumber: 3, reps: 10, weight: 0, completed: false },
          ],
          targetWeight: 0,
          advanced: false,
          mode: (initialExercise.muscle_group || '').toLowerCase().includes('full') ? 'time' : 'sets',
          enableReps: true,
          enableWeight: true,
          durationSeconds: (initialExercise.muscle_group || '').toLowerCase().includes('full') ? 60 : undefined,
          timeCompleted: false
        }]);
      } else {
        // Initialize with a default exercise for new workouts
        setExercises([{
          id: availableExercises[0]?.exercise_id || 'temp-1',
          name: availableExercises[0]?.name || 'Push-ups',
          sets: [
            { setNumber: 1, reps: 10, weight: 0, completed: false },
            { setNumber: 2, reps: 10, weight: 0, completed: false },
            { setNumber: 3, reps: 10, weight: 0, completed: false },
          ],
          mode: 'sets',
          enableReps: true,
          enableWeight: true,
          timeCompleted: false
        }]);
      }
    }
  }, [exerciseLogs, availableExercises, id, searchParams]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setDuration(duration => duration + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set, index) => 
              index === setIndex ? { ...set, completed: !set.completed } : set
            )
          }
        : exercise
    ));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set, index) => 
              index === setIndex ? { ...set, [field]: value } : set
            )
          }
        : exercise
    ));
  };

  const toggleMode = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const toTime = (ex.mode || 'sets') === 'sets';
      if (toTime) {
        return {
          ...ex,
          mode: 'time',
          durationSeconds: ex.durationSeconds || 60,
          timeCompleted: false
        };
      } else {
        const sets = ex.sets && ex.sets.length > 0 ? ex.sets : [
          { setNumber: 1, reps: 10, weight: 0, completed: false },
          { setNumber: 2, reps: 10, weight: 0, completed: false },
          { setNumber: 3, reps: 10, weight: 0, completed: false },
        ];
        return {
          ...ex,
          mode: 'sets',
          sets
        };
      }
    }));
  };

  const updateDuration = (exerciseId: string, seconds: number) => {
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, durationSeconds: Math.max(0, seconds) } : ex));
  };

  const toggleEnableField = (exerciseId: string, field: 'enableReps' | 'enableWeight') => {
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, [field]: !ex[field] } : ex));
  };

  const setTimeCompleted = (exerciseId: string, completed: boolean) => {
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, timeCompleted: completed } : ex));
  };

  const toggleAdvanced = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newAdvanced = !ex.advanced;
        // Persist preference per exercise
        localStorage.setItem(`exercise-mode-${exerciseId}`, newAdvanced ? 'advanced' : 'compact');
        return { ...ex, advanced: newAdvanced };
      }
      return ex;
    }));
  };

  const updateAllSets = (exerciseId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.map(s => ({ ...s, [field]: value })) }
        : ex
    ));
  };

  const setAllSetsCompletion = (exerciseId: string, completed: boolean) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.map(s => ({ ...s, completed })) }
        : ex
    ));
  };

  const saveWorkout = async () => {
    if (!id || id === "new") {
      toast.error("Please save the workout session first");
      return;
    }

    try {
      for (const exercise of exercises) {
        if ((exercise.mode || 'sets') === 'time') {
          if (exercise.timeCompleted && (exercise.durationSeconds || 0) > 0) {
            await createExerciseLogMutation.mutateAsync({
              session_id: id,
              exercise_id: exercise.id,
              duration_seconds: exercise.durationSeconds,
            });
          }
        } else {
          const completedSets = exercise.sets.filter(set => set.completed);
          if (completedSets.length > 0) {
            const payload: any = {
              session_id: id,
              exercise_id: exercise.id,
              sets: completedSets.length,
            };
            if (exercise.enableReps !== false) {
              payload.reps_per_set = completedSets.map(set => set.reps).join(',');
            }
            if (exercise.enableWeight !== false) {
              payload.weight_per_set = completedSets.map(set => set.weight).join(',');
            }
            await createExerciseLogMutation.mutateAsync(payload);
          }
        }
      }
      toast.success("Workout saved successfully!");
      navigate('/progress');
    } catch (error) {
      toast.error("Failed to save workout");
    }
  };

  const completedSets = exercises.reduce((total, exercise) => {
    if ((exercise.mode || 'sets') === 'time') {
      return total + (exercise.timeCompleted ? 1 : 0);
    }
    return total + exercise.sets.filter(set => set.completed).length;
  }, 0);
  
  const totalSets = exercises.reduce((total, exercise) => {
    if ((exercise.mode || 'sets') === 'time') {
      return total + 1;
    }
    return total + exercise.sets.length;
  }, 0);

  useEffect(() => {
    if (!currentWorkout || updateWorkoutMutation.isPending) return;
    if (
      totalSets > 0 &&
      completedSets === totalSets &&
      currentWorkout.status !== 'Done' &&
      !autoMarkedDoneRef.current
    ) {
      autoMarkedDoneRef.current = true;
      updateWorkoutMutation.mutate(
        {
          sessionId: currentWorkout.session_id,
          data: { status: 'Done' }
        },
        {
          onSuccess: () => {
            confetti({ particleCount: 80, spread: 55, origin: { y: 0.3 } });
            toast.success('All sets complete. Marked as Done');
          }
        }
      );
    }
  }, [completedSets, totalSets, currentWorkout?.status, currentWorkout?.session_id]);
  useEffect(() => {
    if (!currentWorkout || updateWorkoutMutation.isPending) return;
    if (totalSets === 0) return;

    // If not all sets are complete, allow auto-mark to trigger again later
    if (completedSets < totalSets) {
      autoMarkedDoneRef.current = false;
      return;
    }

    // All sets complete: mark Done if not already and not yet triggered this cycle
    if (
      completedSets === totalSets &&
      currentWorkout.status !== 'Done' &&
      !autoMarkedDoneRef.current
    ) {
      autoMarkedDoneRef.current = true;
      updateWorkoutMutation.mutate(
        {
          sessionId: currentWorkout.session_id,
          data: { status: 'Done' }
        },
        {
          onSuccess: () => {
            confetti({ particleCount: 80, spread: 55, origin: { y: 0.3 } });
          }
        }
      );
    }
  }, [completedSets, totalSets, currentWorkout?.status, currentWorkout?.session_id, updateWorkoutMutation.isPending]);

  // If any set is incomplete, the session cannot be Done; auto-undo to Planned
  useEffect(() => {
    if (!currentWorkout || updateWorkoutMutation.isPending) return;
    if (totalSets === 0) return;
    if (completedSets < totalSets && currentWorkout.status === 'Done') {
      updateWorkoutMutation.mutate(
        {
          sessionId: currentWorkout.session_id,
          data: { status: 'Planned' }
        },
        {
          onSuccess: () => {
            toast('Marked as Planned');
          }
        }
      );
    }
  }, [completedSets, totalSets, currentWorkout?.status, currentWorkout?.session_id, updateWorkoutMutation.isPending]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const workoutTitle = currentWorkout?.title || (id === "new" ? "New Workout" : "Workout Session");

  const addExercise = (exercise: any) => {
    const isFullBody = (exercise.muscle_group || '').toLowerCase().includes('full');
    const newExercise: ExerciseWithSets = {
      id: exercise.exercise_id,
      name: exercise.name,
      sets: isFullBody ? [] : [
        { setNumber: 1, reps: 10, weight: 0, completed: false },
        { setNumber: 2, reps: 10, weight: 0, completed: false },
        { setNumber: 3, reps: 10, weight: 0, completed: false }
      ],
      targetWeight: 0,
      advanced: false,
      mode: isFullBody ? 'time' : 'sets',
      enableReps: true,
      enableWeight: true,
      durationSeconds: isFullBody ? 60 : undefined,
      timeCompleted: false
    };
    setExercises(prev => [...prev, newExercise]);
    // record recent
    try {
      const next = [exercise.exercise_id, ...recentExercises.filter(id => id !== exercise.exercise_id)].slice(0, 10);
      setRecentExercises(next);
      localStorage.setItem('recent-exercises', JSON.stringify(next));
    } catch {}
    setExerciseDialogOpen(false);
  };

  const toggleFavoriteExercise = (exerciseId: string) => {
    setFavoriteExercises(prev => {
      const exists = prev.includes(exerciseId);
      const next = exists ? prev.filter(id => id !== exerciseId) : [exerciseId, ...prev];
      try { localStorage.setItem('favorite-exercises', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{workoutTitle}</h1>
            <p className="text-muted-foreground">Track your workout progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={saveWorkout}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          {currentWorkout && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWorkoutStatus}
              disabled={updateWorkoutMutation.isPending}
              className={currentWorkout.status === 'Done' ? 'border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20' : 'flex items-center gap-2'}
              title={currentWorkout.status === 'Done' ? 'Click to mark as planned' : 'Click to mark as done'}
            >
              <CheckSquare className="h-4 w-4" />
              {currentWorkout.status === 'Done' ? 'Done' : 'Mark Done'}
            </Button>
          )}
          <Button 
            variant={isActive ? "secondary" : "default"}
            onClick={() => setIsActive(!isActive)}
            className="gap-2"
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Duration</p>
                <p className="text-2xl font-bold">{formatTime(duration)}</p>
              </div>
              <Timer className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Exercises</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
              <Dumbbell className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Sets Complete</p>
                <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
              </div>
              <Check className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Progress</p>
                <p className="text-2xl font-bold">
                  {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit toggle removed (global setting in Settings page) */}

      {/* Exercise List */}
      <div className="space-y-6">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4">
                <span>{exercise.name}</span>
                <div className="flex items-center gap-2">
                  {((exercise.mode || 'sets') === 'time') ? (
                    <Badge variant="outline">Time: {exercise.durationSeconds || 0}s {exercise.timeCompleted ? '✓' : ''}</Badge>
                  ) : (
                    <Badge variant="outline">
                      {exercise.sets.filter(set => set.completed).length}/{exercise.sets.length} sets
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => toggleAdvanced(exercise.id)}>
                    {exercise.advanced ? 'Compact' : 'Advanced'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleMode(exercise.id)}>
                    {((exercise.mode || 'sets') === 'time') ? 'Use Sets' : 'Use Time'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!exercise.advanced ? (
                <div className="flex flex-wrap items-center gap-3">
                  {((exercise.mode || 'sets') === 'time') ? (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Time (sec):</label>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateDuration(exercise.id, (exercise.durationSeconds || 0) - 5)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={exercise.durationSeconds || 0}
                            onChange={(e) => updateDuration(exercise.id, parseInt(e.target.value) || 0)}
                            className="w-20 h-8 border-0 text-center"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateDuration(exercise.id, (exercise.durationSeconds || 0) + 5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {exercise.timeCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20"
                            onClick={() => setTimeCompleted(exercise.id, false)}
                            title="Mark incomplete"
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => setTimeCompleted(exercise.id, true)}
                            title="Mark complete"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {exercise.sets.length} sets ×
                      </div>
                      {exercise.enableReps !== false && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Reps:</label>
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateAllSets(exercise.id, 'reps', Math.max(0, (exercise.sets[0]?.reps || 0) - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={exercise.sets[0]?.reps || 0}
                              onChange={(e) => updateAllSets(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                              className="w-16 h-8 border-0 text-center"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateAllSets(exercise.id, 'reps', (exercise.sets[0]?.reps || 0) + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {exercise.enableWeight !== false && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Weight:</label>
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const currentKg = exercise.sets[0]?.weight || 0;
                                const step = useLbs ? Math.round(2.5 / 2.20462) : 2.5;
                                updateAllSets(exercise.id, 'weight', Math.max(0, currentKg - step));
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={useLbs ? Math.round((exercise.sets[0]?.weight || 0) * 2.20462) : (exercise.sets[0]?.weight || 0)}
                              onChange={(e) => {
                                const raw = parseInt(e.target.value) || 0;
                                const kg = useLbs ? Math.round(raw / 2.20462) : raw;
                                updateAllSets(exercise.id, 'weight', kg);
                              }}
                              className="w-20 h-8 border-0 text-center"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const currentKg = exercise.sets[0]?.weight || 0;
                                const step = useLbs ? Math.round(2.5 / 2.20462) : 2.5;
                                updateAllSets(exercise.id, 'weight', currentKg + step);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">{useLbs ? 'lbs' : 'kg'}</span>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Reps</span>
                          <Switch checked={exercise.enableReps !== false} onCheckedChange={() => toggleEnableField(exercise.id, 'enableReps')} />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Weight</span>
                          <Switch checked={exercise.enableWeight !== false} onCheckedChange={() => toggleEnableField(exercise.id, 'enableWeight')} />
                        </div>
                        {exercise.sets.every(set => set.completed) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20"
                            onClick={() => setAllSetsCompletion(exercise.id, false)}
                            title="Mark all incomplete"
                          >
                            Undo All
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => setAllSetsCompletion(exercise.id, true)}
                            title="Mark all sets complete"
                          >
                            Complete All
                          </Button>
                        )}
                      </div>

                      {/* Quick list of sets to mark complete */}
                      <div className="w-full flex flex-wrap gap-2 mt-3">
                        {exercise.sets.map((set, idx) => (
                          <Button
                            key={idx}
                            variant={set.completed ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSet(exercise.id, idx)}
                          >
                            Set {set.setNumber} {set.completed ? '✓' : ''}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {((exercise.mode || 'sets') === 'time') ? (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium w-24">Time (sec):</label>
                        <Input
                          type="number"
                          value={exercise.durationSeconds || 0}
                          onChange={(e) => updateDuration(exercise.id, parseInt(e.target.value) || 0)}
                          className="w-28 h-9"
                        />
                      </div>
                      <Button
                        variant={exercise.timeCompleted ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeCompleted(exercise.id, !exercise.timeCompleted)}
                        className="ml-auto"
                        title={exercise.timeCompleted ? 'Click to undo' : 'Mark as complete'}
                      >
                        <Check className={`h-4 w-4 mr-2 ${exercise.timeCompleted ? 'text-white' : ''}`} />
                        {exercise.timeCompleted ? 'Done' : 'Complete'}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {exercise.sets.map((set, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                            set.completed 
                              ? "bg-green-50 border border-green-200" 
                              : "bg-muted/50 hover:bg-muted/70"
                          }`}
                        >
                          <div className="w-8 text-center font-medium">
                            {set.setNumber}
                          </div>
                          {exercise.enableReps !== false && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium w-12">Reps:</label>
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={(e) => updateSet(exercise.id, index, 'reps', parseInt(e.target.value) || 0)}
                                className="w-20 h-9"
                                disabled={set.completed}
                              />
                            </div>
                          )}
                          {exercise.enableWeight !== false && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium w-16">Weight:</label>
                              <Input
                                type="number"
                                value={useLbs ? Math.round(set.weight * 2.20462) : set.weight}
                                onChange={(e) => {
                                  const raw = parseInt(e.target.value) || 0;
                                  const kg = useLbs ? Math.round(raw / 2.20462) : raw;
                                  updateSet(exercise.id, index, 'weight', kg);
                                }}
                                className="w-24 h-9"
                                disabled={set.completed}
                              />
                              <span className="text-sm text-muted-foreground">{useLbs ? 'lbs' : 'kg'}</span>
                            </div>
                          )}
                          {exercise.targetDurationPerSet !== undefined && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium w-20">Time (s):</label>
                              <Input
                                type="number"
                                value={exercise.targetDurationPerSet}
                                onChange={(e) => {/* optional per-set override ignored for now */}}
                                className="w-24 h-9"
                                disabled
                              />
                            </div>
                          )}
                          <Button
                            variant={set.completed ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSet(exercise.id, index)}
                            className="ml-auto"
                            title={set.completed ? "Click to undo" : "Mark as complete"}
                          >
                            <Check className={`h-4 w-4 mr-2 ${set.completed ? 'text-white' : ''}`} />
                            {set.completed ? "Done" : "Complete"}
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button + Dialog */}
        <Card className="border-dashed hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-8 text-center">
            <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2" size="lg">
                  <Plus className="h-5 w-5" />
                  Add Exercise
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                <UIDialogHeader>
                  <UIDialogTitle>Select Exercise</UIDialogTitle>
                </UIDialogHeader>
                <div className="pb-3">
                  <Input
                    placeholder="Search exercises (name, muscle, difficulty)"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                {(() => {
                  const q = exerciseSearch.trim().toLowerCase();
                  const list = q.length === 0 ? availableExercises : availableExercises.filter(ex => {
                    const hay = [ex.name, ex.muscle_group, ex.difficulty, ex.description]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase();
                    return hay.includes(q);
                  });
                  // sort: favorites first, then by recency, then name
                  const favSet = new Set(favoriteExercises);
                  const recIndex = (id: string) => {
                    const idx = recentExercises.indexOf(id);
                    return idx === -1 ? 9999 : idx;
                  };
                  list.sort((a, b) => {
                    const aFav = favSet.has(a.exercise_id) ? 1 : 0;
                    const bFav = favSet.has(b.exercise_id) ? 1 : 0;
                    if (aFav !== bFav) return bFav - aFav;
                    const ar = recIndex(a.exercise_id);
                    const br = recIndex(b.exercise_id);
                    if (ar !== br) return ar - br;
                    return a.name.localeCompare(b.name);
                  });
                  if (list.length === 0) {
                    return (
                      <div className="py-6 text-sm text-muted-foreground">No exercises match “{exerciseSearch}”.</div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      {list.map((exercise) => (
                    <Card
                      key={exercise.exercise_id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addExercise(exercise)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium">{exercise.name}</div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={favoriteExercises.includes(exercise.exercise_id) ? 'text-yellow-500' : ''}
                                  onClick={(e) => { e.stopPropagation(); toggleFavoriteExercise(exercise.exercise_id); }}
                                  title={favoriteExercises.includes(exercise.exercise_id) ? 'Unpin favorite' : 'Pin as favorite'}
                                >
                                  <Star className={`h-4 w-4 ${favoriteExercises.includes(exercise.exercise_id) ? 'fill-yellow-400' : ''}`} />
                                </Button>
                              </div>
                          <div className="flex items-center gap-2">
                            {exercise.muscle_group && (
                              <Badge variant="secondary" className="text-xs">
                                {exercise.muscle_group}
                              </Badge>
                            )}
                            {exercise.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.difficulty}
                              </Badge>
                            )}
                                {favoriteExercises.includes(exercise.exercise_id) && (
                                  <Badge variant="outline" className="text-xs">Favorite</Badge>
                                )}
                                {recentExercises.includes(exercise.exercise_id) && (
                                  <Badge variant="secondary" className="text-xs">Recent</Badge>
                                )}
                          </div>
                          {exercise.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {exercise.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground mt-2">
              Browse and add an exercise to this workout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion card removed per request; use header Done button instead */}
    </div>
  );
};

export default WorkoutSession;