import { useMemo } from 'react';
import { useProgressData } from '@/hooks/useWorkoutData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalWorkouts: number;
  weeklyStreak: number; // consecutive days with a completed workout ending today or yesterday
  averageDuration: string; // formatted minutes
  todayCompleted: any[];
  todayPlanned: any[];
  weekCompleted: any[];
  weekPlanned: any[];
  allCompleted: any[];
  allPlanned: any[];
  loading: boolean;
}

// Utility to parse ISO string / date to Date
const toDate = (d: any): Date | null => {
  if (!d) return null;
  try { return new Date(d); } catch { return null; }
};

export const useDashboardStats = (): DashboardStats => {
  const { user } = useAuth();
  // Completed sessions via existing progress hook
  const { data, isLoading: loadingCompleted } = useProgressData();
  const completedSessions = data?.sessions || [];

  // Planned sessions (not Done) - fetch all for flexible week navigation
  const { data: plannedData, isLoading: loadingPlanned } = useQuery({
    queryKey: ['planned-sessions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [] as any[];
      const { data: planned, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Done')
        .is('deleted_at', null);
      if (error) throw error;
      return planned || [];
    }
  });

  const now = new Date();
  // Use local date string to avoid timezone issues
  const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const startOfWeek = new Date(now); // Monday as start
  const day = startOfWeek.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // adjust to Monday
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  startOfWeek.setHours(0,0,0,0);

  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); oneWeekAgo.setHours(0,0,0,0);

  const enrichedCompleted = useMemo(() => {
    return completedSessions.map(s => {
      const dateObj = toDate((s as any).date);
      // Use local date string to avoid timezone issues
      const dateKey = dateObj ? `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}` : null;
      return { ...s, _date: dateObj, _dateKey: dateKey };
    }).filter(s => !!s._date);
  }, [completedSessions]);

  const enrichedPlanned = useMemo(() => {
    return (plannedData||[]).map(s => {
      const dateObj = toDate((s as any).date);
      const dateKey = dateObj ? `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}` : null;
      return { ...s, _date: dateObj, _dateKey: dateKey };
    }).filter(s=>!!s._date);
  }, [plannedData]);

  const todayCompleted = useMemo(() => enrichedCompleted.filter(s => s._dateKey === todayKey), [enrichedCompleted, todayKey]);
  const todayPlanned = useMemo(() => enrichedPlanned.filter(s => s._dateKey === todayKey), [enrichedPlanned, todayKey]);
  const weekCompleted = useMemo(() => enrichedCompleted.filter(s => s._date! >= startOfWeek), [enrichedCompleted, startOfWeek]);
  const weekPlanned = useMemo(() => enrichedPlanned.filter(s => s._date! >= startOfWeek), [enrichedPlanned, startOfWeek]);

  // Streak: count backwards from today (or yesterday if no today session) as consecutive days with at least one session
  const weeklyStreak = useMemo(() => {
    const datesSet = new Set(enrichedCompleted.map(s => s._dateKey));
    let cursor = new Date(now);
    if (!datesSet.has(todayKey)) { // allow streak ending yesterday
      cursor.setDate(cursor.getDate() - 1);
    }
    let streak = 0;
    while (streak < 30) { // cap for performance
      const k = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}-${cursor.getDate().toString().padStart(2, '0')}`;
      if (datesSet.has(k)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [enrichedCompleted, now, todayKey]);

  // Average duration: assume session has duration_minutes or derive from start/end in future
  const averageDuration = useMemo(() => {
    const durations = enrichedCompleted
      .map(s => (s as any).duration_minutes as number | undefined)
      .filter((d): d is number => typeof d === 'number' && d > 0);
    if (!durations.length) return '0 min';
    const avg = Math.round(durations.reduce((a,b)=>a+b,0)/durations.length);
    return `${avg} min`;
  }, [enrichedCompleted]);

  return {
    totalWorkouts: completedSessions.length,
    weeklyStreak,
    averageDuration,
    todayCompleted,
    todayPlanned,
    weekCompleted,
    weekPlanned,
    allCompleted: enrichedCompleted,
    allPlanned: enrichedPlanned,
    loading: loadingCompleted || loadingPlanned,
  };
};

export default useDashboardStats;