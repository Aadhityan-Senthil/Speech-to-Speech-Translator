import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Volume2, User, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  transcript?: string;
  audio_url?: string;
  is_user: boolean;
  latency_ms?: number;
  created_at: string;
}

interface ConversationPanelProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ConversationPanel = ({ messages, isLoading }: ConversationPanelProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5" />
          <span>Conversation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation by recording your voice
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg space-y-2 ${
                    message.is_user
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {message.is_user ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  
                  <div className="text-sm">{message.content}</div>
                  
                  {message.transcript && (
                    <div className="text-xs opacity-70 italic">
                      "{message.transcript}"
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {message.audio_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudio(message.audio_url!)}
                        className="h-6 px-2"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Button>
                    )}
                    
                    {message.latency_ms && (
                      <Badge variant="outline" className="text-xs">
                        {message.latency_ms}ms
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="animate-pulse text-sm">AI is thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};