import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowLeft, Trophy, TrendingUp, Crown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChallenges } from "@/hooks/useChallenges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import moneyBg from "@/assets/money-bg.png";

const Challenges = () => {
  const [user, setUser] = useState<any>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [challengeToLeave, setChallengeToLeave] = useState<{ 
    id: string; 
    title: string; 
    progress: number; 
    type: string 
  } | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<{ 
    challengeId: string; 
    title: string; 
    type: string 
  } | null>(null);
  
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
        description: "Please sign in to view challenges.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const {
    challenges,
    participants,
    userParticipation,
    loading,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    refreshChallenges
  } = useChallenges(user?.id);

  const handleLeaveChallengeClick = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    const participant = userParticipation[challengeId];
    
    if (!challenge || !participant) return;

    setChallengeToLeave({
      id: challengeId,
      title: challenge.title,
      progress: participant.progress,
      type: challenge.challenge_type
    });
    setLeaveDialogOpen(true);
  };

  const confirmLeaveChallenge = async () => {
    if (!challengeToLeave) return;
    
    await leaveChallenge(challengeToLeave.id);
    setLeaveDialogOpen(false);
    setChallengeToLeave(null);
  };

  const isActive = (challenge: any) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    return now >= start && now <= end;
  };

  const getUserRank = (challengeId: string): number | null => {
    if (!user) return null;
    const challengeParticipants = participants[challengeId] || [];
    const userIndex = challengeParticipants.findIndex(p => p.user_id === user.id);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  const formatProgress = (type: string, progress: number) => {
    if (type === "portfolio_growth") {
      return `$${progress.toFixed(2)}`;
    }
    return progress.toString();
  };

  const activeChallenges = challenges.filter(isActive);
  const upcomingChallenges = challenges.filter(c => new Date(c.start_date) > new Date());
  const pastChallenges = challenges.filter(c => new Date(c.end_date) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <div 
        className="absolute inset-0 opacity-50 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url(${moneyBg})` }} 
      />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Community Challenges</h1>
            <p className="text-muted-foreground">
              Compete with peers and climb the leaderboard
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        {activeChallenges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Active Challenges</h2>
            <div className="space-y-6">
              {activeChallenges.map(challenge => {
                const isParticipating = !!userParticipation[challenge.id];
                const participant = userParticipation[challenge.id];
                const rank = getUserRank(challenge.id);
                const challengeParticipants = participants[challenge.id] || [];
                const progressPercentage = participant 
                  ? Math.min(100, (participant.progress / challenge.target_value) * 100)
                  : 0;

                return (
                  <Card key={challenge.id} className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{challenge.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="capitalize">
                                {challenge.challenge_type.replace('_', ' ')}
                              </Badge>
                              <Badge className="bg-success">Active</Badge>
                              {participant?.completed && (
                                <Badge className="bg-primary">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">
                          {challenge.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <p className="font-semibold">
                              {formatProgress(challenge.challenge_type, challenge.target_value)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reward:</span>
                            <p className="font-semibold">{challenge.xp_reward} XP</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Participants:</span>
                            <p className="font-semibold">{challengeParticipants.length}</p>
                          </div>
                          {isParticipating && rank && (
                            <div>
                              <span className="text-muted-foreground">Your Rank:</span>
                              <p className="font-semibold flex items-center gap-1">
                                {rank === 1 && <Crown className="w-4 h-4 text-yellow-500" />}
                                #{rank}
                              </p>
                            </div>
                          )}
                        </div>

                        {isParticipating && participant && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progress:</span>
                              <span className="font-semibold">
                                {formatProgress(challenge.challenge_type, participant.progress)} / {formatProgress(challenge.challenge_type, challenge.target_value)}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {!isParticipating ? (
                            <Button onClick={() => joinChallenge(challenge.id)}>
                              Join Challenge
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline"
                                onClick={() => updateProgress(challenge.id)}
                                disabled={participant?.completed}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Update Progress
                              </Button>
                              {!participant?.completed && (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleLeaveChallengeClick(challenge.id)}
                                >
                                  Leave Challenge
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedLeaderboard({
                                challengeId: challenge.id,
                                title: challenge.title,
                                type: challenge.challenge_type
                              });
                              setLeaderboardOpen(true);
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Leaderboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {upcomingChallenges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Upcoming Challenges</h2>
            <div className="grid gap-6">
              {upcomingChallenges.map(challenge => (
                <Card key={challenge.id} className="p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                      <Badge variant="outline">
                        Starts {new Date(challenge.start_date).toLocaleDateString()}
                      </Badge>
                      <p className="text-muted-foreground mt-2">{challenge.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Past Challenges</h2>
            <div className="grid gap-6">
              {pastChallenges.map(challenge => {
                const participant = userParticipation[challenge.id];
                return (
                  <Card key={challenge.id} className="p-6 opacity-60">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline">Ended</Badge>
                          {participant?.completed && (
                            <Badge className="bg-primary">
                              <Trophy className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Leave Challenge Dialog */}
        <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Challenge?</AlertDialogTitle>
              <AlertDialogDescription>
                {challengeToLeave && (
                  <>
                    <p className="mb-2">
                      Are you sure you want to leave "{challengeToLeave.title}"?
                    </p>
                    <p className="font-semibold">
                      Your current progress ({formatProgress(challengeToLeave.type, challengeToLeave.progress)}) will be lost.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLeaveChallenge}>
                Leave Challenge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Leaderboard Dialog */}
        <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {selectedLeaderboard?.title} - Leaderboard
              </DialogTitle>
              <DialogDescription>
                Top performers in this challenge
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {selectedLeaderboard && 
                  participants[selectedLeaderboard.challengeId]?.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        participant.user_id === user?.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[40px]">
                          {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{participant.username}</p>
                          {participant.completed && (
                            <Badge variant="secondary" className="text-xs">Completed</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatProgress(selectedLeaderboard.type, participant.progress)}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Challenges;
