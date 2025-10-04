import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const GenerateRandomWorkout = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-random-workout', {
        body: {}
      });

      if (error) throw error;

      toast.success(data.message || 'Random workout generated!', {
        description: `Added ${data.exerciseCount} exercises on ${data.date}`
      });

      // Refresh workout sessions
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
    } catch (error: any) {
      console.error('Failed to generate workout:', error);
      toast.error('Failed to generate workout', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate}
      variant="outline"
      className="flex items-center gap-2"
      disabled={isGenerating}
    >
      <Sparkles className="h-4 w-4" />
      {isGenerating ? 'Generating...' : 'Generate Random Workout'}
    </Button>
  );
};
