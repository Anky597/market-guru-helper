import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChatMessage } from "@/components/ChatMessage";
import { Message, sendChatMessage, uploadAndAnalyzeImage } from "@/utils/chatbotService";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Send, Image, Bot, RefreshCw } from "lucide-react";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Welcome to the Financial Assistant! I can help you with stock quotes, financial news, sentiment analysis, and chart interpretation. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await sendChatMessage(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Uploaded an image: ${file.name}`,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const analysis = await uploadAndAnalyzeImage(file);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: analysis,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to analyze the image. Please try again.");
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: "Welcome to the Financial Assistant! I can help you with stock quotes, financial news, sentiment analysis, and chart interpretation. How can I assist you today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto overflow-hidden rounded-xl shadow-lg border-0 glass-panel">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-blue-600/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium">Financial Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by RAG + LLM</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="glass-button" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
        
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 chat-container">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <Bot className="text-blue-500 w-4 h-4" />
              </div>
              <motion.div 
                className="bot-message"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
              </motion.div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t bg-gradient-to-r from-blue-500/5 to-blue-600/5">
          <div className="flex space-x-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="glass-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </Button>
            <Input
              placeholder="Ask about stocks, market news, or upload a chart..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="glass-panel"
            />
            <Button
              type="submit"
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Try: "What's the price of AAPL?" • "Show me news about Tesla" • "Sentiment analysis of Amazon stock"
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
