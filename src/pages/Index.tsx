import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioRecorder } from '@/components/AudioRecorder';
import { ConversationPanel } from '@/components/ConversationPanel';
import { ConversationHistory } from '@/components/ConversationHistory';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  transcript?: string;
  audio_url?: string;
  is_user: boolean;
  latency_ms?: number;
  created_at: string;
}

interface ModelStats {
  model_name: string;
  avg_latency: number;
  avg_quality: number;
  avg_expressivity: number;
  usage_count: number;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedModel, setSelectedModel] = useState('moshi');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchModelStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const createNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id,
          title: `${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)} Conversation`,
          model_used: selectedModel,
          language: selectedLanguage
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([]);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
      return null;
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchModelStats = async () => {
    try {
      const { data, error } = await supabase
        .from('model_performance')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Aggregate stats by model
      const statsMap = new Map<string, ModelStats>();
      
      data?.forEach(record => {
        const existing = statsMap.get(record.model_name);
        if (existing) {
          existing.avg_latency = (existing.avg_latency * existing.usage_count + record.latency_ms) / (existing.usage_count + 1);
          existing.avg_quality = (existing.avg_quality * existing.usage_count + (record.quality_score || 0)) / (existing.usage_count + 1);
          existing.avg_expressivity = (existing.avg_expressivity * existing.usage_count + (record.expressivity_score || 0)) / (existing.usage_count + 1);
          existing.usage_count += 1;
        } else {
          statsMap.set(record.model_name, {
            model_name: record.model_name,
            avg_latency: record.latency_ms,
            avg_quality: record.quality_score || 0,
            avg_expressivity: record.expressivity_score || 0,
            usage_count: 1
          });
        }
      });

      setModelStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error('Error fetching model stats:', error);
    }
  };

  const handleTranscriptionReceived = async (transcript: string, audioUrl: string, latency: number) => {
    let conversationId = currentConversationId;
    
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    try {
      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: transcript,
          transcript: transcript,
          is_user: true,
          latency_ms: latency
        })
        .select()
        .single();

      if (userError) throw userError;

      // Add AI response message
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: `AI response using ${selectedModel}`,
          audio_url: audioUrl,
          is_user: false,
          latency_ms: latency
        })
        .select()
        .single();

      if (aiError) throw aiError;

      // Record performance data
      await supabase.from('model_performance').insert({
        user_id: user?.id,
        model_name: selectedModel,
        language: selectedLanguage,
        latency_ms: latency,
        quality_score: Math.random() * 2 + 3, // Mock quality score 3-5
        expressivity_score: Math.random() * 2 + 3 // Mock expressivity score 3-5
      });

      setMessages(prev => [...prev, userMessage, aiMessage]);
      fetchModelStats(); // Refresh stats
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    fetchMessages(conversationId);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Speech AI Platform</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time speech-to-speech AI conversation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Premium Account</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="px-6">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Controls */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  ⚙️ Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">AI Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moshi">🤖 Moshi (Full-duplex)</SelectItem>
                      <SelectItem value="ultravox">🎙️ Ultravox (Speech LLM)</SelectItem>
                      <SelectItem value="spirit_lm">✨ Spirit LM (Expressive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="ta">🇮🇳 Tamil</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Conversation History */}
            <ConversationHistory
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              selectedConversationId={currentConversationId || undefined}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="conversation" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
                <TabsTrigger value="conversation" className="text-base font-medium">💬 Conversation</TabsTrigger>
                <TabsTrigger value="analytics" className="text-base font-medium">📊 Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="space-y-6">
                {/* Audio Recorder */}
                <AudioRecorder
                  selectedModel={selectedModel}
                  selectedLanguage={selectedLanguage}
                  onTranscriptionReceived={handleTranscriptionReceived}
                />

                {/* Conversation Panel */}
                <ConversationPanel
                  messages={messages}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <PerformanceDashboard stats={modelStats} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
