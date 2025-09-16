import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-fitness.jpg";
import { features, benefits, stats, heroBadgeText, heroHeadline } from "./landing/content";

const LandingPage = () => {
  const navigate = useNavigate();

  

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Flame className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Go // Workout Tracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="hero" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - matches dashboard cover style */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${heroImage})`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              {heroBadgeText}
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {heroHeadline}
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
              Join thousands of fitness enthusiasts who are achieving their goals with our comprehensive 
              workout tracking, smart scheduling, and progress analytics platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="hero"
                className="font-semibold px-8 py-4 text-lg"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white bg-transparent hover:bg-white/10 font-semibold px-8 py-4 text-lg"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to track, 
              analyze, and achieve your fitness goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-smooth bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-primary p-3 rounded-lg mr-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Why Choose Go // Workout Tracker?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join the fitness revolution with our cutting-edge platform designed 
                to make your fitness journey easier, more engaging, and more successful.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                variant="hero" 
                className="mt-8"
                onClick={() => navigate('/register')}
              >
                Get Started Today
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <Card key={i} className={`${s.variant === 'card' ? 'bg-gradient-card' : 'text-white border-0'} ${s.variant === 'primary' ? 'bg-gradient-primary' : s.variant === 'secondary' ? 'bg-gradient-secondary' : s.variant === 'accent' ? 'bg-gradient-accent' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.variant === 'card' ? 'text-primary' : ''}`} />
                    <div className={`text-2xl font-bold ${s.variant === 'card' ? 'text-foreground' : ''}`}>{s.value}</div>
                    <div className={`${s.variant === 'card' ? 'text-muted-foreground' : 'text-white/80'}`}>{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already transformed their lives. 
            Get started today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              onClick={() => navigate('/register')}
            >
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white bg-transparent hover:bg-white/10 font-semibold px-8 py-4 text-lg"
              onClick={() => navigate('/login')}
            >
              Already Have Account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Flame className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Go // Workout Tracker</span>
            </div>
            <div className="text-sm text-background/70">
              © 2024 Go // Workout Tracker. Transform your fitness journey.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;