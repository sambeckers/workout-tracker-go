-- Create workout sessions table
CREATE TABLE public.workout_sessions (
    session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    time TIME,
    title VARCHAR(100),
    status TEXT CHECK (status IN ('Planned', 'Done', 'Skipped')) DEFAULT 'Planned',
    notes TEXT,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
    exercise_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(50),
    description TEXT,
    media_url VARCHAR(255),
    equipment VARCHAR(100),
    difficulty VARCHAR(20) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise logs table
CREATE TABLE public.exercise_logs (
    log_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(session_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
    sets INTEGER,
    reps_per_set TEXT,
    weight_per_set TEXT,
    duration_seconds INTEGER,
    distance_km DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
    goal_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Strength', 'Weight Loss', 'Rehab', 'Conditioning', 'Flexibility')),
    target_value VARCHAR(50),
    current_value VARCHAR(50),
    deadline DATE,
    status TEXT CHECK (status IN ('Active', 'Completed', 'Abandoned')) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resources table
CREATE TABLE public.resources (
    resource_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    url VARCHAR(255),
    category VARCHAR(50),
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for exercises (public read, authenticated users can create)
CREATE POLICY "Anyone can view exercises" 
ON public.exercises 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create exercises" 
ON public.exercises 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own exercises" 
ON public.exercises 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own exercises" 
ON public.exercises 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create RLS policies for exercise_logs
CREATE POLICY "Users can view their own exercise logs" 
ON public.exercise_logs 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.session_id = exercise_logs.session_id 
    AND workout_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create exercise logs for their sessions" 
ON public.exercise_logs 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.session_id = exercise_logs.session_id 
    AND workout_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can update exercise logs for their sessions" 
ON public.exercise_logs 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.session_id = exercise_logs.session_id 
    AND workout_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete exercise logs for their sessions" 
ON public.exercise_logs 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.workout_sessions 
    WHERE workout_sessions.session_id = exercise_logs.session_id 
    AND workout_sessions.user_id = auth.uid()
));

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for resources (public read, authenticated users can create)
CREATE POLICY "Anyone can view resources" 
ON public.resources 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create resources" 
ON public.resources 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own resources" 
ON public.resources 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own resources" 
ON public.resources 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_sessions_updated_at
BEFORE UPDATE ON public.workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_logs_updated_at
BEFORE UPDATE ON public.exercise_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default exercises
INSERT INTO public.exercises (name, muscle_group, description, equipment, difficulty) VALUES
('Push-ups', 'Chest', 'Classic bodyweight chest exercise', 'None', 'Beginner'),
('Squats', 'Legs', 'Bodyweight leg exercise targeting quads and glutes', 'None', 'Beginner'),
('Pull-ups', 'Back', 'Upper body pulling exercise', 'Pull-up Bar', 'Intermediate'),
('Deadlifts', 'Full Body', 'Compound exercise targeting posterior chain', 'Barbell', 'Intermediate'),
('Bench Press', 'Chest', 'Classic chest pressing movement', 'Barbell', 'Intermediate'),
('Overhead Press', 'Shoulders', 'Vertical pressing movement', 'Barbell', 'Intermediate'),
('Rows', 'Back', 'Horizontal pulling movement', 'Barbell', 'Beginner'),
('Lunges', 'Legs', 'Single-leg exercise for balance and strength', 'None', 'Beginner'),
('Planks', 'Core', 'Isometric core strengthening exercise', 'None', 'Beginner'),
('Burpees', 'Full Body', 'High-intensity full body exercise', 'None', 'Advanced');