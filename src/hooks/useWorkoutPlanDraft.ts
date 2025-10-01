import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkoutPlanDraft {
  workoutForm: {
    title: string;
    date: string;
    time: string;
    notes: string;
  };
  selectedExercises: any[];
  updatedAt: string; // ISO timestamp
  version: number;
}

const STORAGE_KEY = 'workout-planner-draft-v1';

export function useWorkoutPlanDraft() {
  const [draft, setDraft] = useState<WorkoutPlanDraft | null>(null);
  const saveTimeout = useRef<number | null>(null);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: WorkoutPlanDraft = JSON.parse(raw);
        setDraft(parsed);
      }
    } catch {}
  }, []);

  const scheduleSave = useCallback((next: WorkoutPlanDraft) => {
    setDraft(next);
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    }, 400); // debounce
  }, []);

  const updateDraft = useCallback((partial: Partial<WorkoutPlanDraft>) => {
    setDraft(prev => {
      const base: WorkoutPlanDraft = prev || {
        workoutForm: { title: '', date: '', time: '', notes: '' },
        selectedExercises: [],
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      const merged: WorkoutPlanDraft = {
        ...base,
        ...partial,
        workoutForm: partial.workoutForm ? { ...base.workoutForm, ...partial.workoutForm } : base.workoutForm,
        selectedExercises: partial.selectedExercises !== undefined ? partial.selectedExercises : base.selectedExercises,
        updatedAt: new Date().toISOString(),
      };
      scheduleSave(merged);
      return merged;
    });
  }, [scheduleSave]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setDraft(null);
  }, []);

  return { draft, updateDraft, clearDraft };
}
