import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Book, Layers, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { icon: Calendar, label: 'Schedule', path: '/schedule', desc: 'Plan upcoming workouts' },
  { icon: Book, label: 'Exercises', path: '/exercises', desc: 'Browse & manage exercises' },
  { icon: Layers, label: 'Templates', path: '/templates', desc: 'Reuse workout structures' },
  { icon: TrendingUp, label: 'Progress', path: '/progress', desc: 'View performance over time' },
];

export const DashboardNavCards = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" aria-label="Primary navigation shortcuts">
      {NAV_ITEMS.map(item => (
        <Card key={item.path} className="group cursor-pointer hover:shadow-lg transition-smooth" onClick={() => navigate('/dashboard'+item.path)}>
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-smooth">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">{item.label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{item.desc}</p>
            <Button size="sm" variant="outline" className="mt-auto h-7 text-xs" onClick={(e)=>{e.stopPropagation(); navigate('/dashboard'+item.path);}}>Open</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardNavCards;
