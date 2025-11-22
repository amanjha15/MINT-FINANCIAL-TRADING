import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { GL } from "@/components/gl";
import { Pill } from "@/components/Pill";

const Hero = () => {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    tradesValue: 0,
    lessonsCompleted: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch platform stats from the public stats table
        const { data: statsData, error } = await supabase
          .from('platform_stats')
          .select('stat_name, stat_value')
          .in('stat_name', ['total_users', 'total_trades_value', 'total_lessons_completed']);

        if (error) throw error;

        // Parse the stats into our state object
        const parsedStats = {
          users: 0,
          tradesValue: 0,
          lessonsCompleted: 0
        };

        statsData?.forEach(stat => {
          if (stat.stat_name === 'total_users') {
            parsedStats.users = Number(stat.stat_value);
          } else if (stat.stat_name === 'total_trades_value') {
            parsedStats.tradesValue = Number(stat.stat_value);
          } else if (stat.stat_name === 'total_lessons_completed') {
            parsedStats.lessonsCompleted = Number(stat.stat_value);
          }
        });

        setStats(parsedStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      <GL hovering={hovering} />
      
      <div className="container relative z-10 px-4 md:px-6 pb-16 mt-auto">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <Pill className="animate-fade-in-up">BETA RELEASE</Pill>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-sentient text-white leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Unlock your <br />
            <i className="font-light">future</i> growth
          </h1>
          
          {/* Subheading */}
          <p className="text-base md:text-lg font-mono text-white/60 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Through perpetual investment strategies that outperform the market
          </p>
            
          <Button 
            size="lg"
            className="mt-6 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
            onClick={() => navigate("/lessons")}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Start Learning]
          </Button>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-white">
                {stats.users > 0 ? formatNumber(stats.users) : '—'}
              </div>
              <div className="text-sm text-white/70">Active Learners</div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-white">
                {stats.tradesValue > 0 ? formatNumber(stats.tradesValue) : '—'}
              </div>
              <div className="text-sm text-white/70">Trades Executed</div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-white">
                {stats.lessonsCompleted > 0 ? formatNumber(stats.lessonsCompleted) : '—'}
              </div>
              <div className="text-sm text-white/70">Lessons Completed</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
