import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const BRIDGE_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  logs?: string[];
}

interface DataContext {
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  visits?: number;
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
  const activeChannelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(async (message: string, context?: DataContext) => {
    // 1. Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Требуется авторизация');
      return null;
    }

    // 2. Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 3. Add placeholder assistant message
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '', // Start empty
      timestamp: new Date(),
      isStreaming: true,
      logs: []
    }]);

    try {
      // 3.5 Save user message to history
      const { error: chatError } = await supabase.from('ai_chat_messages').insert({
        project_id: BRIDGE_PROJECT_ID,
        role: 'user',
        content: message,
        type: 'text'
      });

      if (chatError) {
        console.error('Failed to save chat message:', chatError);
      }

      const payload = {
        project_id: BRIDGE_PROJECT_ID,
        prompt: message,
        status: 'pending'
      };
      
      console.log('Sending to bridge:', payload);

      // 4. Insert into ai_bridge_tasks
      const { data: task, error } = await supabase
        .from('ai_bridge_tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ AI Bridge Task Created:', task.id);

      // Set 45s warning and 90s timeout
      const warningTimeout = setTimeout(() => {
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId || !m.isStreaming) return m;
          return {
            ...m,
            content: m.content || 'Марк выполняет сложный аудит, пожалуйста, подождите...',
          };
        }));
      }, 45000);

      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            content: m.content || 'Марк не отвечает. Убедитесь, что терминал на Макбуке запущен.',
            isStreaming: false
          };
        }));
        if (activeChannelRef.current) {
          supabase.removeChannel(activeChannelRef.current);
          activeChannelRef.current = null;
        }
      }, 90000);

      // 5. Subscribe to changes
      const channel = supabase.channel(`ai_bridge_${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ai_bridge_tasks',
            filter: `id=eq.${task.id}`,
          },
          (payload) => {
            const newTask = payload.new;
            // console.log('🔄 AI Bridge Update:', newTask);

            // Clear timeouts if we get a meaningful response
            if (newTask.response || (newTask.execution_logs && newTask.execution_logs.length > 0)) {
               if (warningTimeout) clearTimeout(warningTimeout);
            }

            setMessages(prev => prev.map(m => {
              if (m.id !== assistantId) return m;

              const isCompleted = newTask.status === 'completed';
              
              return {
                ...m,
                logs: newTask.execution_logs || [],
                content: newTask.response || m.content,
                isStreaming: !isCompleted
              };
            }));

            if (newTask.status === 'completed') {
              console.log('✅ AI Bridge Response Completed');
              setIsLoading(false);
              supabase.removeChannel(channel);
              activeChannelRef.current = null;
              if (warningTimeout) clearTimeout(warningTimeout);
              if (timeoutRef.current) {
                 clearTimeout(timeoutRef.current);
                 timeoutRef.current = null;
              }
            }
          }
        )
        .subscribe();

      activeChannelRef.current = channel;

    } catch (error: any) {
      console.error('❌ AI Bridge Error:', error);
      toast.error('Ошибка отправки: ' + error.message);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      setIsLoading(false);
      if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
         timeoutRef.current = null;
      }
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
      setIsLoading(false);
      if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
         timeoutRef.current = null;
      }
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    stopGeneration,
  };
};
