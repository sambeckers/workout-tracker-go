import StatsCard from "@/components/dashboard/StatsCard";
import QuickActions from "@/components/dashboard/QuickActions";
import HeroGallery from "@/components/layout/HeroGallery";
import { SeedDataButton } from "@/components/dashboard/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, Target, TrendingUp, Clock, Trophy, Flame, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mock user for development when authentication is bypassed
  const mockUser = {
    user_metadata: { name: "Sam Beckers", avatar_url: "" },
    email: "sam@example.com"
  };
  
  const displayUser = user || mockUser;
  const userName = displayUser?.user_metadata?.name?.split(' ')[0] || displayUser?.email?.split('@')[0] || 'User';
  
  // Empty data arrays - will be populated from database later
  const todayWorkouts: any[] = [];
  const recentActivity: any[] = [];

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Hero Gallery Section */}
      <div className="flex items-center justify-between mb-4">
        <div />
        <SeedDataButton />
      </div>
      <HeroGallery 
        userName={userName}
        onStartWorkout={() => navigate('/dashboard/workout/new')}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatsCard
          title="Total Workouts"
          value={0}
          subtitle="This month"
          icon={Dumbbell}
          variant="primary"
        />
        <StatsCard
          title="Active Goals"
          value={0}
          subtitle="In progress"
          icon={Target}
          variant="secondary"
        />
        <StatsCard
          title="Weekly Streak"
          value={0}
          subtitle="Days"
          icon={Flame}
          variant="accent"
        />
        <StatsCard
          title="Average Duration"
          value="0 min"
          subtitle="Per session"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Today's Workouts */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {todayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-smooth"
                    >
                      <div>
                        <h3 className="font-semibold">{workout.name}</h3>
                        <p className="text-sm text-muted-foreground">{workout.time}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No workouts scheduled for today</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/dashboard/schedule')}
                  >
                    Schedule Workout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{activity.exercise}</h4>
                    <p className="text-sm text-muted-foreground">
                      {activity.sets} @ {activity.weight}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to show</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/workout/new')}>
                Start First Workout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
