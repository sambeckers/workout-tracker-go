-- Add soft delete support to workout_sessions table
ALTER TABLE public.workout_sessions 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance when filtering deleted sessions
CREATE INDEX idx_workout_sessions_deleted_at ON public.workout_sessions(deleted_at) WHERE deleted_at IS NOT NULL;