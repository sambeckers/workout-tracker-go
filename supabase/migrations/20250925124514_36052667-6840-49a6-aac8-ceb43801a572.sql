-- Allow users to update exercises that have no owner (created_by is NULL)
-- This enables users to edit system/seed exercises
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;

CREATE POLICY "Users can update their own exercises or system exercises" ON public.exercises
FOR UPDATE USING (
  auth.uid() = created_by 
  OR created_by IS NULL
);