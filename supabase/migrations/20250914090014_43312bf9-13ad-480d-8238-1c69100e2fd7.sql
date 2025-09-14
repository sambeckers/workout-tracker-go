-- Fix security vulnerability: Remove public access to profiles table
-- Drop the overly permissive SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy: Users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Allow viewing of specific profile fields publicly if needed for app functionality
-- Uncomment and modify if you need public usernames/avatars for @mentions or similar features
-- CREATE POLICY "Public usernames are viewable" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (true)
-- WITH CHECK (false);