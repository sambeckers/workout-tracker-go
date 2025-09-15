import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Target, 
  TrendingUp, 
  Calendar, 
  Trophy, 
  Flame,
  CheckCircle,
  Users,
  Clock,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-fitness.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Plan your workouts with our intelligent scheduling system that adapts to your lifestyle."
    },
    {
      icon: Dumbbell,
      title: "Exercise Library",
      description: "Access thousands of exercises with detailed instructions and video demonstrations."
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your fitness goals with our comprehensive tracking system."
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Monitor your progress with detailed analytics and performance insights."
    },
    {
      icon: Trophy,
      title: "Achievement System",
      description: "Stay motivated with our gamified achievement system and milestone rewards."
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with like-minded fitness enthusiasts and share your journey."
    }
  ];

  const benefits = [
    "Track your workouts and progress",
    "Personalized exercise recommendations",
    "Goal setting and achievement tracking",
    "Performance analytics and insights",
    "Community support and motivation"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Flame className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">FitTracker</span>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundBlendMode: 'multiply'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              🔥 Your Fitness Journey Starts Here
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Transform Your Body,
              <span className="block text-white/90">Elevate Your Life</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of fitness enthusiasts who are achieving their goals with our comprehensive 
              workout tracking, smart scheduling, and progress analytics platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
                onClick={() => navigate('/register')}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg"
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
                Why Choose FitTracker?
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
              <Card className="bg-gradient-primary text-white border-0">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-white/80">Active Users</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-secondary text-white border-0">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">1M+</div>
                  <div className="text-white/80">Workouts Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-accent text-white border-0">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-white/80">Goal Achievement</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-0">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-muted-foreground">Support</div>
                </CardContent>
              </Card>
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
            Start your free trial today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              onClick={() => navigate('/register')}
            >
              Start Your Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg"
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
              <span className="text-lg font-bold">FitTracker</span>
            </div>
            <div className="text-sm text-background/70">
              © 2024 FitTracker. Transform your fitness journey.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;