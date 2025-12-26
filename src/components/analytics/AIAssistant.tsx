import { useState, useRef, useEffect } from 'react';
import { Send, User, Trash2, Sparkles, Loader2, Square, MessageSquare, TrendingUp, Lightbulb, Target, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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
  };
}

const suggestedQuestions = [
  { text: 'Проанализируй текущие показатели', icon: TrendingUp },
  { text: 'Как улучшить конверсию?', icon: Target },
  { text: 'Какие метрики требуют внимания?', icon: Lightbulb },
  { text: 'Оптимален ли мой CPL и CAC?', icon: MessageSquare },
];

export const AIAssistant = ({ context }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat, stopGeneration } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobileLayout = typeof window !== 'undefined' && window.innerWidth < 640;

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
    <Card className="flex flex-col h-[400px] sm:h-[600px] bg-gradient-to-b from-card to-card/95">
      <CardHeader className="flex-shrink-0 pb-2 sm:pb-3 border-b px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 ring-1 ring-amber-500/30">
              <Church className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <span className="block truncate">Святой AI аналитик</span>
              {hasContext && (
                <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-0.5 hidden sm:block">
                  Благословляет ваши метрики
                </p>
              )}
            </div>
          </CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-3 sm:pt-4 px-3 sm:px-6">
        <ScrollArea className="flex-1 pr-2 sm:pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center ring-1 ring-amber-500/20">
                  <Church className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                </div>
                <h3 className="font-medium mb-1 text-sm sm:text-base">Мир вам!</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                  {hasContext 
                    ? 'Готов анализировать ваши метрики'
                    : 'Загрузите данные для анализа'
                  }
                </p>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-2 sm:mb-3">Попробуйте спросить:</p>
                <div className="grid gap-1.5 sm:gap-2">
                  {suggestedQuestions.slice(0, isMobileLayout ? 2 : 4).map(({ text, icon: Icon }) => (
                    <Button
                      key={text}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm text-left justify-start gap-2 sm:gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
                      onClick={() => handleSuggestion(text)}
                      disabled={isLoading}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/70 flex-shrink-0" />
                      <span className="truncate">{text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 py-2">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-3 sm:pt-4 border-t mt-2 sm:mt-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос..."
            disabled={isLoading}
            className="flex-1 bg-secondary/50 text-sm"
          />
          {isLoading ? (
            <Button
              onClick={stopGeneration}
              size="icon"
              variant="destructive"
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ring-1',
          isUser 
            ? 'bg-primary text-primary-foreground ring-primary/20' 
            : 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-amber-500/20'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Church className="w-4 h-4 text-amber-500" />}
      </div>
      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[85%] text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/70'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
