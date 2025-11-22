import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useActivityTracker = (userId: string | undefined) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const trackDailyActivity = async () => {
      try {
        // Get current user stats
        const { data: stats, error: fetchError } = await supabase
          .from('user_stats')
          .select('last_activity_date, streak_days')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching user stats:', fetchError);
          return;
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const lastActivity = stats?.last_activity_date;

        // If already tracked today, don't update
        if (lastActivity === today) {
          return;
        }

        // Calculate new streak
        let newStreak = 1;
        
        if (lastActivity) {
          const lastDate = new Date(lastActivity);
          const todayDate = new Date(today);
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day - increment streak
            newStreak = (stats?.streak_days || 0) + 1;
          } else if (diffDays > 1) {
            // Streak broken - reset to 1
            newStreak = 1;
          } else if (diffDays === 0) {
            // Same day (shouldn't happen due to check above, but just in case)
            return;
          }
        }

        // Update user stats with new activity date and streak
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            last_activity_date: today,
            streak_days: newStreak,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating activity:', updateError);
          return;
        }

        // Show streak notification if it's a milestone
        if (newStreak > 1 && (newStreak % 7 === 0 || newStreak === 3 || newStreak === 5)) {
          toast({
            title: `${newStreak} Day Streak! 🔥`,
            description: `You've been active for ${newStreak} consecutive days. Keep it up!`,
          });
        }

      } catch (error) {
        console.error('Error tracking activity:', error);
      }
    };

    // Track activity when component mounts
    trackDailyActivity();

    // Set up interval to check periodically (every 5 minutes) in case day changes while user is active
    const interval = setInterval(trackDailyActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, toast]);
};
