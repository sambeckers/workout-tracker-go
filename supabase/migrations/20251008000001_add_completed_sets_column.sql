-- Add completed_sets column to exercise_logs table to track per-set completion
ALTER TABLE public.exercise_logs 
ADD COLUMN completed_sets text;

COMMENT ON COLUMN public.exercise_logs.completed_sets IS 'Comma-separated completion state for each set (0=incomplete, 1=complete, e.g., "1,1,0,1")';
