-- Harden RLS policies for profiles table to prevent unintended public exposure
-- Previous state allowed public SELECT via policy: "Public profiles are viewable by everyone"
-- This migration removes that permissive exposure and enforces per-user access only.

BEGIN;

-- Drop existing policies if they exist (idempotent safe pattern)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END$$;

-- Re-create explicit least-privilege policies (all PERMISSIVE by default)
-- Only the authenticated user may see, insert, update, or delete their own row.

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING ( auth.uid() = id );

-- (Optional) If you need a public directory later, create a view with only safe fields and apply a separate policy to that view.

COMMIT;
