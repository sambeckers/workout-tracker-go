import heroImage from "@/assets/hero-fitness.jpg";
import StatsCard from "@/components/dashboard/StatsCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, Target, TrendingUp, Clock, Trophy, Flame, Activity, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  // Mock data - in real app this would come from your backend
  const todayWorkouts = [
    { id: 1, name: "Upper Body Strength", time: "9:00 AM", status: "scheduled" },
    { id: 2, name: "Cardio Session", time: "6:00 PM", status: "scheduled" },
  ];

  const recentActivity = [
    { id: 1, exercise: "Bench Press", sets: "3x8", weight: "84 kg", date: "Today" },
    { id: 2, exercise: "Squats", sets: "4x10", weight: "102 kg", date: "Yesterday" },
    { id: 3, exercise: "Deadlifts", sets: "3x5", weight: "125 kg", date: "2 days ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <div 
          className="h-64 md:h-80 bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})` }}
        >
          <div className="text-center text-white space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Track Your <span className="bg-gradient-hero bg-clip-text text-transparent">Fitness Journey</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl">
              Plan workouts, track progress, and achieve your fitness goals with our comprehensive tracker.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              className="mt-6"
              onClick={() => navigate('/workout/new')}
            >
              <Plus className="mr-2 h-5 w-5" />
              Start New Workout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Workouts"
          value={47}
          subtitle="This month"
          icon={Dumbbell}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatsCard
          title="Active Goals"
          value={3}
          subtitle="In progress"
          icon={Target}
          variant="secondary"
        />
        <StatsCard
          title="Weekly Streak"
          value={12}
          subtitle="Days"
          icon={Flame}
          trend={{ value: 8, isPositive: true }}
          variant="accent"
        />
        <StatsCard
          title="Average Duration"
          value="68 min"
          subtitle="Per session"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <Button variant="outline" className="mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
