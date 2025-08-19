import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Plus, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Conversation {
  id: string;
  title: string;
  model_used: string;
  language: string;
  created_at: string;
  message_count?: number;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  selectedConversationId?: string;
}

export const ConversationHistory = ({ 
  onSelectConversation, 
  onNewConversation, 
  selectedConversationId 
}: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          model_used,
          language,
          created_at,
          messages(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0
      })) || [];

      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversationId === conversationId) {
        onNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatModelName = (modelName: string) => {
    switch (modelName) {
      case 'moshi': return 'Moshi';
      case 'ultravox': return 'Ultravox';
      case 'spirit_lm': return 'Spirit LM';
      default: return modelName;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>History</span>
          </CardTitle>
          <Button size="sm" onClick={onNewConversation}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group hover:bg-muted ${
                    selectedConversationId === conversation.id 
                      ? 'bg-muted ring-2 ring-primary' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{conversation.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatModelName(conversation.model_used)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {conversation.language.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(conversation.created_at)}</span>
                        <span>•</span>
                        <span>{conversation.message_count} messages</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};