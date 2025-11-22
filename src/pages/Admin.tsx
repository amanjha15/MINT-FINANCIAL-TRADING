import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import AdminLessons from "@/components/admin/AdminLessons";
import AdminMissions from "@/components/admin/AdminMissions";
import AdminChallenges from "@/components/admin/AdminChallenges";
import AdminAchievements from "@/components/admin/AdminAchievements";
const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkAdminAccess();
  }, []);
  const checkAdminAccess = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the admin panel.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // Check if user has admin role using the has_role function
      const {
        data,
        error
      } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      if (error) {
        console.error("Error checking admin role:", error);
        toast({
          title: "Access Denied",
          description: "Unable to verify admin access.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      if (!data) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      console.error("Error in admin check:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>;
  }
  if (!isAdmin) {
    return null;
  }
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your app content</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="lessons" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="missions">Missions</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="mt-6">
              <AdminLessons />
            </TabsContent>

            <TabsContent value="missions" className="mt-6">
              <AdminMissions />
            </TabsContent>

            <TabsContent value="challenges" className="mt-6">
              <AdminChallenges />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <AdminAchievements />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>;
};
export default Admin;