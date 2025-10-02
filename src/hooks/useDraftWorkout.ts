import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface WorkoutDraft {
  workoutForm: {
    title: string;
    date: string;
    time: string;
    notes: string;
  };
  selectedExercises: any[];
  timestamp: number;
  editingSessionId?: string;
}

const DRAFT_KEY = 'workout-planner-draft';

export const useDraftWorkout = () => {
  const [hasDraft, setHasDraft] = useState(false);
  const navigate = useNavigate();

  // Check if draft exists
  const checkDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      setHasDraft(!!draft);
      return draft ? JSON.parse(draft) as WorkoutDraft : null;
    } catch {
      return null;
    }
  }, []);

  // Save draft
  const saveDraft = useCallback((draft: WorkoutDraft) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...draft,
        timestamp: Date.now()
      }));
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  // Load draft
  const loadDraft = useCallback((): WorkoutDraft | null => {
    return checkDraft();
  }, [checkDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Resume draft - navigate to planner with draft
  const resumeDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.editingSessionId) {
        navigate(`/dashboard/workout/plan?session=${draft.editingSessionId}`);
      } else {
        navigate('/dashboard/workout/plan');
      }
    }
  }, [loadDraft, navigate]);

  // Check for draft on mount
  useEffect(() => {
    checkDraft();
  }, [checkDraft]);

  return {
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    resumeDraft,
    checkDraft
  };
};
