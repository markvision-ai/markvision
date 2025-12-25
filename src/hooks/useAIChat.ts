import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DataContext {
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  diagnostics?: number;
  sales?: number;
  revenue?: number;
  cpl?: number;
  cac?: number;
  aov?: number;
  romi?: number;
  projectId?: string;
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string, context?: DataContext) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-analytics-chat', {
        body: { 
          message, 
          context,
          projectId: context?.projectId 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      return data.reply;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки сообщения';
      toast.error(errorMessage);
      console.error('AI Chat error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
};
