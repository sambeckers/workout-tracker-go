import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, Target, Play, Edit, Trash2, Plus, Download } from 'lucide-react';
import { useWorkoutSessions, useCreateWorkoutSession, useUpdateWorkoutSession, useExportWorkoutData } from '@/hooks/useWorkoutData';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const { data: workouts = [], isLoading } = useWorkoutSessions();
  const createWorkoutMutation = useCreateWorkoutSession();
  const updateWorkoutMutation = useUpdateWorkoutSession();
  const exportDataMutation = useExportWorkoutData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-500';
      case 'Planned':
        return 'bg-blue-500';
      case 'Skipped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCreateWorkout = () => {
    createWorkoutMutation.mutate({
      title: "New Workout",
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: "09:00",
      status: "Planned",
      duration_minutes: 60
    });
  };

  const handleStartWorkout = (sessionId: string) => {
    updateWorkoutMutation.mutate({
      sessionId,
      data: { status: 'Done' }
    });
  };

  const filteredWorkouts = workouts.filter(workout => 
    format(parseISO(workout.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your workout schedule.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Workout Schedule</h1>
          <p className="text-muted-foreground mt-2">Plan and track your fitness routine</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportDataMutation.mutate()}
            variant="outline"
            className="flex items-center gap-2"
            disabled={exportDataMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button 
            onClick={handleCreateWorkout}
            className="flex items-center gap-2"
            disabled={createWorkoutMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            Add Workout
          </Button>
        </div>
      </div>

      {/* Calendar and Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

      {/* Workouts List */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Workouts for {selectedDate.toLocaleDateString()}
        </h2>
        
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading workouts...</p>
          </Card>
        ) : filteredWorkouts.length > 0 ? (
          filteredWorkouts.map((workout) => (
            <Card key={workout.session_id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{workout.title || 'Untitled Workout'}</h3>
                    <Badge className={getStatusColor(workout.status)}>
                      {workout.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {workout.time || 'No time set'} • {workout.duration_minutes || 0} mins
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {format(parseISO(workout.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <p className="text-sm text-muted-foreground">{workout.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {workout.status === 'Planned' && (
                    <Button 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => handleStartWorkout(workout.session_id)}
                      disabled={updateWorkoutMutation.isPending}
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No workouts scheduled</h3>
            <p className="text-muted-foreground mb-4">
              You haven't scheduled any workouts for this date yet.
            </p>
            <Button 
              className="flex items-center gap-2 mx-auto"
              onClick={handleCreateWorkout}
              disabled={createWorkoutMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Schedule Workout
            </Button>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default Schedule;