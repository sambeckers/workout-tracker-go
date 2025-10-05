import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkoutSession {
  session_id: string;
  user_id: string;
  date: string;
  time?: string;
  title?: string;
  status: 'Planned' | 'Done' | 'Skipped';
  notes?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Exercise {
  exercise_id: string;
  name: string;
  muscle_group?: string;
  description?: string;
  media_url?: string;
  equipment?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  created_by?: string;
  // Metric capability flags (schema fields)
  metric_weight?: boolean; // uses weight field
  metric_reps?: boolean;   // uses reps/sets
  metric_time?: boolean;   // uses duration
  metric_distance?: boolean; // uses distance_km
  created_at: string;
  updated_at: string;
}

export interface ExerciseLog {
  log_id: string;
  session_id: string;
  exercise_id: string;
  sets?: number;
  reps_per_set?: string;
  weight_per_set?: string;
  duration_seconds?: number;
  distance_km?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon?: string;
  image_url?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  goal_id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: 'Strength' | 'Weight Loss' | 'Rehab' | 'Conditioning' | 'Flexibility';
  target_value?: string;
  current_value?: string;
  deadline?: string;
  status: 'Active' | 'Completed' | 'Abandoned';
  created_at: string;
  updated_at: string;
}

// =============================
// Workout Templates (new feature)
// =============================
export interface WorkoutTemplate {
  template_id: string;
  user_id: string;
  template_name: string;
  notes?: string | null;
  use_count: number;
  last_used?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  exercises?: WorkoutTemplateExercise[]; // joined convenience
}

export interface WorkoutTemplateExercise {
  id: number;
  template_id: string;
  exercise_id: string;
  exercise_order: number;
  created_at: string;
  exercise?: Exercise; // join helper
}

export const useWorkoutSessions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['workout-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!user?.id,
  });
};

export const useDeletedWorkoutSessions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['deleted-workout-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      
      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!user?.id,
  });
};

export const useExercises = () => {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      const list = (data as Exercise[]).map(e => inferExerciseMetrics(e));
      return list;
    },
  });
};

// Fallback metric inference if migration not applied to some records
const inferExerciseMetrics = (e: Exercise): Exercise => {
  // If flags already present, trust them
  if (typeof e.metric_weight === 'boolean' || typeof e.metric_time === 'boolean') return e;
  const n = e.name.toLowerCase();
  const cardio = /(running|treadmill|rowing|cycling|boxing|crosstraining|padel|tennis|soccer|stairs|yoga|stretch|sauna)/.test(n);
  const distance = /(running|treadmill|rowing|cycling)/.test(n);
  const hold = /(plank|dead *hang|deadhang|hold)/.test(n);
  const kettlebell = /kettlebell/.test(n);
  let metric_time = false, metric_distance = false, metric_weight = true, metric_reps = true;
  if (cardio) { metric_time = true; metric_weight = false; metric_reps = false; }
  if (distance) { metric_distance = true; }
  if (hold) { metric_time = true; metric_weight = false; metric_reps = false; }
  if (kettlebell) { /* keep defaults */ }
  return { ...e, metric_time, metric_distance, metric_weight, metric_reps };
};

export const useGoals = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user?.id,
  });
};

export const useExerciseLogs = (sessionId?: string) => {
  return useQuery({
    queryKey: ['exercise-logs', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at');
      
      if (error) throw error;
      return data as ExerciseLog[];
    },
    enabled: !!sessionId,
  });
};

export const useCreateWorkoutSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<WorkoutSession, 'session_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: result, error } = await supabase
        .from('workout_sessions')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      toast.success('Workout session created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create workout session');
      console.error(error);
    },
  });
};

export const useUpdateWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: Partial<WorkoutSession> }) => {
      const { data: result, error } = await supabase
        .from('workout_sessions')
        .update(data)
        .eq('session_id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      toast.success('Workout session updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update workout session');
      console.error(error);
    },
  });
};

export const useDeleteWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('session_id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-workout-sessions'] });
      toast.success('Workout session moved to bin');
    },
    onError: (error) => {
      toast.error('Failed to delete workout session');
      console.error(error);
    },
  });
};

export const useRestoreWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ deleted_at: null })
        .eq('session_id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-workout-sessions'] });
      toast.success('Workout session restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to restore workout session');
      console.error(error);
    },
  });
};

export const usePermanentlyDeleteWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // First delete associated exercise logs
      const { error: logsError } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('session_id', sessionId);
      
      if (logsError) throw logsError;
      
      // Then delete the session
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('session_id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-workout-sessions'] });
      toast.success('Workout session permanently deleted');
    },
    onError: (error) => {
      toast.error('Failed to permanently delete workout session');
      console.error(error);
    },
  });
};

