import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/components/integrations/GreenAPISettings';
import { toast } from 'sonner';

interface WhatsAppDialogProps {
  leadName: string;
  leadPhone: string;
  projectId: string;
  onMessageSent?: () => void;
}

export const WhatsAppDialog = ({ leadName, leadPhone, projectId, onMessageSent }: WhatsAppDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Default greeting message
  useEffect(() => {
    if (isOpen && !message) {
      setMessage(`Здравствуйте${leadName ? ', ' + leadName.split(' ')[0] : ''}! 👋\n\nМы получили вашу заявку и готовы ответить на все вопросы.\n\nКогда вам удобно связаться для консультации?`);
    }
  }, [isOpen, leadName, message]);

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
        toast.success('Сообщение отправлено!');
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
    return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 rounded-md text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600"
          disabled={!leadPhone}
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1" />
          WhatsApp
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
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите сообщение..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || sent || !message.trim()}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Отправка...
              </>
            ) : sent ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Отправлено!
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </>
            )}
          </Button>

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Сообщение будет отправлено через подключенный GreenAPI
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
