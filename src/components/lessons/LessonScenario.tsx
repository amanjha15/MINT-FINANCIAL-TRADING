import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import LessonStockChart from "./LessonStockChart";
import { toast } from "sonner";

interface ScenarioQuestion {
  question: string;
  answer: string;
  explanation?: string;
}

interface Scenario {
  title: string;
  description: string;
  symbol: string;
  startDate?: string; // ISO date string (new format)
  endDate?: string; // ISO date string (new format)
  timeRange?: string; // Legacy format: "1d", "5d", "1mo", etc.
  showVolume?: boolean;
  showComparison?: boolean;
  indicators?: string[];
  annotations?: Array<{ y: number; label: string; date?: string }>;
  patternType?: string;
  tradeSetup?: {
    entry: number;
    stop: number;
    accountSize: number;
    riskPercent: number;
  };
  questions: ScenarioQuestion[];
}

interface LessonScenarioProps {
  scenario: Scenario;
  onComplete: () => void;
}

const LessonScenario = ({ scenario, onComplete }: LessonScenarioProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<boolean[]>(
    new Array(scenario.questions.length).fill(false)
  );

  const currentQuestion = scenario.questions[currentQuestionIndex];
  const allQuestionsCompleted = completedQuestions.every((q) => q);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    const normalizedCorrect = currentQuestion.answer.toLowerCase().trim();
    
    // More flexible answer matching
    const correct = 
      normalizedAnswer === normalizedCorrect ||
      normalizedAnswer.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedAnswer) ||
      // Handle common yes/no variations
      (normalizedCorrect === 'yes' && ['y', 'yeah', 'yup', 'yep', 'sure', 'true'].includes(normalizedAnswer)) ||
      (normalizedCorrect === 'no' && ['n', 'nope', 'nah', 'false'].includes(normalizedAnswer));
    
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const newCompleted = [...completedQuestions];
      newCompleted[currentQuestionIndex] = true;
      setCompletedQuestions(newCompleted);
      
      toast.success("Correct! Well done!");
      
      // Auto-advance to next question if not the last one
      if (currentQuestionIndex < scenario.questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setUserAnswer("");
          setShowFeedback(false);
          setIsCorrect(false);
        }, 1500);
      } else {
        // On last question, just reset the feedback after showing it
        setTimeout(() => {
          setShowFeedback(false);
          setIsCorrect(false);
        }, 1500);
      }
    } else {
      toast.error("Not quite. Try again!");
    }
  };

  // Reset feedback when user modifies their answer
  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    if (showFeedback && !isCorrect) {
      setShowFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <Card className="p-6 bg-gradient-mint border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">{scenario.title}</h3>
            </div>
            <p className="text-white">{scenario.description}</p>
          </div>
          <Badge variant="secondary" className="ml-4">
            <Clock className="w-3 h-3 mr-1" />
            {scenario.timeRange}
          </Badge>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mt-4">
          {scenario.questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all ${
                completedQuestions[idx]
                  ? "bg-success"
                  : idx === currentQuestionIndex
                  ? "bg-primary animate-pulse"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </Card>

      {/* Stock Chart */}
      <Card className="p-6">
        <LessonStockChart
          symbol={scenario.symbol}
          name={scenario.symbol.replace('.NS', '')}
          startDate={scenario.startDate}
          endDate={scenario.endDate}
          timeRange={scenario.timeRange}
          annotations={scenario.annotations}
          showVolume={scenario.showVolume}
          showComparison={scenario.showComparison}
          tradeEntry={scenario.tradeSetup?.entry}
        />
        
        {/* Trade Setup Info */}
        {scenario.tradeSetup && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Trade Setup:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Entry:</span>
                <span className="ml-2 font-semibold text-foreground">
                  ₹{scenario.tradeSetup.entry}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Stop Loss:</span>
                <span className="ml-2 font-semibold text-destructive">
                  ₹{scenario.tradeSetup.stop}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Account:</span>
                <span className="ml-2 font-semibold text-foreground">
                  ₹{scenario.tradeSetup.accountSize.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk:</span>
                <span className="ml-2 font-semibold text-accent">
                  {scenario.tradeSetup.riskPercent}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Interactive Question */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-primary">
                {currentQuestionIndex + 1}
              </span>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-lg font-medium text-foreground">
                {currentQuestion.question}
              </p>

              <div className="flex gap-2">
                <Input
                  value={userAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && userAnswer.trim() && !(showFeedback && isCorrect) && checkAnswer()}
                  placeholder="Type your answer..."
                  className="flex-1 text-white placeholder:text-white/50"
                  disabled={showFeedback && isCorrect}
                />
                <Button
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim() || (showFeedback && isCorrect)}
                  className="min-w-24"
                >
                  Check
                </Button>
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                    isCorrect
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${isCorrect ? "text-success" : "text-destructive"}`}>
                      {isCorrect ? "Correct!" : "Not quite right"}
                    </p>
                    {!isCorrect && (
                      <>
                        <p className="text-sm text-muted-foreground mt-1">
                          Expected answer: {currentQuestion.answer}
                        </p>
                        {currentQuestion.explanation && (
                          <p className="text-sm text-foreground/90 mt-2 leading-relaxed border-t border-border/30 pt-2">
                            <span className="font-medium">Explanation:</span> {currentQuestion.explanation}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Complete Scenario Button */}
      {allQuestionsCompleted && (
        <Button onClick={onComplete} size="lg" className="w-full">
          Continue
        </Button>
      )}
    </div>
  );
};

export default LessonScenario;