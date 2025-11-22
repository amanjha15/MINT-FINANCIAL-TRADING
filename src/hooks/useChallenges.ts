import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  xp_reward: number;
}

interface ChallengeParticipant {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  initial_value: number;
  streak_count: number;
  joined_at: string;
}

interface ParticipantWithProfile extends ChallengeParticipant {
  username?: string;
}

export const useChallenges = (userId: string | null) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<Record<string, ParticipantWithProfile[]>>({});
  const [userParticipation, setUserParticipation] = useState<Record<string, ChallengeParticipant>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const calculatePortfolioValue = useCallback(async (uid: string): Promise<number> => {
    const { data: portfolio } = await supabase
      .from("simulator_portfolios")
      .select("cash")
      .eq("user_id", uid)
      .maybeSingle();

    const cash = portfolio?.cash || 0;

    const { data: holdings } = await supabase
      .from("simulator_holdings")
      .select("*")
      .eq("user_id", uid);

    const holdingsValue = holdings?.reduce((total, holding) => {
      return total + (holding.current_price * holding.quantity);
    }, 0) || 0;

    return cash + holdingsValue;
  }, []);

  const awardXP = useCallback(async (uid: string, xpAmount: number) => {
    const { data: userStats } = await supabase
      .from("user_stats")
      .select("xp, level")
      .eq("user_id", uid)
      .single();

    if (userStats) {
      const newXP = (userStats.xp || 0) + xpAmount;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await supabase
        .from("user_stats")
        .update({ xp: newXP, level: newLevel })
        .eq("user_id", uid);
    }
  }, []);

  const calculateProgress = useCallback(async (
    uid: string,
    challengeType: string,
    initialValue: number
  ): Promise<number> => {
    if (challengeType === "portfolio_growth") {
      const currentValue = await calculatePortfolioValue(uid);
      const growth = currentValue - initialValue;
      return Math.max(0, growth);
    } else if (challengeType === "daily_login" || challengeType === "learning_streak") {
      // Use the current streak from user_stats (updated by useActivityTracker)
      const { data: userStats } = await supabase
        .from("user_stats")
        .select("streak_days")
        .eq("user_id", uid)
        .single();
      
      // Return the absolute streak value for proper progress tracking
      return userStats?.streak_days || 0;
    }
    return 0;
  }, [calculatePortfolioValue]);

  const checkAndCompleteChallenge = useCallback(async (
    uid: string,
    challengeId: string,
    progress: number,
    targetValue: number,
    xpReward: number
  ): Promise<boolean> => {
    if (progress < targetValue) return false;

    // Check if already completed in the database
    const { data: participant } = await supabase
      .from("challenge_participants")
      .select("completed")
      .eq("challenge_id", challengeId)
      .eq("user_id", uid)
      .single();

    // If already completed, don't do anything
    if (participant?.completed) return false;

    // Mark as completed and award XP in a single transaction-like operation
    const { error } = await supabase
      .from("challenge_participants")
      .update({ completed: true, progress })
      .eq("challenge_id", challengeId)
      .eq("user_id", uid)
      .eq("completed", false); // Only update if not already completed

    if (error) {
      console.error("Error completing challenge:", error);
      return false;
    }

    // Only award XP if the update was successful
    await awardXP(uid, xpReward);
    
    toast({
      title: "🎉 Challenge Completed!",
      description: `You've earned ${xpReward} XP!`,
    });

    return true;
  }, [awardXP, toast]);

  const updateProgress = useCallback(async (challengeId: string) => {
    if (!userId) return;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const participant = userParticipation[challengeId];
    if (!participant) return;

    const newProgress = await calculateProgress(
      userId,
      challenge.challenge_type,
      participant.initial_value
    );

    // Update progress in database
    await supabase
      .from("challenge_participants")
      .update({ 
        progress: newProgress,
        ...((challenge.challenge_type === "daily_login" || challenge.challenge_type === "learning_streak") && { 
          streak_count: newProgress 
        })
      })
      .eq("challenge_id", challengeId)
      .eq("user_id", userId);

    // Check for completion
    await checkAndCompleteChallenge(
      userId,
      challengeId,
      newProgress,
      challenge.target_value,
      challenge.xp_reward
    );

    // Refresh data
    await fetchChallenges();
  }, [userId, challenges, userParticipation, calculateProgress, checkAndCompleteChallenge]);

  const fetchChallenges = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    // Fetch all challenges
    const { data: challengesData } = await supabase
      .from("challenges")
      .select("*")
      .order("start_date", { ascending: false });

    if (!challengesData) {
      setLoading(false);
      return;
    }

    setChallenges(challengesData);

    // Fetch user's participations
    const { data: userParticipations } = await supabase
      .from("challenge_participants")
      .select("*")
      .eq("user_id", userId);

    const participationMap: Record<string, ChallengeParticipant> = {};
    userParticipations?.forEach(p => {
      participationMap[p.challenge_id] = p;
    });
    setUserParticipation(participationMap);

    // Fetch all participants for each challenge
    const participantsMap: Record<string, ParticipantWithProfile[]> = {};
    
    for (const challenge of challengesData) {
      const { data: participantsData } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challenge.id)
        .order("progress", { ascending: false });

      if (participantsData) {
        const participantsWithProfiles: ParticipantWithProfile[] = await Promise.all(
          participantsData.map(async (p) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", p.user_id)
              .maybeSingle();
            
            return {
              ...p,
              username: profile?.username || `User ${p.user_id.slice(0, 8)}`
            };
          })
        );
        
        participantsMap[challenge.id] = participantsWithProfiles;
      }
    }

    setParticipants(participantsMap);
    setLoading(false);
  }, [userId]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!userId) return;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    let initialProgress = 0;
    let initialValue = 0;
    let streakCount = 0;

    if (challenge.challenge_type === "portfolio_growth") {
      initialValue = await calculatePortfolioValue(userId);
      initialProgress = 0;
    } else if (challenge.challenge_type === "daily_login" || challenge.challenge_type === "learning_streak") {
      // Get current streak from user_stats (managed by useActivityTracker)
      const { data: userStats } = await supabase
        .from("user_stats")
        .select("streak_days")
        .eq("user_id", userId)
        .single();
      
      // Start tracking from current streak value
      streakCount = userStats?.streak_days || 0;
      initialProgress = streakCount;
      initialValue = streakCount; // Store initial streak for reference
    }

    const { error } = await supabase
      .from("challenge_participants")
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress: initialProgress,
        initial_value: initialValue,
        streak_count: streakCount,
        completed: false
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Challenge Joined!",
      description: "Good luck competing with other learners!"
    });

    await fetchChallenges();
  }, [userId, challenges, calculatePortfolioValue, toast, fetchChallenges]);

  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!userId) return;

    const participant = userParticipation[challengeId];
    if (!participant) return;

    if (participant.completed) {
      toast({
        title: "Cannot Leave",
        description: "You cannot leave a completed challenge.",
        variant: "destructive"
      });
      return false;
    }

    const { error } = await supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave challenge",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Left Challenge",
      description: "Your progress has been removed."
    });

    await fetchChallenges();
    return true;
  }, [userId, userParticipation, toast, fetchChallenges]);

  useEffect(() => {
    if (userId) {
      fetchChallenges();
    }
  }, [userId, fetchChallenges]);

  return {
    challenges,
    participants,
    userParticipation,
    loading,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    refreshChallenges: fetchChallenges
  };
};
