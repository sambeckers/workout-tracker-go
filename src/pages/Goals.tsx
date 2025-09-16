import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, Plus, Edit, Trash2, Dumbbell, Heart, Activity, Zap, Smile, Download } from 'lucide-react';
import { useGoals, useCreateGoal, useExportWorkoutData } from '@/hooks/useWorkoutData';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const Goals = () => {
  const { user } = useAuth();
  const { data: goals = [], isLoading } = useGoals();
  const createGoalMutation = useCreateGoal();
  const exportDataMutation = useExportWorkoutData();

  const categories = [
    { id: 'All', name: 'All Goals', icon: Target },
    { id: 'Strength', name: 'Strength', icon: Dumbbell },
    { id: 'Weight Loss', name: 'Weight Loss', icon: TrendingUp },
    { id: 'Conditioning', name: 'Conditioning', icon: Heart },
    { id: 'Flexibility', name: 'Flexibility', icon: Activity },
    { id: 'Rehab', name: 'Rehab', icon: Smile }
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-green-500';
      case 'Abandoned':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryItem = categories.find(cat => cat.id === category);
    return categoryItem ? categoryItem.icon : Target;
  };

  const handleCreateGoal = () => {
    createGoalMutation.mutate({
      title: "New Goal",
      description: "Set your goal description",
      category: "Strength",
      status: "Active",
      target_value: "100",
      current_value: "0"
    });
  };

  // Filter goals by category
  const filteredGoals = goals.filter(goal => 
    selectedCategory === 'All' || goal.category === selectedCategory
  );

  // Calculate statistics
  const activeGoals = goals.filter(goal => goal.status === 'Active').length;
  const completedGoals = goals.filter(goal => goal.status === 'Completed').length;
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => {
        if (!goal.target_value || !goal.current_value) return sum;
        const progress = (parseFloat(goal.current_value) / parseFloat(goal.target_value)) * 100;
        return sum + Math.min(progress, 100);
      }, 0) / goals.length)
    : 0;

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your goals.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fitness Goals</h1>
          <p className="text-muted-foreground mt-2">Set, track, and achieve your fitness objectives</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => exportDataMutation.mutate()}
            className="flex items-center gap-2"
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button 
            onClick={handleCreateGoal}
            className="flex items-center gap-2"
            disabled={createGoalMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoals}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedGoals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading goals...</p>
          </Card>
        ) : filteredGoals.length > 0 ? (
          filteredGoals.map((goal) => {
            const IconComponent = getCategoryIcon(goal.category || 'All');
            const progress = goal.current_value && goal.target_value 
              ? Math.min((parseFloat(goal.current_value) / parseFloat(goal.target_value)) * 100, 100)
              : 0;

            return (
              <Card key={goal.goal_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1 text-destructive">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-semibold">{goal.current_value || '0'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold">{goal.target_value || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {goal.deadline ? format(parseISO(goal.deadline), 'MMM dd, yyyy') : 'No deadline'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No goals found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === 'All' 
                ? "You haven't set any fitness goals yet. Create your first goal to get started!"
                : `No goals found in the ${selectedCategory} category. Try selecting a different category or create a new goal.`
              }
            </p>
            <Button 
              className="flex items-center gap-2 mx-auto"
              onClick={handleCreateGoal}
              disabled={createGoalMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Create Your First Goal
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Goals;