import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

const AdminAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "🏆",
    requirement_type: "lessons_completed",
    requirement_value: 10,
    xp_reward: 50,
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch achievements",
        variant: "destructive",
      });
      return;
    }

    setAchievements(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAchievement) {
      const { error } = await supabase
        .from("achievements")
        .update(formData)
        .eq("id", editingAchievement.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update achievement",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Achievement updated successfully",
      });
    } else {
      const { error } = await supabase.from("achievements").insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create achievement",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Achievement created successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchAchievements();
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      xp_reward: achievement.xp_reward,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    const { error } = await supabase.from("achievements").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Achievement deleted successfully",
    });
    fetchAchievements();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "🏆",
      requirement_type: "lessons_completed",
      requirement_value: 10,
      xp_reward: 50,
    });
    setEditingAchievement(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Achievements</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAchievement ? "Edit Achievement" : "Add New Achievement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  required
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="requirement_type">Requirement Type</Label>
                <Select
                  value={formData.requirement_type}
                  onValueChange={(value) => setFormData({ ...formData, requirement_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lessons_completed">Lessons Completed</SelectItem>
                    <SelectItem value="missions_completed">Missions Completed</SelectItem>
                    <SelectItem value="xp_earned">XP Earned</SelectItem>
                    <SelectItem value="trades_made">Trades Made</SelectItem>
                    <SelectItem value="streak_days">Streak Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requirement_value">Requirement Value</Label>
                  <Input
                    id="requirement_value"
                    type="number"
                    value={formData.requirement_value}
                    onChange={(e) => setFormData({ ...formData, requirement_value: parseInt(e.target.value) })}
                    required
                  />
                </div>

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
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAchievement ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Icon</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Requirement</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>XP</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {achievements.map((achievement) => (
            <TableRow key={achievement.id}>
              <TableCell className="text-2xl">{achievement.icon}</TableCell>
              <TableCell className="font-medium">{achievement.title}</TableCell>
              <TableCell className="capitalize">{achievement.requirement_type.replace('_', ' ')}</TableCell>
              <TableCell>{achievement.requirement_value}</TableCell>
              <TableCell>{achievement.xp_reward}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(achievement)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(achievement.id)}
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

export default AdminAchievements;
