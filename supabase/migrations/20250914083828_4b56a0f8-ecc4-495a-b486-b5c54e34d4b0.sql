-- Configure password reset token expiration to 24 hours (86400 seconds)
-- This sets the recovery token validity period to 24 hours
ALTER DATABASE postgres SET "auth.recovery_token_validity_period" = '86400';