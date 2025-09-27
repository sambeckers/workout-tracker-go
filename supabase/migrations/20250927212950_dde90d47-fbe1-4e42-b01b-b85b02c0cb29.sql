-- Add exercise_order column to exercise_logs table for tracking exercise sequence
ALTER TABLE public.exercise_logs 
ADD COLUMN exercise_order integer DEFAULT 0;

-- Create index for better query performance when ordering exercises
CREATE INDEX idx_exercise_logs_session_order ON public.exercise_logs(session_id, exercise_order);