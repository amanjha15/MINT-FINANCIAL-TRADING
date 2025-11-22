import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Flame } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  username: string;
  avatar_url: string | null;
  score: number;
  streak: number;
}

type LeaderboardType = "score" | "streak";

export const Leaderboard = () => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("score");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const orderBy = leaderboardType === "score" ? "score" : "streak";
      
      // Get the highest score/streak for each user
      const { data: scores, error } = await supabase
        .from("rapid_test_scores")
        .select("user_id, score, streak")
        .order(orderBy, { ascending: false });

      if (error) throw error;

      // Get unique users with their highest scores/streaks
      const userBestScores = new Map<string, { score: number; streak: number }>();
      
      scores?.forEach((entry) => {
        const existing = userBestScores.get(entry.user_id);
        if (!existing) {
          userBestScores.set(entry.user_id, {
            score: entry.score,
            streak: entry.streak,
          });
        } else {
          if (leaderboardType === "score" && entry.score > existing.score) {
            userBestScores.set(entry.user_id, {
              score: entry.score,
              streak: existing.streak,
            });
          }
          if (leaderboardType === "streak" && entry.streak > existing.streak) {
            userBestScores.set(entry.user_id, {
              score: existing.score,
              streak: entry.streak,
            });
          }
        }
      });

      // Get usernames and avatars for all user IDs
      const userIds = Array.from(userBestScores.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const leaderboardData: LeaderboardEntry[] = profiles?.map((profile) => {
        const stats = userBestScores.get(profile.id);
        return {
          username: profile.username || "Anonymous",
          avatar_url: profile.avatar_url,
          score: stats?.score || 0,
          streak: stats?.streak || 0,
        };
      }) || [];

      // Sort by the selected metric
      leaderboardData.sort((a, b) => {
        if (leaderboardType === "score") {
          return b.score - a.score;
        }
        return b.streak - a.streak;
      });

      setLeaderboard(leaderboardData.slice(0, 10));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold">Leaderboard</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={leaderboardType === "score" ? "default" : "outline"}
          size="sm"
          onClick={() => setLeaderboardType("score")}
          className="flex-1"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Top Scores
        </Button>
        <Button
          variant={leaderboardType === "streak" ? "default" : "outline"}
          size="sm"
          onClick={() => setLeaderboardType("streak")}
          className="flex-1"
        >
          <Flame className="w-4 h-4 mr-2" />
          Top Streaks
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent/50 ${
                  index === 0 ? "bg-primary/10 border border-primary/20" : "bg-accent/20"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : index === 1
                      ? "bg-chart-2 text-chart-2-foreground"
                      : index === 2
                      ? "bg-chart-3 text-chart-3-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={entry.avatar_url || undefined} alt={entry.username} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {leaderboardType === "score" ? (
                      <>
                        <Trophy className="w-3 h-3 inline mr-1" />
                        {entry.score} points
                      </>
                    ) : (
                      <>
                        <Flame className="w-3 h-3 inline mr-1" />
                        {entry.streak} streak
                      </>
                    )}
                  </p>
                </div>
                {index === 0 && (
                  <Trophy className="w-5 h-5 text-primary animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
