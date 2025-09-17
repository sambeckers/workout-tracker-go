import { useState, useEffect } from "react";
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Pause, Check, Timer, Dumbbell, Save } from "lucide-react";
import { useWorkoutSessions, useExercises, useExerciseLogs, useCreateExerciseLog, useCreateWorkoutSession } from "@/hooks/useWorkoutData";
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
}

const WorkoutSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const { unit } = useUnitPreference();
  const useLbs = unit === 'lbs';

  const { data: workoutSessions = [] } = useWorkoutSessions();
  const { data: availableExercises = [] } = useExercises();
  const { data: exerciseLogs = [] } = useExerciseLogs(id !== "new" ? id : undefined);
  const createExerciseLogMutation = useCreateExerciseLog();
  const createSessionMutation = useCreateWorkoutSession();

  const currentWorkout = workoutSessions.find(w => w.session_id === id);

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
          acc[exerciseId] = {
            id: exerciseId,
            name: log.exercise?.name || 'Unknown Exercise',
            sets: []
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
          const exerciseList = parsed.map((ex: any) => ({
            id: ex.exercise_id,
            name: ex.name,
            sets: Array.from({ length: ex.target_sets }, (_, i) => ({
              setNumber: i + 1,
              reps: 0,
              weight: 0,
              completed: false
            }))
          }));
          setExercises(exerciseList);
          localStorage.removeItem(plannedKey); // Clean up
        } catch (e) {
          console.error('Failed to parse planned exercises:', e);
        }
      }
    } else if (id === "new") {
      // Initialize with a default exercise for new workouts
      setExercises([{
        id: availableExercises[0]?.exercise_id || 'temp-1',
        name: availableExercises[0]?.name || 'Push-ups',
        sets: [
          { setNumber: 1, reps: 10, weight: 0, completed: false },
          { setNumber: 2, reps: 10, weight: 0, completed: false },
          { setNumber: 3, reps: 10, weight: 0, completed: false },
        ]
      }]);
    }
  }, [exerciseLogs, availableExercises, id]);

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
    setExercises(exercises.map(exercise => 
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

  const saveWorkout = async () => {
    if (!id || id === "new") {
      toast.error("Please save the workout session first");
      return;
    }

    try {
      for (const exercise of exercises) {
        const completedSets = exercise.sets.filter(set => set.completed);
        if (completedSets.length > 0) {
          await createExerciseLogMutation.mutateAsync({
            session_id: id,
            exercise_id: exercise.id,
            sets: completedSets.length,
            reps_per_set: completedSets.map(set => set.reps).join(','),
            weight_per_set: completedSets.map(set => set.weight).join(','),
          });
        }
      }
      toast.success("Workout saved successfully!");
      navigate('/progress');
    } catch (error) {
      toast.error("Failed to save workout");
    }
  };

  const completedSets = exercises.reduce((total, exercise) => 
    total + exercise.sets.filter(set => set.completed).length, 0
  );
  
  const totalSets = exercises.reduce((total, exercise) => 
    total + exercise.sets.length, 0
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const workoutTitle = currentWorkout?.title || (id === "new" ? "New Workout" : "Workout Session");

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
              <CardTitle className="flex items-center justify-between">
                <span>{exercise.name}</span>
                <Badge variant="outline">
                  {exercise.sets.filter(set => set.completed).length}/{exercise.sets.length} sets
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <Card className="border-dashed hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-8 text-center">
            <Button 
              variant="ghost" 
              className="gap-2" 
              size="lg"
              onClick={() => navigate('/dashboard/exercises')}
            >
              <Plus className="h-5 w-5" />
              Add Exercise
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Browse exercise library to add to this workout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Finish Workout */}
      {completedSets === totalSets && totalSets > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Workout Complete! 🎉</h3>
            <p className="text-muted-foreground mb-4">
              Great job! You completed all {totalSets} sets in {formatTime(duration)}.
            </p>
            <Button size="lg" onClick={() => navigate('/progress')}>
              View Progress
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkoutSession;