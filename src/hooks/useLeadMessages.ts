import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { useAuth } from './useAuth';

export interface LeadMessage {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string | null;
  message: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

export const useLeadMessages = (leadId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!leadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead_messages_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_messages',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as LeadMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lead_messages',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const sendMessage = useCallback(
    async (
      message: string,
      fileData?: { url: string; name: string; type: string; path?: string } | null
    ) => {
      if (!leadId || !user || (!message.trim() && !fileData)) return false;

      setSending(true);
      try {
        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        // Store the file path (not the signed URL) so we can regenerate signed URLs later
        const { error } = await supabase.from('lead_messages').insert({
          lead_id: leadId,
          user_id: user.id,
          user_name: profile?.name || user.email?.split('@')[0] || 'Пользователь',
          message: message.trim(),
          file_url: fileData?.path || null, // Store path, not signed URL
          file_name: fileData?.name || null,
          file_type: fileData?.type || null,
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      } finally {
        setSending(false);
      }
    },
    [leadId, user]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('lead_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, []);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
};
