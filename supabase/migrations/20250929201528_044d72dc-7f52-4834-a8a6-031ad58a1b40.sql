-- Add duration_unit and distance_unit columns to exercise_logs table
ALTER TABLE public.exercise_logs 
ADD COLUMN duration_unit TEXT CHECK (duration_unit IN ('sec', 'min', 'hr')),
ADD COLUMN distance_unit TEXT CHECK (distance_unit IN ('m', 'km'));