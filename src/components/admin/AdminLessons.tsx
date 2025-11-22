import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ScenarioBuilder from "./ScenarioBuilder";
import QuizBuilder from "./QuizBuilder";

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  content: string;
  xp_reward: number;
  order_index: number;
  scenario_data?: any;
  quiz_questions?: any;
  practice_stocks?: string[];
  practice_start_date?: string;
}

const AdminLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "basics",
    difficulty: "beginner",
    content: "",
    xp_reward: 100,
    order_index: 0,
    scenario_data: { scenarios: [] as any[] },
    quiz_questions: [] as any[],
    practice_stocks: [] as string[],
    practice_start_date: "2024-12-02T00:00:00Z",
  });

  const [practiceStockInput, setPracticeStockInput] = useState("");

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive",
      });
      return;
    }

    setLessons(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLesson) {
      const { error } = await supabase
        .from("lessons")
        .update(formData)
        .eq("id", editingLesson.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update lesson",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
    } else {
      const { error } = await supabase.from("lessons").insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create lesson",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchLessons();
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      category: lesson.category,
      difficulty: lesson.difficulty,
      content: lesson.content,
      xp_reward: lesson.xp_reward,
      order_index: lesson.order_index,
      scenario_data: lesson.scenario_data || { scenarios: [] },
      quiz_questions: lesson.quiz_questions || [],
      practice_stocks: lesson.practice_stocks || [],
      practice_start_date: lesson.practice_start_date || "2024-12-02T00:00:00Z",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Lesson deleted successfully",
    });
    fetchLessons();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "basics",
      difficulty: "beginner",
      content: "",
      xp_reward: 100,
      order_index: 0,
      scenario_data: { scenarios: [] },
      quiz_questions: [],
      practice_stocks: [],
      practice_start_date: "2024-12-02T00:00:00Z",
    });
    setPracticeStockInput("");
    setEditingLesson(null);
  };

  const addPracticeStock = () => {
    if (practiceStockInput.trim()) {
      setFormData({
        ...formData,
        practice_stocks: [...formData.practice_stocks, practiceStockInput.trim()]
      });
      setPracticeStockInput("");
    }
  };

  const removePracticeStock = (index: number) => {
    setFormData({
      ...formData,
      practice_stocks: formData.practice_stocks.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Lessons</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {editingLesson ? "Edit Lesson" : "Add New Lesson"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="practice">Practice</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basics">Basics</SelectItem>
                      <SelectItem value="investing">Investing</SelectItem>
                      <SelectItem value="budgeting">Budgeting</SelectItem>
                      <SelectItem value="saving">Saving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="xp_reward">XP Reward</Label>
                      <Input
                        id="xp_reward"
                        type="number"
                        value={formData.xp_reward}
                        onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="order_index">Order</Label>
                      <Input
                        id="order_index"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scenarios" className="mt-4">
                  <ScenarioBuilder
                    scenarios={formData.scenario_data.scenarios}
                    onChange={(scenarios) => setFormData({ ...formData, scenario_data: { scenarios } })}
                  />
                </TabsContent>

                <TabsContent value="quiz" className="mt-4">
                  <QuizBuilder
                    questions={formData.quiz_questions}
                    onChange={(questions) => setFormData({ ...formData, quiz_questions: questions })}
                  />
                </TabsContent>

                <TabsContent value="practice" className="mt-4 space-y-4">
                  <div>
                    <Label>Practice Start Date</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Set the starting date for practice trading
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.practice_start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.practice_start_date ? format(new Date(formData.practice_start_date), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.practice_start_date ? new Date(formData.practice_start_date) : undefined}
                          onSelect={(date) => setFormData({ ...formData, practice_start_date: date?.toISOString() || "2024-12-02T00:00:00Z" })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Practice Stocks</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add stock symbols for students to practice with
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={practiceStockInput}
                        onChange={(e) => setPracticeStockInput(e.target.value)}
                        placeholder="E.g., RELIANCE.NS or AAPL"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPracticeStock())}
                      />
                      <Button type="button" onClick={addPracticeStock}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {formData.practice_stocks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.practice_stocks.map((stock, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                          <span className="text-sm">{stock}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePracticeStock(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLesson ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>XP</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id}>
              <TableCell>{lesson.order_index}</TableCell>
              <TableCell className="font-medium">{lesson.title}</TableCell>
              <TableCell className="capitalize">{lesson.category}</TableCell>
              <TableCell className="capitalize">{lesson.difficulty}</TableCell>
              <TableCell>{lesson.xp_reward}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(lesson)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(lesson.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminLessons;
