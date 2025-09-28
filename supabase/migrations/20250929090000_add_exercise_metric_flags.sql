-- Migration: add metric flags to exercises
-- Adds boolean columns to classify which logging metrics apply to an exercise.

BEGIN;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS metric_weight BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS metric_reps BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS metric_time BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS metric_distance BOOLEAN DEFAULT false NOT NULL;

-- Heuristic backfill. We use LOWER(name) pattern matching.
-- Time + Distance focused cardio
UPDATE public.exercises SET metric_time = true, metric_distance = true, metric_weight = false, metric_reps = false
WHERE LOWER(name) ~ '(running|treadmill|rowing|cycling)';

-- Time only conditioning (no distance)
UPDATE public.exercises SET metric_time = true, metric_distance = false, metric_weight = false, metric_reps = false
WHERE LOWER(name) ~ '(boxing|crosstraining|padel|tennis|soccer|sauna|stretch|yoga|stairs)';

-- Holds / static positions (plank, dead hang)
UPDATE public.exercises SET metric_time = true, metric_weight = false, metric_reps = false
WHERE LOWER(name) ~ '(plank|dead *hang|deadhang|hold)';

-- Distance but also could have time already handled above; ensure distance for walking lunge etc. (optional skip now)
-- UPDATE public.exercises SET metric_distance = true WHERE LOWER(name) ~ '(hike|walk)';

-- Kettlebell swings / dynamic complexes keep weight+reps (time optional user can enable later)
UPDATE public.exercises SET metric_time = false WHERE LOWER(name) ~ 'kettlebell';

-- Isolation / resistance keep defaults (already default true for weight+reps and false for others)

COMMIT;
