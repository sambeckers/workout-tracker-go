-- Add pace column to exercise_logs table
ALTER TABLE public.exercise_logs 
ADD COLUMN pace numeric;

COMMENT ON COLUMN public.exercise_logs.pace IS 'Target pace in minutes per kilometer (decimal format, e.g., 5.5 = 5:30 min/km)';

-- Create index for faster pace queries
CREATE INDEX idx_exercise_logs_pace ON public.exercise_logs(pace) WHERE pace IS NOT NULL;