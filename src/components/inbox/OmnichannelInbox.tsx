import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Search,
  Instagram,
  PhoneCall,
  Paperclip,
  MoreVertical,
  Circle,
  CheckCheck,
  Brain,
  Users,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  thread_id: string;
  lead_id: string | null;
  channel: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
}

interface ChatThread {
  id: string;
  project_id: string;
  lead_id: string | null;
  channel: 'whatsapp' | 'instagram' | 'tiktok' | 'chat';
  last_message_at: string;
  unread_count: number;
  lead?: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    status: string | null;
  };
  last_message?: ChatMessage;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
}

interface OmnichannelInboxProps {
  projectId: string | null;
}

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppIcon className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <TikTokIcon className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
};

const channelColors: Record<string, string> = {
  whatsapp: 'bg-green-500',
  instagram: 'bg-pink-500',
  tiktok: 'bg-black text-white',
  chat: 'bg-blue-500',
};

export const OmnichannelInbox = ({ projectId }: OmnichannelInboxProps) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [chatSummary, setChatSummary] = useState('');

  // Fetch threads from lead_messages (grouped by lead_id; channel = 'chat')
  const fetchThreads = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data: leadsData, error: leadsErr } = await supabase
        .from('leads')
        .select('id, name, phone, email, status')
        .eq('project_id', projectId);

      if (leadsErr) throw leadsErr;
      const leadIds = (leadsData || []).map((l: { id: string }) => l.id);
      const leadsMap = new Map((leadsData || []).map((l: any) => [l.id, l]));

      if (leadIds.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      const { data: messagesData, error } = await supabase
        .from('lead_messages')
        .select('id, lead_id, user_id, user_name, message, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const threadsMap = new Map<string, ChatThread>();
      (messagesData || []).forEach((msg: any) => {
        const lid = msg.lead_id || 'no-lead';
        const threadKey = `${lid}_chat`;
        const lead = leadsMap.get(msg.lead_id);

        if (!threadsMap.has(threadKey)) {
          threadsMap.set(threadKey, {
            id: threadKey,
            project_id: projectId,
            lead_id: msg.lead_id,
            channel: 'chat',
            last_message_at: msg.created_at,
            unread_count: 0,
            lead: lead ? { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, status: lead.status } : undefined,
            last_message: {
              id: msg.id,
              thread_id: threadKey,
              lead_id: msg.lead_id,
              channel: 'chat',
              direction: 'outbound',
              content: msg.message,
              status: 'delivered',
              sent_at: msg.created_at,
              read_at: null,
              created_at: msg.created_at,
            },
          });
        } else {
          const thread = threadsMap.get(threadKey)!;
          if (new Date(msg.created_at) > new Date(thread.last_message_at)) {
            thread.last_message_at = msg.created_at;
            thread.last_message = {
              id: msg.id,
              thread_id: threadKey,
              lead_id: msg.lead_id,
              channel: 'chat',
              direction: 'outbound',
              content: msg.message,
              status: 'delivered',
              sent_at: msg.created_at,
              read_at: null,
              created_at: msg.created_at,
            };
          }
        }
      });

      const threadsArray = Array.from(threadsMap.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setThreads(threadsArray);
      if (threadsArray.length > 0 && !selectedThread) {
        setSelectedThread(threadsArray[0]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Ошибка загрузки диалогов');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedThread]);

  // Fetch messages for selected thread (from lead_messages)
  const fetchMessages = useCallback(async (thread: ChatThread) => {
    if (!projectId || !thread || !thread.lead_id) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('lead_messages')
        .select('id, lead_id, user_id, user_name, message, created_at')
        .eq('lead_id', thread.lead_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: ChatMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        thread_id: thread.id,
        lead_id: m.lead_id,
        channel: thread.channel,
        direction: 'outbound',
        content: m.message,
        status: 'delivered',
        sent_at: m.created_at,
        read_at: null,
        created_at: m.created_at,
      }));
      setMessages(mapped);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Ошибка загрузки сообщений');
    } finally {
      setLoadingMessages(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Realtime subscription for new messages (lead_messages has no project_id; refetch on any insert)
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('lead-messages-inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_messages',
        },
        () => {
          fetchThreads();
          if (selectedThread) {
            fetchMessages(selectedThread);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, selectedThread, fetchThreads, fetchMessages]);

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !projectId || !selectedThread.lead_id || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('lead_messages')
        .insert({
          lead_id: selectedThread.lead_id,
          user_id: user.id,
          user_name: profile?.name || user.email?.split('@')[0] || 'Пользователь',
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedThread);
      fetchThreads();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка отправки сообщения');
    }
  };

  // AI Summary handler
  const handleSummarizeChat = async () => {
    if (!selectedThread || messages.length === 0) return;

    setIsSummaryOpen(true);
    // Заглушка для ИИ-пересказа (позже свяжем с ИИ)
    const summary = `📋 Саммари диалога:\n\n` +
      `Канал: ${selectedThread.channel}\n` +
      `Сообщений: ${messages.length}\n` +
      `Последнее сообщение: ${new Date(selectedThread.last_message_at).toLocaleString('ru-RU')}\n\n` +
      `Краткое содержание:\n` +
      `Диалог содержит ${messages.length} сообщений. ` +
      `Последнее сообщение: "${messages[messages.length - 1]?.content.substring(0, 100)}..."`;

    setChatSummary(summary);
  };

  const filteredThreads = useMemo(() => {
    if (!searchQuery) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(thread =>
      thread.lead?.name?.toLowerCase().includes(query) ||
      thread.lead?.phone?.includes(query) ||
      thread.lead?.email?.toLowerCase().includes(query) ||
      thread.last_message?.content?.toLowerCase().includes(query)
    );
  }, [threads, searchQuery]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-interstellar">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] opacity-60">Выберите проект для просмотра сообщений</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            Omnichannel Inbox
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1 pl-11">Единый центр коммуникаций</p>
        </div>
        <div className="flex gap-2">
          {/* Только WhatsApp, Instagram, TikTok */}
          {(['whatsapp', 'instagram', 'tiktok'] as const).map((channel) => (
            <Button
              key={channel}
              variant="outline"
              size="icon"
              className="relative bg-[#020617]/40 backdrop-blur-3xl border border-white/10 hover:bg-white/5 transition-all w-12 h-12 rounded-2xl"
            >
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${channelColors[channel]}`} />
              {channelIcons[channel]}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Interface - Glassmorphism */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-interstellar">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Поиск диалогов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white/5 border-white/10 h-12 rounded-2xl font-bold text-sm focus:ring-blue-500/20"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Загрузка...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Нет диалогов</div>
              ) : (
                <AnimatePresence>
                  {filteredThreads.map((thread) => (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => setSelectedThread(thread)}
                      className={cn(
                        "flex items-center gap-4 p-5 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-all relative overflow-hidden group/item",
                        selectedThread?.id === thread.id && 'bg-white/10'
                      )}
                    >
                      {selectedThread?.id === thread.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />}
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {thread.lead?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white",
                          channelColors[thread.channel] || 'bg-muted'
                        )}>
                          {channelIcons[thread.channel]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate text-sm">{thread.lead?.name || 'Без имени'}</p>
                          {thread.last_message && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(thread.last_message_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {thread.last_message?.content || 'Нет сообщений'}
                          </p>
                          {thread.unread_count > 0 && (
                            <Badge className="ml-2 bg-primary text-xs">{thread.unread_count}</Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window + Quick Info */}
        <div className="lg:col-span-3 flex gap-6">
          {/* Chat Window */}
          <Card className="flex-1 flex flex-col bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-interstellar">
            {selectedThread ? (
              <>
                {/* AI Summarize Button */}
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSummarizeChat}
                    className="w-full bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-2xl py-6 h-auto font-black uppercase tracking-widest text-[10px] shadow-sm"
                  >
                    <Brain className="w-5 h-5 mr-3" />
                    🤖 Проанализировать и пересказать чат
                  </Button>
                </div>

                {/* Chat Header */}
                <CardHeader className="border-b border-white/5 py-6 px-8 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border border-white/10 shadow-sm">
                          <AvatarFallback className="bg-blue-500/10 text-blue-400 font-black">
                            {selectedThread.lead?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020617] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">{selectedThread.lead?.name || 'Без имени'}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                          Онлайн • {selectedThread.channel}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/10 w-11 h-11 rounded-xl shadow-sm">
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/10 w-11 h-11 rounded-xl shadow-sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-[380px] pr-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Загрузка...</div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Начните диалог с клиентом
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {messages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={cn(
                                "max-w-[75%] rounded-2xl px-5 py-3 shadow-sm",
                                msg.direction === 'outbound'
                                  ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                                  : 'bg-white/5 rounded-bl-none border border-white/10 text-foreground'
                              )}>
                                <p className="text-sm">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                  }`}>
                                  <span className="text-xs opacity-70">
                                    {new Date(msg.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {msg.direction === 'outbound' && (
                                    <CheckCheck className={`w-3 h-3 ${msg.read_at ? 'text-blue-400' : 'opacity-70'}`} />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-6 border-t border-white/5 bg-white/5">
                  <div className="flex gap-3 bg-black/20 p-2 rounded-2xl border border-white/10 shadow-inner">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 w-11 h-11 rounded-xl text-muted-foreground">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm font-bold h-11"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-11 h-11 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                Выберите диалог для просмотра
              </CardContent>
            )}
          </Card>

          {/* Quick Info - справа от чата */}
          {selectedThread && selectedThread.lead && (
            <Card className="w-80 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-interstellar">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Информация о лиде
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Имя</p>
                  <p className="font-semibold text-sm">{selectedThread.lead.name || 'Без имени'}</p>
                </div>
                {selectedThread.lead.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Телефон</p>
                    <p className="text-sm">{selectedThread.lead.phone}</p>
                  </div>
                )}
                {selectedThread.lead.email && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{selectedThread.lead.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Статус в CRM</p>
                  <Badge className="bg-primary/20 text-primary border-0 text-xs">
                    {selectedThread.lead.status || 'Новая'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Канал</p>
                  <Badge className={cn(
                    "text-xs border-0",
                    selectedThread.channel === 'whatsapp' && 'bg-green-500/20 text-green-600',
                    selectedThread.channel === 'instagram' && 'bg-pink-500/20 text-pink-600',
                    selectedThread.channel === 'tiktok' && 'bg-black/20 text-black'
                  )}>
                    {selectedThread.channel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-xl bg-[#020617] border border-white/10 shadow-interstellar rounded-[32px] overflow-hidden p-0">
          <DialogHeader className="p-8 pb-4 border-b border-white/5 bg-white/5">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-foreground">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Brain className="w-6 h-6" />
              </div>
              ИИ-Пересказ чата
            </DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 shadow-inner font-mono text-cyan-400 text-sm leading-relaxed backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-black tracking-widest opacity-50 uppercase">Analysis Kernel V2.5</span>
                </div>
              </div>
              <div className="whitespace-pre-wrap font-sans text-cyan-400/90">
                {chatSummary || 'Генерация саммари ядрами MarkVision AI...'}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
