-- Add deleted_at column to workout_templates for soft delete functionality
ALTER TABLE public.workout_templates 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better query performance on deleted templates
CREATE INDEX idx_workout_templates_deleted_at ON public.workout_templates(deleted_at);

-- Update RLS policies to exclude deleted templates from normal queries
DROP POLICY IF EXISTS "Users can view their own templates" ON public.workout_templates;

CREATE POLICY "Users can view their own templates" 
ON public.workout_templates 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Add policy to view deleted templates (for bin)
CREATE POLICY "Users can view their own deleted templates" 
ON public.workout_templates 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);