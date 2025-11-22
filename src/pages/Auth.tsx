import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import authBg from "@/assets/auth-bg.png";
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    checkUser();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      navigate("/");
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success!",
      description: "Check your email to confirm your account."
    });
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Welcome back!",
      description: "You've successfully signed in."
    });
    navigate("/");
  };
  return <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden">
      {/* Left Side Image */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${authBg})`,
      backgroundPosition: 'right center'
    }} />
      
      {/* Right Side Image (Mirrored) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${authBg})`,
      backgroundPosition: 'left center',
      transform: 'scaleX(-1)'
    }} />
      
      {/* Green Overlay */}
      <div className="absolute inset-0 bg-[#1a5f3f]/80" />

      {/* Content */}
      <Card className="w-full max-w-md p-8 relative z-10 bg-white rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-sentient font-bold mb-3 text-[#1a5f3f]">Welcome to Mint</h1>
          <p className="text-gray-600 font-mono text-sm">
            Start your financial education journey
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="text-gray-700">Email</Label>
                <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-gray-100 border-gray-200" />
              </div>
              <div>
                <Label htmlFor="signin-password" className="text-gray-700">Password</Label>
                <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-gray-100 border-gray-200" />
              </div>
              <Button type="submit" className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg h-12 font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email" className="text-gray-700">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-gray-100 border-gray-200" />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
                <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-gray-100 border-gray-200" />
              </div>
              <Button type="submit" className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg h-12 font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <button onClick={() => navigate("/")} className="text-gray-800 font-semibold hover:text-[#1a5f3f] transition-colors">
            Back To Home
          </button>
        </div>
      </Card>
    </div>;
};
export default Auth;