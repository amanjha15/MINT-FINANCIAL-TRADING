import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  Trophy,
  Zap,
  DollarSign,
  BookOpen,
  Award,
  Flame,
} from "lucide-react";
import { useUserStats, usePortfolio, useHoldings, useAchievementCount } from "@/hooks/useSupabase";
import { useMemo } from "react";

interface ProfileStatsProps {
  userId: string;
}

export const ProfileStats = ({ userId }: ProfileStatsProps) => {
  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(userId);
  const { data: holdings = [], isLoading: holdingsLoading } = useHoldings(userId);
  const { data: achievements = 0, isLoading: achievementsLoading } = useAchievementCount(userId);

  const loading = statsLoading || portfolioLoading || holdingsLoading || achievementsLoading;

  // Calculate total portfolio value (cash + stocks) with memoization
  const totalPortfolioValue = useMemo(() => {
    const stocksValue = holdings.reduce(
      (sum, h) => sum + h.current_price * h.quantity,
      0
    );
    return (portfolio?.cash || 0) + stocksValue;
  }, [holdings, portfolio]);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading stats...</div>;
  }

  const xpToNextLevel = (stats?.level || 1) * 1000;
  const xpProgress = ((stats?.xp || 0) / xpToNextLevel) * 100;

  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <Card className="p-6 bg-gradient-mint border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-2xl font-sentient font-bold text-white">
                Level {stats?.level || 1}
              </h3>
              <p className="text-white/80 text-sm">
                {stats?.xp || 0} / {xpToNextLevel} XP
              </p>
            </div>
          </div>
        </div>
        <Progress value={xpProgress} className="h-3 bg-white/20" />
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.total_lessons_completed || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Achievements</p>
              <p className="text-2xl font-bold text-foreground">{achievements}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.streak_days || 0} days
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-sentient font-bold text-foreground">
              Missions Progress
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Completed Missions</span>
                <span className="text-foreground font-bold">
                  {stats?.total_missions_completed || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-accent" />
            <h3 className="text-xl font-sentient font-bold text-foreground">
              Activity
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Last Active</p>
              <p className="text-foreground">
                {stats?.last_activity_date
                  ? new Date(stats.last_activity_date).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Member Since</p>
              <p className="text-foreground">
                {stats?.created_at
                  ? new Date(stats.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
