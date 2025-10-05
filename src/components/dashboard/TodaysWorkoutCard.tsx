import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Props { completed: any[]; planned: any[]; }

export const TodaysWorkoutCard: React.FC<Props> = ({ completed, planned }) => {
  const navigate = useNavigate();
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-primary" /> Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Planned */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Planned</p>
            {planned.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
          </div>
          {planned.slice(0,3).map(p => (
            <div key={p.session_id} className="p-2 rounded-md bg-muted/40 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{(p as any).title || 'Workout'}</p>
                <p className="text-[10px] text-muted-foreground">{new Date((p as any).date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>navigate(`/dashboard/workout/${p.session_id}`)} title="Open session">
                <Play className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {planned.length > 3 && <p className="text-[10px] text-muted-foreground">+{planned.length-3} more</p>}
        </div>

        {/* Completed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Completed</p>
            {completed.length === 0 && <span className="text-[10px] text-muted-foreground">None yet</span>}
          </div>
          {completed.slice(0,3).map(s => (
            <div key={s.session_id} className="p-2 rounded-md bg-muted/50 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{(s as any).title || 'Workout'}</p>
                <p className="text-[10px] text-muted-foreground">{new Date((s as any).date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>navigate(`/dashboard/workout/${s.session_id}`)} title="View session">
                <Play className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysWorkoutCard;
