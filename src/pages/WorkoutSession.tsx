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
import { ArrowLeft, Plus, Play, Pause, Check, Timer, Dumbbell, Save, Minus, CheckSquare, Star, Edit, X as XIcon, GripVertical, Cloud } from 'lucide-react';
import NumberStepper from '@/components/ui/number-stepper';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { toast } from 'sonner';
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';
import { useWorkoutSessions, useExercises, useExerciseLogs, useCreateExerciseLog, useCreateWorkoutSession, useUpdateWorkoutSession } from '@/hooks/useWorkoutData';
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
  const createExerciseLog = useCreateExerciseLog();
  const createSession = useCreateWorkoutSession();
  const updateSession = useUpdateWorkoutSession();
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
  
  // Auto-save state tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Metadata edit state
  const [editingMeta,setEditingMeta] = useState(false);
  const [metaDraft,setMetaDraft] = useState({ title: currentWorkout?.title||'', date: currentWorkout?.date||'', time: currentWorkout?.time||'', notes:(currentWorkout as any)?.notes||'' });
  useEffect(()=>{ if(currentWorkout){ setMetaDraft({ title: currentWorkout.title||'', date: currentWorkout.date||'', time: currentWorkout.time||'', notes:(currentWorkout as any)?.notes||'' }); } }, [currentWorkout?.title,currentWorkout?.date,currentWorkout?.time,(currentWorkout as any)?.notes]);

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
            timeCompleted:false,
            metric_time, metric_reps, metric_weight, metric_distance: base?.metric_distance||false,
            durationSeconds: undefined,
            distanceKm: undefined,
        } as ExerciseWithSets; 
        if(log.sets){ 
          const reps=log.reps_per_set?log.reps_per_set.split(',').map(r=>parseInt(r)||0):[]; 
          const weights=log.weight_per_set?log.weight_per_set.split(',').map(w=>parseInt(w)||0):[]; 
          for(let i=0;i<log.sets;i++){ 
            acc[eid].sets.push({ setNumber:i+1, reps: reps[i]||0, weight: weights[i]||0, completed:false }); 
          } 
        } else if (log.duration_seconds) {
          // Time-based planned/logged exercise
          acc[eid].durationSeconds = log.duration_seconds; // store raw seconds; UI will interpret based on unit toggles later
        }
        if ((log as any).distance_km) {
          acc[eid].distanceKm = (log as any).distance_km;
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

  // Auto-save exercise logs when exercises change
  const autoSaveExerciseLogs = useCallback(() => {
    if (!currentWorkout || !exercises.length) return;
    
    const logs = exercises.map((exercise, index) => {
      const baseLog = {
        session_id: currentWorkout.session_id,
        exercise_id: exercise.id,
        exercise_order: index,
      };

      if (exercise.mode === 'time') {
        if (exercise.timeCompleted && exercise.durationSeconds) {
          // durationSeconds is already in canonical seconds, no conversion needed
          const logData: any = {
            ...baseLog,
            duration_seconds: exercise.durationSeconds,
          };
          
          // distanceKm is already in canonical km, no conversion needed
          if (exercise.metric_distance && exercise.distanceKm) {
            logData.distance_km = exercise.distanceKm;
          }
          
          return logData;
        }
      } else {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length > 0) {
          const logData: any = {
            ...baseLog,
            sets: completedSets.length,
          };
          
          if (exercise.metric_reps) {
            logData.reps_per_set = completedSets.map(s => s.reps).join(',');
          }
          
          if (exercise.metric_weight) {
            logData.weight_per_set = completedSets.map(s => s.weight).join(',');
          }
          
          return logData;
        }
      }
      
      // Return placeholder for exercises with no data yet
      return {
        ...baseLog,
        sets: 0,
      };
    }).filter(Boolean);

    if (logs.length > 0) {
      setSaveState('saving');
      autoSave.debouncedSaveExerciseLogs(logs);
    }
  }, [exercises, currentWorkout, autoSave.debouncedSaveExerciseLogs]);

  // Auto-save metadata when changed
  const autoSaveMetadata = useCallback((field: string, value: string) => {
    if (!currentWorkout) return;
    
    const cleaned = {
      [field]: value.trim() || null,
    };

    const oldVal = (currentWorkout as any)[field] ?? null;
    if (cleaned[field] !== oldVal) {
      markChangesAndAutoSave(() => {
        autoSave.debouncedSaveSession(currentWorkout.session_id, cleaned);
      });
    }
  }, [currentWorkout, autoSave.debouncedSaveSession, markChangesAndAutoSave]);

  // Trigger autosave when exercises change
  useEffect(() => {
    if (currentWorkout && exercises.length > 0 && hasUnsavedChanges) {
      autoSaveExerciseLogs();
    }
  }, [exercises, autoSaveExerciseLogs, hasUnsavedChanges]);

  // Timer
  useEffect(()=>{ let int:any; if(isActive) int=setInterval(()=>{setDuration(d=>d+1); setHasUnsavedChanges(true);},1000); return ()=>clearInterval(int); }, [isActive]);
  const toggleSet=(eid:string,idx:number)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?{...ex,sets:ex.sets.map((s,i)=>i===idx?{...s,completed:!s.completed}:s)}:ex));};
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
  const setAllSetsCompletion=(eid:string,done:boolean)=>{setHasUnsavedChanges(true);setExercises(p=>p.map(ex=>ex.id===eid?{...ex,sets:ex.sets.map(s=>({...s,completed:done}))}:ex));};

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
  useEffect(()=>{ if(!currentWorkout || updateSession.isPending) return; if(totalSets>0 && completedSets===totalSets && currentWorkout.status!=='Done' && !autoMarkedDoneRef.current){ autoMarkedDoneRef.current=true; updateSession.mutate({ sessionId: currentWorkout.session_id, data:{ status:'Done' } }, { onSuccess:()=>{ confetti({ particleCount:80, spread:55, origin:{y:0.3} }); toast.success('All sets complete. Marked as Done'); } }); } }, [completedSets,totalSets,currentWorkout?.status,currentWorkout?.session_id]);
  useEffect(()=>{ if(!currentWorkout || updateSession.isPending) return; if(totalSets===0) return; if(completedSets < totalSets && currentWorkout.status==='Done'){ updateSession.mutate({ sessionId: currentWorkout.session_id, data:{ status:'Planned' } }, { onSuccess:()=>toast('Marked as Planned') }); autoMarkedDoneRef.current=false; } }, [completedSets,totalSets,currentWorkout?.status,currentWorkout?.session_id]);
  const toggleWorkoutStatus=()=>{ if(!currentWorkout) return; const next=currentWorkout.status==='Done'?'Planned':'Done'; updateSession.mutate({ sessionId: currentWorkout.session_id, data:{ status: next } }, { onSuccess:()=>{ if(next==='Done') confetti({ particleCount:60, spread:45, origin:{y:0.3} }); } }); };

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
    if(!ex.metric_distance) return '';
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
            <Button variant="outline" size="sm" onClick={toggleWorkoutStatus} disabled={updateSession.isPending} className={currentWorkout.status==='Done'?'border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/20':'flex items-center gap-2'} title={currentWorkout.status==='Done'?'Click to mark as planned':'Click to mark as done'}>
              <CheckSquare className="h-4 w-4" />{currentWorkout.status==='Done'?'Done':'Mark Done'}
            </Button>
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
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Duration:</label>
                        <NumberStepper
                          value={getDisplayDuration(exercise)}
                          onChange={(v) => setDisplayDuration(exercise.id, v)}
                          min={exercise.duration_unit==='hr' ? 0.1 : exercise.duration_unit==='min' ? 1 : 5}
                          max={exercise.duration_unit==='hr' ? 24 : exercise.duration_unit==='min' ? 300 : 3600}
                          step={exercise.duration_unit==='hr' ? 0.25 : exercise.duration_unit==='min' ? 1 : 15}
                        />
                        <UnitToggle
                          units={['sec','min','hr']}
                          value={exercise.duration_unit || 'min'}
                          onChange={(unit)=>updateDurationUnit(exercise.id, unit as any)}
                        />
                      </div>
                      {exercise.metric_distance && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Distance:</label>
                          <NumberStepper
                            value={getDisplayDistance(exercise) as number}
                            onChange={(v) => setDisplayDistance(exercise.id, v)}
                            min={0}
                            max={exercise.distance_unit==='m' ? 50000 : 50}
                            step={exercise.distance_unit==='m' ? 100 : 0.5}
                          />
                          <UnitToggle
                            units={['m','km']}
                            value={exercise.distance_unit || 'km'}
                            onChange={(unit)=>updateDistanceUnit(exercise.id, unit as any)}
                          />
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Reps:</label>
                          <NumberStepper
                            value={exercise.sets[0]?.reps||0}
                            onChange={(v) => updateAllSets(exercise.id,'reps',v)}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                      )}
                      {exercise.metric_weight && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Weight:</label>
                          <NumberStepper
                            value={useLbs?Math.round((exercise.sets[0]?.weight||0)*2.20462):(exercise.sets[0]?.weight||0)}
                            onChange={(v) => {
                              const kg=useLbs?Math.round(v/2.20462):v;
                              updateAllSets(exercise.id,'weight',kg);
                            }}
                            min={0}
                            max={useLbs?1000:500}
                            step={useLbs?5:2.5}
                            unit={useLbs?'lbs':'kg'}
                          />
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-4">
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
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium w-20">Duration:</label>
                        <NumberStepper
                          value={getDisplayDuration(exercise)}
                          onChange={(v) => setDisplayDuration(exercise.id, v)}
                          min={exercise.duration_unit==='hr' ? 0.1 : exercise.duration_unit==='min' ? 1 : 5}
                          max={exercise.duration_unit==='hr' ? 24 : exercise.duration_unit==='min' ? 300 : 3600}
                          step={exercise.duration_unit==='hr' ? 0.25 : exercise.duration_unit==='min' ? 1 : 15}
                        />
                        <UnitToggle
                          units={['sec', 'min', 'hr']}
                          value={exercise.duration_unit || 'min'}
                          onChange={(unit) => updateDurationUnit(exercise.id, unit as any)}
                        />
                      </div>
                      {exercise.metric_distance && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium w-20">Distance:</label>
                          <NumberStepper
                            value={getDisplayDistance(exercise) as number}
                            onChange={(v) => setDisplayDistance(exercise.id, v)}
                            min={0}
                            max={exercise.distance_unit==='m' ? 50000 : 50}
                            step={exercise.distance_unit==='m' ? 100 : 0.5}
                          />
                          <UnitToggle
                            units={['m', 'km']}
                            value={exercise.distance_unit || 'km'}
                            onChange={(unit) => updateDistanceUnit(exercise.id, unit as any)}
                          />
                        </div>
                      )}
                      <Button variant={exercise.timeCompleted?'default':'outline'} size="sm" onClick={()=>setTimeCompleted(exercise.id,!exercise.timeCompleted)} className="ml-auto" title={exercise.timeCompleted?'Click to undo':'Mark as complete'}><Check className={`h-4 w-4 mr-2 ${exercise.timeCompleted?'text-white':''}`} />{exercise.timeCompleted?'Done':'Complete'}</Button>
                    </div>
                  ) : (
                    <>
                      {exercise.sets.map((set,index)=>(
                        <div key={index} className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${set.completed?'bg-green-50 border border-green-200':'bg-muted/50 hover:bg-muted/70'}`}>
                          <div className="w-8 text-center font-medium">{set.setNumber}</div>
                          {exercise.enableReps!==false && (<div className="flex items-center gap-2"><label className="text-sm font-medium w-12">Reps:</label><Input type="number" value={set.reps} onChange={e=>updateSet(exercise.id,index,'reps',parseInt(e.target.value)||0)} className="w-20 h-9" disabled={set.completed} /></div>)}
                          {exercise.enableWeight!==false && (<div className="flex items-center gap-2"><label className="text-sm font-medium w-16">Weight:</label><Input type="number" value={useLbs?Math.round(set.weight*2.20462):set.weight} onChange={e=>{ const raw=parseInt(e.target.value)||0; const kg=useLbs?Math.round(raw/2.20462):raw; updateSet(exercise.id,index,'weight',kg); }} className="w-24 h-9" disabled={set.completed} /><span className="text-sm text-muted-foreground">{useLbs?'lbs':'kg'}</span></div>)}
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