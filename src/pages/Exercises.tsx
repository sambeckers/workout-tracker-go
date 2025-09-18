import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, Plus, Pencil, Trash2, ChevronDown, Settings, Dumbbell } from 'lucide-react';
import { useExercises, useUpdateExercise } from '@/hooks/useWorkoutData';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Intelligent seed mapping for provided exercise names
const SEED_EXERCISE_NAMES = [
  '5-minute Pull-up',
  'Abdominal',
  'Back Extension',
  'Barbell Bench press',
  'Bent-over Row',
  'Bicep Curl',
  'Bicep Pulldown',
  'Boxing',
  'Bulgarian Split Squat',
  'Cable Chest Press',
  'Cable Incline Chest Fly',
  'Cable Rope Pushdown',
  'Cable Side Lateral Raise',
  'Cable Tennis Forehand',
  'Cable Tennis Serve',
  'Calf Extensions',
  'Calf Raise',
  'Chest Press',
  'Crosstraining',
  'Cycling',
  'Deadhang',
  'Deadlift',
  'Dumbbell Backhand',
  'Dumbbell Bench press',
  'Dynamic Stretches',
  'Endorotation',
  'Exorotation',
  'External Rotation Press',
  'Face Pull',
  'Forward Raise',
  'Hip abduction',
  "Igor's Abs",
  'Incline Bench Press',
  'Incline Chest Press',
  'Incline Scapular Push-up',
  'Inner Thigh',
  'Kettlebell Ladder',
  'Kettlebell Lateral Lunge',
  'Kettlebell Lunge',
  'Kettlebell Squat',
  'Kettlebell Swing',
  'Lat Pulldown',
  'Lateral Raise',
  'Leg extension',
  'Machine Horizontal Leg Press',
  'Machine Leg Press',
  'Machine Pectoral (Chest) Fly',
  'Machine Reverse Fly',
  'Machine Seated Cable Row',
  'Overhead Press',
  'Padel',
  'Plank',
  'Pull-up',
  'Push-up',
  'Rear Delt Single Arm Machine',
  'Ren ding',
  'Renegade Row',
  'Resistance Band Rotator Cuff',
  'Romanian Deadlift',
  'Rotary Torso',
  'Rowing',
  'Running',
  'Russian Twist',
  'Sauna',
  'Seated dip',
  'Seated Leg Curl',
  'Skullcrusher',
  'Soccer',
  'Squat',
  'Stairs',
  'Stretch',
  'Tennis',
  'Treadmill Running',
  'Tricep Kickback',
  'Triceps extensions',
  'Upright Row',
  'Vertical Traction',
  'Walking Lunge',
  'Wrist flexion & extension',
  'Yoga',
];

const mapExerciseToGroup = (name: string): string => {
  const n = name.toLowerCase();
  // Specific first
  if (/(wrist|forearm)/.test(n)) return 'Forearms';
  if (/calf/.test(n)) return 'Lower Body';
  if (/(lunge|squat|leg\s|leg\b|hamstring|quad|thigh|hip|glute)/.test(n)) return 'Lower Body';
  if (/(deadlift|romanian deadlift)/.test(n)) return 'Lower Body';
  if (/(row|pulldown|reverse fly|seated cable row|vertical traction|back extension)/.test(n)) return 'Back';
  if (/(bench|chest|pectoral)/.test(n)) return 'Chest';
  if (/(press)/.test(n) && /(overhead|shoulder)/.test(n)) return 'Shoulder';
  if (/(lateral raise|rear delt|upright row|scapular|rotator cuff|rotation|face pull|forward raise)/.test(n)) return 'Shoulder';
  if (/(bicep|tricep|skullcrusher|dip|pushdown|kickback|curl)/.test(n)) return 'Arm';
  if (/(plank|twist|abdominal|abs|torso)/.test(n)) return 'Abs';
  if (/(pull-up|push-up)/.test(n)) return 'Upper Body';
  if (/(boxing|crosstraining|cycling|running|treadmill|rowing|padel|tennis|soccer|stairs|yoga|stretch|dynamic)/.test(n)) return 'Full Body';
  if (/hip/.test(n)) return 'Lower Body';
  return 'Upper Body';
};

const inferEquipment = (name: string): string => {
  const n = name.toLowerCase();
  if (/barbell/.test(n)) return 'Barbell';
  if (/dumbbell/.test(n)) return 'Dumbbell';
  if (/kettlebell/.test(n)) return 'Kettlebell';
  if (/(cable|pulldown|rope)/.test(n)) return 'Cable Machine';
  if (/(machine|leg press|reverse fly|seated cable row|vertical traction|pec.*fly)/.test(n)) return 'Machine';
  if (/(band|resistance)/.test(n)) return 'Resistance Band';
  if (/(rowing|treadmill|running|cycling)/.test(n)) return 'Cardio Equipment';
  if (/(plank|push-up|pull-up|dead hang|deadhang|stretch|yoga|stairs)/.test(n)) return 'Bodyweight';
  if (/boxing|tennis|soccer|padel|running|rowing/.test(n)) return 'Sports/Conditioning';
  return 'Various';
};

const inferMovementType = (name: string): 'compound' | 'isolation' | 'conditioning' => {
  const n = name.toLowerCase();
  if (/(boxing|crosstraining|cycling|running|treadmill|rowing|padel|tennis|soccer|stairs|yoga|stretch|dynamic)/.test(n)) return 'conditioning';
  if (/(curl|kickback|raise|pushdown|fly|rotation|rotator|wrist|forearm|calf|extension\b)/.test(n)) return 'isolation';
  return 'compound';
};

const buildDescription = (name: string, group: string): string => {
  const type = inferMovementType(name);
  if (type === 'conditioning') {
    return `${name} is a conditioning exercise to improve cardio and endurance.`;
  }
  if (type === 'isolation') {
    return `${name} is an isolation movement focusing on the ${group.toLowerCase()}. Maintain control and smooth tempo.`;
  }
  return `${name} is a compound exercise targeting the ${group.toLowerCase()}. Emphasize form through a full range of motion.`;
};

const SEED_EXERCISES = Array.from(new Set(SEED_EXERCISE_NAMES.map(n => n.trim())))
  .filter(Boolean)
  .map((name) => {
    const muscle_group = mapExerciseToGroup(name);
    const equipment = inferEquipment(name);
    const description = buildDescription(name, muscle_group);
    return { name, muscle_group, equipment, description };
  });

// Render-time fallbacks
const getDisplayGroup = (e: { name: string; muscle_group?: string }) => e.muscle_group || mapExerciseToGroup(e.name);
const getDisplayDescription = (e: { name: string; muscle_group?: string; description?: string }) => e.description || buildDescription(e.name, getDisplayGroup(e));
const getDisplayEquipment = (e: { name: string; equipment?: string }) => e.equipment || inferEquipment(e.name);

const Exercises = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: exercises = [], isLoading } = useExercises();
  const updateExerciseMutation = useUpdateExercise();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    muscle_group: '',
    description: '',
    equipment: '',
    difficulty: 'Beginner'
  });

  type Category = { id: string; name: string; icon: string; diagram?: string; imageUrl?: string };

  // Deprecated symbol mapping removed in favor of MuscleDiagram component

  // Icon options removed per request to display only text

  // Organized defaults by region for quick discoverability
  const BASE_CATEGORIES: Category[] = [
    // Full body / conditioning
    { id: 'Full Body (cardio)', name: 'Full Body (cardio)', icon: 'Activity', imageUrl: '/muscles/cardio.svg' },

    // Upper body
  { id: 'Shoulders', name: 'Shoulders', icon: 'Accessibility', imageUrl: '/muscles/shoulders.svg' },
  { id: 'Anterior - Deltoid', name: 'Anterior - Deltoid', icon: 'Target', imageUrl: '/muscles/deltoid-anterior.svg' },
  { id: 'Rotator cuff', name: 'Rotator cuff', icon: 'Target' },
  { id: 'Chest', name: 'Chest', icon: 'Heart', imageUrl: '/muscles/chest.svg' },
  { id: 'Lats', name: 'Lats', icon: 'Users', imageUrl: '/muscles/lats.svg' },
  { id: 'Trapezoid', name: 'Trapezoid', icon: 'Zap', imageUrl: '/muscles/traps.svg' },
  { id: 'Traps', name: 'Traps', icon: 'Zap', imageUrl: '/muscles/traps.svg' },
  { id: 'Biceps', name: 'Biceps', icon: 'Dumbbell', imageUrl: '/muscles/biceps.svg' },
  { id: 'Triceps', name: 'Triceps', icon: 'Dumbbell', imageUrl: '/muscles/triceps.svg' },
  { id: 'Forearms', name: 'Forearms', icon: 'Hand', imageUrl: '/muscles/forearms.svg' },

    // Core
  { id: 'Abs', name: 'Abs', icon: 'Target', imageUrl: '/muscles/abs.svg' },
  { id: 'Upper abs', name: 'Upper abs', icon: 'Clock', imageUrl: '/muscles/abs.svg' },
  { id: 'Lower abs', name: 'Lower abs', icon: 'Timer', imageUrl: '/muscles/abs.svg' },
  { id: 'Obliques', name: 'Obliques', icon: 'Zap', imageUrl: '/muscles/obliques.svg' },
  { id: 'Lower back', name: 'Lower back', icon: 'Bone', imageUrl: '/muscles/lower-back.svg' },

    // Lower body
    { id: 'Glutes', name: 'Glutes', icon: 'Flame', imageUrl: '/muscles/glutes.svg' },
    { id: 'Hips', name: 'Hips', icon: 'Accessibility', imageUrl: '/muscles/hips.svg' },
    { id: 'Quadriceps', name: 'Quadriceps', icon: 'Footprints', imageUrl: '/muscles/quadriceps.svg' },
    { id: 'Hamstrings', name: 'Hamstrings', icon: 'Footprints', imageUrl: '/muscles/hamstrings.svg' },
    { id: 'Abductors', name: 'Abductors', icon: 'Target' },
    { id: 'Calves', name: 'Calves', icon: 'Footprints', imageUrl: '/muscles/calves.svg' },
    { id: 'Shins', name: 'Shins', icon: 'Bone', imageUrl: '/muscles/shins.svg' },
  ];

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAllCats, setShowAllCats] = useState(false);
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [editCatOpen, setEditCatOpen] = useState<null | Category>(null);
  const [catForm, setCatForm] = useState<{ name: string; icon: string; imageUrl?: string }>({ name: '', icon: 'Dumbbell', imageUrl: '' });
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [viewDetailsOpen, setViewDetailsOpen] = useState<null | any>(null);
  const [editExerciseOpen, setEditExerciseOpen] = useState<null | any>(null);
  const [editForm, setEditForm] = useState({
    muscle_group: '',
    equipment: '',
    description: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced'
  });

  // Load categories from localStorage with fallback recovery
  useEffect(() => {
    try {
      // Try primary storage
      const saved = localStorage.getItem('custom-categories-v1');
      if (saved) {
        const parsed: Category[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
      
      // Try backup storage
      const backup = localStorage.getItem('muscle-groups-backup');
      if (backup) {
        const names: string[] = JSON.parse(backup);
        if (Array.isArray(names) && names.length > 0) {
          // Reconstruct categories from names
          const reconstructed = names.map((name, index) => ({
            id: name,
            name,
            icon: 'Dumbbell',
          }));
          setCategories(reconstructed);
          // Save to primary storage
          saveCategories(reconstructed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from localStorage:', e);
    }
    
    // Fallback to base categories
    setCategories(BASE_CATEGORIES);
    saveCategories(BASE_CATEGORIES);
  }, []);

  // Periodic backup of categories (every 5 minutes when categories change)
  useEffect(() => {
    const interval = setInterval(() => {
      if (categories.length > 0) {
        try {
          const lastUpdated = localStorage.getItem('categories-last-updated');
          if (!lastUpdated || new Date().getTime() - new Date(lastUpdated).getTime() > 5 * 60 * 1000) {
            saveCategories(categories);
          }
        } catch (e) {
          console.warn('Periodic backup failed:', e);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [categories]);

  const saveCategories = (next: Category[]) => {
    setCategories(next);
    try { 
      localStorage.setItem('custom-categories-v1', JSON.stringify(next));
      // Also store a backup with a different key for redundancy
      localStorage.setItem('muscle-groups-backup', JSON.stringify(next.map(c => c.name)));
      // Store a timestamp to track when categories were last updated
      localStorage.setItem('categories-last-updated', new Date().toISOString());
    } catch (e) {
      console.warn('Failed to save categories to localStorage:', e);
    }
  };

  const ALL_CATEGORY: Category = { id: 'All', name: 'All Exercises', icon: 'Target', diagram: '🏋️' };
  const sortedCategories: Category[] = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [categories]
  );
  const displayedCategories: Category[] = useMemo(() => [ALL_CATEGORY, ...sortedCategories], [sortedCategories]);
  const hasOverflow = sortedCategories.length > 10;
  const visibleCategories: Category[] = useMemo(() => {
    if (!hasOverflow || showAllCats) return displayedCategories;
    // Show All + first 10 custom categories when collapsed
    return [ALL_CATEGORY, ...sortedCategories.slice(0, 10)];
  }, [displayedCategories, sortedCategories, hasOverflow, showAllCats]);

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

  // Filter exercises based on search term and category (with fallbacks)
  const filteredExercises = exercises.filter(exercise => {
    const q = searchTerm.toLowerCase();
    const desc = getDisplayDescription(exercise).toLowerCase();
    const matchesSearch = exercise.name.toLowerCase().includes(q) || desc.includes(q);
    const group = getDisplayGroup(exercise);
    const matchesCategory = selectedCategory === 'All' || group === selectedCategory;
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
    navigate(`/workout/new?exerciseId=${exerciseId}`);
  };

  const openEditExercise = (exercise: any) => {
    setEditForm({
      muscle_group: exercise.muscle_group || '',
      equipment: exercise.equipment || '',
      description: exercise.description || '',
      difficulty: exercise.difficulty || 'Beginner'
    });
    setEditExerciseOpen(exercise);
  };

  const handleUpdateExercise = async () => {
    if (!editExerciseOpen) return;
    
    // Auto-add new muscle group to categories if it doesn't exist
    if (editForm.muscle_group && 
        editForm.muscle_group.trim() && 
        !categories.some(cat => cat.name.toLowerCase() === editForm.muscle_group.toLowerCase())) {
      const newCategory: Category = {
        id: editForm.muscle_group.trim(),
        name: editForm.muscle_group.trim(),
        icon: 'Dumbbell'
      };
      const updatedCategories = [...categories, newCategory];
      saveCategories(updatedCategories);
    }
    
    const updateData: any = {};
    if (editForm.muscle_group !== editExerciseOpen.muscle_group) {
      updateData.muscle_group = editForm.muscle_group || null;
    }
    if (editForm.equipment !== editExerciseOpen.equipment) {
      updateData.equipment = editForm.equipment || null;
    }
    if (editForm.description !== editExerciseOpen.description) {
      updateData.description = editForm.description || null;
    }
    if (editForm.difficulty !== editExerciseOpen.difficulty) {
      updateData.difficulty = editForm.difficulty || null;
    }

    if (Object.keys(updateData).length > 0) {
      updateExerciseMutation.mutate({
        exerciseId: editExerciseOpen.exercise_id,
        data: updateData
      });
    }
    
    setEditExerciseOpen(null);
  };

  // Seed missing exercises into Supabase
  useEffect(() => {
    const seed = async () => {
      try {
        const existingNames = new Set(exercises.map(e => e.name.toLowerCase()));
        const missing = SEED_EXERCISES.filter(s => !existingNames.has(s.name.toLowerCase()));
        if (!missing.length) return;
        const { error } = await supabase.from('exercises').insert(missing);
        if (error) throw error;
        toast.success(`Added ${missing.length} exercises to library`);
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
      } catch (err) {
        console.error(err);
        toast.error('Failed to seed exercises');
      }
    };
    if (!isLoading) {
      seed();
    }
  }, [isLoading, exercises, queryClient]);

  // Deduplicate by name (case-insensitive) and enrich missing fields
  useEffect(() => {
    const dedupeAndEnrich = async () => {
      try {
        if (!exercises.length) return;
        const byKey = new Map<string, typeof exercises>();
        exercises.forEach((e) => {
          const k = e.name.trim().toLowerCase();
          const arr = byKey.get(k) || [];
          arr.push(e);
          byKey.set(k, arr);
        });

        const deletes: string[] = [];
        const updates: Array<{ exercise_id: string; description?: string; equipment?: string; muscle_group?: string }> = [];

        byKey.forEach((list) => {
          if (list.length > 1) {
            // Prefer the one that has description and equipment; else earliest created_at
            const sorted = [...list].sort((a, b) => {
              const af = (!!a.description ? 1 : 0) + (!!a.equipment ? 1 : 0);
              const bf = (!!b.description ? 1 : 0) + (!!b.equipment ? 1 : 0);
              if (bf !== af) return bf - af;
              const ad = a.created_at || '';
              const bd = b.created_at || '';
              return ad.localeCompare(bd);
            });
            const keep = sorted[0];
            const rest = sorted.slice(1);
            rest.forEach(r => deletes.push(r.exercise_id));
            // Ensure keep is enriched too
            const group = keep.muscle_group || mapExerciseToGroup(keep.name);
            const equip = keep.equipment || inferEquipment(keep.name);
            const desc = keep.description || buildDescription(keep.name, group);
            if (!keep.muscle_group || !keep.equipment || !keep.description) {
              updates.push({ exercise_id: keep.exercise_id, muscle_group: group, equipment: equip, description: desc });
            }
          } else {
            const [only] = list;
            const group = only.muscle_group || mapExerciseToGroup(only.name);
            const equip = only.equipment || inferEquipment(only.name);
            const desc = only.description || buildDescription(only.name, group);
            if (!only.muscle_group || !only.equipment || !only.description) {
              updates.push({ exercise_id: only.exercise_id, muscle_group: group, equipment: equip, description: desc });
            }
          }
        });

        if (!deletes.length && !updates.length) return;

        if (deletes.length) {
          const { error: delErr } = await supabase.from('exercises').delete().in('exercise_id', deletes);
          if (delErr) throw delErr;
        }

        for (const u of updates) {
          const { error: upErr } = await supabase
            .from('exercises')
            .update({ description: u.description, equipment: u.equipment, muscle_group: u.muscle_group })
            .eq('exercise_id', u.exercise_id);
          if (upErr) throw upErr;
        }

        if (deletes.length || updates.length) {
          toast.success(`Cleaned ${deletes.length} duplicates and enriched ${updates.length} items`);
          queryClient.invalidateQueries({ queryKey: ['exercises'] });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to clean exercises');
      }
    };
    // Run after initial load
    if (!isLoading) dedupeAndEnrich();
  }, [isLoading, exercises, queryClient]);

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Categories Sidebar */}
        <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen} className="self-start min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                <span className="font-semibold text-base">Categories</span>
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="default"
                      className="flex items-center gap-2 h-9 px-3"
                      aria-expanded={categoriesOpen}
                    >
                      {categoriesOpen ? 'Collapse' : 'Expand'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => { setCatForm({ name: '', icon: 'Dumbbell' }); setCreateCatOpen(true); }}
                    title="Manage categories"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="min-w-0">
                <div className="space-y-2 min-w-0">
                  {visibleCategories.map((category) => {
                    const isAll = category.id === 'All';
                    return (
                      <div key={category.id} className="min-w-0">
                        <Button
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          size="sm"
                          className="flex-1 min-w-0 justify-start py-3 px-3 w-full"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span className="truncate leading-none font-medium text-base">{category.name}</span>
                        </Button>
                      </div>
                    );
                  })}
                  {hasOverflow && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAllCats(s => !s)}
                    >
                      {showAllCats ? 'Show less' : `Show more (${categories.length - 10})`}
                    </Button>
                  )}
                  <Button className="w-full" variant="outline" onClick={() => { setCatForm({ name: '', icon: 'Dumbbell' }); setCreateCatOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> New Category
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Exercise Grid */}
  <div className="lg:col-span-3 min-w-0">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading exercises...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-4 pb-3 border-b border-border/50 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedCategory === 'All' ? 'All Exercises' : selectedCategory}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              
              {/* Exercise Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => (
                  <Card key={exercise.exercise_id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg truncate max-w-full">
                        {exercise.name}
                      </CardTitle>
                      {exercise.difficulty && (
                        <Badge className={`${getDifficultyColor(exercise.difficulty)} w-max`}>
                          {exercise.difficulty}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col flex-1">
                      <CardDescription className="mb-4 line-clamp-3">
                        {getDisplayDescription(exercise)}
                      </CardDescription>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-[auto,1fr] items-start gap-x-2">
                          <span className="font-medium">Equipment:</span>
                          <span className="text-muted-foreground break-words">{getDisplayEquipment(exercise)}</span>
                        </div>
                        <div className="grid grid-cols-[auto,1fr] items-start gap-x-2">
                          <span className="font-medium">Muscle Group:</span>
                          <span className="text-muted-foreground break-words">{getDisplayGroup(exercise)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4">
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setViewDetailsOpen(exercise)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredExercises.length === 0 && (
            <div className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-4 pb-3 border-b border-border/50">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedCategory === 'All' ? 'All Exercises' : selectedCategory}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    0 exercises available
                  </p>
                </div>
              </div>
              
              {/* Empty Message */}
              <div className="text-center py-12">
                <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No exercises found</h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manage Categories Dialog */}
      <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Existing Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Categories</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {[...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })).map((category) => {
                  return (
                    <div key={category.id} className="flex items-center justify-between gap-2 p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditCatOpen(category); setCatForm({ name: category.name, icon: category.icon }); }}
                          title="Edit category"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            const next = categories.filter(c => c.id !== category.id);
                            saveCategories(next);
                            if (selectedCategory === category.id) setSelectedCategory('All');
                          }}
                          title="Delete category"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Add New Category */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-medium">Add New Category</Label>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input id="cat-name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter category name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-img">Image URL (optional)</Label>
                  <Input id="cat-img" value={catForm.imageUrl || ''} onChange={e => setCatForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://... (prefer transparent SVG/PNG)" />
                </div>
                {/* Icons and previews removed per request */}
                <Button
                  disabled={!catForm.name.trim()}
                  onClick={() => {
                    const id = catForm.name.trim();
                    if (!id) return;
                    if (displayedCategories.some(c => c.id.toLowerCase() === id.toLowerCase())) return;
                    const next = [...categories, { id, name: catForm.name.trim(), icon: catForm.icon, imageUrl: (catForm.imageUrl || '').trim() }];
                    saveCategories(next);
                    setCatForm({ name: '', icon: 'Dumbbell', imageUrl: '' });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateCatOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCatOpen} onOpenChange={(o) => !o && setEditCatOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-cat-name">Name</Label>
              <Input id="edit-cat-name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cat-img">Image URL (optional)</Label>
              <Input id="edit-cat-img" value={catForm.imageUrl || ''} onChange={e => setCatForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            {/* Icons and previews removed per request */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCatOpen(null)}>Cancel</Button>
            <Button
              disabled={!catForm.name.trim()}
              onClick={() => {
                if (!editCatOpen) return;
                const newId = catForm.name.trim();
                const next = categories.map(c => c.id === editCatOpen.id ? { ...c, id: newId, name: catForm.name.trim(), icon: catForm.icon, imageUrl: (catForm.imageUrl || '').trim() } : c);
                saveCategories(next);
                if (selectedCategory === editCatOpen.id) setSelectedCategory(newId);
                setEditCatOpen(null);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Exercise Details Dialog */}
      <Dialog open={!!viewDetailsOpen} onOpenChange={(o) => !o && setViewDetailsOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewDetailsOpen?.name}</DialogTitle>
          </DialogHeader>
          {viewDetailsOpen && (
            <div className="space-y-6 py-4">
              {/* Exercise Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Muscle Group</Label>
                    <p className="text-base">{getDisplayGroup(viewDetailsOpen)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Equipment</Label>
                    <p className="text-base">{getDisplayEquipment(viewDetailsOpen)}</p>
                  </div>
                  {viewDetailsOpen.difficulty && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Difficulty</Label>
                      <div className="mt-1">
                        <Badge className={`${getDifficultyColor(viewDetailsOpen.difficulty)}`}>
                          {viewDetailsOpen.difficulty}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quick Actions</Label>
                    <div className="space-y-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          openEditExercise(viewDetailsOpen);
                          setViewDetailsOpen(null);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Exercise
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategory(getDisplayGroup(viewDetailsOpen));
                          setViewDetailsOpen(null);
                        }}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        View Similar Exercises
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-base mt-2 leading-relaxed">{getDisplayDescription(viewDetailsOpen)}</p>
              </div>

              {/* Exercise Stats/Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium text-muted-foreground">Exercise Information</Label>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="font-medium">Movement Type:</span>
                    <span className="ml-2 capitalize">{inferMovementType(viewDetailsOpen.name)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Exercise ID:</span>
                    <span className="ml-2 font-mono text-xs">{viewDetailsOpen.exercise_id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog */}
      <Dialog open={!!editExerciseOpen} onOpenChange={(open) => !open && setEditExerciseOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Exercise: {editExerciseOpen?.name || 'Unknown'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-muscle-group">Muscle Group</Label>
              <div className="space-y-2">
                <Select 
                  value={editForm.muscle_group} 
                  onValueChange={(value) => {
                    if (value === '__custom__') {
                      // Switch to input mode for custom entry
                      return;
                    }
                    setEditForm({ ...editForm, muscle_group: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select muscle group" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="">None</SelectItem>
                    {sortedCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-blue-600 font-medium">
                      + Add Custom Muscle Group
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom input fallback */}
                <div className="text-xs text-muted-foreground">
                  Or type a custom muscle group:
                </div>
                <Input
                  placeholder="Type custom muscle group..."
                  value={editForm.muscle_group}
                  onChange={(e) => setEditForm({ ...editForm, muscle_group: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-equipment">Equipment</Label>
              <Input
                id="edit-equipment"
                value={editForm.equipment}
                onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
                placeholder="e.g., Barbell, Dumbbell, Bodyweight"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Brief description of the exercise"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-difficulty">Difficulty</Label>
              <Select 
                value={editForm.difficulty} 
                onValueChange={(value) => setEditForm({ ...editForm, difficulty: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExerciseOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExercise} disabled={updateExerciseMutation.isPending}>
              {updateExerciseMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exercises;