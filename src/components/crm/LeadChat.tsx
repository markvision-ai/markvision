import { useState, useRef, useEffect } from 'react';
import { useLeadMessages } from '@/hooks/useLeadMessages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Send, Loader2, Trash2, MessageSquare, Paperclip, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadChatProps {
  leadId: string;
}

export const LeadChat = ({ leadId }: LeadChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, deleteMessage } = useLeadMessages(leadId);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
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

  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lead-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lead-attachments')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: file.name,
        type: file.type,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
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

  const isImage = (type: string) => type?.startsWith('image/');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Чат по заявке</h3>
        <span className="text-xs text-muted-foreground">
          ({messages.length})
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Нет сообщений</p>
            <p className="text-xs text-muted-foreground mt-1">
              Напишите первое сообщение
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col max-w-[85%]',
                    isOwn ? 'ml-auto items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {isOwn ? 'Вы' : msg.user_name || 'Пользователь'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm group relative',
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    )}
                  >
                    {/* File attachment */}
                    {msg.file_url && (
                      <div className="mb-2">
                        {isImage(msg.file_type || '') ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={msg.file_url} 
                              alt={msg.file_name || 'Изображение'} 
                              className="max-w-full max-h-48 rounded object-cover"
                            />
                          </a>
                        ) : (
                          <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={cn(
                              'flex items-center gap-2 p-2 rounded',
                              isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'
                            )}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs truncate max-w-[150px]">
                              {msg.file_name || 'Файл'}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.message && !msg.message.startsWith('📎') && (
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="px-3 py-2 border-t bg-secondary/30">
          <div className="flex items-center gap-2">
            {selectedFile.type.startsWith('image/') ? (
              <Image className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4 text-primary" />
            )}
            <span className="text-xs truncate flex-1">{selectedFile.name}</span>
            <button onClick={removeSelectedFile} className="p-1 hover:bg-secondary rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
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
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
            className="flex-shrink-0"
          >
            {sending || uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