export const useEmptyBin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get all deleted sessions
      const { data: deletedSessions, error: fetchError } = await supabase
        .from('workout_sessions')
        .select('session_id')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null);
      
      if (fetchError) throw fetchError;
      
      // Get all deleted templates
      const { data: deletedTemplates, error: fetchTemplatesError } = await (supabase as any)
        .from('workout_templates')
        .select('template_id')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null);
      
      if (fetchTemplatesError) throw fetchTemplatesError;
      
      let count = 0;
      
      // Delete all sessions and their logs
      if (deletedSessions && deletedSessions.length > 0) {
        const sessionIds = deletedSessions.map(s => s.session_id);
        
        // Delete all associated exercise logs
        const { error: logsError } = await supabase
          .from('exercise_logs')
          .delete()
          .in('session_id', sessionIds);
        
        if (logsError) throw logsError;
        
        // Delete all sessions
        const { error } = await supabase
          .from('workout_sessions')
          .delete()
          .in('session_id', sessionIds);
        
        if (error) throw error;
        count += sessionIds.length;
      }
      
      // Delete all templates and their exercises
      if (deletedTemplates && deletedTemplates.length > 0) {
        const templateIds = deletedTemplates.map((t: any) => t.template_id);
        
        // Delete all associated template exercises
        const { error: templateExercisesError } = await (supabase as any)
          .from('workout_template_exercises')
          .delete()
          .in('template_id', templateIds);
        
        if (templateExercisesError) throw templateExercisesError;
        
        // Delete all templates
        const { error: templatesError } = await (supabase as any)
          .from('workout_templates')
          .delete()
          .in('template_id', templateIds);
        
        if (templatesError) throw templatesError;
        count += templateIds.length;
      }
      
      return count;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['deleted-workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-workout-templates'] });
      toast.success(`Permanently deleted ${count} item${count !== 1 ? 's' : ''}`);
    },
    onError: (error) => {
      toast.error('Failed to empty bin');
      console.error(error);
    },
  });
};

export const useCreateGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Goal, 'goal_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: result, error } = await supabase
        .from('goals')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create goal');
      console.error(error);
    },
  });
};

export const useCreateExerciseLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ExerciseLog, 'log_id' | 'created_at' | 'updated_at' | 'exercise'>) => {
      const { data: result, error } = await supabase
        .from('exercise_logs')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-logs'] });
      toast.success('Exercise log saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save exercise log');
      console.error(error);
    },
  });
};

export const useBulkCreateExerciseLogs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logs: Array<Omit<ExerciseLog, 'log_id' | 'created_at' | 'updated_at'>>) => {
      if (!logs.length) return [];
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert(logs)
        .select();
      if (error) throw error;
      return data as ExerciseLog[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-logs'] });
    },
    onError: (error) => {
      toast.error('Failed to save planned exercises');
      console.error(error);
    }
  });
};

