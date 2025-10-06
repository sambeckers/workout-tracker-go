// Clean rebuilt WorkoutSession component (single definition, removed duplicates)
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Play, Pause, Check, Timer, Dumbbell, Save, CheckSquare, Star, Edit, X as XIcon, GripVertical, Cloud } from 'lucide-react';
import NumberStepper from '@/components/ui/number-stepper';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { toast } from 'sonner';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useWorkoutSessions, useExercises, useExerciseLogs, useCreateExerciseLog, useCreateWorkoutSession, useUpdateWorkoutSession, useWorkoutTemplates, useCreateWorkoutTemplate, useRegisterTemplateUse, scoreTemplates, useCompleteWorkoutSession } from '@/hooks/useWorkoutData';
import { generateTemplateName } from '@/utils/templateNaming';
import { useQueryClient } from '@tanstack/react-query';
import { useAutoSave } from '@/hooks/useAutoSave';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Local interfaces describing enriched exercise + sets for UI
interface Set { setNumber:number; reps:number; weight:number; completed:boolean; }
interface ExerciseWithSets { 
  id:string; 
  name:string; 
  sets:Set[]; 
  advanced?:boolean; 
  mode?:'sets'|'time'; 
  durationSeconds?:number; 
  timeCompleted?:boolean; 
  enableReps?:boolean; 
  enableWeight?:boolean; 
  metric_time?: boolean; 
  metric_weight?: boolean; 
  metric_reps?: boolean; 
  metric_distance?: boolean; 
  distanceKm?: number; // captured when distance metric active
  targetPace?: number; // min/km for cardio exercises
  duration_unit?: 'sec' | 'min' | 'hr';
  distance_unit?: 'm' | 'km';
}

const DEFAULT_SETS: Set[] = [
  { setNumber:1, reps:10, weight:0, completed:false },
  { setNumber:2, reps:10, weight:0, completed:false },
  { setNumber:3, reps:10, weight:0, completed:false },
];

const WorkoutSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unit } = useUnitPreference();
  const useLbs = unit === 'lbs';

  // Data hooks
  const { data: sessions = [] } = useWorkoutSessions();
  const { data: availableExercises = [] } = useExercises();
  const { data: exerciseLogs = [] } = useExerciseLogs(id && id !== 'new' && id !== 'quick' ? id : undefined);
  const { data: templates = [] } = useWorkoutTemplates();
  const createExerciseLog = useCreateExerciseLog();
  const createSession = useCreateWorkoutSession();
  const updateSession = useUpdateWorkoutSession();
  const completeWorkout = useCompleteWorkoutSession();
  const createTemplate = useCreateWorkoutTemplate();
  const registerTemplateUse = useRegisterTemplateUse();
  const queryClient = useQueryClient();
  const currentWorkout = useMemo(()=>sessions.find(s=>s.session_id===id), [sessions,id]);

  // Initialize autosave
  const autoSave = useAutoSave({
    delay: 1500,
    onSuccess: () => {
      setSaveState('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveState('idle'), 2000); // Show saved state for 2 seconds
    },
    onError: (error) => {
      setSaveState('idle');
      toast.error('Auto-save failed');
    }
  });

  // Local state
  const [exercises,setExercises] = useState<ExerciseWithSets[]>([]);
  const [duration,setDuration] = useState(0);
  const [isActive,setIsActive] = useState(false);
  const [exerciseDialogOpen,setExerciseDialogOpen] = useState(false);
  const [exerciseSearch,setExerciseSearch] = useState('');
  const [muscleFilter,setMuscleFilter] = useState('all');
  const [favoriteExercises,setFavoriteExercises] = useState<string[]>(()=>{ try { return JSON.parse(localStorage.getItem('favorite-exercises')||'[]'); } catch { return []; } });
  const [recentExercises,setRecentExercises] = useState<string[]>(()=>{ try { return JSON.parse(localStorage.getItem('recent-exercises')||'[]'); } catch { return []; } });
  const autoMarkedDoneRef = useRef(false);
  const previouslyAllCompleteRef = useRef(false); // Track previous completion state to detect transitions
  // Template modals state
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [templateExerciseSelection, setTemplateExerciseSelection] = useState<string[]>([]); // exercise ids included when saving
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('replace');
  
  // Auto-save state tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Metadata edit state
  const [editingMeta,setEditingMeta] = useState(false);
  const [metaDraft,setMetaDraft] = useState({ title: currentWorkout?.title||'', date: currentWorkout?.date||'', time: currentWorkout?.time||'', notes:(currentWorkout as any)?.notes||'' });
  useEffect(()=>{ if(currentWorkout){ setMetaDraft({ title: currentWorkout.title||'', date: currentWorkout.date||'', time: currentWorkout.time||'', notes:(currentWorkout as any)?.notes||'' }); } }, [currentWorkout?.title,currentWorkout?.date,currentWorkout?.time,(currentWorkout as any)?.notes]);

  // Pace input state (for controlled input during typing)
  const [paceInputs, setPaceInputs] = useState<Record<string, string>>({});

  // Build exercises list (logs -> planned -> new defaults)
  useEffect(()=>{
    if(exerciseLogs.length){
      const groups = exerciseLogs.reduce((acc,log)=>{ 
        const eid=log.exercise_id; 
        const base = availableExercises.find(e=>e.exercise_id===eid) as any;
        const metric_time = base?.metric_time || false;
        const metric_reps = base?.metric_reps !== false; // default true
        const metric_weight = base?.metric_weight !== false; // default true
        if(!acc[eid]) acc[eid]={ 
          id:eid, 
          name: log.exercise?.name||base?.name||'Exercise', 
            sets:[], 
            advanced:false, 
            mode: (log.duration_seconds && log.sets===null) || metric_time ? 'time':'sets', 
            enableReps: metric_reps, 
            enableWeight: metric_weight, 
            timeCompleted: log.completed || false, // RESTORE completion state from DB
            metric_time, metric_reps, metric_weight, metric_distance: base?.metric_distance||false,
            durationSeconds: undefined,
            distanceKm: undefined,
        } as ExerciseWithSets; 
        if(log.sets){ 
          const reps=log.reps_per_set?log.reps_per_set.split(',').map(r=>parseInt(r)||0):[]; 
          const weights=log.weight_per_set?log.weight_per_set.split(',').map(w=>parseInt(w)||0):[]; 
          const logCompleted = log.completed || false; // Get completion state from DB
          for(let i=0;i<log.sets;i++){ 
            acc[eid].sets.push({ setNumber:i+1, reps: reps[i]||0, weight: weights[i]||0, completed: logCompleted }); // Restore per-set completion
          } 
        } else if (log.duration_seconds) {
          // Time-based planned/logged exercise
          acc[eid].durationSeconds = log.duration_seconds; // store raw seconds; UI will interpret based on unit toggles later
          acc[eid].duration_unit = ((log as any).duration_unit as 'sec'|'min'|'hr') || 'min';
        }
        if ((log as any).distance_km) {
          acc[eid].distanceKm = (log as any).distance_km;
          acc[eid].distance_unit = ((log as any).distance_unit as 'm'|'km') || 'km';
        }
        return acc; 
      }, {} as Record<string,ExerciseWithSets>); 
      setExercises(Object.values(groups)); 
      return; 
    }
    if(id && id!=='new' && id!=='quick'){ const key=`planned-exercises-${id}`; const raw=localStorage.getItem(key); if(raw){ try { const parsed=JSON.parse(raw); setExercises(parsed.map((ex:any)=>{ 
          const base = availableExercises.find(b=>b.exercise_id===ex.exercise_id) as any;
          const metric_time = base?.metric_time || false;
          const metric_reps = base?.metric_reps !== false; // default true
          const metric_weight = base?.metric_weight !== false; // default true
          const metric_distance = base?.metric_distance || false;
          // Determine mode and initial duration/distance
          let durationSeconds: number | undefined = undefined;
          if(metric_time){
            // Preserve original entered value – store canonical seconds but keep unit info so UI can reconstruct
            const rawDur = ex.target_duration_sec || 0;
            if(rawDur>0){
              if(ex.duration_unit==='hr') durationSeconds = rawDur * 3600; 
              else if(ex.duration_unit==='min') durationSeconds = rawDur * 60; 
              else durationSeconds = rawDur; 
            } else {
              durationSeconds = 60; // default
            }
          }
          let distanceKm: number | undefined = undefined;
            if(metric_distance && ex.target_distance_km!=null){
              distanceKm = ex.distance_unit==='m' ? (ex.target_distance_km/1000) : ex.target_distance_km; 
            }
          return ({ 
            id: ex.exercise_id, 
            name: ex.name, 
            sets: metric_time ? [] : Array.from({length: ex.target_sets||3}, (_,i)=>({ setNumber:i+1, reps: parseInt(ex.target_reps||'10')||10, weight: parseInt(ex.target_weight||'0')||0, completed:false })), 
            advanced: localStorage.getItem(`exercise-mode-${ex.exercise_id}`)==='advanced', 
            mode: metric_time ? 'time':'sets', 
            enableReps: metric_reps, 
            enableWeight: metric_weight, 
            timeCompleted:false, 
            metric_time, metric_reps, metric_weight, metric_distance,
            durationSeconds,
            distanceKm,
            duration_unit: ex.duration_unit || 'min',
            distance_unit: ex.distance_unit || 'km'
          }); 
        })); localStorage.removeItem(key); } catch(e){ console.error('Failed to parse planned exercises', e); } } return; }
    if(id==='new'){ 
      const exerciseId=searchParams.get('exerciseId'); 
      const pick = exerciseId? availableExercises.find(e=>e.exercise_id===exerciseId) : availableExercises[0];
      if(pick){
        const metric_time = !!pick.metric_time;
        const metric_reps = pick.metric_reps !== false; // default true
        const metric_weight = pick.metric_weight !== false; // default true
        const ex:ExerciseWithSets = {
          id: pick.exercise_id,
          name: pick.name,
          sets: metric_time ? [] : DEFAULT_SETS.map(s=>({...s})),
          mode: metric_time ? 'time':'sets',
          advanced:false,
          enableReps: metric_reps,
          enableWeight: metric_weight,
          durationSeconds: metric_time?60:undefined,
          timeCompleted:false,
          metric_time, metric_reps, metric_weight, metric_distance: pick.metric_distance||false,
        };
        setExercises([ex]);
        return;
      }
      // fallback
      setExercises([{ id:'temp-1', name:'Push-ups', sets:DEFAULT_SETS.map(s=>({...s})), mode:'sets', advanced:false, enableReps:true, enableWeight:true, timeCompleted:false }]);
    }
  }, [exerciseLogs,availableExercises,id,searchParams]);

  // REMOVED: Problematic effect that caused infinite loops
  // Completion state is now properly loaded from exercise logs and persisted via autosave

  // Auto create session when /new
  const createSessionIfNeeded = async ()=>{ if(id!=='new') return; if(createSession.isPending) return; try { const now=new Date(); const date=now.toISOString().slice(0,10); const time=now.toTimeString().slice(0,5); const session=await createSession.mutateAsync({ date,time,status:'Planned' }); navigate(`/workout/${session.session_id}`); } catch { toast.error('Failed to create session'); } };
  useEffect(()=>{ if(id==='new' && !currentWorkout && !createSession.isPending) createSessionIfNeeded(); }, [id,currentWorkout]);

  // Helper to mark changes and trigger auto-save
  const markChangesAndAutoSave = useCallback((saveFunction: () => void) => {
    setHasUnsavedChanges(true);
    setSaveState('saving');
    saveFunction();
  }, []);

  // Auto-save session duration
  useEffect(() => {
    if (currentWorkout && duration > 0 && hasUnsavedChanges) {
      markChangesAndAutoSave(() => {
        autoSave.debouncedSaveSession(currentWorkout.session_id, { 
          duration_minutes: Math.floor(duration / 60) 
        });
      });
    }
  }, [duration, currentWorkout?.session_id, autoSave.debouncedSaveSession, hasUnsavedChanges, markChangesAndAutoSave]);

  // Helper to build exercise logs from exercises array
  const buildExerciseLogs = useCallback((exercisesArray: ExerciseWithSets[]) => {
    if (!currentWorkout) return [];
    
    return exercisesArray.map((exercise, index) => {
      const baseLog = {
        session_id: currentWorkout.session_id,
        exercise_id: exercise.id,
        exercise_order: index,
      };

      if (exercise.mode === 'time') {
        // Save time-based exercise data (even if not completed yet)
        if (exercise.durationSeconds || exercise.distanceKm) {
          const isCompleted = exercise.timeCompleted || false;
          const logData: any = {
            ...baseLog,
            duration_seconds: exercise.durationSeconds || 0,
            duration_unit: exercise.duration_unit || 'min',
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          };
          
          if (exercise.metric_distance && exercise.distanceKm) {
            logData.distance_km = exercise.distanceKm;
            logData.distance_unit = exercise.distance_unit || 'km';
          }
          
          return logData;
        }
      } else {
        // Save all sets with current values and completion state
        if (exercise.sets.length > 0) {
          const allSetsCompleted = exercise.sets.every(s => s.completed);
          const logData: any = {
            ...baseLog,
            sets: exercise.sets.length,
            completed: allSetsCompleted,
            completed_at: allSetsCompleted ? new Date().toISOString() : null,
          };
          
          if (exercise.metric_reps) {
            logData.reps_per_set = exercise.sets.map(s => s.reps).join(',');
          }
          
          if (exercise.metric_weight) {
            logData.weight_per_set = exercise.sets.map(s => s.weight).join(',');
          }
          
          return logData;
        }
      }
      
      // Return placeholder for exercises with no data yet
      return {
        ...baseLog,
        sets: 0,
        completed: false,
        completed_at: null,
      };
    }).filter(Boolean);
  }, [currentWorkout]);

  // Auto-save exercise logs when exercises change
  const autoSaveExerciseLogs = useCallback(() => {
    const logs = buildExerciseLogs(exercises);
    if (logs.length > 0) {
      setSaveState('saving');
      autoSave.debouncedSaveExerciseLogs(logs);
    }
  }, [exercises, buildExerciseLogs, autoSave.debouncedSaveExerciseLogs]);

  // Auto-save metadata when changed
  const autoSaveMetadata = useCallback((field: string, value: string) => {
    if (!currentWorkout) return;
    
    // Don't trim date/time fields, only title and notes
    const shouldTrim = field === 'title' || field === 'notes';
    const cleanedValue = shouldTrim ? (value.trim() || null) : (value || null);
    
    const cleaned = {
      [field]: cleanedValue,
    };

    const oldVal = (currentWorkout as any)[field] ?? null;
    if (cleaned[field] !== oldVal) {
      // Optimistic update: immediately update the query cache
      const queryKey = ['workout-sessions', (sessions[0] && sessions[0].user_id)];
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((s: any) => 
          s.session_id === currentWorkout.session_id 
            ? { ...s, ...cleaned, updated_at: new Date().toISOString() } 
            : s
        );
      });

      // Use direct mutation instead of debounced to ensure it saves
      setHasUnsavedChanges(true);
      setSaveState('saving');
      updateSession.mutate(
        { sessionId: currentWorkout.session_id, data: cleaned },
        {
          onSuccess: () => {
            setSaveState('saved');
            setHasUnsavedChanges(false);
            setTimeout(() => setSaveState('idle'), 2000);
          },
          onError: () => {
            setSaveState('idle');
            toast.error('Failed to save changes');
          }
        }
      );
    }
  }, [currentWorkout, updateSession, sessions, queryClient]);

  // Trigger autosave when exercises change
  useEffect(() => {
    if (currentWorkout && exercises.length > 0 && hasUnsavedChanges) {
      autoSaveExerciseLogs();
    }
  }, [exercises, autoSaveExerciseLogs, hasUnsavedChanges]);

  // Timer
  useEffect(()=>{ let int:any; if(isActive) int=setInterval(()=>{setDuration(d=>d+1); setHasUnsavedChanges(true);},1000); return ()=>clearInterval(int); }, [isActive]);
  const toggleSet=(eid:string,idx:number)=>{
    setHasUnsavedChanges(true);
    setExercises(prev=>prev.map(ex=>{
      if(ex.id!==eid) return ex;
      return { ...ex, sets: ex.sets.map((s,i)=> i===idx ? { ...s, completed: !s.completed } : s) };
    }));
  };
  const updateSet=(eid:string,idx:number,field:'reps'|'weight',val:number)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?{...ex,sets:ex.sets.map((s,i)=>i===idx?{...s,[field]:val}:s)}:ex));};
  const toggleMode=(eid:string)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>{
    if(ex.id!==eid) return ex; 
    // Only allow switching modes if the exercise supports both
    if((ex.mode||'sets')==='sets'){
      if(!ex.metric_time) return ex; // can't switch to time
      return { ...ex, mode:'time', durationSeconds: ex.durationSeconds||60, timeCompleted:false };
    } else {
      // back to sets - only if exercise supports reps or weight
      if(!ex.metric_reps && !ex.metric_weight) return ex; // can't switch to sets
      return { ...ex, mode:'sets', sets: ex.sets.length?ex.sets:DEFAULT_SETS.map(s=>({...s})) };
    }
  }));};
  const updateDuration=(eid:string,val:number)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>{
    if(ex.id!==eid) return ex;
    // durationSeconds always stores canonical seconds, so convert display value to seconds
    let seconds = Math.max(0, val);
    if(ex.duration_unit==='min') seconds = val * 60;
    else if(ex.duration_unit==='hr') seconds = val * 3600;
    return {...ex, durationSeconds: seconds};
  }));};
  const updateDurationUnit=(eid:string,newUnit:'sec'|'min'|'hr')=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>{
    if(ex.id!==eid) return ex;
    // durationSeconds stays as canonical seconds, just change display unit
    return {...ex, duration_unit: newUnit};
  }));};
  const updateDistanceUnit=(eid:string,newUnit:'m'|'km')=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>{
    if(ex.id!==eid) return ex;
    // Distance is already stored in km, just change display unit
    return {...ex, distance_unit: newUnit};
  }));};
  // Remove the toggleEnableField function as metrics are now determined by database settings
  const setTimeCompleted=(eid:string,done:boolean)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?{...ex,timeCompleted:done}:ex));};
  const toggleAdvanced=(eid:string)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?(()=>{ const adv=!ex.advanced; localStorage.setItem(`exercise-mode-${ex.id}`, adv?'advanced':'compact'); return {...ex,advanced:adv}; })():ex));};
  const updateAllSets=(eid:string,field:'reps'|'weight',val:number)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?{...ex,sets:ex.sets.map(s=>({...s,[field]:val}))}:ex));};
  const setAllSetsCompletion=(eid:string,done:boolean)=>{
    setHasUnsavedChanges(true);
    setExercises(prev=>prev.map(ex=>{
      if(ex.id!==eid) return ex;
      if((ex.mode||'sets')==='time'){
        return { ...ex, timeCompleted: done };
      }
      return { ...ex, sets: ex.sets.map(s=>({ ...s, completed: done })) };
    }));
  };

  // Delete exercise with autosave
  const deleteExercise = (exerciseId: string) => {
    setHasUnsavedChanges(true);
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    toast.success('Exercise removed');
    // Autosave will be triggered by the useEffect that watches exercises
  };

  // Drag and drop reordering with autosave
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setHasUnsavedChanges(true);
    setExercises(items);
    // Autosave will be triggered by the useEffect that watches exercises
  };

  // Metadata save
  const handleSaveMeta=()=>{
    if(!currentWorkout) return;
    // Prepare cleaned values
    const cleaned = {
      title: metaDraft.title.trim() || null,
      date: metaDraft.date || currentWorkout.date,
      time: metaDraft.time || currentWorkout.time,
      notes: metaDraft.notes.trim() ? metaDraft.notes : null,
    };

    // Determine changed fields only
    const changed: Record<string, any> = {};
    (Object.keys(cleaned) as Array<keyof typeof cleaned>).forEach(k => {
      const newVal = cleaned[k];
      const oldVal = (currentWorkout as any)[k] ?? null;
      if (newVal !== oldVal) changed[k] = newVal;
    });

    if(Object.keys(changed).length === 0){
      // Nothing changed
      setEditingMeta(false);
      return;
    }

    setHasUnsavedChanges(true);

    // Optimistic update: snapshot previous sessions
    const queryKey = ['workout-sessions', (sessions[0] && sessions[0].user_id)];
    const previous = queryClient.getQueryData<any>(queryKey);
    queryClient.setQueryData(queryKey, (old: any)=>{
      if(!old) return old;
      return old.map((s: any)=> s.session_id===currentWorkout.session_id ? { ...s, ...changed, updated_at: new Date().toISOString() } : s);
    });

    updateSession.mutate(
      { sessionId: currentWorkout.session_id, data: changed },
      {
        onSuccess:()=>{
          toast.success('Session details updated');
          setEditingMeta(false);
        },
        onError:(err)=>{
          // Rollback
            queryClient.setQueryData(queryKey, previous);
            console.error('Failed to update session meta', err);
            toast.error('Failed to update session');
        }
      }
    );
  };

  // Add exercise
  const addExercise=(exercise:any)=>{ 
    // derive metrics with sensible defaults (matches inference logic)
    const metric_time = !!exercise.metric_time;
    const metric_reps = exercise.metric_reps !== false; // default true
    const metric_weight = exercise.metric_weight !== false; // default true
    const newEx:ExerciseWithSets={ 
      id:exercise.exercise_id, 
      name:exercise.name, 
      sets:metric_time?[]:DEFAULT_SETS.map(s=>({...s})), 
      mode:metric_time?'time':'sets', 
      advanced:false, 
      enableReps:metric_reps, 
      enableWeight:metric_weight, 
      durationSeconds:metric_time?60:undefined, 
      timeCompleted:false,
      metric_time, metric_reps, metric_weight, metric_distance: exercise.metric_distance||false,
    }; 
    setHasUnsavedChanges(true); 
    setExercises(p=>[...p,newEx]); 
    setRecentExercises(prev=>{ const up=[newEx.id,...prev.filter(i=>i!==newEx.id)].slice(0,15); localStorage.setItem('recent-exercises', JSON.stringify(up)); return up; }); 
  };
  const toggleFavoriteExercise=(exerciseId:string)=>setFavoriteExercises(prev=>{ const up = prev.includes(exerciseId)?prev.filter(i=>i!==exerciseId):[...prev,exerciseId]; localStorage.setItem('favorite-exercises', JSON.stringify(up)); return up; });

  // Save workout logs
  const saveWorkout = async ()=>{ if(!id || id==='new'){ toast.error('Please save the workout session first'); return; } try { for(const ex of exercises){ if((ex.mode||'sets')==='time'){ if(ex.timeCompleted && (ex.durationSeconds||0)>0){ const payload:any={ session_id:id, exercise_id:ex.id, duration_seconds:ex.durationSeconds }; if(ex.metric_distance && ex.distanceKm) payload.distance_km=ex.distanceKm; await createExerciseLog.mutateAsync(payload); } } else { const done=ex.sets.filter(s=>s.completed); if(done.length){ const payload:any={ session_id:id, exercise_id:ex.id, sets:done.length }; if(ex.enableReps!==false) payload.reps_per_set=done.map(s=>s.reps).join(','); if(ex.enableWeight!==false) payload.weight_per_set=done.map(s=>s.weight).join(','); await createExerciseLog.mutateAsync(payload); } } } toast.success('Workout saved'); navigate('/progress'); } catch { toast.error('Failed to save workout'); } };

  // Completion counts
  const completedSets = exercises.reduce((t,ex)=>(ex.mode||'sets')==='time'?t+(ex.timeCompleted?1:0):t+ex.sets.filter(s=>s.completed).length,0);
  const totalSets = exercises.reduce((t,ex)=>(ex.mode||'sets')==='time'?t+1:t+ex.sets.length,0);

  // Auto status change
  // Auto mark as Done when all sets/time items complete (only on TRANSITION from incomplete to complete)
  useEffect(()=>{ 
    if(!currentWorkout || completeWorkout.isPending) return; 
    
    const allComplete = totalSets > 0 && completedSets === totalSets;
    
    // Only auto-mark if:
    // 1. All exercises just became complete (transition detected)
    // 2. Workout is not already marked as done
    // 3. We haven't already auto-marked this session
    if(allComplete && !previouslyAllCompleteRef.current && !currentWorkout.completed && !autoMarkedDoneRef.current){ 
      autoMarkedDoneRef.current = true; // flag so we know this was automatic
      completeWorkout.mutate({ sessionId: currentWorkout.session_id, completed: true }, { 
        onSuccess:()=>{ 
          confetti({ particleCount:80, spread:55, origin:{y:0.3} }); 
          toast.success('All sets complete. Marked as Done'); 
        } 
      }); 
    }
    
    // Update the tracking ref for next render
    previouslyAllCompleteRef.current = allComplete;
  }, [completedSets,totalSets,currentWorkout?.completed,currentWorkout?.session_id,completeWorkout.isPending]);

  // REMOVED: Auto-revert effects that caused loops
  // User has full manual control; completion state persists via autosave

  const toggleWorkoutStatus=()=>{ 
    if(!currentWorkout) return; 
    const markingDone = !currentWorkout.completed;
    
    // Manual user toggle should not be treated as auto-mark; clear auto flag so we don't immediately revert
    autoMarkedDoneRef.current=false; 
    
    // Optimistic update: immediately update UI
    const queryKey = ['workout-sessions', currentWorkout.user_id];
    const previous = queryClient.getQueryData<any>(queryKey);
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return old.map((s: any) => 
        s.session_id === currentWorkout.session_id 
          ? { ...s, status: markingDone ? 'Done' : 'Planned', completed: markingDone, updated_at: new Date().toISOString() } 
          : s
      );
    });
    
    // Also update local exercises state optimistically
    const updatedExercises = exercises.map(ex=>{
      if(markingDone){
        // Mark all as completed
        if(ex.mode==='time'){
          return {...ex, timeCompleted:true};
        } else {
          return {...ex, sets:ex.sets.map(s=>({...s, completed:true}))};
        }
      } else {
        // Mark all as uncompleted
        if(ex.mode==='time'){
          return {...ex, timeCompleted:false};
        } else {
          return {...ex, sets:ex.sets.map(s=>({...s, completed:false}))};
        }
      }
    });
    setExercises(updatedExercises);
    setHasUnsavedChanges(true); // ensure autosave picks up completed sets/logs
    
    // Call the atomic completion API
    completeWorkout.mutate({ 
      sessionId: currentWorkout.session_id, 
      completed: markingDone 
    }, { 
      onSuccess:(data)=>{ 
        if(markingDone) confetti({ particleCount:60, spread:45, origin:{y:0.3} }); 
        setSaveState('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState('idle'), 2000);
        
        // Update exercises from response to ensure sync
        if (data.exercise_logs) {
          toast('Workout ' + (markingDone ? 'completed!' : 'reverted to planned'));
        }
      },
      onError:(err)=>{
        // Rollback on error
        queryClient.setQueryData(queryKey, previous);
        setExercises(exercises); // Revert to original
        toast.error('Failed to update workout status');
        console.error('Failed to complete workout', err);
      }
    }); 
  };

  const formatTime=(s:number)=>{ const m=Math.floor(s/60); const sec=s%60; return `${m}:${sec.toString().padStart(2,'0')}`; };
  const uniqueMuscleGroups = Array.from(new Set(availableExercises.flatMap(ex=>(ex.muscle_group||'').split(',').map(g=>g.trim()).filter(Boolean)))).sort();
  const workoutTitle = currentWorkout?.title || (id==='new'?'New Workout':'Workout Session');

  // Helper: derive display values for time/distance based on selected unit while keeping canonical storage (seconds / km)
  const getDisplayDuration = (ex: ExerciseWithSets) => {
    const secs = ex.durationSeconds || 0;
    switch(ex.duration_unit){
      case 'hr': return +(secs / 3600).toFixed(2);
      case 'min': return +(secs / 60).toFixed(2);
      default: return secs; // sec
    }
  };
  const setDisplayDuration = (exerciseId: string, value: number) => {
    setHasUnsavedChanges(true);
    setExercises(prev => prev.map(ex => {
      if(ex.id!==exerciseId) return ex;
      const unit = ex.duration_unit;
      let secs = Math.max(0, value);
      if(unit==='min') secs = value * 60;
      else if(unit==='hr') secs = value * 3600;
      return { ...ex, durationSeconds: Math.round(secs) };
    }));
  };
  const getDisplayDistance = (ex: ExerciseWithSets) => {
    if(!ex.metric_distance) return 0;
    const km = ex.distanceKm || 0;
    return ex.distance_unit === 'm' ? Math.round(km * 1000) : +km.toFixed(2);
  };
  const setDisplayDistance = (exerciseId: string, value: number) => {
    setHasUnsavedChanges(true);
    setExercises(prev => prev.map(ex => {
      if(ex.id!==exerciseId) return ex;
      if(!ex.metric_distance) return ex;
      let km = value;
      if(ex.distance_unit==='m') km = value / 1000;
      return { ...ex, distanceKm: km };
    }));
  };

  // Initialize Save Template dialog when opened
  useEffect(()=>{
    if(saveTemplateOpen){
      // Pre-fill name suggestion
      const existingNames = templates.map(t=>t.template_name);
      const baseName = currentWorkout?.title || 'Workout';
      const suggested = generateTemplateName({ existingNames, baseSessionName: baseName });
      setTemplateName(suggested);
      setTemplateNotes('');
      setTemplateExerciseSelection(exercises.map(e=>e.id));
    }
  }, [saveTemplateOpen, templates, currentWorkout?.title, exercises]);

  const toggleSelectTemplateExercise = (id:string) => {
    setTemplateExerciseSelection(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
  };

  const handleCreateTemplate = async () => {
    if(!templateName.trim()) { toast.error('Template name required'); return; }
    if(!templateExerciseSelection.length){ toast.error('Select at least one exercise'); return; }
    try {
      const ordered = exercises.filter(e=>templateExerciseSelection.includes(e.id));
      await createTemplate.mutateAsync({
        template_name: templateName.trim(),
        notes: templateNotes.trim() || null,
        exercises: ordered.map((e, idx)=>({ exercise_id: e.id, exercise_order: idx }))
      });
      setSaveTemplateOpen(false);
      toast.success('Template saved');
    } catch (e:any){ /* error toasts handled in hook */ }
  };

  // Apply template logic
  const applyTemplate = async (templateId: string) => {
    const tpl = templates.find(t=>t.template_id===templateId);
    if(!tpl){ toast.error('Template not found'); return; }
    // Build exercise objects from template
    const newExercises: ExerciseWithSets[] = (tpl.exercises||[])
      .sort((a,b)=>a.exercise_order-b.exercise_order)
      .map(te => {
        const base = availableExercises.find(e=>e.exercise_id===te.exercise_id);
        if(!base) return null;
        const metric_time = !!base.metric_time;
        const metric_reps = base.metric_reps !== false;
        const metric_weight = base.metric_weight !== false;
        return {
          id: base.exercise_id,
          name: base.name,
          sets: metric_time ? [] : DEFAULT_SETS.map(s=>({...s})),
          mode: metric_time ? 'time':'sets',
          advanced: false,
          enableReps: metric_reps,
            enableWeight: metric_weight,
          durationSeconds: metric_time?60:undefined,
          timeCompleted:false,
          metric_time, metric_reps, metric_weight, metric_distance: base.metric_distance||false,
        } as ExerciseWithSets;
      })
      .filter(Boolean) as ExerciseWithSets[];

    setExercises(prev => applyMode==='replace' ? newExercises : [...prev, ...newExercises]);
    setHasUnsavedChanges(true);
    setApplyTemplateOpen(false);
    try { await registerTemplateUse.mutateAsync(templateId); } catch {/* silent */}
    toast.success('Template applied');
  };

  const recommendedTemplates = scoreTemplates(templates).slice(0,5);

  return (
    <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={()=>navigate('/dashboard/schedule')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">{workoutTitle}</h1>
            <p className="text-muted-foreground">Track your workout progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-md border bg-background min-w-[100px]" title={
            saveState === 'saving' ? 'Auto-saving...' : 
            saveState === 'saved' ? 'All changes saved' : 
            hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'
          }>
            {saveState === 'saving' ? (
              <>
                <Cloud className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-sm text-blue-500">Saving...</span>
              </>
            ) : saveState === 'saved' ? (
              <>
                <div className="relative">
                  <Cloud className="h-4 w-4 text-green-500" />
                  <Check className="h-3 w-3 text-green-500 absolute -top-0.5 -right-0.5 animate-scale-in" />
                </div>
                <span className="text-sm text-green-500">Saved</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Cloud className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-500">Unsaved</span>
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Saved</span>
              </>
            )}
          </div>
          {currentWorkout && (
            <Button variant="outline" size="sm" onClick={toggleWorkoutStatus} disabled={completeWorkout.isPending} className={currentWorkout.completed?'border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20':'flex items-center gap-2'} title={currentWorkout.completed?'Click to mark as planned':'Click to mark as done'}>
              <CheckSquare className="h-4 w-4" />{currentWorkout.completed?'Done':'Mark Done'}
            </Button>
          )}
          {/* Save as Template visible only when session Done and exercises exist */}
          {currentWorkout && currentWorkout.status==='Done' && exercises.length>0 && (
            <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" title="Save this completed workout as a reusable template">
                  <Save className="h-4 w-4" />Save as Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[600px] overflow-y-auto">
                <UIDialogHeader><UIDialogTitle>Create Template</UIDialogTitle></UIDialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid gap-1">
                    <label className="text-xs font-medium">Template Name</label>
                    <Input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Template name" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-medium">Notes (optional)</label>
                    <textarea value={templateNotes} onChange={e=>setTemplateNotes(e.target.value)} className="w-full text-xs rounded-md border bg-background p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Warm-up, focus, cues..." />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Exercises ({templateExerciseSelection.length}/{exercises.length})</span><span className="text-[10px] text-muted-foreground">Click to toggle include</span></div>
                    <div className="flex flex-col gap-1">
                      {exercises.map((ex, idx)=>(
                        <button key={ex.id} type="button" onClick={()=>toggleSelectTemplateExercise(ex.id)} className={`flex items-center justify-between px-3 py-2 rounded border text-left text-xs ${templateExerciseSelection.includes(ex.id)?'bg-primary text-primary-foreground border-primary':'hover:bg-muted'}`}> 
                          <span className="truncate">{idx+1}. {ex.name}</span>
                          {templateExerciseSelection.includes(ex.id)?<Check className="h-3 w-3" />:null}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={()=>setSaveTemplateOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleCreateTemplate} disabled={createTemplate.isPending}>{createTemplate.isPending?'Saving...':'Save Template'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {/* Apply Template (visible when editable/planned or new) */}
          {currentWorkout && currentWorkout.status!=='Done' && (
            <Dialog open={applyTemplateOpen} onOpenChange={setApplyTemplateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" title="Add exercises from a template">
                  <Plus className="h-4 w-4" />Add From Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[650px] overflow-y-auto">
                <UIDialogHeader><UIDialogTitle>Apply Template</UIDialogTitle></UIDialogHeader>
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
                  </div>
                  {recommendedTemplates.length>0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">Recommended</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {recommendedTemplates.map(r=> (
                          <Card key={r.template.template_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={()=>applyTemplate(r.template.template_id)}>
                            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between"><span className="truncate" title={r.template.template_name}>{r.template.template_name}</span><Badge variant="outline" className="text-[10px]">{r.reason}</Badge></CardTitle></CardHeader>
                            <CardContent className="text-[11px] text-muted-foreground flex justify-between"><span>{(r.template.exercises||[]).length} exercises</span><span>Uses {r.template.use_count}</span></CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">All Templates</div>
                    {templates.length? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {templates.map(t => (
                          <Card key={t.template_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={()=>applyTemplate(t.template_id)}>
                            <CardHeader className="pb-2"><CardTitle className="text-sm truncate" title={t.template_name}>{t.template_name}</CardTitle></CardHeader>
                            <CardContent className="text-[11px] text-muted-foreground flex justify-between"><span>{(t.exercises||[]).length} exercises</span>{t.last_used && <span>Used {new Date(t.last_used).toLocaleDateString()}</span>}</CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : <div className="text-xs text-muted-foreground py-6">No templates yet. Create one from a completed session.</div>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant={isActive?'secondary':'default'} onClick={()=>setIsActive(!isActive)} className="gap-2">{isActive?(<><Pause className="h-4 w-4" />Pause</>):(<><Play className="h-4 w-4" />Start</>)}</Button>
        </div>
      </div>

      {/* Stats & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-medium">Session Details</CardTitle>
              {currentWorkout && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setEditingMeta(e=>!e)} title={editingMeta?'Cancel edit':'Edit details'}>
                  {editingMeta?<XIcon className="h-4 w-4" />:<Edit className="h-4 w-4" />}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {!currentWorkout && <p className="text-xs text-muted-foreground">Session will appear after creation...</p>}
              {currentWorkout && !editingMeta && (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Title:</span> {currentWorkout.title || <span className="text-muted-foreground">(none)</span>}</div>
                  <div><span className="font-medium">Date:</span> {currentWorkout.date || <span className="text-muted-foreground">(none)</span>}</div>
                  <div><span className="font-medium">Time:</span> {currentWorkout.time?.slice(0,5) || <span className="text-muted-foreground">(none)</span>}</div>
                  <div><span className="font-medium">Status:</span> {currentWorkout.status}</div>
                  <div><span className="font-medium">Notes:</span><div className="mt-1 text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto text-xs">{(currentWorkout as any)?.notes || 'No notes'}</div></div>
                </div>
              )}
              {currentWorkout && editingMeta && (
                <div className="space-y-3">
                  <div className="grid gap-1"><label className="text-xs font-medium">Title</label><Input value={metaDraft.title} onChange={e=>{setMetaDraft(d=>({...d,title:e.target.value})); autoSaveMetadata('title', e.target.value);}} placeholder="Workout title" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1"><label className="text-xs font-medium">Date</label><Input type="date" value={metaDraft.date} onChange={e=>{setMetaDraft(d=>({...d,date:e.target.value})); autoSaveMetadata('date', e.target.value);}} /></div>
                    <div className="grid gap-1"><label className="text-xs font-medium">Time</label><Input type="time" value={metaDraft.time} onChange={e=>{setMetaDraft(d=>({...d,time:e.target.value})); autoSaveMetadata('time', e.target.value);}} /></div>
                  </div>
                  <div className="grid gap-1"><label className="text-xs font-medium">Notes</label><textarea value={metaDraft.notes} onChange={e=>{setMetaDraft(d=>({...d,notes:e.target.value})); autoSaveMetadata('notes', e.target.value);}} className="w-full text-xs rounded-md border bg-background p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Session notes / goals / feelings..." /></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm">Duration</p><p className="text-2xl font-bold">{formatTime(duration)}</p></div><Timer className="h-6 w-6 text-muted-foreground" /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm">Exercises</p><p className="text-2xl font-bold">{exercises.length}</p></div><Dumbbell className="h-6 w-6 text-muted-foreground" /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm">Sets Complete</p><p className="text-2xl font-bold">{completedSets}/{totalSets}</p></div><Check className="h-6 w-6 text-muted-foreground" /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm">Progress</p><p className="text-2xl font-bold">{totalSets>0?Math.round((completedSets/totalSets)*100):0}%</p></div><div className="text-2xl">📈</div></div></CardContent></Card>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                {exercises.map((exercise, index) => (
                  <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                title="Drag to reorder"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <span>{exercise.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(exercise.mode||'sets')==='time' ? (
                                <>
                                  <Badge variant="outline">
                                    {(() => {
                                      const val = getDisplayDuration(exercise);
                                      const unit = exercise.duration_unit || 'sec';
                                      return `Time: ${val}${unit}`;
                                    })()} {exercise.timeCompleted?'✓':''}
                                  </Badge>
                                  {exercise.metric_distance && exercise.distanceKm!=null && (
                                    <Badge variant="outline">
                                      {(() => {
                                        const unit = exercise.distance_unit || 'km';
                                        const val = getDisplayDistance(exercise);
                                        return `Distance: ${val}${unit}`;
                                      })()}
                                    </Badge>
                                  )}
                                </>
                              ) : <Badge variant="outline">{exercise.sets.filter(s=>s.completed).length}/{exercise.sets.length} sets</Badge>}
                              <Button variant="ghost" size="sm" onClick={()=>toggleAdvanced(exercise.id)}>{exercise.advanced?'Compact':'Advanced'}</Button>
                              <Button variant="ghost" size="sm" onClick={()=>toggleMode(exercise.id)}>{(exercise.mode||'sets')==='time'?'Use Sets':'Use Time'}</Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteExercise(exercise.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete exercise"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
            <CardContent>
              {!exercise.advanced ? (
                <div className="flex flex-wrap items-center gap-3">
                  {(exercise.mode||'sets')==='time' ? (
                    <>
                      {exercise.metric_distance && (
                        <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <label className="text-sm shrink-0">Distance:</label>
                              <NumberStepper
                                value={getDisplayDistance(exercise)}
                                onChange={(v) => {
                                  setDisplayDistance(exercise.id, v);
                                  // Auto-calculate time if pace is set
                                  if (exercise.targetPace && v > 0) {
                                    const durationMin = v * exercise.targetPace;
                                    setExercises(p=>p.map(ex=>{
                                      if(ex.id!==exercise.id) return ex;
                                      return { ...ex, durationSeconds: Math.round(durationMin * 60) };
                                    }));
                                  }
                                  setHasUnsavedChanges(true);
                                }}
                                min={0}
                                max={exercise.distance_unit === 'm' ? 50000 : 50}
                                step={exercise.distance_unit === 'm' ? 50 : 0.5}
                                unit=""
                                className="flex-1 min-w-[180px]"
                              />
                            </div>
                            <div className="flex justify-start">
                              <UnitToggle
                                units={['m','km']}
                                value={exercise.distance_unit || 'km'}
                                onChange={(unit)=>{
                                  setHasUnsavedChanges(true);
                                  setExercises(p=>p.map(ex=>{ if(ex.id!==exercise.id) return ex; return { ...ex, distance_unit: unit as any }; }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {exercise.metric_distance && (
                        <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <label className="text-sm shrink-0">Pace [min/km]:</label>
                              <Input
                                type="text"
                                value={paceInputs[exercise.id] !== undefined ? paceInputs[exercise.id] : (() => {
                                  const pace = exercise.targetPace || 5;
                                  const mins = Math.floor(pace);
                                  const secs = Math.round((pace % 1) * 60);
                                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                                })()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Update local input state to allow typing
                                  setPaceInputs(prev => ({ ...prev, [exercise.id]: val }));
                                  
                                  // Try to parse and update exercise state if valid
                                  const match = val.match(/^(\d+):?(\d{0,2})$/);
                                  if (match) {
                                    const mins = parseInt(match[1]) || 0;
                                    const secs = match[2] ? parseInt(match[2]) : 0;
                                    const decimalPace = mins + (secs / 60);
                                    setHasUnsavedChanges(true);
                                    setExercises(p=>p.map(ex=>{
                                      if(ex.id!==exercise.id) return ex;
                                      // Auto-calculate time based on distance × pace
                                      const distance = ex.distanceKm || 0;
                                      if (distance > 0) {
                                        const durationMin = distance * decimalPace;
                                        return { ...ex, targetPace: decimalPace, durationSeconds: Math.round(durationMin * 60) };
                                      }
                                      return { ...ex, targetPace: decimalPace };
                                    }));
                                  }
                                }}
                                onBlur={() => {
                                  // Clear local input state on blur, reverting to calculated display
                                  setPaceInputs(prev => {
                                    const next = { ...prev };
                                    delete next[exercise.id];
                                    return next;
                                  });
                                }}
                                placeholder="5:30"
                                className="flex-1 min-w-[180px] font-mono"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Format: MM:SS</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[220px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <label className="text-sm shrink-0">Time:</label>
                            <NumberStepper
                              value={getDisplayDuration(exercise)}
                              onChange={(v) => setDisplayDuration(exercise.id, v)}
                              min={0}
                              max={exercise.duration_unit === 'hr' ? 24 : exercise.duration_unit === 'min' ? 120 : 3600}
                              step={exercise.duration_unit === 'hr' ? 0.5 : exercise.duration_unit === 'min' ? 0.5 : 5}
                              unit=""
                              className="flex-1 min-w-[180px]"
                            />
                          </div>
                          <div className="flex justify-start">
                            <UnitToggle
                              units={['sec','min','hr']}
                              value={exercise.duration_unit || 'min'}
                              onChange={(unit)=>{
                                setHasUnsavedChanges(true);
                                setExercises(p=>p.map(ex=>{ if(ex.id!==exercise.id) return ex; return { ...ex, duration_unit: unit as any }; }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        {exercise.timeCompleted ? (
                          <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20" onClick={()=>setTimeCompleted(exercise.id,false)} title="Mark incomplete">Undo</Button>
                        ) : (
                          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={()=>setTimeCompleted(exercise.id,true)} title="Mark complete">Complete</Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">{exercise.sets.length} sets ×</div>
                      {exercise.metric_reps && (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-[210px]">
                          <label className="text-sm shrink-0">Reps:</label>
                          <NumberStepper
                            value={exercise.sets[0]?.reps || 0}
                            onChange={(v) => updateAllSets(exercise.id, 'reps', v)}
                            min={0}
                            max={50}
                            step={1}
                            unit=""
                            className="flex-1"
                          />
                        </div>
                      )}
                      {exercise.metric_weight && (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-[230px]">
                          <label className="text-sm shrink-0">Weight:</label>
                          <NumberStepper
                            value={useLbs ? Math.round((exercise.sets[0]?.weight||0)*2.20462*2)/2 : (exercise.sets[0]?.weight||0)}
                            onChange={(v) => {
                              const kg = useLbs ? Math.round(v/2.20462*2)/2 : v;
                              updateAllSets(exercise.id, 'weight', kg);
                            }}
                            min={0}
                            max={useLbs ? 400 : 180}
                            step={useLbs ? 2.5 : 0.5}
                            unit={useLbs ? 'lbs' : 'kg'}
                            className="flex-1"
                          />
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-4 shrink-0">
                        {/* Metric toggles removed - now determined by exercise database settings */}
                        {exercise.sets.every(s=>s.completed) ? (
                          <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20" onClick={()=>setAllSetsCompletion(exercise.id,false)} title="Mark all incomplete">Undo All</Button>
                        ) : (
                          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={()=>setAllSetsCompletion(exercise.id,true)} title="Mark all sets complete">Complete All</Button>
                        )}
                      </div>
                      <div className="w-full flex flex-wrap gap-2 mt-3">
                        {exercise.sets.map((set,idx)=>(<Button key={idx} variant={set.completed?'default':'outline'} size="sm" onClick={()=>toggleSet(exercise.id,idx)}>Set {set.setNumber} {set.completed?'✓':''}</Button>))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(exercise.mode||'sets')==='time' ? (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                      {exercise.metric_distance && (
                        <>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium w-20">Distance:</label>
                              <NumberStepper
                                value={getDisplayDistance(exercise)}
                                onChange={(v) => {
                                  setDisplayDistance(exercise.id, v);
                                  // Auto-calculate time if pace is set
                                  if (exercise.targetPace && v > 0) {
                                    const durationMin = v * exercise.targetPace;
                                    setExercises(p=>p.map(ex=>{
                                      if(ex.id!==exercise.id) return ex;
                                      return { ...ex, durationSeconds: Math.round(durationMin * 60) };
                                    }));
                                  }
                                  setHasUnsavedChanges(true);
                                }}
                                min={0}
                                max={exercise.distance_unit === 'm' ? 50000 : 50}
                                step={exercise.distance_unit === 'm' ? 50 : 0.5}
                                unit=""
                                className="flex-1"
                              />
                            </div>
                            <div className="flex justify-start">
                              <UnitToggle
                                units={['m','km']}
                                value={exercise.distance_unit || 'km'}
                                onChange={(unit)=>{
                                  setHasUnsavedChanges(true);
                                  setExercises(p=>p.map(ex=>{ if(ex.id!==exercise.id) return ex; return { ...ex, distance_unit: unit as any }; }));
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium w-20">Pace:</label>
                              <Input
                                type="text"
                                value={paceInputs[exercise.id] !== undefined ? paceInputs[exercise.id] : (() => {
                                  const pace = exercise.targetPace || 5;
                                  const mins = Math.floor(pace);
                                  const secs = Math.round((pace % 1) * 60);
                                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                                })()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Update local input state to allow typing
                                  setPaceInputs(prev => ({ ...prev, [exercise.id]: val }));
                                  
                                  // Try to parse and update exercise state if valid
                                  const match = val.match(/^(\d+):?(\d{0,2})$/);
                                  if (match) {
                                    const mins = parseInt(match[1]) || 0;
                                    const secs = match[2] ? parseInt(match[2]) : 0;
                                    const decimalPace = mins + (secs / 60);
                                    setHasUnsavedChanges(true);
                                    setExercises(p=>p.map(ex=>{
                                      if(ex.id!==exercise.id) return ex;
                                      // Auto-calculate time based on distance × pace
                                      const distance = ex.distanceKm || 0;
                                      if (distance > 0) {
                                        const durationMin = distance * decimalPace;
                                        return { ...ex, targetPace: decimalPace, durationSeconds: Math.round(durationMin * 60) };
                                      }
                                      return { ...ex, targetPace: decimalPace };
                                    }));
                                  }
                                }}
                                onBlur={() => {
                                  // Clear local input state on blur, reverting to calculated display
                                  setPaceInputs(prev => {
                                    const next = { ...prev };
                                    delete next[exercise.id];
                                    return next;
                                  });
                                }}
                                placeholder="5:30"
                                className="flex-1 font-mono"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Format: MM:SS</p>
                          </div>
                        </>
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium w-20">Duration:</label>
                          <NumberStepper
                            value={getDisplayDuration(exercise)}
                            onChange={(v) => setDisplayDuration(exercise.id, v)}
                            min={0}
                            max={exercise.duration_unit === 'hr' ? 24 : exercise.duration_unit === 'min' ? 120 : 3600}
                            step={exercise.duration_unit === 'hr' ? 0.5 : exercise.duration_unit === 'min' ? 0.5 : 5}
                            unit=""
                            className="flex-1"
                          />
                        </div>
                        <div className="flex justify-start">
                          <UnitToggle
                            units={['sec','min','hr']}
                            value={exercise.duration_unit || 'min'}
                            onChange={(unit)=>{ setHasUnsavedChanges(true); setExercises(p=>p.map(ex=> ex.id!==exercise.id?ex:{ ...ex, duration_unit: unit as any })); }}
                          />
                        </div>
                      </div>
                      {exercise.metric_distance && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium w-20">Distance:</label>
                            <NumberStepper
                              value={getDisplayDistance(exercise)}
                              onChange={(v) => setDisplayDistance(exercise.id, v)}
                              min={0}
                              max={exercise.distance_unit === 'm' ? 50000 : 50}
                              step={exercise.distance_unit === 'm' ? 50 : 0.5}
                              unit=""
                              className="flex-1"
                            />
                          </div>
                          <div className="flex justify-start">
                            <UnitToggle
                              units={['m','km']}
                              value={exercise.distance_unit || 'km'}
                              onChange={(unit)=>{ setHasUnsavedChanges(true); setExercises(p=>p.map(ex=> ex.id!==exercise.id?ex:{ ...ex, distance_unit: unit as any })); }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button variant={exercise.timeCompleted?'default':'outline'} size="sm" onClick={()=>setTimeCompleted(exercise.id,!exercise.timeCompleted)} title={exercise.timeCompleted?'Click to undo':'Mark as complete'}><Check className={`h-4 w-4 mr-2 ${exercise.timeCompleted?'text-white':''}`} />{exercise.timeCompleted?'Done':'Complete'}</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {exercise.sets.map((set,index)=>(
                        <div key={index} className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${set.completed?'bg-green-50 border border-green-200':'bg-muted/50 hover:bg-muted/70'}`}>
                          <div className="w-8 text-center font-medium">{set.setNumber}</div>
                          {exercise.enableReps!==false && (<div className="flex items-center gap-2"><label className="text-sm font-medium w-12">Reps:</label><NumberStepper value={set.reps} onChange={v=>updateSet(exercise.id,index,'reps',v)} min={0} max={50} step={1} unit="" disabled={set.completed} className="w-20" /></div>)}
                          {exercise.enableWeight!==false && (<div className="flex items-center gap-2"><label className="text-sm font-medium w-16">Weight:</label><NumberStepper value={useLbs?Math.round(set.weight*2.20462*2)/2:set.weight} onChange={v=>{ const kg=useLbs?Math.round(v/2.20462*2)/2:v; updateSet(exercise.id,index,'weight',kg); }} min={0} max={useLbs?400:180} step={useLbs?2.5:0.5} unit={useLbs?'lbs':'kg'} disabled={set.completed} className="w-24" /></div>)}
                          <Button variant={set.completed?'default':'outline'} size="sm" onClick={()=>toggleSet(exercise.id,index)} className="ml-auto" title={set.completed?'Click to undo':'Mark as complete'}><Check className={`h-4 w-4 mr-2 ${set.completed?'text-white':''}`} />{set.completed?'Done':'Complete'}</Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>
    ))}
    {provided.placeholder}
  </div>
)}
</Droppable>
</DragDropContext>

            {/* Add Exercise */}
            <Card className="border-dashed hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-8 text-center">
            <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
              <DialogTrigger asChild><Button variant="ghost" className="gap-2" size="lg"><Plus className="h-5 w-5" />Add Exercise</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                <UIDialogHeader><UIDialogTitle>Select Exercise</UIDialogTitle></UIDialogHeader>
                <div className="pb-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                  <div className="flex-1"><Input placeholder="Search exercises (name, muscle, difficulty)" value={exerciseSearch} onChange={e=>setExerciseSearch(e.target.value)} aria-label="Search exercises" /></div>
                  <div className="flex gap-2 items-center">
                    <Select value={muscleFilter} onValueChange={setMuscleFilter}>
                      <SelectTrigger className="w-[180px]" aria-label="Filter by muscle group"><SelectValue placeholder="Muscle Group" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">All Groups</SelectItem>
                        {uniqueMuscleGroups.map(g=>(<SelectItem key={g} value={g}>{g}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(() => { const q=exerciseSearch.trim().toLowerCase(); const base=q?availableExercises.filter(ex=>[ex.name,ex.muscle_group,ex.difficulty,ex.description].filter(Boolean).join(' ').toLowerCase().includes(q)):availableExercises; const list=base.filter(ex=>{ if(muscleFilter==='all') return true; const groups=(ex.muscle_group||'').toLowerCase().split(',').map(g=>g.trim()); return groups.includes(muscleFilter.toLowerCase()); }); const favSet=new Set(favoriteExercises); const recIndex=(iid:string)=>{ const idx=recentExercises.indexOf(iid); return idx===-1?9999:idx; }; list.sort((a,b)=>{ const aFav=favSet.has(a.exercise_id)?1:0; const bFav=favSet.has(b.exercise_id)?1:0; if(aFav!==bFav) return bFav-aFav; const ar=recIndex(a.exercise_id); const br=recIndex(b.exercise_id); if(ar!==br) return ar-br; return a.name.localeCompare(b.name); }); if(!list.length) return <div className="py-6 text-sm text-muted-foreground">No exercises match “{exerciseSearch}”.</div>; return (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">{list.map(exercise=>(<Card key={exercise.exercise_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={()=>addExercise(exercise)}><CardContent className="p-4"><div className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="font-medium truncate" title={exercise.name}>{exercise.name}</div><Button variant="ghost" size="icon" className={favoriteExercises.includes(exercise.exercise_id)?'text-yellow-500':''} onClick={e=>{e.stopPropagation(); toggleFavoriteExercise(exercise.exercise_id);}} title={favoriteExercises.includes(exercise.exercise_id)?'Unpin favorite':'Pin as favorite'}><Star className={`h-4 w-4 ${favoriteExercises.includes(exercise.exercise_id)?'fill-yellow-400':''}`} /></Button></div><div className="flex items-center gap-2 flex-wrap">{exercise.muscle_group && (<div className="flex flex-wrap gap-1">{exercise.muscle_group.split(',').map(g=>(<Badge key={g.trim()} variant="secondary" className="text-[10px] px-1 py-0">{g.trim()}</Badge>))}</div>)}{exercise.difficulty && (<Badge variant="outline" className="text-xs">{exercise.difficulty}</Badge>)}{favoriteExercises.includes(exercise.exercise_id) && (<Badge variant="outline" className="text-xs">Favorite</Badge>)}{recentExercises.includes(exercise.exercise_id) && (<Badge variant="secondary" className="text-xs">Recent</Badge>)} </div>{exercise.description && (<p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>)}</div></CardContent></Card>))}</div>); })()}
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground mt-2">Browse and add an exercise to this workout</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkoutSession;