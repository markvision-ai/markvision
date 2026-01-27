import { useState, useRef, useEffect, useCallback } from 'react';
import { useLeadMessages } from '@/hooks/useLeadMessages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/externalSupabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Send, Loader2, Trash2, MessageSquare, Paperclip, X, FileText, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadChatProps {
  leadId: string;
}

// Helper to get signed URL for a file path
const getSignedUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('lead-attachments')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    if (import.meta.env.DEV) console.error('Error getting signed URL:', error.message || error);
    return null;
  }
  return data.signedUrl;
};

// Component for displaying file attachments with signed URLs
const FileAttachment = ({ 
  filePath, 
  fileName, 
  fileType, 
  isOwn 
}: { 
  filePath: string; 
  fileName: string | null; 
  fileType: string | null; 
  isOwn: boolean;
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isImage = fileType?.startsWith('image/');

  useEffect(() => {
    const loadSignedUrl = async () => {
      setLoading(true);
      const url = await getSignedUrl(filePath);
      setSignedUrl(url);
      setLoading(false);
    };
    loadSignedUrl();
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Загрузка файла...</span>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
        <FileText className="w-4 h-4" />
        <span className="text-xs">Файл недоступен</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={signedUrl} 
          alt={fileName || 'Изображение'} 
          className="max-w-full max-h-48 rounded-lg object-cover shadow-lg"
        />
      </a>
    );
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg transition-colors',
        isOwn ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-muted/50 hover:bg-muted'
      )}
    >
      <FileText className="w-5 h-5" />
      <span className="text-xs truncate max-w-[150px] font-medium">
        {fileName || 'Файл'}
      </span>
    </a>
  );
};

export const LeadChat = ({ leadId }: LeadChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, deleteMessage } = useLeadMessages(leadId);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимум 10 МБ');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string; path: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      // Use lead_id as folder to match RLS policy structure
      const filePath = `${leadId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lead-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL instead of public URL for secure access
      const signedUrl = await getSignedUrl(filePath);
      
      if (!signedUrl) throw new Error('Failed to get signed URL');

      return {
        url: signedUrl,
        name: file.name,
        type: file.type,
        path: filePath, // Store path for regenerating signed URLs
      };
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error uploading file:', error?.message || error);
      toast.error('Ошибка загрузки файла');
      return null;
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || uploading) return;

    let fileData = null;
    
    if (selectedFile) {
      setUploading(true);
      fileData = await uploadFile(selectedFile);
      setUploading(false);
      
      if (!fileData) return;
    }

    const success = await sendMessage(
      newMessage.trim() || (fileData ? `📎 ${fileData.name}` : ''),
      fileData
    );
    
    if (success) {
      setNewMessage('');
      removeSelectedFile();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Загрузка чата...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Premium Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b crm-card-glass">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <MessageSquare className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Чат по заявке</h3>
          <span className="text-xs text-muted-foreground">
            {messages.length} {messages.length === 1 ? 'сообщение' : 'сообщений'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Нет сообщений</p>
            <p className="text-xs text-muted-foreground mt-1">
              Напишите первое сообщение
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'flex flex-col max-w-[85%]',
                      isOwn ? 'ml-auto items-end' : 'items-start'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold">
                        {isOwn ? 'Вы' : msg.user_name || 'Пользователь'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), 'd MMM, HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm group relative shadow-sm',
                        isOwn
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                          : 'crm-card-glass rounded-bl-md'
                      )}
                    >
                      {/* File attachment - uses signed URLs for secure access */}
                      {msg.file_url && (
                        <div className="mb-2">
                          <FileAttachment
                            filePath={msg.file_url}
                            fileName={msg.file_name}
                            fileType={msg.file_type}
                            isOwn={isOwn}
                          />
                        </div>
                      )}
                      {msg.message && !msg.message.startsWith('📎') && (
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-destructive/20 rounded-lg"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Selected file preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            className="px-4 py-3 border-t crm-card-glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-lg">
              {selectedFile.type.startsWith('image/') ? (
                <Image className="w-5 h-5 text-primary" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
              <span className="text-xs truncate flex-1 font-medium">{selectedFile.name}</span>
              <button onClick={removeSelectedFile} className="p-1.5 hover:bg-destructive/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Input */}
      <div className="p-4 border-t crm-card-glass">
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="min-h-[48px] max-h-[120px] resize-none text-sm bg-background/50 border-border/50 focus:border-primary rounded-xl"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
            className="flex-shrink-0 bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-lg transition-all"
          >
            {sending || uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
