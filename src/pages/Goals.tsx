import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Calendar, TrendingUp, Trophy, Edit, Trash2 } from "lucide-react";

const Goals = () => {
  // Mock goals data
  const goals = [
    {
      id: 1,
      title: "Bench Press 200lbs",
      category: "Strength",
      current: 185,
      target: 200,
      unit: "lbs",
      deadline: "2024-03-01",
      status: "active",
      progress: 92.5,
    },
    {
      id: 2,
      title: "Run 5K under 25 minutes",
      category: "Cardio",
      current: 26.5,
      target: 25,
      unit: "min",
      deadline: "2024-02-15",
      status: "active",
      progress: 75,
    },
    {
      id: 3,
      title: "Workout 4x per week",
      category: "Consistency",
      current: 3,
      target: 4,
      unit: "workouts/week",
      deadline: "2024-12-31",
      status: "active",
      progress: 75,
    },
    {
      id: 4,
      title: "Deadlift 300lbs",
      category: "Strength",
      current: 300,
      target: 300,
      unit: "lbs",
      deadline: "2024-01-15",
      status: "completed",
      progress: 100,
    },
  ];

  const categories = ["All", "Strength", "Cardio", "Weight Loss", "Consistency"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "active":
        return "bg-primary";
      case "paused":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Strength":
        return Target;
      case "Cardio":
        return TrendingUp;
      case "Consistency":
        return Calendar;
      default:
        return Trophy;
    }
  };

  const filteredGoals = selectedCategory === "All" 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  const activeGoals = goals.filter(goal => goal.status === "active").length;
  const completedGoals = goals.filter(goal => goal.status === "completed").length;
  const averageProgress = goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Goals & Targets</h1>
          <p className="text-muted-foreground">Set and track your fitness objectives</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-white shadow-glow border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Active Goals</p>
                <p className="text-3xl font-bold">{activeGoals}</p>
              </div>
              <Target className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Completed</p>
                <p className="text-3xl font-bold">{completedGoals}</p>
              </div>
              <Trophy className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">Avg Progress</p>
                <p className="text-3xl font-bold">{Math.round(averageProgress)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const IconComponent = getCategoryIcon(goal.category);
          const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== "completed";
          
          return (
            <Card key={goal.id} className="bg-gradient-card shadow-lg border-0 hover:shadow-xl transition-smooth">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Current vs Target */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-xl font-bold text-primary">
                        {goal.current} {goal.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Target</p>
                      <p className="text-xl font-bold">
                        {goal.target} {goal.unit}
                      </p>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant="outline">{goal.category}</Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No goals found</h3>
            <p className="text-muted-foreground">Create your first goal to start tracking progress</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Goals;