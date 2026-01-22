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
    <div className="group flex flex-col h-[400px] sm:h-[600px] bg-[#0f172a]/50 backdrop-blur-xl border border-transparent hover:border-blue-500/30 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-purple-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

      {/* Header - ChatGPT style */}
      <div className="relative z-10 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/20">
              <Church className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
                Святой AI аналитик
              </h3>
              {hasContext && (
                <p className="text-xs text-slate-500 hidden sm:block">
                  Благословляет ваши метрики
                </p>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 flex-shrink-0 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="relative z-10 flex-1 px-4 sm:px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 ring-1 ring-amber-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <Church className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2">
                Добро пожаловать в AI-аналитику
              </h4>
              <p className="text-sm text-slate-500 max-w-md">
                Задайте любой вопрос о ваших метриках, и я помогу найти точки роста
              </p>
            </motion.div>

            {/* Suggested Questions - Styled buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
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
                    className="group/btn relative overflow-hidden bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 hover:border-blue-500/50 rounded-xl p-3 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-300 group-hover/btn:text-slate-100 transition-colors">
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

      {/* Input Area - ChatGPT style */}
      <div className="relative z-10 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/30">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 text-sm text-slate-200 placeholder:text-slate-500"
          />
          {isLoading ? (
            <Button
              onClick={stopGeneration}
              size="icon"
              variant="destructive"
              className="flex-shrink-0 h-10 w-10 rounded-xl"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
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
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 shadow-lg',
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-blue-500/20 shadow-blue-500/30' 
            : 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-amber-500/20 shadow-amber-500/20'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Church className="w-4 h-4 text-amber-400" />
        )}
      </div>

      {/* Bubble - with blur effect */}
      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[85%] text-sm backdrop-blur-sm',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
            : 'bg-slate-800/50 text-slate-200 border border-slate-700/30'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                code: ({ children }) => <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-xs text-blue-300">{children}</code>,
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-amber-400/50 animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
