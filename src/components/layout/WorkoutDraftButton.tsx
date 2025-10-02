import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import { useDraftWorkout } from '@/hooks/useDraftWorkout';
import { useLocation } from 'react-router-dom';

export const WorkoutDraftButton = () => {
  const { hasDraft, resumeDraft, clearDraft, checkDraft } = useDraftWorkout();
  const [show, setShow] = useState(false);
  const location = useLocation();
  
  // Don't show on planner page itself
  const isOnPlannerPage = location.pathname.includes('/workout/plan');

  useEffect(() => {
    setShow(hasDraft && !isOnPlannerPage);
  }, [hasDraft, isOnPlannerPage]);

  // Periodically check for draft changes
  useEffect(() => {
    const interval = setInterval(() => {
      checkDraft();
    }, 500);
    return () => clearInterval(interval);
  }, [checkDraft]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-4">
      <div className="bg-card border shadow-lg rounded-lg p-3 pr-4 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Workout Draft Saved</span>
          <span className="text-xs text-muted-foreground">Continue planning your workout</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={resumeDraft}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Resume
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              clearDraft();
              setShow(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
