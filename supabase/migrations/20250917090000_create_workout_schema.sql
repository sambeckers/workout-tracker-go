-- Workout Tracking Core Schema
-- Generated: 2025-09-17
-- This migration introduces normalized workout/session/exercise logging with goal + resource support.

-- ENUM TYPES ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE workout_status AS ENUM ('planned','in_progress','completed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE set_type AS ENUM ('normal','warmup','drop','failure','amrap','rest_pause','cluster','timed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_category AS ENUM ('strength','weight_loss','rehab','conditioning','flexibility','hypertrophy','mobility');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLES ------------------------------------------------------------------

-- Exercises: global + user-created (user_id nullable => system exercise)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  muscle_group TEXT, -- consider future enum (chest, back, etc.)
  description TEXT,
  media_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workout Sessions: one per workout event
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  title TEXT,
  status workout_status NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Session Exercises: an exercise planned/performed in a session (header row for sets)
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INT NOT NULL DEFAULT 0,
  target_sets INT,
  target_reps_low INT,
  target_reps_high INT,
  target_rpe NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercise Sets: granular performance logging
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL, -- order within the exercise
  set_type set_type NOT NULL DEFAULT 'normal',
  reps INT,
  weight NUMERIC(8,2),
  rpe NUMERIC(4,2),
  seconds INT, -- for timed sets or rest-pause clusters
  distance_m NUMERIC(10,2), -- for runs/rows etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_exercise_id, set_index)
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category goal_category,
  target_numeric NUMERIC(14,4),
  target_text TEXT, -- alternative if numeric not applicable
  current_numeric NUMERIC(14,4),
  status goal_status NOT NULL DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goal Progress Snapshots (historical tracking)
CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_numeric NUMERIC(14,4),
  value_text TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources (articles, videos) optionally user-curated
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT,
  category TEXT,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_exercises_user ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON public.session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_exercise ON public.exercise_sets(session_exercise_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON public.goal_progress(goal_id);

-- TIMESTAMP UPDATE TRIGGER ------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers where needed
DO $$ BEGIN
  CREATE TRIGGER trg_exercises_updated BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_session_exercises_updated BEFORE UPDATE ON public.session_exercises
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_sets_updated BEFORE UPDATE ON public.exercise_sets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ROW LEVEL SECURITY ------------------------------------------------------
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINERS: helper function to check ownership chain
CREATE OR REPLACE FUNCTION public.is_session_owner(p_session_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = p_session_id AND ws.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_session_exercise_owner(p_session_exercise_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_exercises se
    JOIN public.workout_sessions ws ON ws.id = se.session_id
    WHERE se.id = p_session_exercise_id AND ws.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

-- POLICIES ----------------------------------------------------------------
-- Exercises: public readable, user can manage their own & system exercises remain read-only
CREATE POLICY exercises_select_public ON public.exercises
  FOR SELECT USING ( is_public OR user_id = auth.uid() );
CREATE POLICY exercises_modify_own ON public.exercises
  FOR ALL USING ( user_id = auth.uid() ) WITH CHECK ( user_id = auth.uid() );

-- Workout sessions
CREATE POLICY sessions_select_own ON public.workout_sessions
  FOR SELECT USING ( user_id = auth.uid() );
CREATE POLICY sessions_modify_own ON public.workout_sessions
  FOR ALL USING ( user_id = auth.uid() ) WITH CHECK ( user_id = auth.uid() );

-- Session exercises (inherit via session)
CREATE POLICY session_exercises_select_own ON public.session_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  );
CREATE POLICY session_exercises_modify_own ON public.session_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  );

-- Exercise sets (inherit via session_exercise -> session)
CREATE POLICY exercise_sets_select_own ON public.exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = session_exercise_id AND ws.user_id = auth.uid()
    )
  );
CREATE POLICY exercise_sets_modify_own ON public.exercise_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = session_exercise_id AND ws.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = session_exercise_id AND ws.user_id = auth.uid()
    )
  );

-- Goals & progress
CREATE POLICY goals_select_own ON public.goals
  FOR SELECT USING ( user_id = auth.uid() );
CREATE POLICY goals_modify_own ON public.goals
  FOR ALL USING ( user_id = auth.uid() ) WITH CHECK ( user_id = auth.uid() );

CREATE POLICY goal_progress_select_own ON public.goal_progress
  FOR SELECT USING ( user_id = auth.uid() );
CREATE POLICY goal_progress_modify_own ON public.goal_progress
  FOR ALL USING ( user_id = auth.uid() ) WITH CHECK ( user_id = auth.uid() );

-- Resources: public readable, owner can modify
CREATE POLICY resources_select_public ON public.resources
  FOR SELECT USING ( is_public OR user_id = auth.uid() );
CREATE POLICY resources_modify_own ON public.resources
  FOR ALL USING ( user_id = auth.uid() ) WITH CHECK ( user_id = auth.uid() );

-- FUTURE: analytics materialized views / weekly aggregates can be added separately.
