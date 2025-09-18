import React, { useState, useEffect } from 'react';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Calendar, Clock, Dumbbell, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import NumberStepper from '@/components/ui/number-stepper';
import { useExercises, useCreateWorkoutSession, useWorkoutSessions, useExerciseLogs, useBulkCreateExerciseLogs } from '@/hooks/useWorkoutData';
import { toast } from 'sonner';
import { format } from '@/lib/date-utils';

interface SelectedExercise {
  exercise_id: string;
  name: string;
  muscle_group?: string;
  target_sets: number;
  target_reps: string;
  notes?: string;
  target_weight?: number; // stored in kg
  target_duration_sec?: number; // optional per set duration
}

const WorkoutPlanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editingSessionId = searchParams.get('session') || undefined;
  const { data: sessions = [] } = useWorkoutSessions();
  const { data: existingLogs = [] } = useExerciseLogs(editingSessionId);
  const { data: exercises = [] } = useExercises();
  const createWorkoutMutation = useCreateWorkoutSession();
  const bulkLogsMutation = useBulkCreateExerciseLogs();

  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    notes: '',
  });

  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const { unit } = useUnitPreference();
  const useLbs = unit === 'lbs';

  const addExercise = (exercise: any) => {
    const newExercise: SelectedExercise = {
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      target_sets: 3,
      target_reps: '10',
      notes: '',
      target_weight: 20,
      target_duration_sec: 0
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setExerciseDialogOpen(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof SelectedExercise, value: any) => {
    setSelectedExercises(selectedExercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  useEffect(() => {
    if (editingSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.session_id === editingSessionId);
      if (session) {
        setWorkoutForm({
          title: session.title || '',
            date: session.date,
            time: session.time || format(new Date(), 'HH:mm'),
            notes: session.notes || ''
        });
      }
    }
  }, [editingSessionId, sessions]);

  useEffect(() => {
    if (editingSessionId && existingLogs.length > 0 && selectedExercises.length === 0) {
      const logsGrouped: Record<string, SelectedExercise> = {};
      existingLogs.forEach(log => {
        const reps = log.reps_per_set ? log.reps_per_set.split(',') : [];
        const weights = log.weight_per_set ? log.weight_per_set.split(',') : [];
        logsGrouped[log.exercise_id] = {
          exercise_id: log.exercise_id,
          name: log.exercise?.name || 'Exercise',
          muscle_group: log.exercise?.muscle_group,
          target_sets: log.sets || reps.length || weights.length || 3,
          target_reps: reps.length > 0 ? reps.join('-') : '8-12',
          notes: log.notes || ''
        };
      });
      setSelectedExercises(Object.values(logsGrouped));
    }
  }, [editingSessionId, existingLogs, selectedExercises.length]);

  const handleSave = async () => {
    if (!workoutForm.title) {
      toast.error('Please enter a workout title');
      return;
    }

    try {
      if (editingSessionId) {
        // Just store planned exercises to localStorage for pickup by session editing flow
        if (selectedExercises.length > 0) {
          localStorage.setItem(`planned-exercises-${editingSessionId}`, JSON.stringify(selectedExercises));
        }
        toast.success('Workout plan updated');
        navigate(`/dashboard/workout/${editingSessionId}`);
        return;
      }

      const result: any = await createWorkoutMutation.mutateAsync({
          title: workoutForm.title,
          date: workoutForm.date,
          time: workoutForm.time,
          status: 'Planned',
          notes: workoutForm.notes,
          duration_minutes: 0
        });

      if (result?.session_id) {
        if (selectedExercises.length > 0) {
          const logsPayload = selectedExercises.map(ex => {
            const repsExpanded = ex.target_reps.includes('-') ? (() => {
              // Range pattern like 8-12 -> replicate approximate mid value
              const parts = ex.target_reps.split('-').map(p => parseInt(p));
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const mid = Math.round((parts[0] + parts[1]) / 2);
                return new Array(ex.target_sets).fill(mid).join(',');
              }
              return new Array(ex.target_sets).fill(10).join(',');
            })() : new Array(ex.target_sets).fill(parseInt(ex.target_reps) || 10).join(',');
            const weights = new Array(ex.target_sets).fill(ex.target_weight || 0).join(',');
            return {
              session_id: result.session_id,
              exercise_id: ex.exercise_id,
              sets: ex.target_sets,
              reps_per_set: repsExpanded,
              weight_per_set: weights,
              duration_seconds: ex.target_duration_sec ? ex.target_duration_sec * ex.target_sets : undefined,
              notes: ex.notes || ''
            };
          });
          await bulkLogsMutation.mutateAsync(logsPayload as any);
        }
        toast.success('Workout planned successfully!');
        navigate(`/dashboard/workout/${result.session_id}`);
      }
    } catch (error) {
      toast.error('Failed to create workout');
    }
  };

  const filteredExercises = exercises.filter(ex => 
    !selectedExercises.some(sel => sel.exercise_id === ex.exercise_id)
  );

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{editingSessionId ? 'Edit Workout Plan' : 'Plan New Workout'}</h1>
            <p className="text-muted-foreground">{editingSessionId ? 'Update structure and details' : 'Design your workout session'}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={createWorkoutMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {editingSessionId ? 'Save Changes' : 'Save & Start'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workout Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Workout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Workout Title</Label>
                <Input
                  id="title"
                  value={workoutForm.title}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Upper Body Strength, Morning Cardio..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={workoutForm.date}
                    onChange={(e) => setWorkoutForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={workoutForm.time}
                    onChange={(e) => setWorkoutForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add any notes about this workout..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exercise Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Exercises ({selectedExercises.length})
                </span>
                <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exercise
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Select Exercise</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      {filteredExercises.map((exercise) => (
                        <Card 
                          key={exercise.exercise_id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addExercise(exercise)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="font-medium">{exercise.name}</div>
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
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Unit toggle removed (global setting in Settings page) */}
              <div className="space-y-4">
                {selectedExercises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises added yet</p>
                    <p className="text-sm">Click "Add Exercise" to get started</p>
                  </div>
                ) : (
                  selectedExercises.map((exercise, index) => (
                    <Card key={exercise.exercise_id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{exercise.name}</h4>
                          {exercise.muscle_group && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {exercise.muscle_group}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => removeExercise(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm">Sets</Label>
                          <NumberStepper
                            value={exercise.target_sets}
                            onChange={(v) => updateExercise(index, 'target_sets', v)}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Weight</Label>
                          <NumberStepper
                            value={useLbs ? Math.round((exercise.target_weight||0)*2.20462) : (exercise.target_weight||0)}
                            onChange={(v) => updateExercise(index, 'target_weight', useLbs ? Math.round(v/2.20462) : v)}
                            min={0}
                            max={useLbs ? 400 : 180}
                            step={useLbs ? 5 : 2}
                            unit={useLbs ? 'lbs' : 'kg'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-2">Time/Set
                            <Switch
                              checked={(exercise.target_duration_sec || 0) > 0}
                              onCheckedChange={(checked) => updateExercise(index, 'target_duration_sec', checked ? (exercise.target_duration_sec || 30) : 0)}
                            />
                          </Label>
                          <NumberStepper
                            value={exercise.target_duration_sec || 0}
                            onChange={(v) => updateExercise(index, 'target_duration_sec', v)}
                            min={0}
                            max={300}
                            step={5}
                            unit="sec"
                            disabled={(exercise.target_duration_sec || 0) === 0}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 mt-4">
                        <Label className="text-sm">Reps per set</Label>
                        <NumberStepper
                          value={parseInt(exercise.target_reps || '0') || 10}
                          onChange={(v) => updateExercise(index, 'target_reps', String(Math.max(0, v || 0)))}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                      
                      <div className="grid gap-2 mt-4">
                        <Label className="text-sm">Exercise Notes</Label>
                        <Input
                          value={exercise.notes || ''}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Form cues, weight progression..."
                        />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workout Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exercises:</span>
                  <span className="font-medium">{selectedExercises.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sets:</span>
                  <span className="font-medium">
                    {selectedExercises.reduce((sum, ex) => sum + ex.target_sets, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Muscle Groups:</span>
                  <span className="font-medium">
                    {new Set(selectedExercises.map(ex => ex.muscle_group).filter(Boolean)).size}
                  </span>
                </div>
              </div>
              
              {selectedExercises.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Exercise List:</h4>
                  <div className="space-y-1">
                    {selectedExercises.map((ex, i) => (
                      <div key={i} className="text-sm text-muted-foreground">
                        {ex.target_sets} sets × {ex.target_reps} reps @ {useLbs ? Math.round((ex.target_weight||0)*2.20462) : ex.target_weight || 0} {useLbs ? 'lbs' : 'kg'}
                        <div className="font-medium text-xs">{ex.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanner;