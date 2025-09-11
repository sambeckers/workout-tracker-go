import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Dumbbell, Activity, Target, BarChart3 } from "lucide-react";

const Progress = () => {
  // Mock data for charts and progress
  const stats = {
    totalWorkouts: 147,
    totalWeightLifted: 25420,
    averageWorkoutTime: 67,
    currentStreak: 12,
  };

  const recentWorkouts = [
    { date: "2024-01-15", type: "Upper Body", duration: 65, exercises: 8, totalWeight: 1850 },
    { date: "2024-01-14", type: "Cardio", duration: 45, exercises: 5, totalWeight: 0 },
    { date: "2024-01-13", type: "Lower Body", duration: 75, exercises: 6, totalWeight: 2100 },
    { date: "2024-01-12", type: "Full Body", duration: 80, exercises: 10, totalWeight: 1650 },
    { date: "2024-01-11", type: "Upper Body", duration: 60, exercises: 7, totalWeight: 1750 },
  ];

  const exerciseProgress = [
    { name: "Bench Press", currentMax: "84 kg", previousMax: "79 kg", improvement: "+5 kg" },
    { name: "Squats", currentMax: "102 kg", previousMax: "97 kg", improvement: "+5 kg" },
    { name: "Deadlifts", currentMax: "125 kg", previousMax: "120 kg", improvement: "+5 kg" },
    { name: "Pull-ups", currentMax: "12 reps", previousMax: "10 reps", improvement: "+2 reps" },
  ];

  const monthlyData = [
    { month: "Sep", workouts: 16, totalWeight: 8500 },
    { month: "Oct", workouts: 18, totalWeight: 9200 },
    { month: "Nov", workouts: 20, totalWeight: 10100 },
    { month: "Dec", workouts: 22, totalWeight: 11400 },
    { month: "Jan", workouts: 15, totalWeight: 8200 }, // Current month (partial)
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Progress & Analytics</h1>
          <p className="text-muted-foreground">Track your fitness journey and improvements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button variant="default">View Reports</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary text-white shadow-glow border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Total Workouts</p>
                <p className="text-3xl font-bold">{stats.totalWorkouts}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Weight Lifted</p>
                <p className="text-3xl font-bold">{stats.totalWeightLifted.toLocaleString()}</p>
                <p className="text-white/70 text-sm">kg total</p>
              </div>
              <BarChart3 className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Avg Duration</p>
                <p className="text-3xl font-bold">{stats.averageWorkoutTime}</p>
                <p className="text-white/70 text-sm">minutes</p>
              </div>
              <Activity className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold text-primary">{stats.currentStreak}</p>
                <p className="text-muted-foreground text-sm">days</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Chart Placeholder */}
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-primary">{month.month}</span>
                    </div>
                    <div>
                      <p className="font-medium">{month.workouts} workouts</p>
                      <p className="text-sm text-muted-foreground">{month.totalWeight.toLocaleString()} kg lifted</p>
                    </div>
                  </div>
                  {index > 0 && month.workouts > monthlyData[index - 1].workouts && (
                    <Badge variant="default" className="bg-success">
                      +{month.workouts - monthlyData[index - 1].workouts}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Progress */}
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Exercise Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exerciseProgress.map((exercise) => (
                <div key={exercise.name} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {exercise.improvement}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Previous: {exercise.previousMax}</span>
                    <span className="font-medium">Current: {exercise.currentMax}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Workout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-smooth">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{workout.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{workout.duration} min</p>
                    <p className="text-muted-foreground">Duration</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{workout.exercises}</p>
                    <p className="text-muted-foreground">Exercises</p>
                  </div>
                  {workout.totalWeight > 0 && (
                    <div className="text-center">
                      <p className="font-medium">{workout.totalWeight} kg</p>
                      <p className="text-muted-foreground">Total Weight</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;