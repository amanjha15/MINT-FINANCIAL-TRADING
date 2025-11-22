import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moneyBg from "@/assets/money-bg.png";
interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  target_value: number;
  xp_reward: number;
  expires_at?: string;
}
interface UserMission {
  mission_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
}
const Missions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [user, setUser] = useState<any>(null);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view missions.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchData(session.user.id);
  };
  const fetchData = async (userId: string) => {
    // Fetch missions
    const {
      data: missionsData
    } = await supabase.from("missions").select("*").order("created_at", {
      ascending: false
    });
    if (missionsData) {
      setMissions(missionsData);
    }

    // Fetch user missions
    const {
      data: userMissionsData
    } = await supabase.from("user_missions").select("*").eq("user_id", userId);
    if (userMissionsData) {
      setUserMissions(userMissionsData);
    }
  };
  const getMissionProgress = (missionId: string): UserMission | undefined => {
    return userMissions.find(um => um.mission_id === missionId);
  };
  const acceptMission = async (missionId: string) => {
    if (!user) return;
    const {
      error
    } = await supabase.from("user_missions").insert({
      user_id: user.id,
      mission_id: missionId,
      progress: 0,
      completed: false
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept mission",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Mission Accepted!",
      description: "Get started on your new mission"
    });
    fetchData(user.id);
  };
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };
  const completedMissions = userMissions.filter(um => um.completed).length;
  const activeMissions = userMissions.filter(um => !um.completed).length;
  return <div className="min-h-screen bg-background py-12 px-4 relative">
      <div className="absolute inset-0 opacity-50 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${moneyBg})`
    }} />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Missions</h1>
            <p className="text-muted-foreground">
              Complete missions to earn XP and level up faster
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Missions</p>
                <p className="text-3xl font-bold text-primary">{activeMissions}</p>
              </div>
              
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Missions</p>
                <p className="text-3xl font-bold text-success">{completedMissions}</p>
              </div>
              
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {missions.map(mission => {
          const userProgress = getMissionProgress(mission.id);
          const progressPercentage = userProgress ? userProgress.progress / mission.target_value * 100 : 0;
          const expired = isExpired(mission.expires_at);
          return <Card key={mission.id} className={`p-6 ${userProgress?.completed ? "border-success bg-success/5" : expired ? "opacity-50" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${userProgress?.completed ? "bg-success/20" : "bg-primary/20"}`}>
                        {userProgress?.completed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Target className="w-6 h-6 text-primary" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{mission.title}</h3>
                        <Badge variant="secondary">{mission.mission_type}</Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{mission.description}</p>

                    {userProgress && !userProgress.completed && <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress: {userProgress.progress} / {mission.target_value}
                          </span>
                          <span className="font-semibold">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>}

                    {mission.expires_at && <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {expired ? "Expired" : `Expires ${new Date(mission.expires_at).toLocaleDateString()}`}
                        </span>
                      </div>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className="text-lg px-4 py-2">+{mission.xp_reward} XP</Badge>

                    {!userProgress && !expired && <Button onClick={() => acceptMission(mission.id)}>
                        Accept Mission
                      </Button>}

                    {userProgress?.completed && <Badge variant="default" className="bg-success text-lg px-4 py-2">
                        Completed
                      </Badge>}
                  </div>
                </div>
              </Card>;
        })}
        </div>

        {missions.length === 0 && <Card className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Missions Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new missions to complete!
            </p>
          </Card>}
      </div>
    </div>;
};
export default Missions;