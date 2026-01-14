import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/components/integrations/GreenAPISettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppDialogProps {
  leadName: string;
  leadPhone: string;
  projectId: string;
  clinicName?: string;
  onMessageSent?: () => void;
}

export const WhatsAppDialog = ({ leadName, leadPhone, projectId, clinicName, onMessageSent }: WhatsAppDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Check if GreenAPI is configured
  useEffect(() => {
    const checkConfig = async () => {
      if (!projectId) return;
      
      const { data } = await supabase
        .from('integrations')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'greenapi')
        .eq('status', 'active')
        .maybeSingle();
      
      setIsConfigured(!!data);
    };
    
    checkConfig();
  }, [projectId]);

  // Default greeting message with clinic name
  useEffect(() => {
    if (isOpen && !message) {
      const firstName = leadName ? leadName.split(' ')[0] : '';
      const clinic = clinicName || 'нашей клиники';
      setMessage(`Здравствуйте${firstName ? ', ' + firstName : ''}! 👋\n\nЭто Марк, ИИ-ассистент ${clinic}.\n\nМы получили вашу заявку и готовы ответить на все вопросы.\n\nКогда вам удобно связаться для консультации?`);
    }
  }, [isOpen, leadName, message, clinicName]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Введите сообщение');
      return;
    }

    setSending(true);
    try {
      const result = await sendWhatsAppMessage(projectId, leadPhone, message.trim());
      
      if (result.success) {
        setSent(true);
        toast.success('✅ Сообщение отправлено в WhatsApp');
        onMessageSent?.();
        setTimeout(() => {
          setIsOpen(false);
          setSent(false);
          setMessage('');
        }, 1500);
      } else {
        toast.error(result.error || 'Ошибка отправки');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Не указан';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
    }
    return phone;
  };

  // Not configured state
  if (isConfigured === false) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 rounded-md text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
        disabled
        title="GreenAPI не настроен"
      >
        <MessageCircle className="w-3.5 h-3.5 mr-1" />
        WhatsApp
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-7 px-3 rounded-md text-xs bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm transition-all hover:shadow-md"
          disabled={!leadPhone || isConfigured === null}
        >
          {isConfigured === null ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            Написать в WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Recipient info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{leadName || 'Клиент'}</p>
            <p className="text-xs text-muted-foreground">{formatPhone(leadPhone)}</p>
            {clinicName && (
              <p className="text-xs text-muted-foreground mt-1">Клиника: {clinicName}</p>
            )}
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите сообщение..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Сообщение будет отправлено через GreenAPI
            </p>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || sent || !message.trim()}
            className="w-full bg-green-500 hover:bg-green-600 h-11 text-base font-medium"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Отправка...
              </>
            ) : sent ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Отправлено!
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Отправить сообщение
              </>
            )}
          </Button>

          {/* Security hint */}
          <div className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Токен API никогда не показывается в интерфейсе и используется только для отправки</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};