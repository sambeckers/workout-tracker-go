-- Add metric columns to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS metric_weight BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metric_reps BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metric_time BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metric_distance BOOLEAN DEFAULT false;