import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileEdit, X } from 'lucide-react';

const STORAGE_KEY = 'workout-planner-draft-v1';

interface DraftMeta {
  updatedAt: string;
  workoutForm?: { title?: string };
  selectedExercises?: any[];
}

export function DraftResumeFab() {
  const [visible, setVisible] = useState(false);
  const [meta, setMeta] = useState<DraftMeta | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setVisible(false); return; }
      const parsed = JSON.parse(raw) as DraftMeta;
      setMeta(parsed);
      // hide on planner route
      const onPlanner = location.pathname.includes('/workout/plan');
      setVisible(!onPlanner);
    } catch {
      setVisible(false);
    }
  }, [location.pathname]);

  if (!visible || !meta) return null;

  const exerciseCount = meta.selectedExercises?.length || 0;
  const title = meta.workoutForm?.title || 'Untitled Workout';
  const timeAgo = (() => {
    if (!meta.updatedAt) return '';
    const updated = new Date(meta.updatedAt).getTime();
    const diffMin = Math.round((Date.now() - updated) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return diffMin + ' mins ago';
    const diffHr = Math.round(diffMin / 60);
    return diffHr + 'h ago';
  })();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div className="bg-background/90 backdrop-blur border rounded-lg shadow-md p-3 min-w-[240px]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium leading-tight flex items-center gap-1"><FileEdit className="h-4 w-4" /> Draft Workout</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{title}</div>
            <div className="text-xs text-muted-foreground">{exerciseCount} exercise{exerciseCount===1?'':'s'} • {timeAgo}</div>
          </div>
          <button
            type="button"
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={() => { try { localStorage.removeItem(STORAGE_KEY); } catch {}; setVisible(false); }}
            title="Discard draft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={() => navigate('/dashboard/workout/plan')}>
            Resume
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DraftResumeFab;
