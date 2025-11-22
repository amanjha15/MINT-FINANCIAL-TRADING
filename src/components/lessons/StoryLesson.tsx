import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StoryLessonProps {
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty: string;
  onComplete: () => void;
}

const StoryLesson = ({
  title,
  description,
  content,
  category,
  difficulty,
  onComplete,
}: StoryLessonProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Split content into story sections (paragraphs)
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const paragraphs = Array.from(doc.querySelectorAll("p, h2, h3, ul, ol")).map(
      (el) => el.outerHTML
    );
    
    // Group content into manageable story chunks (3-4 elements per section)
    const grouped: string[] = [];
    for (let i = 0; i < paragraphs.length; i += 3) {
      grouped.push(paragraphs.slice(i, i + 3).join(""));
    }
    
    setSections(grouped.length > 0 ? grouped : [content]);
  }, [content]);

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setShowContent(false);
      setTimeout(() => setShowContent(true), 100);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setShowContent(false);
      setTimeout(() => setShowContent(true), 100);
    }
  };

  useEffect(() => {
    setShowContent(true);
  }, []);

  const progressPercentage = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="space-y-6">
      {/* Story Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{category}</Badge>
                <Badge>{difficulty}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Chapter Progress</div>
              <div className="text-lg font-bold text-primary">
                {currentSection + 1} / {sections.length}
              </div>
            </div>
          </div>
          
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Story Content with Animation */}
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-8 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                {currentSection === 0 && (
                  <div className="mb-6 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">Story Introduction</span>
                    </div>
                    <p className="text-muted-foreground">{description}</p>
                  </div>
                )}
                
                <div className="prose prose-lg max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: sections[currentSection] || "" }}
                    className="story-content"
                  />
                </div>

                {currentSection === sections.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 bg-success/10 rounded-lg border-l-4 border-success"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">
                        Great job! You've completed the story. Ready for practice?
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSection === 0}
          size="lg"
        >
          Previous Chapter
        </Button>
        
        <div className="flex gap-2">
          {sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSection(idx);
                setShowContent(false);
                setTimeout(() => setShowContent(true), 100);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentSection
                  ? "w-8 bg-primary"
                  : idx < currentSection
                  ? "w-2 bg-success"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          size="lg"
          className="min-w-[180px]"
        >
          {currentSection < sections.length - 1 ? (
            <>
              Next Chapter
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Start Practice
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StoryLesson;
