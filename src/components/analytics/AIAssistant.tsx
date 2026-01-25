import { useState, useRef, useEffect } from 'react';
import { Send, User, Trash2, Church, Loader2, Square, MessageSquare, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAssistantProps {
  context?: {
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
  };
}

const suggestedQuestions = [
  { text: 'Проанализируй мою воронку', icon: TrendingUp },
  { text: 'Как улучшить конверсию?', icon: Target },
  { text: 'Какие метрики требуют внимания?', icon: Lightbulb },
  { text: 'Дай совет по бюджету', icon: MessageSquare },
];

export const AIAssistant = ({ context }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat, stopGeneration } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message, context);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (question: string) => {
    sendMessage(question, context);
  };

  const hasContext = context && (context.spend || context.revenue || context.leads);

  return (
    <div className="group flex flex-col h-[320px] sm:h-[380px] bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 rounded-xl transition-all duration-200 overflow-hidden">
      {/* Header - Compact style */}
      <div className="relative z-10 flex-shrink-0 px-3 py-2 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Church className="w-3 h-3 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-foreground truncate">
                Святой AI аналитик
              </h3>
              {hasContext && (
                <p className="text-[9px] text-muted-foreground/70 hidden sm:block">
                  Анализирую метрики
                </p>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 flex-shrink-0 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="relative z-10 flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <Church className="w-5 h-5 text-amber-500" />
              </div>
              <h4 className="text-xs font-semibold text-foreground mb-1">
                AI-аналитика
              </h4>
              <p className="text-[10px] text-muted-foreground/70 max-w-md">
                Задайте вопрос о метриках
              </p>
            </motion.div>

            {/* Suggested Questions - Compact buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-lg">
              {suggestedQuestions.map((q, index) => {
                const Icon = q.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestion(q.text)}
                    disabled={isLoading}
                    className="group/btn bg-card/50 hover:bg-card border border-border/40 hover:border-border rounded-lg p-2 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="text-[10px] text-foreground/80 group-hover/btn:text-foreground transition-colors">
                        {q.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input Area - Compact style */}
      <div className="relative z-10 flex-shrink-0 px-3 py-2 border-t border-border/40">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос..."
            disabled={isLoading}
            className="flex-1 text-[11px] h-7 bg-background/50 border-border/40"
          />
          {isLoading ? (
            <Button
              onClick={stopGeneration}
              size="icon"
              variant="destructive"
              className="flex-shrink-0 h-7 w-7"
            >
              <Square className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="flex-shrink-0 h-7 w-7 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0',
          isUser 
            ? 'bg-primary/10' 
            : 'bg-amber-500/10'
        )}
      >
        {isUser ? (
          <User className="w-2.5 h-2.5 text-primary" />
        ) : (
          <Church className="w-2.5 h-2.5 text-amber-500" />
        )}
      </div>

      {/* Bubble - compact style */}
      <div
        className={cn(
          'rounded-lg px-2.5 py-1.5 max-w-[85%] text-[11px]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border/40 text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0.5 prose-headings:my-1">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0 text-foreground/90">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-3 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-3 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-[10px] text-primary">{children}</code>,
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-amber-500/50 animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
