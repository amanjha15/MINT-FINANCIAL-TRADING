import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useSupabase";

interface ProfileEditorProps {
  userId: string;
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

export const ProfileEditor = ({
  userId,
  profile,
  onProfileUpdate
}: ProfileEditorProps) => {
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = await updateProfile.mutateAsync({
        userId,
        updates: {
          username,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        }
      });
      
      onProfileUpdate(data);
      toast({
        title: "Success!",
        description: "Your profile has been updated."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  return <Card className="p-8 bg-card border-border/20">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-slate-50">
          <Label htmlFor="username" className="text-foreground">
            Username
          </Label>
          <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" className="bg-background border-border/40" />
        </div>

        <div>
          <Label htmlFor="bio" className="text-foreground">
            Bio
          </Label>
          <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} className="bg-background border-border/40" />
        </div>

        <div>
          <Label htmlFor="avatar" className="text-foreground">
            Avatar URL
          </Label>
          <Input id="avatar" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className="bg-background border-border/40" />
          {avatarUrl && <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <img src={avatarUrl} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            </div>}
        </div>

        <Button type="submit" disabled={updateProfile.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </form>
    </Card>;
};