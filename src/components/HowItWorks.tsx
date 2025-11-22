import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
const steps = [{
  step: "01",
  title: "demystify finance using the coach",
  description: "send financial pdfs or just ask doubts and our financial coach is there for you. It will help you learn and analyse stock market data.",
  features: ["5-minute setup", "No credit card", "Instant results"]
}, {
  step: "02",
  title: "Learn & Practice",
  description: "Follow guided lessons with interactive quizzes and real-world scenarios. Your personal coach explains concepts in plain language.",
  features: ["Story-based learning", "Instant feedback", "Progress tracking"]
}, {
  step: "03",
  title: "Simulate Investments",
  description: "Put your knowledge to test in our virtual trading sandbox. Practice with real market data, zero real risk.",
  features: ["Live market data", "Virtual currency", "Performance analytics"]
}, {
  step: "04",
  title: "Build Confidence",
  description: "Complete missions, earn badges, and watch your virtual portfolio grow. When you're ready, transition to real investing.",
  features: ["Achievement system", "Peer comparison", "Expert insights"]
}];
const HowItWorks = () => {
  const navigate = useNavigate();
  return <section className="py-24 px-4 md:px-6">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          
          <h2 className="text-4xl md:text-5xl font-sentient text-foreground">
            Your Journey to
            <br />
            <span className="text-primary italic">Financial Freedom</span>
          </h2>
          <p className="text-base md:text-lg font-mono text-foreground/60 max-w-2xl mx-auto">
            Four simple steps to transform from curious beginner to confident investor.
          </p>
        </div>
        
        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((item, index) => <Card key={index} className="relative p-8 hover:shadow-xl transition-all duration-300 border-border/50 bg-card animate-fade-in-up overflow-hidden group opacity-90" style={{
          animationDelay: `${index * 0.15}s`
        }}>
              {/* Step number background */}
              <div className="absolute top-0 right-0 text-[200px] font-bold text-muted/5 leading-none select-none">
                {item.step}
              </div>
              
              <div className="relative z-10">
                {/* Step badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                  Step {item.step}
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left: Title and description */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Right: Features */}
                  <div className="space-y-2">
                    {item.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>)}
                  </div>
                </div>
              </div>
              
              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-gradient-to-b from-border to-transparent" />}
            </Card>)}
        </div>
        
        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="default" size="xl" className="group" onClick={() => navigate("/auth")}>
            Start Your Journey
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>;
};
export default HowItWorks;