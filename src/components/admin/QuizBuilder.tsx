import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

const QuizBuilder = ({ questions, onChange }: QuizBuilderProps) => {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      options: ["", "", "", ""],
      correct: 0,
      explanation: "",
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Quiz Questions</Label>
        <Button onClick={addQuestion} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.map((question, qIdx) => (
        <Card key={qIdx} className="p-6 space-y-4 bg-muted/20">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">Question {qIdx + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(qIdx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label htmlFor={`question-${qIdx}`}>Question</Label>
            <Input
              id={`question-${qIdx}`}
              value={question.question}
              onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
              placeholder="Enter your question..."
            />
          </div>

          <div className="space-y-3">
            <Label>Options (Select the correct answer)</Label>
            <RadioGroup
              value={question.correct.toString()}
              onValueChange={(value) => updateQuestion(qIdx, 'correct', parseInt(value))}
            >
              {question.options.map((option, optIdx) => (
                <div key={optIdx} className="flex items-center space-x-2">
                  <RadioGroupItem value={optIdx.toString()} id={`q${qIdx}-opt${optIdx}`} />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor={`explanation-${qIdx}`}>Explanation (shown when answer is incorrect)</Label>
            <Textarea
              id={`explanation-${qIdx}`}
              value={question.explanation}
              onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
              placeholder="Explain why the correct answer is right..."
              rows={3}
            />
          </div>
        </Card>
      ))}

      {questions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No quiz questions added yet</p>
          <Button onClick={addQuestion} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Question
          </Button>
        </Card>
      )}
    </div>
  );
};

export default QuizBuilder;
