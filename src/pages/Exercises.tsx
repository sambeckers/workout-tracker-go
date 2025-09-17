import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Dumbbell, Heart, Zap, Target, Users, Plus } from 'lucide-react';
import { useExercises } from '@/hooks/useWorkoutData';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: exercises = [], isLoading } = useExercises();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    muscle_group: '',
    description: '',
    equipment: '',
    difficulty: 'Beginner'
  });

  const categories = [
    { id: 'All', name: 'All Exercises', icon: Target },
    { id: 'Chest', name: 'Chest', icon: Dumbbell },
    { id: 'Back', name: 'Back', icon: Dumbbell },
    { id: 'Legs', name: 'Legs', icon: Dumbbell },
    { id: 'Shoulders', name: 'Shoulders', icon: Dumbbell },
    { id: 'Core', name: 'Core', icon: Target },
    { id: 'Full Body', name: 'Full Body', icon: Users }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter exercises based on search term and category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (exercise.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.muscle_group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async () => {
    if (!form.name) return;
    const { error } = await supabase.from('exercises').insert({
      name: form.name,
      muscle_group: form.muscle_group || null,
      description: form.description || null,
      equipment: form.equipment || null,
      difficulty: form.difficulty || null
    });
    if (error) {
      toast.error('Failed to create exercise');
    } else {
      toast.success('Exercise created');
      setCreateOpen(false);
      setForm({ name: '', muscle_group: '', description: '', equipment: '', difficulty: 'Beginner' });
    }
  };

  const addToWorkout = (exerciseId: string) => {
    navigate(`/dashboard/workout/new?exerciseId=${exerciseId}`);
  };

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
          <p className="text-muted-foreground mt-2">Discover and track exercises for every muscle group</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ex-name">Name</Label>
                <Input id="ex-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ex-muscle">Muscle Group</Label>
                <Input id="ex-muscle" value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))} placeholder="Chest, Back..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ex-desc">Description</Label>
                <Input id="ex-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ex-equip">Equipment</Label>
                  <Input id="ex-equip" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ex-diff">Difficulty</Label>
                  <select id="ex-diff" className="border rounded-md h-9 px-2 bg-background" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button disabled={!form.name} onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading exercises...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.exercise_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      {exercise.difficulty && (
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {exercise.difficulty}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4">
                      {exercise.description || 'No description available'}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm">
                      {exercise.equipment && (
                        <div className="flex justify-between">
                          <span className="font-medium">Equipment:</span>
                          <span className="text-muted-foreground">{exercise.equipment}</span>
                        </div>
                      )}
                      {exercise.muscle_group && (
                        <div className="flex justify-between">
                          <span className="font-medium">Muscle Group:</span>
                          <span className="text-muted-foreground">{exercise.muscle_group}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => addToWorkout(exercise.exercise_id)}>
                        Add to Workout
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredExercises.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No exercises found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exercises;