export const useProgressData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['progress-data', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get workout sessions (excluding deleted ones)
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Done')
        .is('deleted_at', null);
      
      if (sessionsError) throw sessionsError;
      
      // Get exercise logs with exercise details (excluding deleted sessions)
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          session:workout_sessions!inner(user_id, date, status, deleted_at),
          exercise:exercises(name, muscle_group, equipment, metric_weight, metric_reps, metric_time, metric_distance)
        `)
        .eq('session.user_id', user.id)
        .eq('session.status', 'Done')
        .is('session.deleted_at', null);
      
      if (logsError) throw logsError;
      
      return { sessions, logs };
    },
    enabled: !!user?.id,
  });
};

// =============================
// Template Hooks
// =============================
export const useWorkoutTemplates = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout-templates', user?.id],
    queryFn: async () => {
      if(!user?.id) throw new Error('User not authenticated');
      // Cast supabase to any because generated types don't yet include new tables
      const { data, error } = await (supabase as any)
        .from('workout_templates')
        .select('*, workout_template_exercises:workout_template_exercises(*, exercise:exercises(*))')
        .is('deleted_at', null)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if(error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        exercises: (t.workout_template_exercises || []).sort((a: any,b: any)=>a.exercise_order-b.exercise_order)
      })) as WorkoutTemplate[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateWorkoutTemplate = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_name: string; notes?: string | null; exercises: { exercise_id: string; exercise_order: number; }[] }) => {
      if(!user?.id) throw new Error('User not authenticated');
      const { data: tpl, error: tplErr } = await (supabase as any)
        .from('workout_templates')
        .insert({ template_name: input.template_name, notes: input.notes || null, user_id: user.id })
        .select()
        .single();
      if(tplErr){
        console.error('[create template] insert error', tplErr);
        throw tplErr;
      }
      if(input.exercises.length){
        const rows = input.exercises.map(e=>({ template_id: tpl.template_id, exercise_id: e.exercise_id, exercise_order: e.exercise_order }));
        const { error: exErr } = await (supabase as any).from('workout_template_exercises').insert(rows);
        if(exErr){
          console.error('[create template] insert exercises error', exErr);
          throw exErr;
        }
      }
      return tpl as WorkoutTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-templates'] });
      toast.success('Template created');
    },
    onError: (e) => { toast.error('Failed to create template'); console.error(e); }
  });
};

export const useUpdateWorkoutTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_id: string; template_name?: string; notes?: string | null; exercises?: { exercise_id: string; exercise_order: number; id?: number }[] }) => {
      const { template_id, template_name, notes, exercises } = input;
      if(template_name!=null || notes!==undefined){
        const { error: upErr } = await (supabase as any)
          .from('workout_templates')
          .update({ template_name: template_name, notes })
          .eq('template_id', template_id);
        if(upErr) throw upErr;
      }
      if(exercises){
        const { error: delErr } = await (supabase as any)
          .from('workout_template_exercises')
          .delete()
          .eq('template_id', template_id);
        if(delErr) throw delErr;
        if(exercises.length){
          const rows = exercises.map(e=>({ template_id, exercise_id: e.exercise_id, exercise_order: e.exercise_order }));
          const { error: insErr } = await (supabase as any).from('workout_template_exercises').insert(rows);
          if(insErr) throw insErr;
        }
      }
      return template_id;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout-templates'] }); toast.success('Template updated'); },
    onError: (e) => { toast.error('Failed to update template'); console.error(e); }
  });
};

export const useDeleteWorkoutTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template_id: string) => {
      const { error } = await (supabase as any)
        .from('workout_templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('template_id', template_id);
      if(error) throw error;
      return template_id;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['workout-templates'] }); 
      qc.invalidateQueries({ queryKey: ['deleted-workout-templates'] });
      toast.success('Template moved to bin'); 
    },
    onError: (e) => { toast.error('Failed to delete template'); console.error(e); }
  });
};

export const useDeletedWorkoutTemplates = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deleted-workout-templates', user?.id],
    queryFn: async () => {
      if(!user?.id) throw new Error('User not authenticated');
      const { data, error } = await (supabase as any)
        .from('workout_templates')
        .select('*, workout_template_exercises:workout_template_exercises(*, exercise:exercises(*))')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if(error) throw error;
      const templates: WorkoutTemplate[] = (data||[]).map((t: any)=>{
        const exercises = (t.workout_template_exercises||[]).map((wte: any)=>({ 
          ...wte, 
          exercise: wte.exercise 
        }));
        return { ...t, exercises };
      });
      return templates;
    },
    enabled: !!user?.id
  });
};

export const useRestoreWorkoutTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template_id: string) => {
      const { error } = await (supabase as any)
        .from('workout_templates')
        .update({ deleted_at: null })
        .eq('template_id', template_id);
      if(error) throw error;
      return template_id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-templates'] });
      qc.invalidateQueries({ queryKey: ['deleted-workout-templates'] });
      toast.success('Template restored successfully');
    },
    onError: (e) => { toast.error('Failed to restore template'); console.error(e); }
  });
};

export const usePermanentlyDeleteWorkoutTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template_id: string) => {
      // First delete associated exercises
      const { error: exErr } = await (supabase as any)
        .from('workout_template_exercises')
        .delete()
        .eq('template_id', template_id);
      if(exErr) throw exErr;
      
      // Then delete the template
      const { error } = await (supabase as any)
        .from('workout_templates')
        .delete()
        .eq('template_id', template_id);
      if(error) throw error;
      return template_id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deleted-workout-templates'] });
      toast.success('Template permanently deleted');
    },
    onError: (e) => { toast.error('Failed to permanently delete template'); console.error(e); }
  });
};

export const useRegisterTemplateUse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template_id: string) => {
      // RPC not yet defined in code-generated types; do manual update
      const { data: tpl, error: fetchErr } = await (supabase as any).from('workout_templates').select('use_count').eq('template_id', template_id).single();
      if(fetchErr) throw fetchErr;
      const { error: upErr } = await (supabase as any).from('workout_templates').update({ use_count: (tpl?.use_count||0)+1, last_used: new Date().toISOString() }).eq('template_id', template_id);
      if(upErr) throw upErr;
      return template_id;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout-templates'] }); },
    onError: (e) => { console.warn('Template use tracking failed', e); }
  });
};

// Recommendation scoring utility
export const scoreTemplates = (templates: WorkoutTemplate[]): { template: WorkoutTemplate; score: number; reason: string; }[] => {
  const now = Date.now();
  return templates.map(t => {
    const last = t.last_used ? new Date(t.last_used).getTime() : 0;
    const days = last ? (now - last)/(1000*60*60*24) : 999;
    // Recentness score (inverse days, cap at 30d)
    const recentness = Math.max(0, 1 - Math.min(days, 30)/30);
    // Frequency normalized (log scale)
    const freq = Math.min(1, Math.log10((t.use_count||0)+1)/Math.log10(20));
    const score = recentness*0.7 + freq*0.3;
    const reason = recentness >= 0.5 ? 'Recently used' : (freq >= 0.4 ? 'Frequently used' : 'Suggested');
    return { template: t, score, reason };
  }).sort((a,b)=>b.score-a.score);
};

export const useExportWorkoutData = () => {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Fetch all user data (excluding deleted sessions)
      const [sessionsRes, goalsRes, logsRes] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('user_id', user.id).is('deleted_at', null),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase
          .from('exercise_logs')
          .select(`
            *,
            workout_sessions!inner(user_id, deleted_at),
            exercise:exercises(name, muscle_group, equipment)
          `)
          .eq('workout_sessions.user_id', user.id)
          .is('workout_sessions.deleted_at', null)
      ]);
      
      if (sessionsRes.error) throw sessionsRes.error;
      if (goalsRes.error) throw goalsRes.error;
      if (logsRes.error) throw logsRes.error;
      
      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        workout_sessions: sessionsRes.data,
        goals: goalsRes.data,
        exercise_logs: logsRes.data,
      };
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return exportData;
    },
    onSuccess: () => {
      toast.success('Workout data exported successfully');
    },
    onError: (error) => {
      toast.error('Failed to export workout data');
      console.error(error);
    },
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ exerciseId, data }: { exerciseId: string; data: Partial<Exercise> }) => {
      console.debug('[useUpdateExercise] Starting update:', { exerciseId, updateData: data });
      
      // First check if the exercise exists
      const { data: existing, error: checkError } = await supabase
        .from('exercises')
        .select('exercise_id, name')
        .eq('exercise_id', exerciseId);
      
      if (checkError) {
        console.error('[useUpdateExercise] Check error:', checkError);
        throw new Error(`Database check failed: ${checkError.message}`);
      }
      
      console.debug('[useUpdateExercise] Existing exercise check:', { exerciseId, existing });
      
      if (!existing || existing.length === 0) {
        throw new Error(`Exercise with ID ${exerciseId} not found in database`);
      }

      // Proceed with update
      const { data: result, error } = await supabase
        .from('exercises')
        .update(data)
        .eq('exercise_id', exerciseId)
        .select();
      
      console.debug('[useUpdateExercise] Update result:', { exerciseId, result, error });
      
      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }
      
      if (!result || result.length === 0) {
        throw new Error(`Update failed:\nExercise with ID ${exerciseId} could not be updated`);
      }
      
      console.debug('[useUpdateExercise] Update successful');
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success('Exercise updated successfully');
    },
    onError: (error) => {
      console.error('[useUpdateExercise] Mutation error:', error);
      const message = error?.message || 'Unknown error';
      toast.error(`Failed to update exercise: ${message}`);
    },
  });
};

// TODO: Add categories hooks after running migration and regenerating Supabase types

// Delete exercise by ID
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('exercise_id', exerciseId);
      if (error) throw error;
      return exerciseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success('Exercise deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete exercise');
      console.error(error);
    }
  });
};

// Delete exercise(s) by name (case-insensitive). Returns number deleted.
export const useDeleteExerciseByName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      // Fetch matching IDs first
      const { data: matches, error: fetchErr } = await supabase
        .from('exercises')
        .select('exercise_id')
        .ilike('name', name);
      if (fetchErr) throw fetchErr;
      if (!matches || matches.length === 0) return 0;
      const ids = matches.map(m => m.exercise_id);
      const { error: delErr } = await supabase
        .from('exercises')
        .delete()
        .in('exercise_id', ids);
      if (delErr) throw delErr;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(`Deleted ${count} exercise${count===1?'':'s'}`);
    },
    onError: (error) => {
      toast.error('Failed to delete by name');
      console.error(error);
    }
  });
};