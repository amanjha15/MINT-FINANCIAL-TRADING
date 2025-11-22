import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Lock, ArrowLeft, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LessonScenario from "@/components/lessons/LessonScenario";
import LessonQuiz from "@/components/lessons/LessonQuiz";
import PracticeTradingMode from "@/components/lessons/PracticeTradingMode";
import StoryLesson from "@/components/lessons/StoryLesson";
import ContentViewer from "@/components/lessons/ContentViewer";
import lessonsBg from "@/assets/lessons-bg.png";

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
  annotations?: Array<{ y: number; label: string }>;
  tradeSetup?: {
    entry: number;
    stop: number;
    accountSize: number;
    riskPercent: number;
  };
  questions: Array<{ question: string; answer: string }>;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty: string;
  xp_reward: number;
  order_index: number;
  scenario_data?: {
    scenarios: Scenario[];
  };
  quiz_questions?: QuizQuestion[];
  practice_stocks?: string[];
  practice_start_date?: string;
}

interface UserProgress {
  lesson_id: string;
  completed: boolean;
  score?: number;
}

const Lessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonMode, setLessonMode] = useState<"content" | "scenarios" | "quiz" | "practice">("content");
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchLessons();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access lessons.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchProgress(session.user.id);
  };

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("order_index");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
      return;
    }

    // Cast JSONB fields to proper types
    const typedLessons: Lesson[] = (data || []).map((lesson) => ({
      ...lesson,
      scenario_data: (lesson.scenario_data as unknown) as { scenarios: Scenario[] } | undefined,
      quiz_questions: (lesson.quiz_questions as unknown) as QuizQuestion[] | undefined,
      practice_stocks: lesson.practice_stocks || undefined,
    }));

    setLessons(typedLessons);
  };

  const fetchProgress = async (userId: string) => {
    const { data } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    setProgress(data || []);
  };

  const completeLesson = async (lessonId: string, xpReward: number) => {
    if (!user) return;

    const { error } = await supabase.from("user_progress").upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      score: 100,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
      return;
    }

    // Update user stats
    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (stats) {
      await supabase
        .from("user_stats")
        .update({
          xp: stats.xp + xpReward,
          total_lessons_completed: stats.total_lessons_completed + 1,
        })
        .eq("user_id", user.id);
    }

    toast({
      title: "Lesson Complete! 🎉",
      description: `You earned ${xpReward} XP!`,
    });

    fetchProgress(user.id);
    setSelectedLesson(null);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lesson_id === lessonId && p.completed);
  };

  const completedCount = progress.filter((p) => p.completed).length;
  const totalCount = lessons.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const startLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonMode("content");
    setCurrentScenarioIndex(0);
  };

  const proceedToScenarios = () => {
    if (selectedLesson?.scenario_data?.scenarios && selectedLesson.scenario_data.scenarios.length > 0) {
      setLessonMode("scenarios");
    } else {
      proceedToQuiz();
    }
  };

  const proceedToQuiz = () => {
    if (selectedLesson?.quiz_questions && selectedLesson.quiz_questions.length > 0) {
      setLessonMode("quiz");
    } else {
      proceedToPractice();
    }
  };

  const proceedToPractice = () => {
    if (selectedLesson?.practice_stocks && selectedLesson.practice_stocks.length > 0) {
      setLessonMode("practice");
    } else {
      completeLesson(selectedLesson!.id, selectedLesson!.xp_reward);
    }
  };

  const handleScenarioComplete = () => {
    if (!selectedLesson?.scenario_data?.scenarios) return;
    
    if (currentScenarioIndex < selectedLesson.scenario_data.scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    } else {
      proceedToQuiz();
    }
  };

  const handleQuizComplete = (score: number) => {
    toast({
      title: "Quiz Complete!",
      description: `You scored ${score}%`,
    });
    proceedToPractice();
  };

  if (selectedLesson) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedLesson(null);
              setLessonMode("content");
              setCurrentScenarioIndex(0);
            }} 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>

          {/* Story-Based Lesson Content */}
          {lessonMode === "content" && (
            <StoryLesson
              title={selectedLesson.title}
              description={selectedLesson.description}
              content={selectedLesson.content}
              category={selectedLesson.category}
              difficulty={selectedLesson.difficulty}
              onComplete={proceedToScenarios}
            />
          )}

          {/* Scenarios Mode */}
          {lessonMode === "scenarios" && selectedLesson.scenario_data?.scenarios && (
            <>
              <ContentViewer
                title={selectedLesson.title}
                content={selectedLesson.content}
                category={selectedLesson.category}
                difficulty={selectedLesson.difficulty}
                description={selectedLesson.description}
              />
              
              {/* Scenario Progress Indicator */}
              {selectedLesson.scenario_data.scenarios.length > 1 && (
                <Card className="p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Scenario {currentScenarioIndex + 1} of {selectedLesson.scenario_data.scenarios.length}
                    </span>
                    <div className="flex gap-2">
                      {selectedLesson.scenario_data.scenarios.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-8 rounded-full transition-all ${
                            idx < currentScenarioIndex
                              ? "bg-success"
                              : idx === currentScenarioIndex
                              ? "bg-primary animate-pulse"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}
              
              <LessonScenario
                scenario={selectedLesson.scenario_data.scenarios[currentScenarioIndex]}
                onComplete={handleScenarioComplete}
              />
            </>
          )}

          {/* Quiz Mode */}
          {lessonMode === "quiz" && selectedLesson.quiz_questions && (
            <>
              <ContentViewer
                title={selectedLesson.title}
                content={selectedLesson.content}
                category={selectedLesson.category}
                difficulty={selectedLesson.difficulty}
                description={selectedLesson.description}
              />
              <LessonQuiz
                questions={selectedLesson.quiz_questions}
                onComplete={handleQuizComplete}
              />
            </>
          )}

          {/* Practice Trading Mode */}
          {lessonMode === "practice" && selectedLesson.practice_stocks && (
            <>
              <ContentViewer
                title={selectedLesson.title}
                content={selectedLesson.content}
                category={selectedLesson.category}
                difficulty={selectedLesson.difficulty}
                description={selectedLesson.description}
              />
              <PracticeTradingMode
                practiceStocks={selectedLesson.practice_stocks}
                practiceDate={selectedLesson.practice_start_date}
                lessonId={selectedLesson.id}
                onComplete={() => completeLesson(selectedLesson.id, selectedLesson.xp_reward)}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${lessonsBg})` }}
      />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Interactive Learning</h1>
            <p className="text-muted-foreground">
              Master financial concepts through engaging lessons
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {totalCount} lessons
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {lessons.map((lesson) => {
            const completed = isLessonCompleted(lesson.id);
            return (
              <Card
                key={lesson.id}
                className={`p-6 hover:shadow-lg transition-all cursor-pointer bg-white ${
                  completed ? "border-success" : ""
                }`}
                onClick={() => startLesson(lesson)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      completed ? "bg-success/20" : "bg-primary/20"
                    }`}>
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black">{lesson.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs text-black">
                          {lesson.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs text-black">
                          {lesson.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-black mb-4 line-clamp-2">
                  {lesson.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">
                    +{lesson.xp_reward} XP
                  </span>
                  {completed && (
                    <Badge variant="default" className="bg-success">
                      Completed
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {lessons.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Lessons Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new learning content!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Lessons;