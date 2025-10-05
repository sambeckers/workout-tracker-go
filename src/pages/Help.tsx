import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Plus, 
  Dumbbell, 
  Edit, 
  Trash2, 
  Check, 
  Calendar,
  TrendingUp,
  Book,
  Info
} from 'lucide-react';

const Help = () => {
  return (
  <div className="app-container p-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Help & Features Guide</h1>
          <p className="text-muted-foreground">Learn how to use your workout tracker effectively</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Button Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Button Types & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Plan Workout
                </div>
                <span className="text-sm">Create detailed workout with exercises, sets, and schedule</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-outline border px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Play className="h-4 w-4" />
                  Quick Session
                </div>
                <span className="text-sm">Start immediate workout with basic timer - no planning</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-outline border px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Dumbbell className="h-4 w-4" />
                  Open Session
                </div>
                <span className="text-sm">View/perform workout session with set tracking</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-outline border px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Edit className="h-4 w-4" />
                  Edit Plan
                </div>
                <span className="text-sm">Edit workout details, exercises, and schedule</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-primary text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4" />
                  Mark Done/Undo
                </div>
                <span className="text-sm">Toggle workout completion status (click to undo)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-red-500 text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </div>
                <span className="text-sm">Permanently remove workout (confirmation required)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Plan Your Workout</p>
                  <p className="text-sm text-muted-foreground">Use "Plan Workout" to create detailed sessions with specific exercises, sets, and reps</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Track Your Session</p>
                  <p className="text-sm text-muted-foreground">Click "Open Session" to perform the workout and log your sets with weights</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Complete & Review</p>
                  <p className="text-sm text-muted-foreground">Mark sets as done (✓), then "Mark Done" when finished to track progress</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Monitor Progress</p>
                  <p className="text-sm text-muted-foreground">Check your Progress page to see workout history and improvements</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Differences */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Session vs Plan Workout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Quick Session
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Immediate workout start</li>
                  <li>• Basic timer functionality</li>
                  <li>• Add exercises on the go</li>
                  <li>• Spontaneous workouts</li>
                  <li>• No pre-planning required</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Plan Workout
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Pre-plan exercises and sets</li>
                  <li>• Set target reps and weights</li>
                  <li>• Schedule for specific date/time</li>
                  <li>• Add workout notes</li>
                  <li>• Structured training programs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Schedule</p>
                  <p className="text-sm text-muted-foreground">View, create, and manage your workout calendar</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Exercises</p>
                  <p className="text-sm text-muted-foreground">Browse exercise library and create new exercises</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Progress</p>
                  <p className="text-sm text-muted-foreground">View workout history and performance trends</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Set Tracking Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Set Tracking & Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How to Track Sets:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Enter reps and weight for each set</li>
                <li>Click the checkmark button (✓) to mark set as complete</li>
                <li>Completed sets turn green and show "Done"</li>
                <li>Click "Done" again to undo if needed</li>
                <li>Use "Mark Done" button to complete entire workout</li>
              </ol>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Adding Exercises Mid-Workout:</h4>
              <p className="text-sm text-muted-foreground">
                In any workout session, click "Add Exercise" to browse the exercise library. 
                Select exercises to add them to your current workout with default set/rep targets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;