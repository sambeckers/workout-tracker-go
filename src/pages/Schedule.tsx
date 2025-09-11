import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users, Play, Edit, Trash2 } from "lucide-react";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - replace with actual data from your backend
  const workouts = [
    {
      id: 1,
      title: "Upper Body Strength",
      date: "2024-01-15",
      time: "9:00 AM",
      duration: "60 min",
      type: "Strength",
      status: "scheduled",
      participants: ["Sam Beckers"],
    },
    {
      id: 2,
      title: "Cardio HIIT",
      date: "2024-01-15",
      time: "6:00 PM", 
      duration: "45 min",
      type: "Cardio",
      status: "scheduled",
      participants: ["Ricardo Scholten", "Suzanne van Elten"],
    },
    {
      id: 3,
      title: "Leg Day",
      date: "2024-01-16",
      time: "10:00 AM",
      duration: "75 min",
      type: "Strength",
      status: "completed",
      participants: ["Sam Beckers"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "scheduled":
        return "bg-primary";
      case "missed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workout Schedule</h1>
          <p className="text-muted-foreground">Plan and track your training sessions</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" />
          New Workout
        </Button>
      </div>

      {/* Calendar & Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendar */}
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="text-4xl font-bold mt-2">
                {selectedDate.getDate()}
              </div>
              <div className="text-muted-foreground">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
            </div>
            {/* Simple calendar grid would go here in a real implementation */}
          </CardContent>
        </Card>

        {/* Workout List */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardHeader>
              <CardTitle>Upcoming Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-smooth"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workout.title}</h3>
                          <Badge className={getStatusColor(workout.status)}>
                            {workout.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(workout.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {workout.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {workout.participants.length} participant{workout.participants.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{workout.type}</Badge>
                          <span className="text-sm text-muted-foreground">{workout.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {workout.status === "scheduled" && (
                          <Button variant="success" size="sm" className="gap-1">
                            <Play className="h-3 w-3" />
                            Start
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;