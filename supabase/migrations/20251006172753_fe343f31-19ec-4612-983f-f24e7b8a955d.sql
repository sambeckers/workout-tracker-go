-- Add completion tracking fields to workout_sessions and exercise_logs

-- Add completion fields to workout_sessions
ALTER TABLE public.workout_sessions 
ADD COLUMN completed BOOLEAN DEFAULT false,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add completion fields to exercise_logs
ALTER TABLE public.exercise_logs 
ADD COLUMN completed BOOLEAN DEFAULT false,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on completed status
CREATE INDEX idx_workout_sessions_completed ON public.workout_sessions(user_id, completed, date);
CREATE INDEX idx_exercise_logs_completed ON public.exercise_logs(session_id, completed);

-- Migrate existing data: Mark sessions with status='Done' as completed
UPDATE public.workout_sessions 
SET completed = true, completed_at = updated_at 
WHERE status = 'Done';

-- For completed sessions, mark all their exercise logs as completed
UPDATE public.exercise_logs 
SET completed = true, completed_at = el.created_at
FROM (
  SELECT el.log_id, el.created_at
  FROM exercise_logs el
  JOIN workout_sessions ws ON el.session_id = ws.session_id
  WHERE ws.status = 'Done'
) el
WHERE exercise_logs.log_id = el.log_id;