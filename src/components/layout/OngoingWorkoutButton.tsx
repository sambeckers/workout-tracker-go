import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Timer, X } from 'lucide-react';

export function OngoingWorkoutButton() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for active workout on mount and periodically
  useEffect(() => {
    const checkActiveWorkout = () => {
      const sessionId = localStorage.getItem('active-workout-session');
      if (sessionId) {
        setActiveSessionId(sessionId);
        setIsVisible(true);
        
        // Get timer state
        const timerKey = `workout-timer-${sessionId}`;
        try {
          const saved = localStorage.getItem(timerKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.isActive && parsed.startTime) {
              const now = Date.now();
              const currentElapsed = Math.floor((now - parsed.startTime) / 1000);
              setElapsedTime((parsed.elapsedBeforePause || 0) + currentElapsed);
            } else {
              setElapsedTime(parsed.duration || 0);
            }
          }
        } catch (e) {
          console.error('Failed to read timer state:', e);
        }
      } else {
        setActiveSessionId(null);
        setIsVisible(false);
      }
    };

    checkActiveWorkout();
    const interval = setInterval(checkActiveWorkout, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (activeSessionId) {
      navigate(`/dashboard/workout/${activeSessionId}`);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSessionId) {
      // Just remove from active tracker (timer keeps running in session)
      localStorage.removeItem('active-workout-session');
      setActiveSessionId(null);
      setIsVisible(false);
    }
  };

  // Don't show if already on the workout session page
  const isOnWorkoutPage = location.pathname.startsWith('/dashboard/workout/');
  if (!activeSessionId || isOnWorkoutPage || !isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500"
      style={{ animationFillMode: 'both' }}
    >
      <Button
        onClick={handleClick}
        size="lg"
        className="gap-3 pr-3 pl-4 shadow-lg bg-gradient-primary hover:shadow-xl transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
        <div className="relative flex items-center gap-3">
          <Timer className="h-5 w-5 animate-pulse" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-90">Ongoing Workout</span>
            <span className="text-lg font-bold leading-tight">{formatTime(elapsedTime)}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            title="Dismiss (timer keeps running)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Button>
    </div>
  );
}
