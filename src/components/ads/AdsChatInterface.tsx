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
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Video,
  Layers,
  FileText,
  Mic,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ContentItem } from '@/hooks/useContentFactory';

interface DailyData {
  date: string;
  spend: number;
  leads: number;
  revenue: number;
}

interface WidgetData {
  title?: string;
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral' | 'good' | 'bad';
    subtext?: string;
  }[];
  actions?: {
    label: string;
    action_id: string;
    style?: 'primary' | 'destructive' | 'outline';
  }[];
  details?: string;
}

interface Message {
  id: string;
  project_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  type?: 'text' | 'success' | 'error' | 'info' | 'widget';
  widget_type?: 'audit_card' | 'confirmation_card' | 'action_card' | 'content_selection_card';
  widget_data?: WidgetData;
  metadata?: any;
}

interface AdsChatInterfaceProps {
  projectId: string | null;
  contextData: {
    campaigns: any[];
    leads: any[];
    contentItems: ContentItem[];
    dailyData: Record<string, any>;
    summary: {
      totalSpent: number;
      totalLeads: number;
      avgCpl: number;
      romi: number;
    };
  };
}

// --- Widget Components ---

const AuditWidget = ({ data }: { data: WidgetData }) => {
  return (
    <div className="mt-4 flex flex-col gap-4 min-w-[320px]">
      {data.title && (
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Activity className="w-3 h-3 text-primary" />
          {data.title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {data.metrics?.map((metric, idx) => (
          <div key={idx} className="bg-muted/50 border border-white/50 p-4 rounded-[1.5rem] group hover:border-primary/30 transition-all duration-300">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-foreground">{metric.label}</div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold tabular-nums text-foreground tracking-tighter">{metric.value}</span>
              {metric.trend && (
                <div className={cn(
                  "text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full flex items-center gap-1 mb-1 transition-all",
                  metric.trend === 'up' || metric.trend === 'good' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                    metric.trend === 'down' || metric.trend === 'bad' ? "bg-red-50 text-red-600 border border-red-100" :
                      "bg-muted text-muted-foreground border border-white/50"
                )}>
                  {metric.trend === 'up' || metric.trend === 'good' ? <TrendingUp className="w-2.5 h-2.5" /> :
                    metric.trend === 'down' || metric.trend === 'bad' ? <TrendingDown className="w-2.5 h-2.5" /> :
                      <Minus className="w-2.5 h-2.5" />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActionWidget = ({ data, onExecute }: { data: WidgetData; onExecute: (actionId: string, label: string) => void }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {data.actions?.map((action, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onExecute(action.action_id, action.label)}
          className={cn(
            "h-10 px-6 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 group shadow-sm",
            action.style === 'destructive' ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100" :
              action.style === 'primary' ? "bg-primary border-primary/20 text-primary-foreground hover:bg-primary/90 shadow-md" :
                "border-white/50 bg-slate-50 text-foreground hover:bg-muted"
          )}
        >
          {action.label}
          <ArrowRight className="w-3.5 h-3.5 ml-3 transition-transform group-hover:translate-x-1" />
        </Button>
      ))}
    </div>
  );
};

const ContentSelectionWidget = ({ data, onExecute }: { data: WidgetData; onExecute: (actionId: string, label: string) => void }) => {
  const getIcon = (action: any) => {
    const id = action.action_id || '';
    const label = action.label || '';

    if (id.includes('video') || label.includes('Видео')) return <Video className="w-6 h-6 text-blue-500" />;
    if (id.includes('post') || label.includes('пост')) return <ImageIcon className="w-6 h-6 text-pink-500" />;
    if (id.includes('carousel') || label.includes('Карусель')) return <Layers className="w-6 h-6 text-purple-500" />;
    if (id.includes('article') || label.includes('Статья')) return <FileText className="w-6 h-6 text-orange-500" />;

    return <Sparkles className="w-6 h-6 text-yellow-500" />;
  };

  return (
    <div className="mt-4 flex flex-col gap-4 min-w-[320px]">
      {data.title && (
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-yellow-500" />
          {data.title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {data.actions?.map((action, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onExecute(action.action_id, action.label)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-muted hover:bg-muted/80 border border-white/50 hover:border-primary/40 rounded-[2rem] transition-all duration-300 group shadow-sm"
          >
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 group-hover:border-primary/20 transition-colors">
              {getIcon(action)}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground text-center">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

export const AdsChatInterface = ({ projectId, contextData }: AdsChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('ИИ-Аналитик: Активен...');
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
        setMessages([]);
      }
    };

    fetchMessages();

    const channel = (supabase as any)
      .channel('ai_chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_chat_messages',
        filter: `project_id=eq.${projectId}`
      }, (payload: any) => {
        setMessages(prev => {
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

  const saveMessage = async (role: 'user' | 'assistant' | 'system', content: string, type: Message['type'] = 'text', widgetData?: any) => {
    if (!projectId) return;

    const newMessage = {
      project_id: projectId,
      role,
      content,
      type,
      widget_type: widgetData?.widget_type,
      widget_data: widgetData?.data,
      created_at: new Date().toISOString()
    };

    const tempId = Date.now().toString();
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

  const handleExecuteAction = async (actionId: string, label: string) => {
    if (!projectId) {
      toast.error('Connect Project First');
      return;
    }
    await saveMessage('user', `[COMMAND] Выполнено: ${label}`);
    setIsLoading(true);
    setLoadingText('Обработка команды...');

    try {
      const { data: task, error } = await (supabase as any)
        .from('ai_bridge_tasks')
        .insert({
          project_id: projectId,
          prompt: `[ACTION] ${actionId} ${label}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        toast.error('Превышено время ожидания');
        saveMessage('system', 'Ошибка: Превышено время ожидания ответа от ИИ.', 'error');
        supabase.removeChannel(channel);
      }, 30000);

      const channel = supabase.channel(`ai_bridge_action_${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ai_bridge_tasks',
            filter: `id=eq.${task.id}`,
          },
          (payload: any) => {
            const newTask = payload.new;

            if (newTask.status === 'completed' || newTask.status === 'failed') {
              clearTimeout(timeoutId);
              setIsLoading(false);
              supabase.removeChannel(channel);

              if (newTask.status === 'failed') {
                saveMessage('assistant', 'Ошибка системы: Не удалось выполнить задачу.', 'error');
              }
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Action failed:', error);
      await saveMessage('assistant', 'Ошибка инициализации системы', 'error');
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Синхронизация данных...');

    try {
      if (projectId) {
        await (supabase as any).from('ai_commands').insert({
          project_id: projectId,
          command: 'sync_data',
          status: 'pending',
          payload: { source: 'all' }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Данные обновлены');
      saveMessage('system', '[СИСТЕМА: Данные синхронизированы]', 'info');
    } catch (e) {
      toast.error('Ошибка связи');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!projectId) {
      toast.error('Project Link Required');
      return;
    }

    const text = inputValue;
    setInputValue('');
    setIsLoading(true);
    setLoadingText('ИИ-Ассистент: Обработка...');

    await saveMessage('user', text);

    try {
      const { data: task, error } = await (supabase as any)
        .from('ai_bridge_tasks')
        .insert({
          project_id: projectId,
          prompt: text,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        toast.error('ИИ-ядро отключено');
        saveMessage('system', 'Ошибка связи с ИИ. Проверьте активность модуля MarkVision.', 'error');
        supabase.removeChannel(channel);
      }, 30000);

      const channel = supabase.channel(`ai_bridge_ads_${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ai_bridge_tasks',
            filter: `id=eq.${task.id}`,
          },
          (payload: any) => {
            const newTask = payload.new;

            if (newTask.status === 'completed' || newTask.status === 'failed') {
              clearTimeout(timeoutId);
              setIsLoading(false);
              supabase.removeChannel(channel);

              if (newTask.status === 'failed') {
                saveMessage('assistant', 'Protocol Deviation: Engine encountered an internal exception.', 'error');
              }
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Failed to process request:', error);
      setIsLoading(false);
      await saveMessage('assistant', 'Link protocol error', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickCommands = [
    { label: 'Полный аудит системы', icon: Activity },
    { label: 'Оптимизировать ROI', icon: Zap },
    { label: 'Проверить бюджеты', icon: TrendingUp },
    { label: 'Открыть хаб контента', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col h-full w-full text-foreground relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <BackgroundBeams className="opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background pointer-events-none" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/50 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 shadow-sm min-h-[64px]">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-[11px] uppercase text-foreground">ИИ-АССТЕНТ</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Версия системы 4.0.98</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-10 px-6 rounded-2xl border-white/50 bg-slate-50 text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all"
        >
          <RefreshCw className={cn("w-4 h-4 mr-3", isSyncing && "animate-spin")} />
          СИНХРОНИЗАЦИЯ
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea ref={scrollRef} className="h-full px-6 py-8">
          <div className="space-y-10 pb-8 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-center gap-4 opacity-50">
                <div className="w-16 h-16 rounded-[2rem] border border-white/50 flex items-center justify-center bg-muted">
                  <Sparkles className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Ожидание подключения к ИИ...</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex gap-6",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 border shadow-md transition-transform hover:scale-110",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/10"
                    : msg.role === 'system'
                      ? "bg-muted border border-white/50 text-muted-foreground"
                      : "bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-foreground"
                )}>
                  {msg.role === 'user' ? <User className="w-6 h-6" /> : msg.role === 'system' ? <Terminal className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                </div>

                <div className={cn(
                  "flex flex-col gap-2 w-full",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-6 text-sm shadow-sm border relative overflow-hidden transition-all",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground border-primary/10 rounded-[2rem] rounded-tr-none max-w-[80%]"
                      : msg.role === 'system'
                        ? "bg-muted/50 border border-white/50 rounded-[1.5rem] rounded-tl-none text-muted-foreground font-mono text-[10px] uppercase tracking-widest p-4"
                        : "bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-[2.5rem] rounded-tl-none text-foreground max-w-[90%]"
                  )}>
                    {msg.role === 'system' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        {msg.content}
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "prose prose-slate dark:prose-invert max-w-none leading-relaxed prose-p:my-0 prose-headings:text-foreground prose-strong:text-foreground prose-strong:font-bold",
                          "prose-pre:bg-muted prose-pre:border prose-pre:border-white/50 prose-pre:rounded-2xl",
                          msg.role === 'user' ? "text-primary-foreground font-medium" : "text-foreground"
                        )}>
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Widget Rendering */}
                        {msg.type === 'widget' && msg.widget_data && (
                          <div className="mt-8 pt-6 border-t border-white/50 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              Инструмент ИИ
                            </div>
                            {msg.widget_type === 'audit_card' && <AuditWidget data={msg.widget_data} />}
                            {msg.widget_type === 'content_selection_card' && (
                              <ContentSelectionWidget data={msg.widget_data} onExecute={handleExecuteAction} />
                            )}
                            {msg.widget_type !== 'content_selection_card' && (msg.widget_data.actions?.length ?? 0) > 0 && (
                              <ActionWidget data={msg.widget_data} onExecute={handleExecuteAction} />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                    {format(new Date(msg.created_at || new Date()), 'HH:mm')} Время системы
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6"
              >
                <div className="w-12 h-12 rounded-[1.2rem] border border-primary/40 bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 px-6 py-4 rounded-[2rem] rounded-tl-none">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse pl-2">{loadingText}</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-8 pt-4 bg-background/80 border-t border-white/50 backdrop-blur-xl">
        {/* Quick Commands */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide px-2">
          {quickCommands.map((cmd, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInputValue(cmd.label)}
              className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:bg-muted hover:border-primary/40 transition-all text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              <cmd.icon className="w-4 h-4 text-primary/60" />
              {cmd.label}
            </motion.button>
          ))}
        </div>

        <div className="relative flex items-center max-w-5xl mx-auto w-full">
          <div className="absolute left-4 p-2 rounded-xl bg-muted border border-white/50 z-10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ваш вопрос или команду..."
            className="bg-muted border-white/50 focus-visible:ring-primary/20 focus-visible:border-primary/40 text-foreground placeholder:text-muted-foreground pl-16 pr-16 h-16 rounded-[2rem] transition-all hover:bg-muted/80 font-medium text-base shadow-inner"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="absolute right-2 top-2 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl transition-all shadow-md group"
          >
            <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Button>
        </div>

        <div className="mt-6 flex justify-between items-center max-w-5xl mx-auto w-full px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">ИИ-Ядро: Оптимизировано</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Протокол: РЕКЛАМА-RT</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
            <div className="w-1 h-1 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-blue-600">Связь: Активна</span>
          </div>
        </div>
      </div>
    </div>
  );
};
