-- Migration: create exercise_muscle_groups join table for multi-group normalization
-- Date: 2025-09-26
-- Purpose: Normalize comma-separated muscle_group in exercises into relational form.

BEGIN;

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.exercise_muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, muscle_group)
);

-- 2. Backfill existing data (parse comma separated values)
INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group)
SELECT e.exercise_id,
       trim(g) AS muscle_group
FROM public.exercises e
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(e.muscle_group, ''), ',') AS g
WHERE trim(g) <> ''
ON CONFLICT DO NOTHING;

COMMIT;
