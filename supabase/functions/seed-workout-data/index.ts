import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Fetch all exercises
    const { data: exercises, error: exercisesError } = await supabaseClient
      .from('exercises')
      .select('*');

    if (exercisesError) throw exercisesError;
    if (!exercises || exercises.length === 0) throw new Error('No exercises found');

    // Group exercises by type
    const strengthExercises = exercises.filter(e => e.metric_weight && e.metric_reps);
    const cardioExercises = exercises.filter(e => e.metric_distance || (e.metric_time && !e.metric_weight));
    const bodyweightExercises = exercises.filter(e => e.metric_reps && !e.metric_weight);

    // Generate 100 sessions over the past 12 months
    const sessions = [];
    const logs = [];
    const today = new Date();
    
    // Track progression for each exercise
    const exerciseProgress: Record<string, { weight: number; reps: number; distance: number; duration: number }> = {};

    for (let i = 0; i < 100; i++) {
      // Distribute sessions over past 12 months, with more recent sessions
      const daysAgo = Math.floor((365 * Math.pow((100 - i) / 100, 1.5)));
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - daysAgo);

      // Vary workout types
      const workoutType = i % 4;
      let sessionTitle = '';
      let selectedExercises = [];

      if (workoutType === 0) {
        // Upper body strength
        sessionTitle = 'Upper Body Strength';
        selectedExercises = strengthExercises.filter(e => 
          ['chest', 'shoulders', 'biceps', 'triceps', 'lats'].includes(e.muscle_group?.toLowerCase() || '')
        ).slice(0, 6);
      } else if (workoutType === 1) {
        // Lower body strength
        sessionTitle = 'Lower Body Strength';
        selectedExercises = strengthExercises.filter(e => 
          ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(e.muscle_group?.toLowerCase() || '')
        ).slice(0, 6);
      } else if (workoutType === 2) {
        // Cardio session
        sessionTitle = 'Cardio Session';
        selectedExercises = cardioExercises.slice(0, 3);
      } else {
        // Mixed/full body
        sessionTitle = 'Full Body Workout';
        selectedExercises = [
          ...strengthExercises.slice(0, 4),
          ...bodyweightExercises.slice(0, 2)
        ];
      }

      // Create session
      const session = {
        user_id: user.id,
        date: sessionDate.toISOString().split('T')[0],
        time: `${6 + Math.floor(Math.random() * 12)}:${Math.random() > 0.5 ? '00' : '30'}:00`,
        title: sessionTitle,
        status: 'Completed',
        duration_minutes: 45 + Math.floor(Math.random() * 45),
        notes: null
      };

      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('workout_sessions')
        .insert(session)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add exercise logs for this session
      for (let j = 0; j < selectedExercises.length; j++) {
        const exercise = selectedExercises[j];
        const exerciseId = exercise.exercise_id;

        // Initialize progression if first time
        if (!exerciseProgress[exerciseId]) {
          exerciseProgress[exerciseId] = {
            weight: exercise.metric_weight ? 20 + Math.random() * 30 : 0,
            reps: 8 + Math.floor(Math.random() * 5),
            distance: exercise.metric_distance ? 2 + Math.random() * 3 : 0,
            duration: exercise.metric_time ? 600 + Math.random() * 600 : 0
          };
        }

        // Progressive overload - gradually increase over time
        const progressFactor = 1 + (i / 100) * 0.5; // 50% increase over 100 sessions
        const variance = 0.9 + Math.random() * 0.2; // ±10% variance per session

        const log: any = {
          session_id: sessionData.session_id,
          exercise_id: exerciseId,
          exercise_order: j,
          notes: null
        };

        if (exercise.metric_weight && exercise.metric_reps) {
          // Strength exercise
          const sets = 3 + Math.floor(Math.random() * 2);
          const baseWeight = exerciseProgress[exerciseId].weight * progressFactor * variance;
          const baseReps = Math.max(6, Math.floor(exerciseProgress[exerciseId].reps * variance));
          
          log.sets = sets;
          log.weight_per_set = Array(sets).fill(Math.round(baseWeight * 2) / 2).join(',');
          log.reps_per_set = Array(sets).fill(baseReps).map(r => r + Math.floor(Math.random() * 3)).join(',');
          
          exerciseProgress[exerciseId].weight = baseWeight;
          exerciseProgress[exerciseId].reps = baseReps;
        }

        if (exercise.metric_distance) {
          // Cardio with distance
          const distance = exerciseProgress[exerciseId].distance * progressFactor * variance;
          log.distance_km = Math.round(distance * 100) / 100;
          log.distance_unit = 'km';
          exerciseProgress[exerciseId].distance = distance;
        }

        if (exercise.metric_time) {
          // Timed exercise
          const duration = Math.floor(exerciseProgress[exerciseId].duration * (exercise.metric_distance ? progressFactor * 0.95 : 1) * variance);
          log.duration_seconds = duration;
          log.duration_unit = 'seconds';
          exerciseProgress[exerciseId].duration = duration;
        }

        const { error: logError } = await supabaseClient
          .from('exercise_logs')
          .insert(log);

        if (logError) throw logError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully created 100 workout sessions for user ${user.id}`,
        sessionCount: 100
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
