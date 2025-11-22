import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import Index from "./pages/Index";
import Simulator from "./pages/Simulator";
import Lessons from "./pages/Lessons";
import AICoach from "./pages/AICoach";
import RapidTestGame from "./pages/RapidTestGame";
import Achievements from "./pages/Achievements";
import Missions from "./pages/Missions";
import Challenges from "./pages/Challenges";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');

    // Get current user and track activity
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track daily activity for logged-in users
  useActivityTracker(userId);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/rapid-test" element={<RapidTestGame />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
