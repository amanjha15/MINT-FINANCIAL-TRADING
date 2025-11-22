import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Trophy, Target } from "lucide-react";
import { useUserProgress, useUserAchievements, useUserMissions } from "@/hooks/useSupabase";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LearningProgressProps {
  userId: string;
}

export const LearningProgress = ({ userId }: LearningProgressProps) => {
  const { data: progress = [], isLoading: progressLoading } = useUserProgress(userId);
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(userId);
  const { data: missions = [], isLoading: missionsLoading } = useUserMissions(userId);
  
  const { data: practiceSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["practiceSessions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!userId,
  });

  const loading = progressLoading || achievementsLoading || missionsLoading || sessionsLoading;

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading learning data...</div>;
  }

  const completedLessons = progress.filter((p) => p.completed).length;
  const totalLessons = progress.length;
  const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {completedLessons} / {totalLessons}
              </p>
            </div>
          </div>
          <Progress value={completionRate} className="mt-4 h-2" />
        </Card>

        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
              <p className="text-2xl font-bold text-foreground">{achievements.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Practice Sessions</p>
              <p className="text-2xl font-bold text-foreground">
                {practiceSessions.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Completed Lessons */}
      <Card className="p-6 bg-card border-border/20">
        <h3 className="text-xl font-sentient font-bold text-foreground mb-4">
          Lesson Progress
        </h3>
        {progress.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No lessons started yet. Begin your learning journey today!
          </p>
        ) : (
          <div className="space-y-3">
            {progress.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/40"
              >
                <div className="flex items-center gap-4">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.lessons?.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.lessons?.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.lessons?.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
                {item.score !== null && (
                  <Badge className="bg-primary text-primary-foreground">
                    Score: {item.score}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Achievements */}
      <Card className="p-6 bg-card border-border/20">
        <h3 className="text-xl font-sentient font-bold text-foreground mb-4">
          Recent Achievements
        </h3>
        {achievements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No achievements unlocked yet. Keep learning to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border/40"
              >
                <div className="text-4xl">{item.achievements?.icon}</div>
                <div>
                  <p className="font-semibold text-foreground">
                    {item.achievements?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.achievements?.description}
                  </p>
                  <p className="text-xs text-accent mt-1">
                    +{item.achievements?.xp_reward} XP
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Missions Progress */}
      <Card className="p-6 bg-card border-border/20">
        <h3 className="text-xl font-sentient font-bold text-foreground mb-4">
          Mission Status
        </h3>
        {missions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No missions yet. Check the missions page to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {missions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-background border border-border/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">
                    {item.missions?.title}
                  </p>
                  {item.completed && (
                    <Badge className="bg-success text-success-foreground">
                      Completed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {item.missions?.description}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">
                      {item.progress || 0} / {item.missions?.target_value}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((item.progress || 0) / (item.missions?.target_value || 1)) * 100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
