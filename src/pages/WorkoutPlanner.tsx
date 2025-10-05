import React, { useState, useEffect, useMemo } from 'react';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Calendar, Clock, Dumbbell, Save, Search, Star, Check, PanelRightOpen, BarChart2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import NumberStepper from '@/components/ui/number-stepper';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useExercises, useCreateWorkoutSession, useWorkoutSessions, useExerciseLogs, useBulkCreateExerciseLogs, useWorkoutTemplates, useRegisterTemplateUse, scoreTemplates } from '@/hooks/useWorkoutData';
import { toast } from 'sonner';
import { format } from '@/lib/date-utils';
import { useDraftWorkout } from '@/hooks/useDraftWorkout';
import { ExerciseProgressChart } from '@/components/progress/ExerciseProgressChart';
import { convertKgToUnit, convertUnitToKg } from '@/lib/units';
import { supabase } from '@/integrations/supabase/client';
import { classifyExercise, deriveProgressiveDefaults } from '@/lib/metrics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  suggestion?: string; // progressive suggestion text
}

const WorkoutPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editingSessionId = searchParams.get('session') || undefined;
  const { data: sessions = [] } = useWorkoutSessions();
  const { data: existingLogs = [] } = useExerciseLogs(editingSessionId);
  const { data: exercises = [] } = useExercises();
  const createWorkoutMutation = useCreateWorkoutSession();
  const bulkLogsMutation = useBulkCreateExerciseLogs();
  const { data: templates = [] } = useWorkoutTemplates();
  const registerTemplateUse = useRegisterTemplateUse();

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
  const { saveDraft, loadDraft, clearDraft } = useDraftWorkout();
  const [progressExercise, setProgressExercise] = useState<{id:string; name:string; metrics?:any}|null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  // Template apply dialog state
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('append');
  const [templateSearch, setTemplateSearch] = useState('');
  const [applyingTemplateId, setApplyingTemplateId] = useState<string|null>(null);
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<string|undefined>(()=>{
    try { return localStorage.getItem('planner.lastTemplate')||undefined; } catch { return undefined; }
  });

  const recommendedTemplates = useMemo(()=> scoreTemplates(templates).slice(0,4), [templates]);
  const filteredTemplates = useMemo(()=>{
    const q = templateSearch.trim().toLowerCase();
    if(!q) return templates;
    return templates.filter(t => t.template_name.toLowerCase().includes(q));
  }, [templates, templateSearch]);

  // Restore last progress exercise
  useEffect(()=>{
    try {
      const lastId = localStorage.getItem('planner.progress.exercise');
      const lastOpen = localStorage.getItem('planner.progress.open') === '1';
      if (lastId && lastOpen) {
        const ex = selectedExercises.find(e => e.exercise_id === lastId);
        if (ex) {
          const exerciseData = exercises.find(ed => ed.exercise_id === ex.exercise_id);
            setProgressExercise({ id: ex.exercise_id, name: ex.name, metrics: exerciseData });
            setProgressOpen(true);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises.length]);

  // Persist state
  useEffect(()=>{
    try {
      if (progressExercise) {
        localStorage.setItem('planner.progress.exercise', progressExercise.id);
        localStorage.setItem('planner.progress.open', progressOpen ? '1':'0');
      } else {
        localStorage.removeItem('planner.progress.exercise');
        localStorage.setItem('planner.progress.open', '0');
      }
    } catch {}
  }, [progressExercise, progressOpen]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key === 'p') {
        if (progressExercise) {
          setProgressOpen(o=>!o);
        } else if (selectedExercises.length>0) {
          const ex = selectedExercises[0];
          const exerciseData = exercises.find(ed => ed.exercise_id === ex.exercise_id);
          setProgressExercise({ id: ex.exercise_id, name: ex.name, metrics: exerciseData });
          setProgressOpen(true);
        }
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && progressExercise) {
        e.preventDefault();
        const idx = selectedExercises.findIndex(se => se.exercise_id === progressExercise.id);
        if (idx !== -1) {
          const nextIdx = e.key === 'ArrowDown' ? (idx + 1) % selectedExercises.length : (idx - 1 + selectedExercises.length) % selectedExercises.length;
          const ex = selectedExercises[nextIdx];
          const exerciseData = exercises.find(ed => ed.exercise_id === ex.exercise_id);
          setProgressExercise({ id: ex.exercise_id, name: ex.name, metrics: exerciseData });
          setProgressOpen(true);
        }
      } else if (e.key === 'Escape' && progressOpen) {
        setProgressOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [progressExercise, progressOpen, selectedExercises, exercises]);

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem('favorite-exercises') || '[]');
      if (Array.isArray(fav)) setFavoriteExercises(fav);
      const rec = JSON.parse(localStorage.getItem('recent-exercises') || '[]');
      if (Array.isArray(rec)) setRecentExercises(rec);
    } catch {}
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      // Only restore if matches current editing context or is new
      const isMatchingContext = (!editingSessionId && !draft.editingSessionId) || 
                                (editingSessionId && draft.editingSessionId === editingSessionId);
      
      if (isMatchingContext) {
        setWorkoutForm(draft.workoutForm);
        setSelectedExercises(draft.selectedExercises);
        toast.info('Draft restored');
      }
    }
  }, [loadDraft, editingSessionId]);

  // Auto-save draft when form or exercises change
  useEffect(() => {
    // Don't save if completely empty
    if (!workoutForm.title && selectedExercises.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveDraft({
        workoutForm,
        selectedExercises,
        timestamp: Date.now(),
        editingSessionId
      });
    }, 1000); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [workoutForm, selectedExercises, editingSessionId, saveDraft]);

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

  const confirmAddSelectedExercises = async () => {
    if (pendingSelection.length === 0) {
      setExerciseDialogOpen(false);
      return;
    }

    const newlyAdded: SelectedExercise[] = await Promise.all(
      pendingSelection.map(async (exercise) => {
        // Base defaults depending on classification
        const profile = classifyExercise(exercise);
        let lastLog: any = null;
        try {
          if (user?.id) {
            const { data } = await supabase
              .from('exercise_logs')
              .select(`*, session:workout_sessions!inner(user_id,status,date)`)
              .eq('exercise_id', exercise.exercise_id)
              .eq('session.user_id', user.id)
              .eq('session.status', 'Done')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (data) lastLog = data;
          }
        } catch (e) {
          console.error('Prefill last log error', e);
        }
        const progressive = deriveProgressiveDefaults(profile, lastLog);

        const base: SelectedExercise = {
          exercise_id: exercise.exercise_id,
          name: exercise.name,
          muscle_group: exercise.muscle_group,
          notes: '',
          target_sets: progressive.target_sets ?? 3,
          target_reps: progressive.target_reps ?? '10',
          target_weight: progressive.target_weight,
          target_duration_sec: progressive.target_duration_sec ? Math.round(progressive.target_duration_sec / 60) : undefined,
          target_distance_km: progressive.target_distance_km,
          duration_unit: 'min',
          distance_unit: 'km',
          suggestion: progressive.suggestion
        };

        // Remove irrelevant strength fields for pure cardio / duration types to avoid confusion in summary
        if (profile.type === 'cardio' || profile.type === 'duration') {
          base.target_sets = base.target_sets || 0; // not displayed if 0 later, can adjust
          base.target_reps = profile.type === 'cardio' ? (base.target_reps || '0') : base.target_reps || '0';
          // weight not relevant
          delete (base as any).target_weight;
        } else if (profile.type === 'bodyweight') {
          // weight irrelevant
          delete (base as any).target_weight;
        }
        // Suggestion (stretch) is currently unused in UI; could surface later
        return base;
      })
    );

    const combined = [
      ...selectedExercises,
      ...newlyAdded.filter(ne => !selectedExercises.some(se => se.exercise_id === ne.exercise_id))
    ];
    setSelectedExercises(combined);
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

  // Apply a workout template to planner (replace or append)
  const applyTemplate = async (template_id: string, opts?: { silent?: boolean }) => {
    const tpl = templates.find(t => t.template_id === template_id);
    if(!tpl) return;
    if(!tpl.exercises || tpl.exercises.length === 0){
      toast.error('Template has no exercises');
      return;
    }
    try {
      setApplyingTemplateId(template_id);
      // Map template exercises to SelectedExercise with progressive defaults
      const mapped: SelectedExercise[] = [];
      for(const tex of tpl.exercises){
        const exerciseMeta: any = exercises.find(e => e.exercise_id === tex.exercise_id);
        if(!exerciseMeta) continue; // skip missing
        const profile = classifyExercise(exerciseMeta);
        let lastLog: any = null;
        try {
          if (user?.id) {
            const { data } = await supabase
              .from('exercise_logs')
              .select(`*, session:workout_sessions!inner(user_id,status,date)`) as any;
            // minimal targeted query (filtering server-side in new call to reduce payload)
            const { data: last } = await supabase
              .from('exercise_logs')
              .select(`*, session:workout_sessions!inner(user_id,status,date)`) // join for user scope
              .eq('exercise_id', tex.exercise_id)
              .eq('session.user_id', user.id)
              .eq('session.status', 'Done')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if(last) lastLog = last;
          }
        } catch(e){/* silent */}
        const progressive = deriveProgressiveDefaults(profile, lastLog);
        const base: SelectedExercise = {
          exercise_id: exerciseMeta.exercise_id,
          name: exerciseMeta.name,
          muscle_group: exerciseMeta.muscle_group,
          notes: '',
          target_sets: progressive.target_sets ?? 3,
          target_reps: progressive.target_reps ?? '10',
          target_weight: progressive.target_weight,
          target_duration_sec: progressive.target_duration_sec ? Math.round(progressive.target_duration_sec/60) : undefined,
          target_distance_km: progressive.target_distance_km,
          duration_unit: 'min',
          distance_unit: 'km',
          suggestion: progressive.suggestion
        };
        if (profile.type === 'cardio' || profile.type === 'duration') {
          base.target_sets = base.target_sets || 0;
          base.target_reps = profile.type === 'cardio' ? (base.target_reps || '0') : base.target_reps || '0';
          delete (base as any).target_weight;
        } else if (profile.type === 'bodyweight') {
          delete (base as any).target_weight;
        }
        mapped.push(base);
      }
      if(mapped.length === 0){
        toast.error('No valid exercises to apply');
        return;
      }
      let previous: SelectedExercise[] = [];
      setSelectedExercises(prev => {
        previous = prev;
        const merged = applyMode === 'replace' ? [] : [...prev];
        mapped.forEach(m => {
          if(!merged.some(e => e.exercise_id === m.exercise_id)) merged.push(m);
        });
        return merged;
      });
      registerTemplateUse.mutate(template_id);
      setApplyTemplateOpen(false);
      setLastAppliedTemplate(template_id);
      try { localStorage.setItem('planner.lastTemplate', template_id); } catch {}
      if(!opts?.silent){
        toast.success(`Applied ${tpl.template_name}`, {
          action: {
            label: 'Undo',
            onClick: () => {
              setSelectedExercises(previous);
              toast.message('Template application undone');
            }
          }
        });
      }
    } catch(e){
      console.error('Apply template error', e);
      toast.error('Failed to apply template');
    } finally {
      setApplyingTemplateId(null);
    }
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
      // Clear draft on successful save
      clearDraft();

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
              base.duration_unit = ex.duration_unit || 'min'; // Save the unit preference
              
              if(metric_distance && (ex.target_distance_km!=null && ex.target_distance_km > 0)){
                // Store as canonical km in database
                let km = ex.target_distance_km;
                if(ex.distance_unit==='m') km = km / 1000;
                base.distance_km = km;
                base.distance_unit = ex.distance_unit || 'km'; // Save the unit preference
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
      // Don't clear draft on error, allow user to try again
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
                <div className="flex items-center gap-2">
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
                {/* Apply Template Dialog */}
                <Dialog open={applyTemplateOpen} onOpenChange={(o)=>{ setApplyTemplateOpen(o); if(o){ setTemplateSearch(''); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2" title="Add exercises from a template">
                      <Plus className="h-4 w-4" />From Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[650px] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center justify-between w-full">
                      <span>Apply Template</span>
                      {lastAppliedTemplate && templates.some(t=>t.template_id===lastAppliedTemplate) && (
                        <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={()=>applyTemplate(lastAppliedTemplate!, { silent: true })} title="Quick re-apply last template">Quick Apply</Button>
                      )}
                    </DialogTitle></DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium">Mode</label>
                        <Select value={applyMode} onValueChange={(v:any)=>setApplyMode(v)}>
                          <SelectTrigger className="w-[160px]" aria-label="Apply mode"><SelectValue placeholder="Mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="replace">Replace Current</SelectItem>
                            <SelectItem value="append">Append</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex-1 relative">
                          <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input value={templateSearch} onChange={e=>setTemplateSearch(e.target.value)} placeholder="Search templates..." className="pl-6 h-8 text-xs" />
                        </div>
                      </div>
                      {recommendedTemplates.length>0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Recommended</div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {recommendedTemplates.map(r=> (
                              <Card key={r.template.template_id} className={`cursor-pointer hover:shadow-md transition-shadow ${applyingTemplateId===r.template.template_id?'opacity-60 pointer-events-none':''}`}
                                onClick={()=>applyTemplate(r.template.template_id)}
                                onDoubleClick={()=>applyTemplate(r.template.template_id)}
                              >
                                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between gap-2"><span className="truncate flex-1" title={r.template.template_name}>{r.template.template_name}</span><Badge variant="outline" className="text-[10px]">{applyingTemplateId===r.template.template_id?'Applying...':r.reason}</Badge></CardTitle></CardHeader>
                                <CardContent className="text-[11px] text-muted-foreground flex justify-between"><span>{(r.template.exercises||[]).length} exercises</span><span>Uses {r.template.use_count}</span></CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">All Templates</div>
                        {filteredTemplates.length? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {filteredTemplates.map(t => (
                              <Card key={t.template_id} className={`cursor-pointer hover:shadow-md transition-shadow ${applyingTemplateId===t.template_id?'opacity-60 pointer-events-none':''}`}
                                onClick={()=>applyTemplate(t.template_id)}
                                onDoubleClick={()=>applyTemplate(t.template_id)}
                              >
                                <CardHeader className="pb-2"><CardTitle className="text-sm truncate flex items-center justify-between gap-2" title={t.template_name}><span className="truncate flex-1">{t.template_name}</span>{applyingTemplateId===t.template_id && <Badge variant="outline" className="text-[10px]">Applying...</Badge>}</CardTitle></CardHeader>
                                <CardContent className="text-[11px] text-muted-foreground flex justify-between"><span>{(t.exercises||[]).length} exercises</span>{t.last_used && <span>Used {new Date(t.last_used).toLocaleDateString()}</span>}</CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : <div className="text-xs text-muted-foreground py-6">{templates.length? 'No templates match your search.' : 'No templates yet. Create one from a completed session.'}</div>}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
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
                    <Card key={exercise.exercise_id} className={`p-4 ${progressExercise?.id===exercise.exercise_id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            {exercise.name}
                            <Button
                              type="button"
                              variant={progressExercise?.id===exercise.exercise_id? 'default':'outline'}
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                const exerciseData = exercises.find(ex => ex.exercise_id === exercise.exercise_id);
                                setProgressExercise({ id: exercise.exercise_id, name: exercise.name, metrics: exerciseData });
                                setProgressOpen(true);
                              }}
                              aria-label="Open progress split view"
                            >
                              <BarChart2 className="h-3 w-3" />
                              Prog
                            </Button>
                          </h4>
                          {exercise.muscle_group && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {exercise.muscle_group}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => removeExercise(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* existing exercise config UI ... */}
                      {(() => {
                        const exerciseData = exercises.find(ex => ex.exercise_id === exercise.exercise_id);
                        const showReps = exerciseData?.metric_reps !== false; // default true
                        const showWeight = exerciseData?.metric_weight !== false; // default true  
                        const showTime = exerciseData?.metric_time === true;
                        const showDistance = exerciseData?.metric_distance === true;
                        return (
                          <> {/* unchanged sections below */}
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
                                 <NumberStepper
                                   value={parseInt(exercise.target_reps) || 10}
                                   onChange={(v) => updateExercise(index, 'target_reps', String(v))}
                                   min={1}
                                   max={50}
                                   step={1}
                                   unit=""
                                 />
                               </div>
                             )}
                             {showWeight && (
                               <div className="space-y-2">
                                 <Label className="text-sm">Weight</Label>
                                 <NumberStepper
                                   value={useLbs ? Math.round((exercise.target_weight||0)*2.20462*2)/2 : (exercise.target_weight||0)}
                                   onChange={(v) => updateExercise(index, 'target_weight', useLbs ? Math.round(v/2.20462*2)/2 : v)}
                                   min={0}
                                   max={useLbs ? 1000 : 500}
                                   step={useLbs ? 0.5 : 0.5}
                                   buttonStep={useLbs ? 5 : 5}
                                   unit={useLbs ? 'lbs' : 'kg'}
                                 />
                               </div>
                             )}
                              {showTime && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Duration</Label>
                                  <div className="flex flex-col gap-2">
                                    <NumberStepper
                                      value={exercise.target_duration_sec || 60}
                                      onChange={(v) => updateExercise(index, 'target_duration_sec', v)}
                                      min={1}
                                      max={exercise.duration_unit === 'hr' ? 24 : exercise.duration_unit === 'min' ? 120 : 3600}
                                      step={exercise.duration_unit === 'hr' ? 0.25 : exercise.duration_unit === 'min' ? 0.5 : 5}
                                      buttonStep={exercise.duration_unit === 'hr' ? 1 : exercise.duration_unit === 'min' ? 5 : 30}
                                      unit=""
                                    />
                                    <div className="flex justify-start">
                                      <UnitToggle
                                        units={['sec', 'min', 'hr']}
                                        value={exercise.duration_unit || 'min'}
                                        onChange={(unit) => updateExercise(index, 'duration_unit', unit)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {showDistance && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Distance</Label>
                                  <div className="flex flex-col gap-2">
                                    <NumberStepper
                                      value={exercise.target_distance_km || 0}
                                      onChange={(v) => updateExercise(index, 'target_distance_km', v)}
                                      min={0}
                                      max={exercise.distance_unit === 'm' ? 100000 : 200}
                                      step={exercise.distance_unit === 'm' ? 10 : 0.5}
                                      buttonStep={exercise.distance_unit === 'm' ? 100 : 5}
                                      unit=""
                                    />
                                    <div className="flex justify-start">
                                      <UnitToggle
                                        units={['m', 'km']}
                                        value={exercise.distance_unit || 'km'}
                                        onChange={(unit) => updateExercise(index, 'distance_unit', unit)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                           </div>
                           
                           <div className="grid gap-2 mt-4">
                             <Label className="text-sm">Exercise Notes</Label>
                             <Input
                               value={exercise.notes || ''}
                               onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                               placeholder="Form cues, weight progression..."
                             />
                             {exercise.suggestion && (
                               <p className="text-xs text-muted-foreground mt-1">Suggestion: {exercise.suggestion}</p>
                             )}
                           </div>
                        </>
                        );
                      })()}
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
                    {selectedExercises.map((ex, i) => {
                      const exerciseData = exercises.find(e => e.exercise_id === ex.exercise_id);
                      const weightEnabled = exerciseData?.metric_weight;
                      const repsEnabled = exerciseData?.metric_reps;
                      const timeEnabled = exerciseData?.metric_time;
                      const distanceEnabled = exerciseData?.metric_distance;

                      let line = '';
                      if ((weightEnabled || repsEnabled) && !timeEnabled && !distanceEnabled) {
                        line = `${ex.target_sets} x ${ex.target_reps}${weightEnabled ? ` @ ${useLbs ? Math.round((ex.target_weight||0)*2.20462) : ex.target_weight || 0} ${useLbs ? 'lbs' : 'kg'}` : ''}`;
                      } else if (distanceEnabled && timeEnabled) {
                        // cardio combined
                        if (ex.target_distance_km && ex.target_duration_sec) {
                          const mins = ex.target_duration_sec / 60;
                          const pace = ex.target_distance_km > 0 ? mins / ex.target_distance_km : 0;
                          const paceMin = Math.floor(pace);
                          const paceSec = Math.round((pace - paceMin) * 60).toString().padStart(2,'0');
                          line = `${ex.target_distance_km} km in ${Math.round(mins)} min (pace ${paceMin}:${paceSec}/km)`;
                        } else if (ex.target_distance_km) {
                          line = `${ex.target_distance_km} km`;
                        } else if (ex.target_duration_sec) {
                          line = `${Math.round(ex.target_duration_sec/60)} min`; 
                        }
                      } else if (timeEnabled && !distanceEnabled) {
                        if (ex.target_duration_sec) {
                          line = `${ex.target_duration_sec < 600 ? ex.target_duration_sec + 's' : Math.round(ex.target_duration_sec/60)+' min'}`;
                        }
                      } else if (!weightEnabled && repsEnabled && !timeEnabled && !distanceEnabled) {
                        line = `${ex.target_sets} x ${ex.target_reps}`;
                      } else {
                        line = `${ex.target_sets} sets`;
                      }
                      return (
                        <div key={i} className="text-sm text-muted-foreground">
                          {line}
                          <div className="font-medium text-xs">{ex.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {progressExercise && (
        isDesktop ? (
          <div className="fixed top-0 right-0 h-full w-full lg:w-[38%] xl:w-[34%] 2xl:w-[30%] bg-background border-l shadow-lg overflow-y-auto z-30 p-4 hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><BarChart2 className="h-4 w-4" /> {progressExercise.name} Progress</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={selectedExercises.length<=1} onClick={()=>{
                  if(!progressExercise) return; const idx = selectedExercises.findIndex(se=>se.exercise_id===progressExercise.id); if(idx>-1){ const prev = selectedExercises[(idx-1+selectedExercises.length)%selectedExercises.length]; const data = exercises.find(ed=>ed.exercise_id===prev.exercise_id); setProgressExercise({id:prev.exercise_id,name:prev.name,metrics:data}); }
                }}>Prev</Button>
                <Button variant="outline" size="sm" disabled={selectedExercises.length<=1} onClick={()=>{
                  if(!progressExercise) return; const idx = selectedExercises.findIndex(se=>se.exercise_id===progressExercise.id); if(idx>-1){ const next = selectedExercises[(idx+1)%selectedExercises.length]; const data = exercises.find(ed=>ed.exercise_id===next.exercise_id); setProgressExercise({id:next.exercise_id,name:next.name,metrics:data}); }
                }}>Next</Button>
                <Button variant="ghost" size="sm" onClick={()=>{ setProgressOpen(false); setProgressExercise(null); }}>Close</Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-3 flex flex-wrap gap-2">
              <span>[p] toggle</span>
              <span>[↑/↓] cycle</span>
              <span>[Esc] close</span>
            </div>
            <ExerciseProgressChart
              exerciseId={progressExercise.id}
              exerciseName={progressExercise.name}
              metricWeight={progressExercise.metrics?.metric_weight}
              metricReps={progressExercise.metrics?.metric_reps}
              metricTime={progressExercise.metrics?.metric_time}
              metricDistance={progressExercise.metrics?.metric_distance}
            />
          </div>
        ) : (
          <Sheet open={progressOpen} onOpenChange={(o)=>{ if(!o){ setProgressExercise(null);} setProgressOpen(o); }}>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-sm"><BarChart2 className="h-4 w-4" /> {progressExercise.name} Progress</SheetTitle>
              </SheetHeader>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" disabled={selectedExercises.length<=1} onClick={()=>{
                  if(!progressExercise) return; const idx = selectedExercises.findIndex(se=>se.exercise_id===progressExercise.id); if(idx>-1){ const prev = selectedExercises[(idx-1+selectedExercises.length)%selectedExercises.length]; const data = exercises.find(ed=>ed.exercise_id===prev.exercise_id); setProgressExercise({id:prev.exercise_id,name:prev.name,metrics:data}); }
                }}>Prev</Button>
                <Button variant="outline" size="sm" disabled={selectedExercises.length<=1} onClick={()=>{
                  if(!progressExercise) return; const idx = selectedExercises.findIndex(se=>se.exercise_id===progressExercise.id); if(idx>-1){ const next = selectedExercises[(idx+1)%selectedExercises.length]; const data = exercises.find(ed=>ed.exercise_id===next.exercise_id); setProgressExercise({id:next.exercise_id,name:next.name,metrics:data}); }
                }}>Next</Button>
                <div className="ml-auto text-[10px] text-muted-foreground flex gap-2">
                  <span>[p]</span><span>[↑/↓]</span><span>[Esc]</span>
                </div>
              </div>
              <div className="mt-4">
                <ExerciseProgressChart
                  exerciseId={progressExercise.id}
                  exerciseName={progressExercise.name}
                  metricWeight={progressExercise.metrics?.metric_weight}
                  metricReps={progressExercise.metrics?.metric_reps}
                  metricTime={progressExercise.metrics?.metric_time}
                  metricDistance={progressExercise.metrics?.metric_distance}
                />
              </div>
            </SheetContent>
          </Sheet>
        )
      )}
    </div>
  );
};

export default WorkoutPlanner;