import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExerciseDefaults {
  target_sets: number;
  target_reps: string;
  target_weight: number;
  target_duration_sec: number;
  target_distance_km: number;
}

export const useExerciseDefaults = (exerciseId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-defaults', user?.id, exerciseId],
    queryFn: async (): Promise<ExerciseDefaults> => {
      const defaults: ExerciseDefaults = {
        target_sets: 3,
        target_reps: '10',
        target_weight: 20,
        target_duration_sec: 0,
        target_distance_km: 0,
      };

      if (!user?.id || !exerciseId) return defaults;
      
      // Fetch last log for this user and exercise
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
      
      if (error || !data) return defaults;

      // Parse values from last log
      const sets = data.sets || defaults.target_sets;
      const reps = data.reps_per_set || defaults.target_reps;
      const weights = data.weight_per_set?.split(',').map((w: string) => parseFloat(w.trim())) || [];
      const weight = weights.length > 0 ? weights[0] : defaults.target_weight;
      const duration = data.duration_seconds || defaults.target_duration_sec;
      const distance = data.distance_km || defaults.target_distance_km;

      return {
        target_sets: sets,
        target_reps: reps,
        target_weight: weight,
        target_duration_sec: duration,
        target_distance_km: distance,
      };
    },
    enabled: !!user?.id && !!exerciseId,
    staleTime: 0, // Always fetch fresh
  });
};
