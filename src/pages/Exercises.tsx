import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Dumbbell, Heart, Zap, Target } from "lucide-react";

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock exercise data
  const exercises = [
    {
      id: 1,
      name: "Bench Press",
      category: "chest",
      equipment: "Barbell",
      difficulty: "Intermediate",
      muscleGroups: ["Chest", "Triceps", "Shoulders"],
      description: "Classic upper body compound movement for building chest strength.",
    },
    {
      id: 2,
      name: "Squats",
      category: "legs",
      equipment: "Barbell",
      difficulty: "Beginner",
      muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
      description: "Fundamental lower body exercise for building leg and glute strength.",
    },
    {
      id: 3,
      name: "Deadlifts",
      category: "back",
      equipment: "Barbell",
      difficulty: "Advanced",
      muscleGroups: ["Back", "Hamstrings", "Glutes", "Core"],
      description: "King of compound movements, targets multiple muscle groups.",
    },
    {
      id: 4,
      name: "Push Ups",
      category: "chest",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      muscleGroups: ["Chest", "Triceps", "Core"],
      description: "Classic bodyweight exercise for upper body strength.",
    },
    {
      id: 5,
      name: "Mountain Climbers",
      category: "cardio",
      equipment: "Bodyweight",
      difficulty: "Intermediate",
      muscleGroups: ["Core", "Legs", "Shoulders"],
      description: "High-intensity cardio exercise that builds endurance.",
    },
    {
      id: 6,
      name: "Plank",
      category: "core",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      muscleGroups: ["Core", "Shoulders"],
      description: "Isometric exercise for core stability and strength.",
    },
  ];

  const categories = [
    { id: "all", name: "All Exercises", icon: Dumbbell },
    { id: "chest", name: "Chest", icon: Target },
    { id: "back", name: "Back", icon: Target },
    { id: "legs", name: "Legs", icon: Target },
    { id: "shoulders", name: "Shoulders", icon: Target },
    { id: "arms", name: "Arms", icon: Target },
    { id: "core", name: "Core", icon: Target },
    { id: "cardio", name: "Cardio", icon: Heart },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-success";
      case "intermediate":
        return "bg-warning";
      case "advanced":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          <p className="text-muted-foreground">Discover exercises for every muscle group</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div>
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="bg-gradient-card shadow-lg border-0 hover:shadow-xl transition-smooth">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    <Badge className={getDifficultyColor(exercise.difficulty)}>
                      {exercise.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{exercise.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Equipment:</span>
                      <Badge variant="outline" className="ml-2">{exercise.equipment}</Badge>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Muscle Groups:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscleGroups.map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="default" size="sm">
                      Add to Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <Card className="bg-gradient-card shadow-lg border-0">
              <CardContent className="text-center py-12">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exercises;