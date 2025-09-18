-- Create categories table for persistent muscle group storage
-- This ensures categories are preserved across sessions and devices

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name) -- Prevent duplicate category names per user
);

-- Insert default categories that will be available to all users
INSERT INTO public.categories (user_id, name, icon, image_url, is_default) VALUES
  (NULL, 'Full Body (cardio)', 'Activity', '/muscles/cardio.svg', true),
  (NULL, 'Shoulders', 'Accessibility', '/muscles/shoulders.svg', true),
  (NULL, 'Anterior - Deltoid', 'Target', '/muscles/deltoid-anterior.svg', true),
  (NULL, 'Rotator cuff', 'Target', NULL, true),
  (NULL, 'Chest', 'Heart', '/muscles/chest.svg', true),
  (NULL, 'Lats', 'Users', '/muscles/lats.svg', true),
  (NULL, 'Trapezoid', 'Zap', '/muscles/traps.svg', true),
  (NULL, 'Traps', 'Zap', '/muscles/traps.svg', true),
  (NULL, 'Biceps', 'Dumbbell', '/muscles/biceps.svg', true),
  (NULL, 'Triceps', 'Dumbbell', '/muscles/triceps.svg', true),
  (NULL, 'Forearms', 'Hand', '/muscles/forearms.svg', true),
  (NULL, 'Abs', 'Target', '/muscles/abs.svg', true),
  (NULL, 'Upper abs', 'Clock', '/muscles/abs.svg', true),
  (NULL, 'Lower abs', 'Timer', '/muscles/abs.svg', true),
  (NULL, 'Obliques', 'Zap', '/muscles/obliques.svg', true),
  (NULL, 'Lower back', 'Bone', '/muscles/lower-back.svg', true),
  (NULL, 'Glutes', 'Flame', '/muscles/glutes.svg', true),
  (NULL, 'Hips', 'Accessibility', '/muscles/hips.svg', true),
  (NULL, 'Quadriceps', 'Footprints', '/muscles/quadriceps.svg', true),
  (NULL, 'Hamstrings', 'Footprints', '/muscles/hamstrings.svg', true),
  (NULL, 'Abductors', 'Target', NULL, true),
  (NULL, 'Calves', 'Footprints', '/muscles/calves.svg', true),
  (NULL, 'Shins', 'Bone', '/muscles/shins.svg', true)
ON CONFLICT (user_id, name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see default categories (user_id IS NULL) and their own categories
CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Policy: Users can insert their own categories
CREATE POLICY "Users can create categories" ON public.categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own categories
CREATE POLICY "Users can update categories" ON public.categories
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own categories
CREATE POLICY "Users can delete categories" ON public.categories
  FOR DELETE USING (user_id = auth.uid());