import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, ArrowLeft, Lock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moneyBg from "@/assets/money-bg.png";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface UserStats {
  xp: number;
  level: number;
  streak_days: number;
  total_lessons_completed: number;
  total_missions_completed: number;
}

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view achievements.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    // Fetch achievements
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .order("requirement_value");

    if (achievementsData) {
      setAchievements(achievementsData);
    }

    // Fetch user achievements
    const { data: userAchievementsData } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);

    if (userAchievementsData) {
      setUserAchievements(userAchievementsData);
    }

    // Fetch user stats
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (statsData) {
      setUserStats(statsData);
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement): number => {
    if (!userStats) return 0;

    let current = 0;
    switch (achievement.requirement_type) {
      case "lessons_completed":
        current = userStats.total_lessons_completed;
        break;
      case "xp_earned":
        current = userStats.xp;
        break;
      case "level_reached":
        current = userStats.level;
        break;
      case "streak_days":
        current = userStats.streak_days;
        break;
      case "missions_completed":
        current = userStats.total_missions_completed;
        break;
      default:
        return 0;
    }

    return Math.min((current / achievement.requirement_value) * 100, 100);
  };

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <div 
        className="absolute inset-0 opacity-50 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${moneyBg})` }}
      />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Achievements</h1>
            <p className="text-muted-foreground">
              Track your milestones and celebrate your progress
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Achievement Progress</h3>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {totalCount} unlocked
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress 
            value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} 
            className="h-3 mt-4" 
          />
        </Card>

        {userStats && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold text-primary">{userStats.level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold text-primary">{userStats.xp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-primary">{userStats.streak_days} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons</p>
                <p className="text-2xl font-bold text-primary">
                  {userStats.total_lessons_completed}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const unlocked = isAchievementUnlocked(achievement.id);
            const progress = getProgress(achievement);

            return (
              <Card
                key={achievement.id}
                className={`p-6 ${
                  unlocked ? "border-success bg-success/5" : "opacity-75"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        unlocked
                          ? "bg-gradient-to-br from-success to-success/70"
                          : "bg-muted"
                      }`}
                    >
                      {unlocked ? (
                        <Trophy className="w-7 h-7 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{achievement.title}</h3>
                      <Badge variant={unlocked ? "default" : "secondary"} className="mt-1">
                        +{achievement.xp_reward} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{achievement.description}</p>

                {!unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {unlocked && userAchievements.find((ua) => ua.achievement_id === achievement.id) && (
                  <div className="flex items-center gap-2 text-success">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">
                      Unlocked{" "}
                      {new Date(
                        userAchievements.find((ua) => ua.achievement_id === achievement.id)!
                          .unlocked_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {achievements.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Achievements Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new achievements to unlock!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Achievements;