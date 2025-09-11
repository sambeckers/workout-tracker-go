import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Pause, Check, Timer, Dumbbell, Save } from "lucide-react";

const WorkoutSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);

  // Mock workout data
  const workout = {
    id: id || "new",
    title: id === "new" ? "New Workout" : "Upper Body Strength",
    type: "Strength Training",
    startTime: new Date(),
    exercises: [
      {
        id: 1,
        name: "Bench Press",
        sets: [
          { setNumber: 1, reps: 8, weight: 185, completed: true },
          { setNumber: 2, reps: 8, weight: 185, completed: true },
          { setNumber: 3, reps: 8, weight: 185, completed: false },
        ],
      },
      {
        id: 2,
        name: "Incline Dumbbell Press",
        sets: [
          { setNumber: 1, reps: 10, weight: 70, completed: false },
          { setNumber: 2, reps: 10, weight: 70, completed: false },
          { setNumber: 3, reps: 10, weight: 70, completed: false },
        ],
      },
    ],
  };

  const [exercises, setExercises] = useState(workout.exercises);

  const toggleSet = (exerciseId: number, setIndex: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set, index) => 
              index === setIndex ? { ...set, completed: !set.completed } : set
            )
          }
        : exercise
    ));
  };

  const updateSet = (exerciseId: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set, index) => 
              index === setIndex ? { ...set, [field]: value } : set
            )
          }
        : exercise
    ));
  };

  const completedSets = exercises.reduce((total, exercise) => 
    total + exercise.sets.filter(set => set.completed).length, 0
  );
  
  const totalSets = exercises.reduce((total, exercise) => 
    total + exercise.sets.length, 0
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{workout.title}</h1>
            <p className="text-muted-foreground">{workout.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button 
            variant={isActive ? "warning" : "hero"}
            onClick={() => setIsActive(!isActive)}
            className="gap-2"
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary text-white shadow-glow border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Duration</p>
                <p className="text-2xl font-bold">{formatTime(duration)}</p>
              </div>
              <Timer className="h-6 w-6 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary text-white shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Exercises</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
              <Dumbbell className="h-6 w-6 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-white shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Sets Complete</p>
                <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
              </div>
              <Check className="h-6 w-6 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Progress</p>
                <p className="text-2xl font-bold text-primary">
                  {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
                </p>
              </div>
              <div className="text-primary text-2xl">📈</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise List */}
      <div className="space-y-6">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="bg-gradient-card shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{exercise.name}</span>
                <Badge variant="outline">
                  {exercise.sets.filter(set => set.completed).length}/{exercise.sets.length} sets
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exercise.sets.map((set, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-smooth ${
                      set.completed 
                        ? "bg-success/10 border border-success/20" 
                        : "bg-muted/50 hover:bg-muted/70"
                    }`}
                  >
                    <div className="w-8 text-center font-medium">
                      {set.setNumber}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium w-12">Reps:</label>
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.id, index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-20 h-9"
                        disabled={set.completed}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium w-16">Weight:</label>
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exercise.id, index, 'weight', parseInt(e.target.value) || 0)}
                        className="w-20 h-9"
                        disabled={set.completed}
                      />
                      <span className="text-sm text-muted-foreground">kg</span>
                    </div>

                    <Button
                      variant={set.completed ? "success" : "outline"}
                      size="sm"
                      onClick={() => toggleSet(exercise.id, index)}
                      className="ml-auto"
                    >
                      {set.completed ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Done
                        </>
                      ) : (
                        "Complete"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <Card className="bg-gradient-card shadow-lg border-0 border-dashed hover:shadow-xl transition-smooth cursor-pointer">
          <CardContent className="p-8 text-center">
            <Button variant="ghost" className="gap-2" size="lg">
              <Plus className="h-5 w-5" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Finish Workout */}
      {completedSets === totalSets && totalSets > 0 && (
        <Card className="bg-gradient-hero text-white shadow-glow border-0">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Workout Complete! 🎉</h3>
            <p className="text-white/90 mb-4">
              Great job! You completed all {totalSets} sets in {formatTime(duration)}.
            </p>
            <Button variant="accent" size="lg" onClick={() => navigate('/progress')}>
              View Progress
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkoutSession;