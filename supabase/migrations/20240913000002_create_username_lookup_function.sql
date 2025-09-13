-- Function to lookup email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
    user_id UUID;
BEGIN
    -- First try to find the user by username in profiles table
    SELECT profiles.id INTO user_id
    FROM public.profiles
    WHERE profiles.username = username_input
    LIMIT 1;
    
    -- If found, get their email from auth.users
    IF user_id IS NOT NULL THEN
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = user_id;
        
        RETURN user_email;
    END IF;
    
    -- If not found, return null
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon;