import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // keep for difficulty select
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, Plus, Pencil, ChevronDown, Dumbbell } from 'lucide-react';
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
  
  // Handle specific multi-muscle exercises with comma-separated values
  if (/(5.*min.*pull.*up|5.*minute.*pull.*up|pull.*up.*5.*min)/.test(n)) return 'Lats, Biceps, Shoulders';
  if (/(push.*up|pushup)/.test(n)) return 'Chest, Triceps, Shoulders';
  if (/(pull.*up|pullup)/.test(n) && !/(5.*min|minute)/.test(n)) return 'Lats, Biceps, Shoulders';
  if (/(deadlift)/.test(n)) return 'Glutes, Hamstrings, Lower back';
  if (/(squat)/.test(n)) return 'Glutes, Quadriceps';
  if (/(lunge)/.test(n)) return 'Glutes, Quadriceps';
  if (/(plank)/.test(n)) return 'Abs, Shoulders';
  if (/(renegade.*row)/.test(n)) return 'Lats, Abs, Shoulders';
  if (/(burpee)/.test(n)) return 'Full Body (cardio)';
  
  // Cardio/conditioning exercises
  if (/(boxing|crosstraining|cycling|running|treadmill|rowing|padel|tennis|soccer|stairs|yoga|stretch|dynamic|sauna)/.test(n)) return 'Full Body (cardio)';
  
  // Specific muscle groups (most specific first)
  if (/(wrist|forearm)/.test(n)) return 'Forearms';
  if (/(calf|calves)/.test(n)) return 'Calves';
  
  // Lower body specifics
  if (/(glute)/.test(n)) return 'Glutes';
  if (/(quad|thigh)/.test(n)) return 'Quadriceps';
  if (/(hamstring)/.test(n)) return 'Hamstrings';
  if (/(hip|abduction|abductor)/.test(n)) return 'Hips';
  
  // Upper body specifics
  if (/(bicep|curl)/.test(n) && !/(tricep|pushdown)/.test(n)) return 'Biceps';
  if (/(tricep|skullcrusher|dip|pushdown|kickback|extension)/.test(n) && !/bicep/.test(n)) return 'Triceps';
  if (/(bench|chest|pectoral|fly)/.test(n)) return 'Chest';
  if (/(lat|pulldown|vertical traction)/.test(n)) return 'Lats';
  if (/(trap|upright row)/.test(n)) return 'Traps';
  if (/(row|reverse fly|seated cable row|back extension)/.test(n) && !/upright/.test(n)) return 'Lats';
  
  // Shoulder specifics
  if (/(lateral raise|rear delt|forward raise)/.test(n)) return 'Anterior - Deltoid';
  if (/(rotator cuff|rotation|face pull|exorotation|endorotation|external rotation)/.test(n)) return 'Rotator cuff';
  if (/(press)/.test(n) && /(overhead|shoulder)/.test(n)) return 'Shoulders';
  if (/(scapular)/.test(n)) return 'Shoulders';
  
  // Core specifics
  if (/(plank|twist|abdominal|abs|igor)/.test(n)) return 'Abs';
  if (/(torso|rotary torso)/.test(n)) return 'Obliques';
  if (/(lower back|back extension)/.test(n)) return 'Lower back';
  
  // Default fallbacks
  if (/(arm)/.test(n)) return 'Biceps';
  
  return 'Shoulders'; // Conservative default for upper body
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

// Helper function to split and display multiple muscle groups
const formatMuscleGroups = (muscleGroup: string): string[] => {
  if (!muscleGroup) return [];
  return muscleGroup.split(',').map(g => g.trim()).filter(Boolean);
};

// Color classes per muscle group root keyword
const GROUP_COLOR_MAP: Record<string, string> = {
  Chest: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  Back: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Lats: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  Shoulders: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Legs: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Glutes: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
  Arms: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  Biceps: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  Triceps: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  Core: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  Abs: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  Cardio: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Conditioning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Machine: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200',
  Cable: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200',
  Various: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200'
};

const badgeColorForGroup = (g: string) => {
  const key = Object.keys(GROUP_COLOR_MAP).find(k => g.toLowerCase().includes(k.toLowerCase()));
  return key ? GROUP_COLOR_MAP[key] : GROUP_COLOR_MAP['Various'];
};

const getFirstMuscleGroup = (muscleGroup: string): string => {
  const groups = formatMuscleGroups(muscleGroup);
  return groups[0] || muscleGroup;
};

// Ensure a value shown in Select matches an available category or 'none'
const normalizeToAvailableCategory = (value: string, available: { name: string }[]): string => {
  if (!value) return 'none';
  const first = getFirstMuscleGroup(value);
  const match = available.find(c => c.name.toLowerCase() === first.toLowerCase());
  return match ? match.name : 'none';
};

// Render-time fallbacks
const getDisplayGroup = (e: { name: string; muscle_group?: string }) => {
  const mg = e.muscle_group || '';
  if (!mg || mg.toLowerCase() === 'none') return mapExerciseToGroup(e.name);
  return mg;
};
const getDisplayDescription = (e: { name: string; muscle_group?: string; description?: string }) => e.description || buildDescription(e.name, getFirstMuscleGroup(getDisplayGroup(e)));
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

  const categories: Category[] = BASE_CATEGORIES;
  const [showAllCats, setShowAllCats] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [viewDetailsOpen, setViewDetailsOpen] = useState<null | any>(null);
  const [editExerciseOpen, setEditExerciseOpen] = useState<null | any>(null);
  const [editForm, setEditForm] = useState({
    muscle_group: '',
    equipment: '',
    description: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced'
  });
  const [metricFlags, setMetricFlags] = useState({
    metric_weight: true,
    metric_reps: true,
    metric_time: false,
    metric_distance: false,
  });

  // Categories are fixed; no local persistence or editing

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
    const groups = formatMuscleGroups(group);
    const matchesCategory = selectedCategory === 'All' || 
                           groups.includes(selectedCategory) || 
                           group === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const openEditExercise = (exercise: any) => {
    // Preserve ALL existing muscle groups (comma-separated) instead of collapsing to first
    const raw = exercise.muscle_group || '';
    // Split, trim, filter to only valid known categories to avoid showing stale/removed groups
    const allValid = raw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .filter((g: string) => categories.some(c => c.name.toLowerCase() === g.toLowerCase()));
    const normalized = allValid.join(',');
    setEditForm({
      muscle_group: normalized,
      equipment: exercise.equipment || '',
      description: exercise.description || '',
      difficulty: exercise.difficulty || 'Beginner'
    });
    setEditExerciseOpen(exercise);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    // Persist groups as comma-separated string (or null if none)
    const muscle_group = createGroups.length ? joinGroups(createGroups) : null;
    const { data: created, error } = await supabase.from('exercises').insert({
      name: form.name.trim(),
      muscle_group,
      description: form.description || null,
      equipment: form.equipment || null,
      difficulty: form.difficulty || null
    }).select('exercise_id, muscle_group').single();
    if (error) {
      toast.error('Failed to create exercise');
      console.error('[Exercises] Create failed', error);
    } else {
      if (created?.exercise_id) await syncExerciseGroups(created.exercise_id, createGroups);
      toast.success('Exercise created');
      setCreateOpen(false);
      setForm({ name: '', muscle_group: '', description: '', equipment: '', difficulty: 'Beginner' });
      setCreateGroups([]);
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  };

  const handleUpdateExercise = async () => {
    if (!editExerciseOpen) return;
    const newMuscleGroupStr = editGroups.length ? joinGroups(editGroups) : null;
    const updateData: any = {};
    if (newMuscleGroupStr !== editExerciseOpen.muscle_group) {
      updateData.muscle_group = newMuscleGroupStr;
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
    // Metric flags: only include changed ones
    ['metric_weight','metric_reps','metric_time','metric_distance'].forEach(key => {
      if ((editExerciseOpen as any)[key] !== (metricFlags as any)[key]) {
        updateData[key] = (metricFlags as any)[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      console.debug('[Exercises] Updating exercise', {
        id: editExerciseOpen.exercise_id,
        name: editExerciseOpen.name,
        updateData
      });
      await updateExerciseMutation.mutateAsync({
        exerciseId: editExerciseOpen.exercise_id,
        data: updateData,
      });
      await syncExerciseGroups(editExerciseOpen.exercise_id, editGroups);
      setEditExerciseOpen(null);
    } catch (err) {
      // Error toast already shown in mutation onError; keep dialog open for correction
      console.error('[Exercises] Update failed', err);
    }
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

  // Force re-enrich all exercises with updated muscle group mappings
  const forceUpdateMuscleGroups = async (opts?: { silent?: boolean }) => {
    try {
      const updates: Array<{ exercise_id: string; name: string; old_group: string | null; muscle_group: string }> = [];
      const diffs: Array<{ name: string; from: string | null; to: string }> = [];

      exercises.forEach((exercise) => {
        const newGroup = mapExerciseToGroup(exercise.name);
        const oldGroup = exercise.muscle_group ?? null;
        const isCoarse = oldGroup && /^(upper body|lower body|back|shoulder|arm|full body)$/i.test(oldGroup);
        if (oldGroup !== newGroup || isCoarse) {
          updates.push({ exercise_id: exercise.exercise_id, name: exercise.name, old_group: oldGroup, muscle_group: newGroup });
          diffs.push({ name: exercise.name, from: oldGroup, to: newGroup });
        }
      });

      if (!updates.length) {
        if (!opts?.silent) {
          console.info('[MuscleGroups] No changes detected. Either the DB already matches or names do not map differently.');
          toast.success('No muscle group changes detected.');
        }
        return;
      }

      if (!opts?.silent) {
        console.groupCollapsed('[MuscleGroups] Pending updates');
        console.table(diffs.slice(0, 20));
        if (diffs.length > 20) console.info(`...and ${diffs.length - 20} more`);
        console.groupEnd();
      }

      for (const u of updates) {
        const { error } = await supabase
          .from('exercises')
          .update({ muscle_group: u.muscle_group })
          .eq('exercise_id', u.exercise_id);
        if (error) throw error;
      }

      if (!opts?.silent) toast.success(`Updated muscle groups for ${updates.length} exercises`);
      // Small delay to ensure DB has applied changes before refetch
      await new Promise((r) => setTimeout(r, 200));
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    } catch (err) {
      console.error(err);
      if (!opts?.silent) toast.error('Failed to update muscle groups');
    }
  };

  // Auto-migrate muscle groups on initial load (silent)
  useEffect(() => {
    const run = async () => {
      const key = 'mg-auto-updated-v1';
      if (localStorage.getItem(key)) return;
      if (!isLoading && exercises.length) {
        await forceUpdateMuscleGroups({ silent: true });
        localStorage.setItem(key, '1');
      }
    };
    run();
  }, [isLoading, exercises]);

  // Helpers for multi muscle group support (stored as comma-separated string)
  // parseGroups: splits on ',', trims whitespace, filters empties, de-dupes case-insensitively while preserving first casing
  const parseGroups = (val?: string | null) => {
    if (!val) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of val.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  };
  const joinGroups = (arr: string[]) => arr.join(',');

  const [createGroups, setCreateGroups] = useState<string[]>(() => parseGroups(form.muscle_group));
  const [editGroups, setEditGroups] = useState<string[]>(() => parseGroups(editForm.muscle_group));
  const [groupSearchCreate, setGroupSearchCreate] = useState('');
  const [groupSearchEdit, setGroupSearchEdit] = useState('');

  const filteredCreateCats = useMemo(() => {
    const q = groupSearchCreate.toLowerCase();
    return sortedCategories.filter(c => c.name.toLowerCase().includes(q));
  }, [groupSearchCreate, sortedCategories]);

  const filteredEditCats = useMemo(() => {
    const q = groupSearchEdit.toLowerCase();
    return sortedCategories.filter(c => c.name.toLowerCase().includes(q));
  }, [groupSearchEdit, sortedCategories]);

  useEffect(() => { setCreateGroups(parseGroups(form.muscle_group)); }, [form.muscle_group]);
  useEffect(() => { setEditGroups(parseGroups(editForm.muscle_group)); }, [editForm.muscle_group]);
  // When opening edit dialog, initialize metric flags from exercise (fallback defaults already inferred in hook)
  useEffect(() => {
    if (editExerciseOpen) {
      setMetricFlags({
        metric_weight: editExerciseOpen.metric_weight !== false,
        metric_reps: editExerciseOpen.metric_reps !== false,
        metric_time: !!editExerciseOpen.metric_time,
        metric_distance: !!editExerciseOpen.metric_distance,
      });
    }
  }, [editExerciseOpen]);

  const toggleGroup = (current: string[], setFn: (v: string[]) => void, g: string) => {
    setFn(current.includes(g) ? current.filter(x => x !== g) : [...current, g]);
  };

  // Helper to sync normalized join table (ignores errors if migration not applied yet)
  const syncExerciseGroups = async (exerciseId: string, groups: string[]) => {
    const client: any = supabase;
    try {
      await client.from('exercise_muscle_groups').delete().eq('exercise_id', exerciseId);
      if (groups.length) {
        await client.from('exercise_muscle_groups').insert(
          groups.map(g => ({ exercise_id: exerciseId, muscle_group: g }))
        );
      }
    } catch (e: any) {
      if (e?.message?.includes('exercise_muscle_groups')) {
        console.warn('[Exercises] Join table missing (migration pending)');
      } else {
        console.warn('[Exercises] Failed to sync exercise groups', e);
      }
    }
  };

  const MultiSelectDisplay: React.FC<{ selected: string[]; placeholder: string }> = ({ selected, placeholder }) => {
    if (!selected.length) return <span className="text-muted-foreground">{placeholder}</span>;
    return <span className="flex flex-wrap gap-1 max-h-10 overflow-y-auto">{selected.map(g => (
      <span key={g} className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeColorForGroup(g)}`}>{g}</span>
    ))}</span>;
  };

  return (
  <div className="app-container p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
          <p className="text-muted-foreground mt-2">Discover and track exercises for every muscle group</p>
        </div>
        <div className="flex gap-2">
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
                <Label htmlFor="ex-muscle">Muscle Groups</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" id="ex-muscle" className="justify-start h-10 w-full">
                      <MultiSelectDisplay selected={createGroups} placeholder="Select muscle groups" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 max-h-80" align="start">
                      <div className="mb-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Select one or more</span>
                          {createGroups.length > 0 && (
                            <button
                              className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                              onClick={() => setCreateGroups([])}
                            >Clear</button>
                          )}
                        </div>
                        <Input
                          placeholder="Search groups..."
                          className="h-8 text-xs"
                          onChange={e => setGroupSearchCreate(e.target.value)}
                          value={groupSearchCreate}
                        />
                      </div>
                      <div className="relative">
                        <div
                          className="space-y-1 overflow-y-auto max-h-56 pr-1"
                          onWheel={(e) => { e.stopPropagation(); }}
                          role="listbox"
                          aria-label="Muscle groups list"
                        >
                          {filteredCreateCats.map(cat => {
                            const checked = createGroups.includes(cat.name);
                            return (
                              <label key={cat.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer text-sm select-none">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleGroup(createGroups, setCreateGroups, cat.name)}
                                  className="h-4 w-4"
                                />
                                <span className="flex-1 truncate">{cat.name}</span>
                                {checked && <span className="text-[10px] text-muted-foreground">✓</span>}
                              </label>
                            );
                          })}
                          {!filteredCreateCats.length && (
                            <div className="text-center text-xs text-muted-foreground py-4">No matches</div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ex-desc">Description</Label>
                <Input id="ex-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ex-equip">Equipment</Label>
                <Input id="ex-equip" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button disabled={!form.name} onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
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
                  {/* Category management removed */}
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
                  {/* New Category button removed */}
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
                      {/* Difficulty removed */}
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
                          <div className="text-muted-foreground break-words">
                            {(() => {
                              const groups = formatMuscleGroups(getDisplayGroup(exercise));
                              if (groups.length <= 1) {
                                return <span>{getDisplayGroup(exercise)}</span>;
                              }
                              return (
                                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                                  {groups.map((group, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={`text-[10px] leading-tight border ${badgeColorForGroup(group)} max-w-[110px] truncate`}
                                      title={group}
                                    >
                                      {group}
                                    </Badge>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
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
                        <Select value={form.muscle_group || 'none'} onValueChange={(v) => setForm(f => ({ ...f, muscle_group: v }))}>
                          <SelectTrigger id="ex-muscle">
                            <SelectValue placeholder="Select muscle group" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="none">None</SelectItem>
                            {sortedCategories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ex-equip">Equipment</Label>
                        <Input id="ex-equip" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} placeholder="Dumbbell, Barbell, Machine..." />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ex-diff">Difficulty</Label>
                        <Select value={form.difficulty} onValueChange={(v) => setForm(f => ({ ...f, difficulty: v as any }))}>
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
                      <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button disabled={!form.name} onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category management removed */}

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
                  {/* Difficulty removed */}
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quick Actions</Label>
                    <div className="space-y-2 mt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Edit button clicked, viewDetailsOpen:', viewDetailsOpen);
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
                  <div className="col-span-2">
                    <span className="font-medium">Metrics:</span>
                    <span className="ml-2 inline-flex flex-wrap gap-1 items-center">
                      {(() => {
                        const metrics: string[] = [];
                        if (viewDetailsOpen.metric_time) metrics.push('Time');
                        if (viewDetailsOpen.metric_distance) metrics.push('Distance');
                        if (viewDetailsOpen.metric_reps !== false) metrics.push('Reps');
                        if (viewDetailsOpen.metric_weight !== false) metrics.push('Weight');
                        if (!metrics.length) return <span className="text-muted-foreground">None</span>;
                        return metrics.map(m => (
                          <Badge key={m} variant="outline" className="text-[10px] px-1 py-0">
                            {m}
                          </Badge>
                        ));
                      })()}
                    </span>
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
              <Label htmlFor="edit-muscle-group">Muscle Groups</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="edit-muscle-group" className="justify-start h-10 w-full">
                    <MultiSelectDisplay selected={editGroups} placeholder="Select muscle groups" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 max-h-80" align="start">
                  <div className="mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Select one or more</span>
                      {editGroups.length > 0 && (
                        <button
                          className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={() => setEditGroups([])}
                        >Clear</button>
                      )}
                    </div>
                    <Input
                      placeholder="Search groups..."
                      className="h-8 text-xs"
                      onChange={e => setGroupSearchEdit(e.target.value)}
                      value={groupSearchEdit}
                    />
                  </div>
                  <div className="relative">
                    <div
                      className="space-y-1 overflow-y-auto max-h-56 pr-1"
                      onWheel={(e) => { e.stopPropagation(); }}
                      role="listbox"
                      aria-label="Muscle groups list"
                    >
                      {filteredEditCats.map(cat => {
                        const checked = editGroups.includes(cat.name);
                        return (
                          <label key={cat.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer text-sm select-none">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleGroup(editGroups, setEditGroups, cat.name)}
                              className="h-4 w-4"
                            />
                            <span className="flex-1 truncate">{cat.name}</span>
                            {checked && <span className="text-[10px] text-muted-foreground">✓</span>}
                          </label>
                        );
                      })}
                      {!filteredEditCats.length && (
                        <div className="text-center text-xs text-muted-foreground py-4">No matches</div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
              <Label>Metrics</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={metricFlags.metric_weight}
                    onCheckedChange={() => setMetricFlags(f => ({ ...f, metric_weight: !f.metric_weight }))}
                    className="h-4 w-4"
                  />
                  Weight
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={metricFlags.metric_reps}
                    onCheckedChange={() => setMetricFlags(f => ({ ...f, metric_reps: !f.metric_reps }))}
                    className="h-4 w-4"
                  />
                  Reps/Sets
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={metricFlags.metric_time}
                    onCheckedChange={() => setMetricFlags(f => {
                      const enabling = !f.metric_time;
                      if (enabling) {
                        return { ...f, metric_time: true, metric_distance: f.metric_distance, metric_weight: false, metric_reps: false };
                      } else {
                        return { ...f, metric_time: false, metric_distance: false };
                      }
                    })}
                    className="h-4 w-4"
                  />
                  Time
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <Checkbox
                    checked={metricFlags.metric_distance}
                    disabled={!metricFlags.metric_time}
                    onCheckedChange={() => setMetricFlags(f => ({ ...f, metric_distance: !f.metric_distance }))}
                    className="h-4 w-4"
                  />
                  Distance
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Enable only the metrics you plan to log. Distance requires Time.</p>
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