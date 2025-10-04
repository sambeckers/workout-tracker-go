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

export const useExerciseHistory = (exerciseId: string, limit: number = 25, exerciseName?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-history', user?.id, exerciseId, limit, exerciseName],
    queryFn: async () => {
      if (!user?.id || !exerciseId) return [];
      // Primary fetch by exercise_id
      let { data, error } = await supabase
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
      if (data && data.length > 0) return data as (ExerciseLog & { session: { date: string } })[];
      // Fallback: if no rows and we have a name, attempt name-based join (in case of differing IDs across seeds)
      if (exerciseName) {
        const { data: nameData, error: nameErr } = await supabase
          .from('exercise_logs')
          .select(`
            *,
            session:workout_sessions!inner(user_id,status,date),
            exercise:exercises(name)
          `)
          .eq('session.user_id', user.id)
          .eq('session.status', 'Done')
          .order('session.date', { ascending: false })
          .limit(200);
        if (nameErr) throw nameErr;
        const filtered = (nameData||[]).filter((row: any) => row.exercise?.name?.toLowerCase() === exerciseName.toLowerCase()).map((row:any) => {
          if (row.exercise) {
            // Ensure required Exercise fields for downstream typing; fill minimal placeholders
            row.exercise = {
              exercise_id: row.exercise_id,
              name: row.exercise.name,
              created_at: row.created_at,
              updated_at: row.created_at,
              metric_weight: row.metric_weight,
              metric_reps: row.metric_reps,
              metric_time: row.metric_time,
              metric_distance: row.metric_distance
            };
          }
          return row;
        });
        return filtered as unknown as (ExerciseLog & { session: { date: string } })[];
      }
      return [];
    },
    enabled: !!user?.id && !!exerciseId,
  });
};
