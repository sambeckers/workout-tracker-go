-- Create workout_templates table
CREATE TABLE public.workout_templates (
  template_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name VARCHAR NOT NULL,
  notes TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_template_exercises junction table
CREATE TABLE public.workout_template_exercises (
  template_id UUID NOT NULL REFERENCES public.workout_templates(template_id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (template_id, exercise_id)
);

-- Enable RLS
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_templates
CREATE POLICY "Users can view their own templates"
  ON public.workout_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.workout_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.workout_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.workout_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for workout_template_exercises
CREATE POLICY "Users can view their template exercises"
  ON public.workout_template_exercises
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates
    WHERE workout_templates.template_id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their template exercises"
  ON public.workout_template_exercises
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_templates
    WHERE workout_templates.template_id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their template exercises"
  ON public.workout_template_exercises
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates
    WHERE workout_templates.template_id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their template exercises"
  ON public.workout_template_exercises
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates
    WHERE workout_templates.template_id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();