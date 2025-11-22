import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LessonStockChart from "@/components/lessons/LessonStockChart";
import confetti from "canvas-confetti";
import { Leaderboard } from "@/components/rapid-test/Leaderboard";
const POPULAR_STOCKS = [{
  symbol: "AAPL",
  name: "Apple Inc."
}, {
  symbol: "GOOGL",
  name: "Alphabet Inc."
}, {
  symbol: "MSFT",
  name: "Microsoft Corporation"
}, {
  symbol: "AMZN",
  name: "Amazon.com Inc."
}, {
  symbol: "TSLA",
  name: "Tesla Inc."
}, {
  symbol: "META",
  name: "Meta Platforms Inc."
}, {
  symbol: "NVDA",
  name: "NVIDIA Corporation"
}, {
  symbol: "NFLX",
  name: "Netflix Inc."
}, {
  symbol: "DIS",
  name: "Walt Disney Company"
}, {
  symbol: "BABA",
  name: "Alibaba Group"
}, {
  symbol: "V",
  name: "Visa Inc."
}, {
  symbol: "JPM",
  name: "JPMorgan Chase"
}, {
  symbol: "WMT",
  name: "Walmart Inc."
}, {
  symbol: "MA",
  name: "Mastercard Inc."
}, {
  symbol: "PYPL",
  name: "PayPal Holdings"
}];
type GameState = "not_started" | "playing" | "showing_result";
const RapidTestGame = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    name: string;
  } | null>(null);
  const [prediction, setPrediction] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameState, setGameState] = useState<GameState>("not_started");
  const [leaderboardKey, setLeaderboardKey] = useState(0);
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
        description: "Please sign in to play the game.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };
  const getRandomStock = () => {
    const randomIndex = Math.floor(Math.random() * POPULAR_STOCKS.length);
    return POPULAR_STOCKS[randomIndex];
  };
  const startGame = () => {
    setScore(0);
    setStreak(0);
    setGameState("playing");
    loadNextStock();
  };
  const loadNextStock = () => {
    const stock = getRandomStock();
    setSelectedStock(stock);
    setPrediction("");
    setGameState("playing");
  };
  const exitGame = () => {
    setGameState("not_started");
    setSelectedStock(null);
    setPrediction("");
  };
  const handleSubmitPrediction = async () => {
    if (!prediction.trim() || !user || !selectedStock) return;
    setIsSubmitting(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('rapid-test-prediction', {
        body: {
          query: prediction,
          stock_symbol: selectedStock.symbol,
          stock_name: selectedStock.name
        }
      });
      if (error) throw error;
      const output = Array.isArray(data) ? data[0]?.output : data?.output || data?.result;
      if (output === "point" || output?.toLowerCase() === "point") {
        const newScore = score + 1;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);

        // Save score to database
        await supabase.from("rapid_test_scores").insert({
          user_id: user.id,
          score: newScore,
          streak: newStreak
        });

        // Refresh leaderboard
        setLeaderboardKey(prev => prev + 1);

        // Play success sound
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAk+ltryxnMpBSh+zPLaizsIGGS57OihUxALTKXh8bllHAU2jdXzzn0vBSF1xe/glEcNEl2049+nWhEJQJve8sFuJAU");
        audio.play().catch(() => {});

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            y: 0.6
          },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#00CED1", "#9370DB"]
        });
        const messages = [`🎯 INCREDIBLE! ${newStreak} in a row! You're on fire! 🔥`, `💎 BRILLIANT! Keep that streak going! Score: ${newScore}`, `🌟 AMAZING! You're a trading genius! ${newStreak} streak!`, `🚀 SPECTACULAR! You're crushing it! Score: ${newScore}`, `⚡ PHENOMENAL! ${newStreak} correct predictions!`];
        toast({
          title: messages[Math.floor(Math.random() * messages.length)],
          description: `Total Score: ${newScore} | Current Streak: ${newStreak}`,
          className: "bg-primary text-primary-foreground border-2 border-chart-1"
        });

        // Load next stock after a short delay
        setTimeout(() => {
          loadNextStock();
        }, 1500);
      } else {
        setStreak(0);
        toast({
          title: "Not quite right 📊",
          description: `Keep learning! You'll get the next one. Score: ${score}`,
          variant: "destructive"
        });

        // Load next stock after a short delay
        setTimeout(() => {
          loadNextStock();
        }, 1500);
      }
      setPrediction("");
    } catch (error) {
      console.error("Error submitting prediction:", error);
      toast({
        title: "Error",
        description: "Failed to submit prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-2xl font-bold">Rapid Test: Your Learning vs Ours</h1>
              <p className="text-sm text-muted-foreground">
                Predict stock performance and test your skills
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate("/ai-coach")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coach
          </Button>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 hover-scale transition-all">
            <div className="flex items-center gap-3">
              
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold text-primary animate-fade-in">{score}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 hover-scale transition-all">
            <div className="flex items-center gap-3">
              
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className={`text-2xl font-bold text-chart-1 transition-all ${streak > 0 ? "animate-scale-in" : ""}`}>
                  {streak > 0 && <Sparkles className="w-4 h-4 inline mr-1 animate-pulse" />}
                  {streak}
                  {streak > 2 && " 🔥"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 hover-scale transition-all">
            <div className="flex items-center gap-3">
              
              <div>
                <p className="text-sm text-muted-foreground">Selected Stock</p>
                <p className="text-lg font-bold text-foreground">
                  {selectedStock ? selectedStock.symbol : "None"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {gameState === "not_started" ? <Card className="p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Ready to Test Your Skills?</h2>
                  <p className="text-muted-foreground">
                    We'll show you random stocks and their charts. Predict how they'll perform and
                    compete for the top spot on the leaderboard!
                  </p>
                  <Button size="lg" onClick={startGame} className="w-full">
                    <Play className="w-5 h-5 mr-2" />
                    Start Game
                  </Button>
                </div>
              </Card> : <>
                {/* Stock Chart */}
                {selectedStock && <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{selectedStock.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={exitGame}>
                        <X className="w-4 h-4 mr-2" />
                        Exit Game
                      </Button>
                    </div>
                    <LessonStockChart symbol={selectedStock.symbol} name={selectedStock.name} timeRange="1mo" showVolume={true} />
                  </div>}

                {/* Prediction Input */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Make Your Prediction</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on the chart above, how do you think this stock will perform?
                  </p>
                  <div className="space-y-4">
                    <Input placeholder="Enter your prediction (e.g., 'Will go up 5% next week')" value={prediction} onChange={e => setPrediction(e.target.value)} onKeyPress={e => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handleSubmitPrediction();
                  }
                }} />
                    <Button onClick={handleSubmitPrediction} disabled={isSubmitting || !prediction.trim()} className="w-full">
                      {isSubmitting ? "Submitting..." : "Submit Prediction"}
                    </Button>
                  </div>
                </Card>
              </>}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <Leaderboard key={leaderboardKey} />
          </div>
        </div>
      </div>
    </div>;
};
export default RapidTestGame;