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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const clearDebounceTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
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
        const { data, error } = await supabase
          .from('exercise_logs')
          .insert(logs)
          .select();
        
        if (error) throw error;
        return data;
      }
      return [];
    },
    onSuccess: () => {
      // Don't invalidate queries during autosave to prevent refetch overwriting local state
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Auto-save exercise logs failed:', error);
      onError?.(error);
    },
  });

  const debouncedSaveSession = useCallback((sessionId: string, data: any) => {
    clearDebounceTimeout();
    timeoutRef.current = setTimeout(() => {
      autoSaveSession.mutate({ sessionId, data });
    }, delay);
  }, [delay, autoSaveSession.mutate, clearDebounceTimeout]);

  const debouncedSaveExerciseLogs = useCallback((logs: any[]) => {
    clearDebounceTimeout();
    timeoutRef.current = setTimeout(() => {
      autoSaveExerciseLogs.mutate(logs);
    }, delay);
  }, [delay, autoSaveExerciseLogs.mutate, clearDebounceTimeout]);

  const saveImmediately = useCallback((sessionId: string, data: any) => {
    clearDebounceTimeout();
    autoSaveSession.mutate({ sessionId, data });
  }, [autoSaveSession.mutate, clearDebounceTimeout]);

  const saveExerciseLogsImmediately = useCallback((logs: any[]) => {
    clearDebounceTimeout();
    autoSaveExerciseLogs.mutate(logs);
  }, [autoSaveExerciseLogs.mutate, clearDebounceTimeout]);

  useEffect(() => {
    return () => {
      clearDebounceTimeout();
    };
  }, [clearDebounceTimeout]);

  return {
    debouncedSaveSession,
    debouncedSaveExerciseLogs,
    saveImmediately,
    saveExerciseLogsImmediately,
    isAutoSaving: autoSaveSession.isPending || autoSaveExerciseLogs.isPending,
    clearTimeout: clearDebounceTimeout,
  };
};