import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, Send, ArrowLeft, User, Paperclip, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface Message {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; size: number; type: string }[];
}

interface UploadedFile {
  file: File;
  preview: string;
}
const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    checkAuth();
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the Financial Coach.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv', 'text/markdown'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Please upload PDF or text files.`,
          variant: "destructive"
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive"
        });
        continue;
      }

      newFiles.push({
        file,
        preview: file.name
      });
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const streamChat = async (userMessage: string, files: UploadedFile[]) => {
    try {
      // Upload files to storage and get download URLs
      const filesData = await Promise.all(
        files.map(async (uploadedFile) => {
          const filePath = `${user?.id}/${Date.now()}-${uploadedFile.file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ai-coach-files')
            .upload(filePath, uploadedFile.file, {
              contentType: uploadedFile.file.type,
              upsert: false
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            throw uploadError;
          }

          // Get signed URL for the uploaded file (valid for 1 hour)
          const { data: urlData } = await supabase.storage
            .from('ai-coach-files')
            .createSignedUrl(filePath, 3600);

          return {
            name: uploadedFile.file.name,
            type: uploadedFile.file.type,
            size: uploadedFile.file.size,
            url: urlData?.signedUrl || '',
            path: filePath
          };
        })
      );

      const { data, error } = await supabase.functions.invoke('ai-coach-chat', {
        body: {
          message: userMessage,
          files: filesData,
          sender: user?.email || "Unknown User"
        }
      });

      if (error) throw error;

      // Add assistant response
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || "No response received"
      }]);
    } catch (error) {
      throw error;
    }
  };
  const sendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || !user) return;
    
    const userMessage = input.trim();
    const filesToSend = [...uploadedFiles];
    
    setInput("");
    setUploadedFiles([]);
    
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage || "(Sent files)",
      files: filesToSend.map(f => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type
      }))
    }]);
    
    setIsLoading(true);
    try {
      await streamChat(userMessage, filesToSend);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return <div className="min-h-screen bg-background">
    <div className="container mx-auto max-w-4xl h-screen flex flex-col py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-2xl font-bold">Financial Coach</h1>
            <p className="text-sm text-muted-foreground">
              Your personal guide to financial success
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => navigate("/rapid-test")}>
            🎯 Rapid Test: Your Learning
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-center">
            <GraduationCap className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Welcome to Your Financial Coach!
            </h3>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about personal finance, investing, budgeting, or money management.
              I'm here to help you learn and grow!
            </p>
          </div>}

          <div className="space-y-6">
            {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-green-900" />
              </div>}
              <div className={`rounded-lg p-4 max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center gap-2 text-xs opacity-80">
                        <FileText className="w-3 h-3" />
                        <span>{file.name}</span>
                        <span>({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "user" && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>}
            </div>)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <FileText className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 hover:bg-background rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 text-stone-50">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input 
              className="text-white placeholder:text-gray-300" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Ask me anything about finance..." 
              disabled={isLoading} 
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>;
};
export default AICoach;