import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import DynamicScrollLanding from "./AppleScrollLanding";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PublicHome = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [experience, setExperience] = useState<"classic" | "dynamic">(() => {
    const saved = localStorage.getItem("landing-experience");
    return saved === "dynamic" || saved === "classic" ? (saved as any) : "classic";
  });

  // Query param override (?experience=apple|classic)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("experience");
    if (q === "dynamic" || q === "classic") {
      setExperience(q);
      localStorage.setItem("landing-experience", q);
      // Clean the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("experience");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, [location.search]);

  // Persist preference
  useEffect(() => {
    localStorage.setItem("landing-experience", experience);
  }, [experience]);

  useEffect(() => {
    // If user is authenticated, redirect to the main app
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page with experience toggle overlay
  return (
    <div className="relative">
      {experience === "dynamic" ? <DynamicScrollLanding /> : <LandingPage />}
      <div className="fixed right-4 bottom-4 z-[60] bg-background/80 backdrop-blur border rounded-full px-4 py-2 shadow-md flex items-center gap-2">
        <Label htmlFor="exp-toggle" className="text-sm text-muted-foreground">Classic</Label>
        <Switch
          id="exp-toggle"
          checked={experience === "dynamic"}
          onCheckedChange={(v) => setExperience(v ? "dynamic" : "classic")}
        />
        <Label htmlFor="exp-toggle" className="text-sm text-muted-foreground">Dynamic</Label>
        <span className="text-xs text-muted-foreground ml-1">scrolling style</span>
      </div>
    </div>
  );
};

export default PublicHome;