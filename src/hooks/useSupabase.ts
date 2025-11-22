import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Portfolio } from "@/utils/portfolioStorage";

// Query keys
export const QUERY_KEYS = {
  user: ["user"],
  profile: (userId: string) => ["profile", userId],
  stats: (userId: string) => ["stats", userId],
  portfolio: (userId: string) => ["portfolio", userId],
  holdings: (userId: string) => ["holdings", userId],
  trades: (userId: string) => ["trades", userId],
  progress: (userId: string) => ["progress", userId],
  achievements: (userId: string) => ["achievements", userId],
  achievementCount: (userId: string) => ["achievementCount", userId],
  missions: (userId: string) => ["missions", userId],
  lessons: ["lessons"],
  challenges: ["challenges"],
};

// Get current user
export const useUser = () => {
  return useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });
};

// Get user profile
export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.profile(userId || ""),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Get user stats
export const useUserStats = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.stats(userId || ""),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Get portfolio
export const usePortfolio = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.portfolio(userId || ""),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("simulator_portfolios")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
};

// Get holdings
export const useHoldings = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.holdings(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("simulator_holdings")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Get trades
export const useTrades = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.trades(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("simulator_trades")
        .select("*")
        .eq("user_id", userId)
        .order("traded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Get user progress
export const useUserProgress = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.progress(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select(`
          *,
          lessons (
            id,
            title,
            category,
            difficulty,
            xp_reward
          )
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Get achievement count
export const useAchievementCount = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.achievementCount(userId || ""),
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
};

// Get user achievements (full data)
export const useUserAchievements = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.achievements(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements (
            id,
            title,
            description,
            icon,
            xp_reward
          )
        `)
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Get user missions
export const useUserMissions = (userId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.missions(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_missions")
        .select(`
          *,
          missions (
            id,
            title,
            description,
            target_value,
            mission_type,
            xp_reward
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(data.id) });
    },
  });
};

// Combined hook for profile page (fetches all data in parallel)
export const useProfileData = (userId?: string) => {
  const profile = useUserProfile(userId);
  const stats = useUserStats(userId);
  const portfolio = usePortfolio(userId);
  const holdings = useHoldings(userId);
  const trades = useTrades(userId);
  const progress = useUserProgress(userId);
  const achievementCount = useAchievementCount(userId);

  return {
    profile,
    stats,
    portfolio,
    holdings,
    trades,
    progress,
    achievementCount,
    isLoading: profile.isLoading || stats.isLoading || portfolio.isLoading || holdings.isLoading,
    isError: profile.isError || stats.isError || portfolio.isError || holdings.isError,
  };
};
