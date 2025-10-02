import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseLog } from './useWorkoutData';

export const useExerciseLastLog = (exerciseId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-last-log', user?.id, exerciseId],
    queryFn: async () => {
      if (!user?.id || !exerciseId) return null;
      
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          session:workout_sessions!inner(
            user_id,
            status,
            date
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('session.user_id', user.id)
        .eq('session.status', 'Done')
        .order('session.date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ExerciseLog | null;
    },
    enabled: !!user?.id && !!exerciseId,
  });
};

export const useExerciseHistory = (exerciseId: string, limit: number = 10) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-history', user?.id, exerciseId, limit],
    queryFn: async () => {
      if (!user?.id || !exerciseId) return [];
      
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          session:workout_sessions!inner(
            user_id,
            status,
            date
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('session.user_id', user.id)
        .eq('session.status', 'Done')
        .order('session.date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as (ExerciseLog & { session: { date: string } })[];
    },
    enabled: !!user?.id && !!exerciseId,
  });
};
