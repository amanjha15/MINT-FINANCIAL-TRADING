import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const LessonQuiz = ({ questions, onComplete }: LessonQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === question.correct;
    setShowFeedback(true);
    setAnswers([...answers, isCorrect]);

    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = Math.round((score / questions.length) * 100);
      onComplete(finalScore);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Knowledge Check</h3>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Trophy className="w-4 h-4 mr-2" />
            {score}/{questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      {/* Question Card */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-6 text-foreground">{question.question}</h4>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correct;
            const showCorrect = showFeedback && isCorrect;
            const showIncorrect = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  showCorrect
                    ? "border-success bg-success/10"
                    : showIncorrect
                    ? "border-destructive bg-destructive/10"
                    : isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{option}</span>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {showFeedback && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              selectedAnswer === question.correct
                ? "bg-success/10 border border-success/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}
          >
            <p
              className={`font-semibold mb-2 ${
                selectedAnswer === question.correct ? "text-success" : "text-destructive"
              }`}
            >
              {selectedAnswer === question.correct
                ? "Excellent! That's correct."
                : "Not quite. The correct answer is highlighted above."}
            </p>
            {selectedAnswer !== question.correct && question.explanation && (
              <p className="text-sm text-foreground/90 mt-2 leading-relaxed">
                {question.explanation}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {!showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="w-full"
              size="lg"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full" size="lg">
              {isLastQuestion ? "Complete Lesson" : "Next Question"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LessonQuiz;