import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, LineChart, Gamepad2, GraduationCap, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
const features = [{
  icon: BookOpen,
  title: "Interactive Learning",
  description: "Bite-sized lessons that transform complex financial concepts into engaging stories and scenarios.",
  gradient: "from-primary to-primary/70"
}, {
  icon: LineChart,
  title: "Virtual Trading Sandbox",
  description: "Practice investing with real market data in a risk-free environment. Learn by doing, not just reading.",
  gradient: "from-secondary to-secondary/70"
}, {
  icon: GraduationCap,
  title: "Personal Financial Coach",
  description: "Get personalized guidance from an expert mentor that adapts to your learning style and goals.",
  gradient: "from-accent to-accent/70"
}, {
  icon: Gamepad2,
  title: "Gamified Experience",
  description: "Earn XP, unlock achievements, and complete missions. Make learning addictive, not intimidating.",
  gradient: "from-primary to-accent"
}, {
  icon: Trophy,
  title: "Achievement System",
  description: "Track your progress with badges, levels, and streaks. Celebrate every milestone on your financial journey.",
  gradient: "from-success to-success/70"
}, {
  icon: Users,
  title: "Community Challenges",
  description: "Compete and collaborate with peers. Share strategies and learn from collective wisdom.",
  gradient: "from-secondary to-primary"
}];
const Features = () => {
  const navigate = useNavigate();
  const handleFeatureClick = (index: number) => {
    switch (index) {
      case 0:
        navigate("/lessons");
        break;
      case 1:
        navigate("/simulator");
        break;
      case 2:
        navigate("/ai-coach");
        break;
      case 3:
        navigate("/lessons");
        break;
      case 4:
        navigate("/achievements");
        break;
      case 5:
        navigate("/challenges");
        break;
    }
  };
  return <section className="py-24 px-4 md:px-6 relative">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          
          <h2 className="text-4xl md:text-5xl font-sentient text-foreground">
            Everything You Need to
            <br />
            <span className="text-primary">Master Money</span>
          </h2>
          <p className="text-base md:text-lg font-mono text-foreground/60 max-w-2xl mx-auto">
            A comprehensive platform designed to take you from financial novice to confident investor.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
          const Icon = feature.icon;
          return <Card key={index} className="group p-6 hover:shadow-glow transition-all duration-300 border-border bg-card/50 backdrop-blur-sm animate-fade-in-up cursor-pointer hover:border-primary/50" style={{
            animationDelay: `${index * 0.1}s`
          }} onClick={() => handleFeatureClick(index)}>
                {/* Icon with gradient */}
                
                
                {/* Content */}
                <h3 className="text-xl font-sentient text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm font-mono text-foreground/60 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                <Button variant="ghost" className="w-full group-hover:bg-primary/10 font-mono uppercase text-xs">
                  Learn More →
                </Button>
              </Card>;
        })}
        </div>
      </div>
    </section>;
};
export default Features;