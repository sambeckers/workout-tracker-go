import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Flame, Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await resetPassword(email);

    if (error) {
      if (error.message.includes("rate")) {
        toast({
          title: "Too Many Requests",
          description: "Please wait before requesting another password reset.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      setSubmitted(true);
      toast({
        title: "Password Reset Sent",
        description: "Check your email for a password reset link.",
      });
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-gradient-primary rounded-xl">
                <Flame className="h-8 w-8 text-white" />
            </div>
              <h1 className="text-2xl font-bold">Go // Workout Tracker</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you don't see the email in your inbox, please check your spam folder.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gradient-primary rounded-xl">
              <Flame className="h-8 w-8 text-white" />
          </div>
            <h1 className="text-2xl font-bold">Go // Workout Tracker</h1>
          <p className="text-muted-foreground text-center">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              No worries! Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
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

export default ForgotPassword;