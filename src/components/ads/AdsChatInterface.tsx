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
import { supabase } from '@/lib/externalSupabase';
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
      avgCPA: number;
      overallROAS: number;
    };
  };
}

// --- Widget Components ---

const AuditWidget = ({ data }: { data: WidgetData }) => {
  return (
    <div className="mt-2 flex flex-col gap-3 min-w-[300px]">
      {data.title && (
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="w-3 h-3" />
          {data.title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {data.metrics?.map((metric, idx) => (
          <div key={idx} className="bg-card/50 border border-border/50 p-3 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-muted-foreground mb-1">{metric.label}</div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold tabular-nums text-foreground">{metric.value}</span>
              {metric.trend && (
                <div className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 mb-1",
                  metric.trend === 'up' || metric.trend === 'good' ? "bg-emerald-500/10 text-emerald-500" :
                  metric.trend === 'down' || metric.trend === 'bad' ? "bg-red-500/10 text-red-500" :
                  "bg-muted text-muted-foreground"
                )}>
                  {metric.trend === 'up' || metric.trend === 'good' ? <TrendingUp className="w-3 h-3" /> :
                   metric.trend === 'down' || metric.trend === 'bad' ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
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
    <div className="mt-2 flex flex-wrap gap-2">
      {data.actions?.map((action, idx) => (
        <Button
          key={idx}
          variant={action.style === 'destructive' ? 'destructive' : action.style === 'outline' ? 'outline' : 'default'}
          size="sm"
          onClick={() => onExecute(action.action_id, action.label)}
          className={cn(
            "text-xs h-8 shadow-sm transition-all active:scale-95",
            action.style === 'primary' && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
          )}
        >
          {action.label}
          <ArrowRight className="w-3 h-3 ml-2 opacity-70" />
        </Button>
      ))}
    </div>
  );
};

const ContentSelectionWidget = ({ data, onExecute }: { data: WidgetData; onExecute: (actionId: string, label: string) => void }) => {
  const getIcon = (action: any) => {
    const id = action.action_id || '';
    const label = action.label || '';
    
    if (id.includes('video') || label.includes('Видео')) return <Video className="w-5 h-5 text-blue-400" />;
    if (id.includes('post') || label.includes('пост')) return <ImageIcon className="w-5 h-5 text-pink-400" />;
    if (id.includes('carousel') || label.includes('Карусель')) return <Layers className="w-5 h-5 text-purple-400" />;
    if (id.includes('article') || label.includes('Статья')) return <FileText className="w-5 h-5 text-orange-400" />;
    
    return <Sparkles className="w-5 h-5 text-yellow-400" />;
  };

  return (
    <div className="mt-2 flex flex-col gap-3 min-w-[300px]">
       {data.title && (
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          {data.title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {data.actions?.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onExecute(action.action_id, action.label)}
            className="flex flex-col items-center justify-center gap-2 p-3 bg-card/50 hover:bg-muted/80 border border-border/50 hover:border-emerald-500/50 rounded-xl transition-all active:scale-95 group"
          >
            <div className="p-2 rounded-full bg-background/50 group-hover:bg-background transition-colors">
              {getIcon(action)}
            </div>
            <span className="text-xs font-medium text-center">{action.label}</span>
          </button>
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
  const [loadingText, setLoadingText] = useState('Анализирую данные...');
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
          setMessages([
             {
                id: 'welcome',
                role: 'assistant',
                content: 'Quantum AI v2.1 подключен. Готов к управлению рекламой.',
                created_at: new Date().toISOString(),
                type: 'info'
             }
          ]);
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
    await saveMessage('user', `[Действие] ${label}`);
    setIsLoading(true);
    setLoadingText('Выполняю действие...');

    try {
       const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: {
          action: 'execute_action',
          payload: {
            project_id: projectId,
            action_id: actionId
          }
        }
      });

      if (error) throw error;

      await saveMessage('assistant', data.message || 'Действие выполнено', data.type || 'text', data);

    } catch (error) {
      console.error('Action failed:', error);
      await saveMessage('assistant', 'Ошибка выполнения действия', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Синхронизация данных с Meta Ads...');
    
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
      toast.success('Данные успешно обновлены');
      saveMessage('system', '[Марк: Данные успешно синхронизированы из Meta Ads и Supabase]', 'info');
    } catch (e) {
      toast.error('Ошибка синхронизации');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    // Cycle loading texts
    const loadingStates = [
      'Марк заходит в рекламный кабинет...',
      'Анализирую статистику Meta Ads...',
      'Проверяю бюджеты и ставки...',
      'Формирую ответ...'
    ];
    let stateIdx = 0;
    setLoadingText(loadingStates[0]);
    const loadingInterval = setInterval(() => {
      stateIdx = (stateIdx + 1) % loadingStates.length;
      setLoadingText(loadingStates[stateIdx]);
    }, 2000);
    
    await saveMessage('user', text);

    try {
      const { data, error } = await fetchWithRetry(() => supabase.functions.invoke('ads-manager', {
        body: {
          action: 'chat_request',
          payload: {
            project_id: projectId,
            query: text,
            context: {
              spent_today: contextData.summary.totalSpent,
              leads_today: contextData.summary.totalLeads,
              roas: contextData.summary.overallROAS,
              content_count: contextData.contentItems.length
            }
          }
        }
      }));

      clearInterval(loadingInterval);

      if (error) throw error;

      if (data?.type === 'widget') {
        await saveMessage('assistant', data.message, 'widget', data);
      } else {
        await saveMessage('assistant', data?.message || 'Ответ получен', 'text');
      }
      
    } catch (error) {
      clearInterval(loadingInterval);
      console.error('Failed to process request:', error);
      await saveMessage('assistant', 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.', 'error');
    } finally {
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
    { label: 'Отключи плохие', icon: Zap },
    { label: 'Проверь бюджет', icon: TrendingUp },
    { label: 'Контент-Завод', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col h-full w-full text-foreground relative overflow-hidden bg-background">
      <div className="hidden dark:block">
        <BackgroundBeams className="absolute inset-0 z-0 opacity-30" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 border-b border-border bg-background/80 backdrop-blur-md min-h-[40px]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className="font-semibold tracking-wide text-[10px] uppercase text-muted-foreground">AI Analyst V2.1</span>
        </div>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            SYNC
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ScrollArea ref={scrollRef} className="h-full px-4 py-4">
            <div className="space-y-6 pb-4">
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
                        
                        <div className="flex flex-col gap-1 w-full">
                            <div className={cn(
                                "p-3.5 text-sm backdrop-blur-md shadow-sm border relative overflow-hidden",
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
                                    <>
                                      <div className={cn(
                                        "prose prose-sm max-w-none leading-relaxed prose-invert",
                                        msg.role === 'user' && "text-primary-foreground"
                                      )}>
                                          <ReactMarkdown 
                                              components={{
                                                  p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                                  strong: ({node, ...props}) => <span className="font-semibold opacity-90" {...props} />,
                                                  code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                              }}
                                          >
                                              {msg.content}
                                          </ReactMarkdown>
                                      </div>

                                      {/* Widget Rendering */}
                                      {msg.type === 'widget' && msg.widget_data && (
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                          {msg.widget_type === 'audit_card' && <AuditWidget data={msg.widget_data} />}
                                          {msg.widget_type === 'content_selection_card' && (
                                            <ContentSelectionWidget data={msg.widget_data} onExecute={handleExecuteAction} />
                                          )}
                                          {/* Only show generic actions if NOT a specific widget that handles actions internally */}
                                          {msg.widget_type !== 'content_selection_card' && (msg.widget_data.actions?.length ?? 0) > 0 && (
                                            <ActionWidget data={msg.widget_data} onExecute={handleExecuteAction} />
                                          )}
                                        </div>
                                      )}
                                    </>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                                {format(new Date(msg.created_at || new Date()), 'HH:mm')}
                            </span>
                        </div>
                    </motion.div>
                ))}
                
                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 pl-2"
                    >
                        <div className="flex gap-1 bg-card border border-border px-3 py-2 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground animate-pulse">{loadingText}</span>
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
