import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Scenario {
  title: string;
  description: string;
  symbol: string;
  startDate?: string;
  endDate?: string;
  timeRange?: string;
  showVolume: boolean;
  showComparison: boolean;
  tradeSetup?: {
    entry: number;
    stop: number;
    accountSize: number;
    riskPercent: number;
  };
  questions: Array<{ question: string; answer: string; explanation: string }>;
}

interface ScenarioBuilderProps {
  scenarios: Scenario[];
  onChange: (scenarios: Scenario[]) => void;
}

const ScenarioBuilder = ({ scenarios, onChange }: ScenarioBuilderProps) => {
  const addScenario = () => {
    const newScenario: Scenario = {
      title: "",
      description: "",
      symbol: "",
      startDate: "",
      endDate: "",
      showVolume: true,
      showComparison: true,
      questions: [{ question: "", answer: "", explanation: "" }],
    };
    onChange([...scenarios, newScenario]);
  };

  const updateScenario = (index: number, field: string, value: any) => {
    const updated = [...scenarios];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...(updated[index][parent as keyof Scenario] as any),
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeScenario = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index));
  };

  const addQuestion = (scenarioIndex: number) => {
    const updated = [...scenarios];
    updated[scenarioIndex].questions.push({ question: "", answer: "", explanation: "" });
    onChange(updated);
  };

  const updateQuestion = (scenarioIndex: number, questionIndex: number, field: string, value: string) => {
    const updated = [...scenarios];
    updated[scenarioIndex].questions[questionIndex] = {
      ...updated[scenarioIndex].questions[questionIndex],
      [field]: value
    };
    onChange(updated);
  };

  const removeQuestion = (scenarioIndex: number, questionIndex: number) => {
    const updated = [...scenarios];
    updated[scenarioIndex].questions = updated[scenarioIndex].questions.filter((_, i) => i !== questionIndex);
    onChange(updated);
  };

  const enableTradeSetup = (scenarioIndex: number, enable: boolean) => {
    const updated = [...scenarios];
    if (enable) {
      updated[scenarioIndex].tradeSetup = {
        entry: 0,
        stop: 0,
        accountSize: 100000,
        riskPercent: 1
      };
    } else {
      delete updated[scenarioIndex].tradeSetup;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Interactive Scenarios</Label>
        <Button onClick={addScenario} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Scenario
        </Button>
      </div>

      {scenarios.map((scenario, scenarioIdx) => (
        <Card key={scenarioIdx} className="p-6 space-y-4 bg-muted/20">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">Scenario {scenarioIdx + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeScenario(scenarioIdx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`scenario-title-${scenarioIdx}`}>Title</Label>
              <Input
                id={`scenario-title-${scenarioIdx}`}
                value={scenario.title}
                onChange={(e) => updateScenario(scenarioIdx, 'title', e.target.value)}
                placeholder="E.g., Bullish Breakout Pattern"
              />
            </div>

            <div>
              <Label htmlFor={`scenario-symbol-${scenarioIdx}`}>Stock Symbol</Label>
              <Input
                id={`scenario-symbol-${scenarioIdx}`}
                value={scenario.symbol}
                onChange={(e) => updateScenario(scenarioIdx, 'symbol', e.target.value)}
                placeholder="E.g., RELIANCE.NS or AAPL"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`scenario-desc-${scenarioIdx}`}>Description</Label>
            <Textarea
              id={`scenario-desc-${scenarioIdx}`}
              value={scenario.description}
              onChange={(e) => updateScenario(scenarioIdx, 'description', e.target.value)}
              placeholder="Describe the scenario..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`scenario-start-${scenarioIdx}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Start Date
              </Label>
              <Input
                id={`scenario-start-${scenarioIdx}`}
                type="date"
                value={scenario.startDate}
                onChange={(e) => updateScenario(scenarioIdx, 'startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={`scenario-end-${scenarioIdx}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                End Date
              </Label>
              <Input
                id={`scenario-end-${scenarioIdx}`}
                type="date"
                value={scenario.endDate}
                onChange={(e) => updateScenario(scenarioIdx, 'endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id={`show-volume-${scenarioIdx}`}
                checked={scenario.showVolume}
                onCheckedChange={(checked) => updateScenario(scenarioIdx, 'showVolume', checked)}
              />
              <Label htmlFor={`show-volume-${scenarioIdx}`}>Show Volume</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`show-comparison-${scenarioIdx}`}
                checked={scenario.showComparison}
                onCheckedChange={(checked) => updateScenario(scenarioIdx, 'showComparison', checked)}
              />
              <Label htmlFor={`show-comparison-${scenarioIdx}`}>Enable Future Comparison</Label>
            </div>
          </div>

          {/* Trade Setup */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id={`trade-setup-${scenarioIdx}`}
                checked={!!scenario.tradeSetup}
                onCheckedChange={(checked) => enableTradeSetup(scenarioIdx, checked)}
              />
              <Label htmlFor={`trade-setup-${scenarioIdx}`}>Include Trade Setup</Label>
            </div>

            {scenario.tradeSetup && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Price (₹)</Label>
                  <Input
                    type="number"
                    value={scenario.tradeSetup.entry}
                    onChange={(e) => updateScenario(scenarioIdx, 'tradeSetup.entry', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Stop Loss (₹)</Label>
                  <Input
                    type="number"
                    value={scenario.tradeSetup.stop}
                    onChange={(e) => updateScenario(scenarioIdx, 'tradeSetup.stop', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Account Size (₹)</Label>
                  <Input
                    type="number"
                    value={scenario.tradeSetup.accountSize}
                    onChange={(e) => updateScenario(scenarioIdx, 'tradeSetup.accountSize', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Risk (%)</Label>
                  <Input
                    type="number"
                    value={scenario.tradeSetup.riskPercent}
                    onChange={(e) => updateScenario(scenarioIdx, 'tradeSetup.riskPercent', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <Label className="font-semibold">Questions</Label>
              <Button
                onClick={() => addQuestion(scenarioIdx)}
                size="sm"
                variant="outline"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Question
              </Button>
            </div>

            {scenario.questions.map((question, qIdx) => (
              <Card key={qIdx} className="p-4 mb-3 bg-background">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium">Question {qIdx + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(scenarioIdx, qIdx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Question</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(scenarioIdx, qIdx, 'question', e.target.value)}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <Input
                      value={question.answer}
                      onChange={(e) => updateQuestion(scenarioIdx, qIdx, 'answer', e.target.value)}
                      placeholder="Enter the answer..."
                    />
                  </div>
                  <div>
                    <Label>Explanation (shown when user answers incorrectly)</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(scenarioIdx, qIdx, 'explanation', e.target.value)}
                      placeholder="Explain why this is the correct answer..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ))}

      {scenarios.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No scenarios added yet</p>
          <Button onClick={addScenario} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Scenario
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ScenarioBuilder;
