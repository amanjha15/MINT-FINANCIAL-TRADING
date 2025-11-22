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

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
}

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    challenge_type: "portfolio_growth",
    target_value: 1000,
    xp_reward: 500,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch challenges",
        variant: "destructive",
      });
      return;
    }

    setChallenges(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingChallenge) {
      const { error } = await supabase
        .from("challenges")
        .update(formData)
        .eq("id", editingChallenge.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update challenge",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Challenge updated successfully",
      });
    } else {
      const { error } = await supabase.from("challenges").insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create challenge",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Challenge created successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchChallenges();
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      challenge_type: challenge.challenge_type,
      target_value: challenge.target_value,
      xp_reward: challenge.xp_reward,
      start_date: challenge.start_date.split('T')[0],
      end_date: challenge.end_date.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    const { error } = await supabase.from("challenges").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete challenge",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Challenge deleted successfully",
    });
    fetchChallenges();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      challenge_type: "portfolio_growth",
      target_value: 1000,
      xp_reward: 500,
      start_date: "",
      end_date: "",
    });
    setEditingChallenge(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Challenges</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingChallenge ? "Edit Challenge" : "Add New Challenge"}</DialogTitle>
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
                <Label htmlFor="challenge_type">Challenge Type</Label>
                <Select
                  value={formData.challenge_type}
                  onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio_growth">Portfolio Growth</SelectItem>
                    <SelectItem value="trading_volume">Trading Volume</SelectItem>
                    <SelectItem value="learning_streak">Learning Streak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingChallenge ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>XP</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => (
            <TableRow key={challenge.id}>
              <TableCell className="font-medium">{challenge.title}</TableCell>
              <TableCell className="capitalize">{challenge.challenge_type.replace('_', ' ')}</TableCell>
              <TableCell>{challenge.target_value}</TableCell>
              <TableCell>{challenge.xp_reward}</TableCell>
              <TableCell>
                {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(challenge)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(challenge.id)}
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

export default AdminChallenges;
