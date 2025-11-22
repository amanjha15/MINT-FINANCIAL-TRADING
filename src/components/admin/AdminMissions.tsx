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

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  target_value: number;
  xp_reward: number;
  expires_at: string | null;
}

const AdminMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mission_type: "daily_login",
    target_value: 1,
    xp_reward: 200,
    expires_at: "",
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch missions",
        variant: "destructive",
      });
      return;
    }

    setMissions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      expires_at: formData.expires_at || null,
    };

    if (editingMission) {
      const { error } = await supabase
        .from("missions")
        .update(submitData)
        .eq("id", editingMission.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update mission",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Mission updated successfully",
      });
    } else {
      const { error } = await supabase.from("missions").insert([submitData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create mission",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Mission created successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchMissions();
  };

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description,
      mission_type: mission.mission_type,
      target_value: mission.target_value,
      xp_reward: mission.xp_reward,
      expires_at: mission.expires_at || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mission?")) return;

    const { error } = await supabase.from("missions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete mission",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Mission deleted successfully",
    });
    fetchMissions();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      mission_type: "daily_login",
      target_value: 1,
      xp_reward: 200,
      expires_at: "",
    });
    setEditingMission(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Missions</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMission ? "Edit Mission" : "Add New Mission"}</DialogTitle>
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
                <Label htmlFor="mission_type">Mission Type</Label>
                <Select
                  value={formData.mission_type}
                  onValueChange={(value) => setFormData({ ...formData, mission_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_login">Daily Login</SelectItem>
                    <SelectItem value="complete_lessons">Complete Lessons</SelectItem>
                    <SelectItem value="trade_stocks">Trade Stocks</SelectItem>
                    <SelectItem value="portfolio_value">Portfolio Value</SelectItem>
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

              <div>
                <Label htmlFor="expires_at">Expires At (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMission ? "Update" : "Create"}
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
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missions.map((mission) => (
            <TableRow key={mission.id}>
              <TableCell className="font-medium">{mission.title}</TableCell>
              <TableCell className="capitalize">{mission.mission_type.replace('_', ' ')}</TableCell>
              <TableCell>{mission.target_value}</TableCell>
              <TableCell>{mission.xp_reward}</TableCell>
              <TableCell>
                {mission.expires_at ? new Date(mission.expires_at).toLocaleDateString() : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(mission)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(mission.id)}
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

export default AdminMissions;
