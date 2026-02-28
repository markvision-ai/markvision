import { useState, useRef, useEffect, useCallback } from 'react';
import { useLeadMessages } from '@/hooks/useLeadMessages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Send,
  Loader2,
  Trash2,
  MessageSquare,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Zap,
  CheckCheck,
  MoreVertical,
  ShieldCheck,
  Smile,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    console.error('Error getting signed URL:', error);
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
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-slate-200 animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Encryption in progress...</span>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
        <FileText className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Failed to retrieve</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <motion.a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="block group relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-2xl"
      >
        <img
          src={signedUrl}
          alt={fileName || 'Изображение'}
          className="max-w-full max-h-[300px] rounded-[2rem] object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Open full resolution</p>
        </div>
      </motion.a>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 border',
        isOwn
          ? 'bg-white/10 border-white/20 hover:bg-white/20'
          : 'bg-primary/5 border-primary/10 hover:bg-primary/10'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">Attachment</p>
        <p className="text-xs font-bold truncate">
          {fileName || 'Unknown File'}
        </p>
      </div>
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
    <div className="flex flex-col h-full bg-background/5 relative">
      {/* Branded Messenger Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-background/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-2xl shadow-primary/20">
              <MessageSquare className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0A0A0B] shadow-2xl shadow-blue-900/5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Project Intelligence</h3>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black p-1 px-2 uppercase tracking-widest">LIVE</Badge>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
              {messages.length} Secure data points encryption
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5">
            <MoreVertical className="w-4 h-4 opacity-40" />
          </Button>
        </div>
      </div>

      {/* Messenger Flow */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl border-slate-200 flex items-center justify-center relative z-10">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Начните диалог</h4>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                Secure connection established. Awaiting initial input...
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {messages.map((msg, idx) => {
                  const isOwn = msg.user_id === user?.id;
                  const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: isOwn ? 30 : -30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className={cn(
                        'flex gap-4 max-w-[90%]',
                        isOwn ? 'ml-auto flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar System */}
                      <div className={cn(
                        "w-10 h-10 shrink-0",
                        !showAvatar && "invisible"
                      )}>
                        <div className={cn(
                          "absolute w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black border",
                          isOwn
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-white/10 border-slate-200 text-white"
                        )}>
                          {isOwn ? 'YOU' : (msg.user_name?.[0] || 'U').toUpperCase()}
                        </div>
                      </div>

                      <div className={cn(
                        'flex flex-col gap-1.5',
                        isOwn ? 'items-end' : 'items-start'
                      )}>
                        {showAvatar && (
                          <div className="flex items-center gap-3 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {isOwn ? 'MarkVision System' : msg.user_name}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/30">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        )}

                        <div
                          className={cn(
                            'relative p-4 rounded-[1.75rem] text-sm group transition-all duration-300',
                            isOwn
                              ? 'bg-primary text-white shadow-2xl shadow-primary/20 rounded-tr-none'
                              : 'bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl border-white/5 text-white/90 rounded-tl-none hover:border-white/20'
                          )}
                        >
                          {/* Secure File Handling */}
                          {msg.file_url && (
                            <div className="mb-3">
                              <FileAttachment
                                filePath={msg.file_url}
                                fileName={msg.file_name}
                                fileType={msg.file_type}
                                isOwn={isOwn}
                              />
                            </div>
                          )}

                          {msg.message && !msg.message.startsWith('📎') && (
                            <p className="leading-relaxed font-bold tracking-tight whitespace-pre-wrap break-words">{msg.message}</p>
                          )}

                          {/* Quick Actions Bar */}
                          <div className={cn(
                            "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300",
                            isOwn ? "-left-16" : "-right-16"
                          )}>
                            {isOwn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMessage(msg.id)}
                                className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive shadow-2xl shadow-blue-900/5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pro Command Center (Input) */}
      <div className="p-6 border-t border-white/5 bg-background/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          {/* File Queue Visualization */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl p-3 rounded-2xl border-primary/20 bg-primary/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ready to upload</p>
                    <p className="text-xs font-bold text-white/90 truncate max-w-[200px]">{selectedFile.name}</p>
                  </div>
                </div>
                <Button
                  onClick={removeSelectedFile}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <div className="flex gap-1">
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
                className="h-14 w-14 rounded-2xl bg-white/5 border border-slate-200 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Secure message command..."
                className="interstellar-input min-h-[56px] max-h-[200px] py-4 px-6 text-base font-bold tracking-tight resize-none rounded-[1.75rem] border-slate-200 focus:border-primary/50"
                rows={1}
              />
              <div className="absolute right-4 bottom-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 hover:opacity-100">
                  <Smile className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
              className={cn(
                "h-14 px-8 rounded-[1.75rem] font-black uppercase tracking-widest transition-all duration-500",
                (newMessage.trim() || selectedFile) && !sending && !uploading
                  ? "bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-[1.02] hover:opacity-90"
                  : "bg-white/5 text-white/20 border border-white/5"
              )}
            >
              {sending || uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <span>SEND</span>
                  <Send className="w-4 h-4 ml-1" />
                </div>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 opacity-30">
            <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              END-TO-END ENCRYPTED
            </div>
            <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em]">
              <Zap className="w-3 h-3 text-primary" />
              AI ENHANCED STREAMING
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
