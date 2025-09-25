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
        .order('date', { ascending: false });
      
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
      return data as Exercise[];
    },
  });
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
        .delete()
        .eq('session_id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      toast.success('Workout session deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete workout session');
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
      
      // Get workout sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Done');
      
      if (sessionsError) throw sessionsError;
      
      // Get exercise logs with exercise details
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          workout_sessions!inner(user_id, date, status),
          exercise:exercises(name, muscle_group, equipment)
        `)
        .eq('workout_sessions.user_id', user.id)
        .eq('workout_sessions.status', 'Done');
      
      if (logsError) throw logsError;
      
      return { sessions, logs };
    },
    enabled: !!user?.id,
  });
};

export const useExportWorkoutData = () => {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Fetch all user data
      const [sessionsRes, goalsRes, logsRes] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase
          .from('exercise_logs')
          .select(`
            *,
            workout_sessions!inner(user_id),
            exercise:exercises(name, muscle_group, equipment)
          `)
          .eq('workout_sessions.user_id', user.id)
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