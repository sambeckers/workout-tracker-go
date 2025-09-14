import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const { changePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

    // Wait for Supabase to establish session from magic link; attempt code exchange
    useEffect(() => {
      let isMounted = true;

      const bootstrap = async () => {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (data.session) {
          setHasSession(true);
          setSessionChecked(true);
        } else {
          try {
            // Try to exchange any code in the URL for a session
            await supabase.auth.exchangeCodeForSession(window.location.href);
            if (!isMounted) return;
            const { data: after } = await supabase.auth.getSession();
            if (after.session) setHasSession(true);
          } catch (e) {
            // ignore; will rely on auth state listener below
          } finally {
            // Give the listener a moment, then mark checked
            setTimeout(() => {
              if (!isMounted) return;
              setSessionChecked(true);
            }, 700);
          }
        }
      };

      bootstrap();

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (session) setHasSession(true);
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }, []);

    // If session check completed and no session, redirect to request a new link
    useEffect(() => {
      if (sessionChecked && !hasSession) {
        toast({
          title: "Reset Link Needed",
          description: "Please request a new password reset email to continue.",
          variant: "destructive",
        });
        navigate("/forgot-password");
      }
    }, [sessionChecked, hasSession, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await changePassword(password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">FitTracker</h1>
          <p className="text-muted-foreground text-center">
            Create a new password for your account.
          </p>
        </div>

        {/* Reset Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's secure!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Password must be at least 8 characters long.
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                <ArrowLeft className="h-3 w-3 mr-1 inline" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;