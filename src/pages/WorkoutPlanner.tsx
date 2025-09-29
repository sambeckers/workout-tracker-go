import React, { useState, useEffect, useMemo } from 'react';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Calendar, Clock, Dumbbell, Save, Search, Star, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import NumberStepper from '@/components/ui/number-stepper';
import { UnitToggle } from '@/components/ui/unit-toggle';
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
  target_distance_km?: number; // for distance-based exercises
  duration_unit?: 'sec' | 'min' | 'hr';
  distance_unit?: 'm' | 'km';
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
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>([]);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  // Holds selections within the dialog before user confirms adding them
  const [pendingSelection, setPendingSelection] = useState<any[]>([]);
  const { unit } = useUnitPreference();
  const useLbs = unit === 'lbs';

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem('favorite-exercises') || '[]');
      if (Array.isArray(fav)) setFavoriteExercises(fav);
      const rec = JSON.parse(localStorage.getItem('recent-exercises') || '[]');
      if (Array.isArray(rec)) setRecentExercises(rec);
    } catch {}
  }, []);

  // Unique muscle groups for filter (supports multi-group entries)
  const uniqueMuscleGroups = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach(ex => {
      if (ex.muscle_group) {
        ex.muscle_group.split(',').map(g => g.trim()).filter(Boolean).forEach(g => set.add(g));
      }
    });
    return Array.from(set).sort();
  }, [exercises]);

  const addExercise = (exercise: any) => {
    // legacy single add (still used elsewhere); wrap into pendingSelection then confirm
    if (!pendingSelection.some(e => e.exercise_id === exercise.exercise_id)) {
      setPendingSelection(prev => [...prev, exercise]);
    } else {
      // toggle off if already present
      setPendingSelection(prev => prev.filter(e => e.exercise_id !== exercise.exercise_id));
    }
  };

  const confirmAddSelectedExercises = () => {
    if (pendingSelection.length === 0) {
      setExerciseDialogOpen(false);
      return;
    }
    const newlyAdded: SelectedExercise[] = pendingSelection.map(exercise => ({
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      target_sets: 3,
      target_reps: '10',
      notes: '',
      target_weight: 20,
      target_duration_sec: 0,
      duration_unit: 'min' as const,
      distance_unit: 'km' as const
    }));
    const combined = [...selectedExercises, ...newlyAdded.filter(ne => !selectedExercises.some(se => se.exercise_id === ne.exercise_id))];
    setSelectedExercises(combined);
    // record recents
    try {
      const next = [
        ...newlyAdded.map(e => e.exercise_id),
        ...recentExercises.filter(id => !newlyAdded.some(e => e.exercise_id === id))
      ].slice(0, 10);
      setRecentExercises(next);
      localStorage.setItem('recent-exercises', JSON.stringify(next));
    } catch {}
    setPendingSelection([]);
    setExerciseDialogOpen(false);
  };

  const clearPendingSelection = () => setPendingSelection([]);

  const toggleFavoriteExercise = (exerciseId: string) => {
    setFavoriteExercises(prev => {
      const exists = prev.includes(exerciseId);
      const next = exists ? prev.filter(id => id !== exerciseId) : [exerciseId, ...prev];
      try { localStorage.setItem('favorite-exercises', JSON.stringify(next)); } catch {}
      return next;
    });
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
            const base: any = {
              session_id: result.session_id,
              exercise_id: ex.exercise_id,
              notes: ex.notes || ''
            };
            // Determine if exercise is time-based (no reps/weight metrics) by checking underlying exercise data
            const exerciseData = exercises.find(e => e.exercise_id === ex.exercise_id) as any;
            const metric_time = exerciseData?.metric_time || false;
            const metric_reps = exerciseData?.metric_reps !== false; // default true
            const metric_weight = exerciseData?.metric_weight !== false; // default true
            const metric_distance = exerciseData?.metric_distance || false;

            if(metric_time){
              // Store as canonical seconds in database
              let seconds = ex.target_duration_sec || 60;
              if(ex.duration_unit==='min') seconds = seconds * 60;
              else if(ex.duration_unit==='hr') seconds = seconds * 3600;
              base.duration_seconds = seconds;
              if(metric_distance && (ex.target_distance_km!=null && ex.target_distance_km > 0)){
                // Store as canonical km in database
                let km = ex.target_distance_km;
                if(ex.distance_unit==='m') km = km / 1000;
                base.distance_km = km;
              }
              // For purely time-based, we don't set sets/reps/weight
            } else {
              base.sets = ex.target_sets;
              if(metric_reps) base.reps_per_set = repsExpanded;
              if(metric_weight) base.weight_per_set = weights;
              // If distance metric present alongside sets (rare hybrid), we don't log distance until performed
            }
            return base;
          });
          await bulkLogsMutation.mutateAsync(logsPayload as any);
          try { localStorage.setItem(`planned-exercises-${result.session_id}`, JSON.stringify(selectedExercises)); } catch {}
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
          {editingSessionId ? 'Save Changes' : 'Save'}
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
                <Dialog
                  open={exerciseDialogOpen}
                  onOpenChange={(open) => {
                    setExerciseDialogOpen(open);
                    if (open) {
                      // initialize pending with currently non-selected state
                      setPendingSelection([]);
                    } else {
                      setPendingSelection([]);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exercise
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Select Exercises
                        {pendingSelection.length > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">({pendingSelection.length} selected)</span>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                      <div className="relative flex-1">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search exercises..."
                          value={exerciseSearch}
                          onChange={(e) => setExerciseSearch(e.target.value)}
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
                    <div className="border rounded-md h-[360px] overflow-auto p-2 space-y-2 bg-muted/40">
                      {(() => {
                        const q = exerciseSearch.trim().toLowerCase();
                        const base = q.length === 0 ? filteredExercises : filteredExercises.filter(ex => {
                          const hay = [ex.name, ex.muscle_group, ex.difficulty, ex.description]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();
                          return hay.includes(q);
                        });
                        const list = base.filter(ex => {
                          if (muscleFilter === 'all') return true;
                          const groups = (ex.muscle_group || '').toLowerCase().split(',').map(g => g.trim());
                          return groups.includes(muscleFilter.toLowerCase());
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
                            <div className="text-sm text-muted-foreground p-4">No exercises match your search.</div>
                          );
                        }
                        return list.map((exercise) => {
                          const isPending = pendingSelection.some(e => e.exercise_id === exercise.exercise_id);
                          return (
                            <button
                              type="button"
                              key={exercise.exercise_id}
                              onClick={() => addExercise(exercise)}
                              className={`w-full text-left p-3 rounded-md border flex flex-col gap-1 transition-smooth bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring relative ${isPending ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
                            >
                              {isPending && (
                                <span className="absolute top-2 right-2 text-primary text-xs font-medium">Selected</span>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{exercise.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`p-1 h-6 w-6 ${favoriteExercises.includes(exercise.exercise_id) ? 'text-yellow-500' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); toggleFavoriteExercise(exercise.exercise_id); }}
                                  title={favoriteExercises.includes(exercise.exercise_id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Star className={`h-3 w-3 ${favoriteExercises.includes(exercise.exercise_id) ? 'fill-yellow-400' : ''}`} />
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {exercise.muscle_group && (
                                  <div className="flex flex-wrap gap-1">
                                    {exercise.muscle_group.split(',').map(g => (
                                      <Badge key={g.trim()} variant="secondary" className="text-[10px] px-1 py-0">{g.trim()}</Badge>
                                    ))}
                                  </div>
                                )}
                                {exercise.difficulty && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">{exercise.difficulty}</Badge>
                                )}
                                {favoriteExercises.includes(exercise.exercise_id) && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">Favorite</Badge>
                                )}
                                {recentExercises.includes(exercise.exercise_id) && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Recent</Badge>
                                )}
                              </div>
                              {exercise.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                      <div className="text-xs text-muted-foreground">
                        {pendingSelection.length === 0 ? 'No exercises selected yet' : `${pendingSelection.length} exercise${pendingSelection.length>1?'s':''} ready to add`}
                      </div>
                      <div className="flex gap-2">
                        {pendingSelection.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearPendingSelection}>Clear</Button>
                        )}
                        <Button size="sm" onClick={confirmAddSelectedExercises} disabled={pendingSelection.length===0}>
                          <Check className="h-4 w-4 mr-1" /> Add Selected
                        </Button>
                      </div>
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
                      
                      {(() => {
                        // Find the exercise data to get metric settings
                        const exerciseData = exercises.find(ex => ex.exercise_id === exercise.exercise_id);
                        const showReps = exerciseData?.metric_reps !== false; // default true
                        const showWeight = exerciseData?.metric_weight !== false; // default true  
                        const showTime = exerciseData?.metric_time === true;
                        const showDistance = exerciseData?.metric_distance === true;
                        
                         return (
                           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                             {/* Always show sets for weight/rep exercises */}
                             {(showReps || showWeight) && (
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
                             )}
                             {showReps && (
                               <div className="space-y-2">
                                 <Label className="text-sm">Reps per set</Label>
                                 <Input
                                   value={exercise.target_reps}
                                   onChange={(e) => updateExercise(index, 'target_reps', e.target.value)}
                                   placeholder="10 or 8-12"
                                 />
                               </div>
                             )}
                             {showWeight && (
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
                             )}
                              {showTime && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Duration</Label>
                                  <div className="flex items-center gap-2">
                                    <NumberStepper
                                      value={exercise.target_duration_sec || 60}
                                      onChange={(v) => updateExercise(index, 'target_duration_sec', v)}
                                      min={1}
                                      max={exercise.duration_unit === 'hr' ? 24 : exercise.duration_unit === 'min' ? 120 : 3600}
                                      step={exercise.duration_unit === 'hr' ? 0.5 : exercise.duration_unit === 'min' ? 1 : 5}
                                      unit=""
                                    />
                                    <UnitToggle
                                      units={['sec', 'min', 'hr']}
                                      value={exercise.duration_unit || 'min'}
                                      onChange={(unit) => updateExercise(index, 'duration_unit', unit)}
                                    />
                                  </div>
                                </div>
                              )}
                              {showDistance && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Distance</Label>
                                  <div className="flex items-center gap-2">
                                    <NumberStepper
                                      value={exercise.target_distance_km || 0}
                                      onChange={(v) => updateExercise(index, 'target_distance_km', v)}
                                      min={0}
                                      max={exercise.distance_unit === 'm' ? 50000 : 50}
                                      step={exercise.distance_unit === 'm' ? 100 : 0.1}
                                      unit=""
                                    />
                                    <UnitToggle
                                      units={['m', 'km']}
                                      value={exercise.distance_unit || 'km'}
                                      onChange={(unit) => updateExercise(index, 'distance_unit', unit)}
                                    />
                                  </div>
                                </div>
                              )}
                           </div>
                         );
                       })()}
                       
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