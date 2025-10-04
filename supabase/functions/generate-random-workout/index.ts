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
    
    // Generate random date within past year
    const today = new Date();
    const daysAgo = Math.floor(Math.random() * 365);
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    // Random workout type
    const workoutTypes = [
      { title: 'Upper Body Strength', muscles: ['chest', 'shoulders', 'biceps', 'triceps', 'lats'], count: 5 },
      { title: 'Lower Body Strength', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'], count: 5 },
      { title: 'Full Body Workout', muscles: ['chest', 'quadriceps', 'lats', 'shoulders', 'hamstrings'], count: 6 },
      { title: 'Push Day', muscles: ['chest', 'shoulders', 'triceps'], count: 5 },
      { title: 'Pull Day', muscles: ['lats', 'biceps', 'traps'], count: 5 },
    ];
    
    const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
    
    // Select exercises for this workout
    let selectedExercises = [];
    
    // Add strength exercises matching muscle groups
    for (const muscle of workoutType.muscles) {
      const matching = strengthExercises.filter(e => 
        e.muscle_group?.toLowerCase().includes(muscle.toLowerCase())
      );
      if (matching.length > 0) {
        selectedExercises.push(matching[Math.floor(Math.random() * matching.length)]);
      }
    }
    
    // Add 1-2 cardio exercises
    const cardioCount = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < cardioCount && cardioExercises.length > 0; i++) {
      const cardio = cardioExercises[Math.floor(Math.random() * cardioExercises.length)];
      if (!selectedExercises.find(e => e.exercise_id === cardio.exercise_id)) {
        selectedExercises.push(cardio);
      }
    }

    // Limit total exercises
    selectedExercises = selectedExercises.slice(0, workoutType.count + cardioCount);

    // Create session
    const session = {
      user_id: user.id,
      date: sessionDate.toISOString().split('T')[0],
      time: `${6 + Math.floor(Math.random() * 12)}:${Math.random() > 0.5 ? '00' : '30'}:00`,
      title: workoutType.title,
      status: 'Done',
      duration_minutes: 45 + Math.floor(Math.random() * 45),
      notes: 'Auto-generated workout'
    };

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('workout_sessions')
      .insert(session)
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Add exercise logs
    for (let j = 0; j < selectedExercises.length; j++) {
      const exercise = selectedExercises[j];
      const log: any = {
        session_id: sessionData.session_id,
        exercise_id: exercise.exercise_id,
        exercise_order: j,
        notes: null
      };

      if (exercise.metric_weight && exercise.metric_reps) {
        // Strength exercise
        const sets = 3 + Math.floor(Math.random() * 2);
        const baseWeight = 20 + Math.random() * 60;
        const baseReps = 8 + Math.floor(Math.random() * 5);
        
        log.sets = sets;
        log.weight_per_set = Array(sets).fill(Math.round(baseWeight * 2) / 2).join(',');
        log.reps_per_set = Array(sets).fill(baseReps).map(r => r + Math.floor(Math.random() * 3)).join(',');
      }

      if (exercise.metric_distance) {
        // Cardio with distance
        const distance = 2 + Math.random() * 8;
        log.distance_km = Math.round(distance * 100) / 100;
        log.distance_unit = 'km';
      }

      if (exercise.metric_time) {
        // Timed exercise
        const durationSec = 600 + Math.floor(Math.random() * 1800);
        
        if (durationSec > 3600) {
          log.duration_seconds = Math.floor(durationSec / 3600);
          log.duration_unit = 'hr';
        } else if (durationSec > 60) {
          log.duration_seconds = Math.floor(durationSec / 60);
          log.duration_unit = 'min';
        } else {
          log.duration_seconds = durationSec;
          log.duration_unit = 'sec';
        }
      }

      await supabaseClient
        .from('exercise_logs')
        .insert(log);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${workoutType.title} workout for ${session.date}`,
        sessionId: sessionData.session_id,
        date: session.date,
        exerciseCount: selectedExercises.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating workout:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
