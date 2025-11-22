import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface ContentViewerProps {
  title: string;
  content: string;
  category: string;
  difficulty: string;
  description: string;
}

const ContentViewer = ({ title, content, category, difficulty, description }: ContentViewerProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 px-6 shadow-lg hover:shadow-xl transition-all"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          View Content
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{title}</SheetTitle>
          <div className="flex gap-2 pt-2">
            <Badge variant="secondary">{category}</Badge>
            <Badge>{difficulty}</Badge>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContentViewer;
