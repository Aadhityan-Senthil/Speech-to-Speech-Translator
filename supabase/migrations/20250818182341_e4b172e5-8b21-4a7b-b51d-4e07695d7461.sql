-- Create conversations table for history logging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  model_used TEXT NOT NULL CHECK (model_used IN ('moshi', 'ultravox', 'spirit_lm')),
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for conversation content
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  transcript TEXT,
  audio_url TEXT,
  is_user BOOLEAN NOT NULL DEFAULT true,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model_performance table for analytics
CREATE TABLE public.model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL CHECK (model_name IN ('moshi', 'ultravox', 'spirit_lm')),
  language TEXT NOT NULL DEFAULT 'en',
  latency_ms INTEGER NOT NULL,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  expressivity_score DECIMAL(3,2) CHECK (expressivity_score >= 0 AND expressivity_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Model performance policies
CREATE POLICY "Users can view their own performance data" 
ON public.model_performance FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance data" 
ON public.model_performance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add triggers for timestamps
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_model_performance_user_id ON public.model_performance(user_id);
CREATE INDEX idx_model_performance_model_name ON public.model_performance(model_name);