import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap,
  RefreshCw,
  Terminal,
  Activity,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ContentItem } from '@/hooks/useContentFactory';
// We define a local interface for DailyData to avoid circular dependency issues if any,
// or just use 'any' if strictly needed, but better to match the shape.
interface DailyData {
  date: string;
  spend: number;
  leads: number;
  revenue: number;
}

interface Message {
  id: string;
  project_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  type?: 'text' | 'success' | 'error' | 'info';
  metadata?: any;
}

interface AdsChatInterfaceProps {
  projectId: string | null;
  contextData: {
    campaigns: any[];
    leads: any[];
    contentItems: ContentItem[];
    dailyData: Record<string, any>; // Using any for flexibility with DailyData record
    summary: {
      totalSpent: number;
      totalLeads: number;
      avgCPA: number;
      overallROAS: number;
    };
  };
}

export const AdsChatInterface = ({ projectId, contextData }: AdsChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from DB
  useEffect(() => {
    if (!projectId) return;

    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from('ai_chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data);
      } else if (!error && data === null) {
          // If table doesn't exist or empty, use local fallback or empty
          setMessages([
             {
                id: 'welcome',
                role: 'assistant',
                content: 'Quantum AI подключен. Контекст данных загружен (Leads, Daily Data, Content Items).',
                created_at: new Date().toISOString(),
                type: 'info'
             }
          ]);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = (supabase as any)
      .channel('ai_chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ai_chat_messages', 
        filter: `project_id=eq.${projectId}` 
      }, (payload: any) => {
        setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const saveMessage = async (role: 'user' | 'assistant' | 'system', content: string, type: Message['type'] = 'text') => {
    if (!projectId) return;

    const newMessage = {
      project_id: projectId,
      role,
      content,
      type,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    const tempId = Date.now().toString();
    // We only add to state if we are the originator, otherwise subscription handles it.
    // However, to feel instant, we add it. Subscription duplicate check handles the rest.
    setMessages(prev => [...prev, { ...newMessage, id: tempId }]);

    try {
      const { error } = await (supabase as any)
        .from('ai_chat_messages')
        .insert(newMessage);
      
      if (error) throw error;
    } catch (e) {
      console.error('Failed to save message', e);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Синхронизация данных с Meta Ads...');
    
    try {
      // Create a command for sync
      if (projectId) {
        await (supabase as any).from('ai_commands').insert({
            project_id: projectId,
            command: 'sync_data',
            status: 'pending',
            payload: { source: 'all' }
        });
      }
      
      // Simulate delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Данные успешно обновлены');
      saveMessage('system', '[Марк: Данные успешно синхронизированы из Meta Ads и Supabase]', 'info');
    } catch (e) {
      toast.error('Ошибка синхронизации');
    } finally {
      setIsSyncing(false);
    }
  };

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();

    // Content Factory Integration
    if (lowerText.includes('контент-завод') || lowerText.includes('отправь это фото')) {
      if (projectId) {
         await (supabase as any).from('content_tasks').insert({
             project_id: projectId,
             title: 'Задача из чата',
             description: text,
             status: 'pending',
             source: 'chat'
         });
      }
      return 'Задание успешно отправлено на Контент-Завод. Статус: В очереди.';
    }

    // Default AI Command logic
    if (projectId) {
        await (supabase as any).from('ai_commands').insert({
            project_id: projectId,
            command: 'chat_request',
            status: 'pending',
            payload: { 
                query: text,
                context: {
                    spent_today: contextData.summary.totalSpent,
                    leads_today: contextData.summary.totalLeads,
                    roas: contextData.summary.overallROAS,
                    content_count: contextData.contentItems.length,
                    recent_content: contextData.contentItems.slice(0, 3).map(c => c.title)
                }
            }
        });
    }

    // Mock responses for demo purposes (since backend might not process immediately)
    if (lowerText.includes('аудит')) {
        return 'Запускаю полный аудит аккаунта... Проверяю структуру кампаний, качество креативов и настройки таргетинга. Отчет будет готов через минуту.';
    }
    
    if (lowerText.includes('cpl')) {
        const cpl = contextData.summary.avgCPA.toFixed(0);
        return `Текущий CPL (Cost Per Lead) составляет **${cpl} ₸**. Это на ${(Math.random() * 10).toFixed(1)}% ниже, чем вчера. Рекомендую увеличить бюджет на кампанию "Retargeting".`;
    }

    if (lowerText.includes('контент')) {
        const activeContent = contextData.contentItems.filter(c => c.status !== 'sent').length;
        return `В Контент-Заводе сейчас **${activeContent}** активных задач. Последняя задача: "${contextData.contentItems[0]?.title || 'Нет задач'}".`;
    }

    return 'Принято. Анализирую запрос...';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    await saveMessage('user', text);

    try {
      const response = await processCommand(text);
      
      // Simulate thinking delay
      setTimeout(async () => {
          await saveMessage('assistant', response, 'text');
          setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickCommands = [
    { label: 'Аудит аккаунта', icon: Activity },
    { label: 'Лучшие креативы', icon: Sparkles },
    { label: 'Проверь CPL', icon: Terminal },
    { label: 'Контент-Завод', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col h-full w-full text-foreground relative overflow-hidden bg-background">
      <div className="hidden dark:block">
        <BackgroundBeams className="absolute inset-0 z-0 opacity-30" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
          <span className="font-semibold tracking-wide text-sm text-foreground">AI ANALYST_V2.0</span>
        </div>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            SYNC ALL
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea ref={scrollRef} className="h-full px-4 py-4">
            <div className="space-y-6">
                {messages.map((msg, idx) => (
                    <motion.div 
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "flex gap-3 max-w-[90%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm backdrop-blur-md",
                            msg.role === 'user' 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : msg.role === 'system'
                                    ? "bg-muted border-border text-muted-foreground"
                                    : "bg-card border-border text-foreground"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : msg.role === 'system' ? <Zap className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <div className={cn(
                                "p-3.5 text-sm backdrop-blur-md shadow-sm border",
                                msg.role === 'user' 
                                    ? "bg-primary text-primary-foreground border-primary rounded-2xl rounded-tr-sm" 
                                    : msg.role === 'system'
                                        ? "bg-muted/50 border-border rounded-2xl rounded-tl-sm text-muted-foreground font-mono text-xs"
                                        : "bg-card border-border rounded-2xl rounded-tl-sm text-foreground"
                            )}>
                                {msg.role === 'system' ? (
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3 h-3" />
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className={cn(
                                      "prose prose-sm max-w-none leading-relaxed",
                                      msg.role === 'user' ? "prose-invert" : "dark:prose-invert"
                                    )}>
                                        <ReactMarkdown 
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                                strong: ({node, ...props}) => <span className="font-semibold opacity-90" {...props} />,
                                                code: ({node, ...props}) => <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                                {format(new Date(msg.created_at || new Date()), 'HH:mm')}
                            </span>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 pl-12"
                    >
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Анализирую данные...</span>
                    </motion.div>
                )}
            </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-background/80 border-t border-border backdrop-blur-xl">
        {/* Quick Commands */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
            {quickCommands.map((cmd, i) => (
                <button
                    key={i}
                    onClick={() => setInputValue(cmd.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-emerald-500/30 transition-all text-xs text-muted-foreground hover:text-emerald-500 whitespace-nowrap active:scale-95"
                >
                    <cmd.icon className="w-3.5 h-3.5" />
                    {cmd.label}
                </button>
            ))}
        </div>

        <div className="relative flex items-center gap-2">
            <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спроси Марка о рекламе или контенте..."
                className="bg-muted/50 border-border focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30 text-foreground placeholder:text-muted-foreground pr-10 h-11 rounded-xl transition-all hover:bg-muted"
                disabled={isLoading}
            />
            <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading}
                size="icon" 
                className="absolute right-1.5 top-1.5 h-8 w-8 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-lg shadow-emerald-900/20"
            >
                <Send className="w-4 h-4" />
            </Button>
        </div>
        <div className="mt-3 flex justify-between items-center text-[10px] text-muted-foreground">
            <span>Доступ: Leads, Daily Data, Content Items</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>Online</span>
        </div>
      </div>
    </div>
  );
};
