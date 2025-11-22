import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GL } from "./gl";
import { Pill } from "./Pill";
import { Button } from "./ui/button";
export function HeroSection() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/lessons");
    } else {
      navigate("/auth");
    }
  };

  return <div className="flex flex-col h-screen justify-center items-center">
      <GL hovering={false} />

      <div className="text-center relative z-10">
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient text-foreground">
          Master the Art of <br />
          <i className="font-light">Stock Trading</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          Build wealth through knowledge and practice with our interactive learning platform
        </p>

        <Button onClick={handleGetStarted} className="mt-14 max-sm:hidden">
          [Get Started]
        </Button>
        <Button onClick={handleGetStarted} size="sm" className="mt-14 sm:hidden">
          [Get Started]
        </Button>
      </div>
    </div>;
}