import { useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoSaveOptions {
  delay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const { delay = 2000, onSuccess, onError } = options;
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const exerciseLogsTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = undefined;
    }
  }, []);

  const clearExerciseLogsTimeout = useCallback(() => {
    if (exerciseLogsTimeoutRef.current) {
      clearTimeout(exerciseLogsTimeoutRef.current);
      exerciseLogsTimeoutRef.current = undefined;
    }
  }, []);

  const autoSaveSession = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
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
      // Invalidate queries to ensure Schedule and other pages get fresh data
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      onError?.(error);
    },
  });

  const autoSaveExerciseLogs = useMutation({
    mutationFn: async (logs: Array<{
      session_id: string;
      exercise_id: string;
      sets?: number;
      reps_per_set?: string;
      weight_per_set?: string;
      duration_seconds?: number;
      distance_km?: number;
      duration_unit?: string;
      distance_unit?: string;
      exercise_order?: number;
      notes?: string;
      pace?: number; // Pace for cardio exercises
      completed?: boolean;
      completed_at?: string | null;
    }>) => {
      // First, delete existing logs for this session
      const sessionId = logs[0]?.session_id;
      if (sessionId) {
        await supabase
          .from('exercise_logs')
          .delete()
          .eq('session_id', sessionId);
      }

      // Insert new logs
      if (logs.length > 0) {
        try {
          const { data, error } = await supabase
            .from('exercise_logs')
            .insert(logs)
            .select();
          
          if (error) throw error;
          console.log('[autosave] Successfully saved exercise logs:', data?.length);
          return data;
        } catch (err: any) {
          console.error('[autosave] Error saving exercise logs:', err);
          // Graceful fallback if pace column not yet migrated
          if (err?.message && err.message.includes('pace')) {
            console.warn('[autosave] pace column missing; retrying without it');
            const stripped = logs.map(l => { 
              const { pace, ...rest } = l as any; 
              return rest; 
            });
            const { data: data2, error: error2 } = await supabase
              .from('exercise_logs')
              .insert(stripped)
              .select();
            if (error2) {
              console.error('[autosave] Fallback also failed:', error2);
              throw error2;
            }
            console.log('[autosave] Fallback succeeded, saved without pace:', data2?.length);
            return data2;
          }
          throw err;
        }
      }
      return [];
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data when navigating back
      // Mark queries as stale but don't refetch immediately to avoid overwriting local state
      queryClient.invalidateQueries({ queryKey: ['exercise-logs'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'], refetchType: 'none' });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Auto-save exercise logs failed:', error);
      onError?.(error);
    },
  });

  const debouncedSaveSession = useCallback((sessionId: string, data: any) => {
    clearSessionTimeout();
    sessionTimeoutRef.current = setTimeout(() => {
      autoSaveSession.mutate({ sessionId, data });
    }, delay);
  }, [delay, autoSaveSession.mutate, clearSessionTimeout]);

  const debouncedSaveExerciseLogs = useCallback((logs: any[]) => {
    clearExerciseLogsTimeout();
    exerciseLogsTimeoutRef.current = setTimeout(() => {
      autoSaveExerciseLogs.mutate(logs);
    }, delay);
  }, [delay, autoSaveExerciseLogs.mutate, clearExerciseLogsTimeout]);

  const saveImmediately = useCallback((sessionId: string, data: any) => {
    clearSessionTimeout();
    autoSaveSession.mutate({ sessionId, data });
  }, [autoSaveSession.mutate, clearSessionTimeout]);

  const saveExerciseLogsImmediately = useCallback((logs: any[]) => {
    clearExerciseLogsTimeout();
    autoSaveExerciseLogs.mutate(logs);
  }, [autoSaveExerciseLogs.mutate, clearExerciseLogsTimeout]);

  useEffect(() => {
    return () => {
      clearSessionTimeout();
      clearExerciseLogsTimeout();
    };
  }, [clearSessionTimeout, clearExerciseLogsTimeout]);

  return {
    debouncedSaveSession,
    debouncedSaveExerciseLogs,
    saveImmediately,
    saveExerciseLogsImmediately,
    isAutoSaving: autoSaveSession.isPending || autoSaveExerciseLogs.isPending,
    clearSessionTimeout,
    clearExerciseLogsTimeout,
  };
};