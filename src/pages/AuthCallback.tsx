import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is an email confirmation or password reset first
        const type = searchParams.get("type");
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (type === "recovery" && accessToken && refreshToken) {
          // This is a password reset - redirect to reset password page with tokens
          navigate(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}`);
          return;
        } else if (type === "signup" && accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            toast({
              title: "Error",
              description: "Failed to confirm email. Please try again.",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }

          toast({
            title: "Email Confirmed!",
            description: "Your email has been successfully confirmed. Welcome to Go // Workout Tracker!",
          });
          navigate("/");
        } else {
          // Check for existing session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
            });
            navigate("/login");
            return;
          }

          if (data.session) {
            // User is already authenticated
            navigate("/");
          } else {
            // No valid session, redirect to login
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try signing in again.",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <h2 className="text-xl font-semibold">Confirming your account...</h2>
        <p className="text-muted-foreground">Please wait while we verify your email.</p>
      </div>
    </div>
  );
};

export default AuthCallback;