import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Activity, BarChart3, Calendar, Target } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";
import { useNavigate } from "react-router-dom";
import { ScrollRevealStyles, useScrollReveal } from "@/hooks/use-scroll-reveal";
import { heroBadgeText, heroHeadline, features } from "./landing/content";

// Apple-style scroll: large immersive hero, pinned panels, parallax text, and reveal-on-scroll.
const DynamicScrollLanding = () => {
  const navigate = useNavigate();
  useScrollReveal({ threshold: 0.2 });

  // Add scroll-driven CSS vars to create subtle parallax effect
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY || 0;
      document.documentElement.style.setProperty("--scroll", String(y));
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollRevealStyles />

      {/* Top Nav */}
  <nav className="fixed top-0 inset-x-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-semibold">Go // Workout Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/register")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Immersive Hero - full viewport with subtle parallax */}
      <header
        className="relative h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.65)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "translateZ(0)",
        }}
      >
        <div className="relative z-10 text-center text-white px-6">
          <div data-reveal className="mb-4">
            <span className="inline-block rounded-full border border-white/40 bg-white/10 px-3 py-1 text-sm">{heroBadgeText}</span>
          </div>
          <h1
            data-reveal
            data-reveal-delay="120"
            className="text-4xl sm:text-6xl font-bold leading-tight max-w-4xl mx-auto"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.7)" }}
          >
            {heroHeadline}
          </h1>
          <p
            data-reveal
            data-reveal-delay="240"
            className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}
          >
            Track, visualize, and celebrate progress with immersive analytics and smart scheduling.
          </p>
          <div data-reveal data-reveal-delay="360" className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" variant="hero" onClick={() => navigate("/register")}>Get Started</Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(600px 200px at 50% 40%, rgba(255,255,255,0.08), transparent)",
          }}
        />
      </header>

      {/* Pinned storytelling panels */}
  <section className="relative">
        {/* Panel 1 */}
        <div className="sticky top-14 md:top-16 bg-background">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center transition-[padding] duration-300">
            <div data-reveal>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">{features[0].title}</h2>
              <p className="text-muted-foreground text-lg">
                {features[0].description}
              </p>
              <div className="mt-6 flex items-center gap-3 text-primary">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Auto-shift sessions around life events</span>
              </div>
            </div>
            <div data-reveal data-reveal-delay="120" className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border overflow-hidden">
              <div className="absolute inset-0 grid place-items-center">
                <Calendar className="h-20 w-20 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to allow scroll between panels */}
        <div className="h-[24vh]" />

        {/* Panel 2 */}
        <div className="sticky top-14 md:top-16 bg-background">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center transition-[padding] duration-300">
            <div className="order-2 md:order-1" data-reveal>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Live Metrics</h2>
              <p className="text-muted-foreground text-lg">
                Watch trends as they form. See volume, intensity, and focus across cycles.
              </p>
              <div className="mt-6 flex items-center gap-3 text-primary">
                <Activity className="h-5 w-5" />
                <span className="font-medium">Real-time indicators and weekly rollups</span>
              </div>
            </div>
            <div className="order-1 md:order-2" data-reveal data-reveal-delay="120">
              <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border overflow-hidden">
                <div className="absolute inset-0 grid place-items-center">
                  <Activity className="h-20 w-20 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

  <div className="h-[24vh]" />

        {/* Panel 3 */}
        <div className="sticky top-14 md:top-16 bg-background">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center transition-[padding] duration-300">
            <div data-reveal>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Progress, Visualized</h2>
              <p className="text-muted-foreground text-lg">
                From micro improvements to big milestones, your path is clear and motivating.
              </p>
              <div className="mt-6 flex items-center gap-3 text-primary">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Powerful charts with clean storytelling</span>
              </div>
            </div>
            <div data-reveal data-reveal-delay="120" className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border overflow-hidden">
              <div className="absolute inset-0 grid place-items-center">
                <BarChart3 className="h-20 w-20 text-primary" />
              </div>
            </div>
          </div>
        </div>

  <div className="h-[24vh]" />

        {/* Panel 4 */}
        <div className="sticky top-14 md:top-16 bg-background">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center transition-[padding] duration-300">
            <div className="order-2 md:order-1" data-reveal>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Goals That Stick</h2>
              <p className="text-muted-foreground text-lg">
                Define outcomes, set cadence, and keep score—without losing the joy.
              </p>
              <div className="mt-6 flex items-center gap-3 text-primary">
                <Target className="h-5 w-5" />
                <span className="font-medium">Targets with built-in accountability loops</span>
              </div>
            </div>
            <div className="order-1 md:order-2" data-reveal data-reveal-delay="120">
              <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border overflow-hidden">
                <div className="absolute inset-0 grid place-items-center">
                  <Target className="h-20 w-20 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[20vh]" />
      </section>

      {/* CTA Footer */}
      <footer className="bg-gradient-hero py-16 text-center text-white">
        <h3 data-reveal className="text-3xl sm:text-4xl font-bold mb-3">Ready to Go?</h3>
        <p data-reveal data-reveal-delay="120" className="text-white/90 max-w-2xl mx-auto mb-8">
          Start your first week with guided plans and clear wins.
        </p>
        <div data-reveal data-reveal-delay="240" className="flex items-center justify-center gap-3">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate("/register")}>Get Started</Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
        <div className="mt-8 opacity-80 text-sm">© {new Date().getFullYear()} Go // Workout Tracker</div>
      </footer>
    </div>
  );
};

export default DynamicScrollLanding;
