import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const SeedDataButton = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { user } = useAuth();

  const handleSeedData = async () => {
    if (!user) {
      toast.error('Must be logged in to seed data');
      return;
    }

    setIsSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://vazdvgbpujjlchqfwndz.supabase.co/functions/v1/seed-workout-data',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Successfully seeded 100 workout sessions!');
      } else {
        toast.error(result.error || 'Failed to seed data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button
      onClick={handleSeedData}
      disabled={isSeeding}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isSeeding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Seeding Data...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Seed 100 Workouts
        </>
      )}
    </Button>
  );
};
