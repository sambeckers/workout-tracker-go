import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteWorkoutRequest {
  completed: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse session ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 2]; // /complete-workout-session/:sessionId/complete

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CompleteWorkoutRequest = await req.json();
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'completed must be a boolean' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Marking session ${sessionId} as ${completed ? 'completed' : 'not completed'} for user ${user.id}`);

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabaseClient
      .from('workout_sessions')
      .select('session_id, user_id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('Session not found or access denied:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // Update workout session
    const { error: updateSessionError } = await supabaseClient
      .from('workout_sessions')
      .update({
        completed,
        completed_at: completed ? now : null,
        status: completed ? 'Done' : 'Planned',
        updated_at: now,
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (updateSessionError) {
      console.error('Failed to update session:', updateSessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to update workout session', details: updateSessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update all exercise logs for this session
    const { error: updateLogsError } = await supabaseClient
      .from('exercise_logs')
      .update({
        completed,
        completed_at: completed ? now : null,
      })
      .eq('session_id', sessionId);

    if (updateLogsError) {
      console.error('Failed to update exercise logs:', updateLogsError);
      // Rollback session update
      await supabaseClient
        .from('workout_sessions')
        .update({
          completed: !completed,
          completed_at: !completed ? now : null,
          status: !completed ? 'Done' : 'Planned',
        })
        .eq('session_id', sessionId);

      return new Response(
        JSON.stringify({ error: 'Failed to update exercise logs', details: updateLogsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch updated session and exercise logs
    const { data: updatedSession, error: fetchSessionError } = await supabaseClient
      .from('workout_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    const { data: updatedLogs, error: fetchLogsError } = await supabaseClient
      .from('exercise_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise_order', { ascending: true });

    if (fetchSessionError || fetchLogsError) {
      console.error('Failed to fetch updated data:', fetchSessionError || fetchLogsError);
    }

    console.log(`Successfully updated session ${sessionId}: completed=${completed}, affected ${updatedLogs?.length || 0} exercise logs`);

    return new Response(
      JSON.stringify({
        success: true,
        session: updatedSession,
        exercise_logs: updatedLogs || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
