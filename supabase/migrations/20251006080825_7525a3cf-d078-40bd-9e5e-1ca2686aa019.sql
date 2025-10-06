-- Fix search_path for handle_new_user function to prevent search path attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, username, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;

-- Fix search_path for handle_user_update function
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.profiles
    SET 
        full_name = NEW.raw_user_meta_data->>'name',
        username = NEW.raw_user_meta_data->>'username',
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error updating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;

-- Add explicit policy to deny anonymous access to profiles (defense in depth)
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Add explicit policy to deny anonymous access to workout_sessions
DROP POLICY IF EXISTS "Deny anonymous access to workout_sessions" ON public.workout_sessions;
CREATE POLICY "Deny anonymous access to workout_sessions"
ON public.workout_sessions
FOR ALL
TO anon
USING (false);