import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FloatingNav } from "@/components/ui/floating-navbar";
import {
  IconHome,
  IconBook,
  IconChartLine,
  IconTarget,
  IconTrophy,
  IconBrain,
  IconSword,
} from "@tabler/icons-react";

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="h-4 w-4" />,
    },
    {
      name: "Lessons",
      link: "/lessons",
      icon: <IconBook className="h-4 w-4" />,
    },
    {
      name: "Simulator",
      link: "/simulator",
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      name: "Missions",
      link: "/missions",
      icon: <IconTarget className="h-4 w-4" />,
    },
    {
      name: "Challenges",
      link: "/challenges",
      icon: <IconSword className="h-4 w-4" />,
    },
    {
      name: "Coach",
      link: "/ai-coach",
      icon: <IconBrain className="h-4 w-4" />,
    },
    {
      name: "Achievements",
      link: "/achievements",
      icon: <IconTrophy className="h-4 w-4" />,
    },
  ];

  const authButton = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="border text-sm font-medium relative border-border/20 text-foreground px-4 py-2 rounded-full transition-colors">
          <User className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <button
      onClick={() => navigate("/auth")}
      className="border text-sm font-medium relative border-primary/50 text-foreground px-4 py-2 rounded-full transition-all hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] hover:border-primary"
    >
      <span>Login</span>
    </button>
  );

  // Only show floating nav on home page
  if (location.pathname !== "/") {
    return null;
  }

  return <FloatingNav navItems={navItems} authButton={authButton} />;
};

export default Navbar;
