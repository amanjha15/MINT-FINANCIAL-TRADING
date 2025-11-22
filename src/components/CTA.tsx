import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
const CTA = () => {
  const navigate = useNavigate();
  return <section className="py-24 px-4 md:px-6 relative overflow-hidden">
      {/* Background gradient */}
      
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" style={{
      animationDelay: '1s'
    }} />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Icon */}
          
          
          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-sentient text-foreground leading-tight">
            Ready to Take Control of
            <br />
            Your <span className="text-primary italic">Financial Future</span>?
          </h2>
          
          {/* Description */}
          <p className="text-base md:text-lg font-mono text-foreground/60 max-w-2xl mx-auto">
            Join thousands of learners who are building their wealth through knowledge and practice. Start your journey today—completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="xl" className="group" onClick={() => navigate("/auth")}>
              Get Started Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghost" size="xl" className="border border-border hover:border-primary/50" onClick={() => navigate("/lessons")}>
              Learn More
            </Button>
          </div>
          
          {/* Trust indicators */}
          
        </div>
      </div>
    </section>;
};
export default CTA;