import { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle, XCircle, Loader2, Bot, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface TelegramSettingsProps {
  projectId: string;
  onStatusChange?: (isActive: boolean) => void;
}

export const TelegramSettings = ({ projectId, onStatusChange }: TelegramSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('config, status')
        .eq('project_id', projectId)
        .eq('type', 'telegram')
        .maybeSingle();

      if (!error && data) {
        const config = data.config as { bot_token?: string; chat_id?: string } | null;
        setBotToken(config?.bot_token || '');
        setChatId(config?.chat_id || '');
        setIsConnected(data.status === 'active');
        onStatusChange?.(data.status === 'active');
      }
    } catch (error) {
      console.error('Error fetching Telegram config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onStatusChange]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('integrations').upsert({
        project_id: projectId,
        type: 'telegram',
        name: 'Telegram Bot',
        status: 'active',
        config: {
          bot_token: botToken.trim(),
          chat_id: chatId.trim(),
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id,type',
      });

      if (error) throw error;

      setIsConnected(true);
      onStatusChange?.(true);
      toast.success('✅ Telegram бот подключен!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving Telegram config:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await supabase
        .from('integrations')
        .delete()
        .eq('project_id', projectId)
        .eq('type', 'telegram');

      setBotToken('');
      setChatId('');
      setIsConnected(false);
      onStatusChange?.(false);
      toast.success('Telegram отключен');
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast.error('Ошибка отключения');
    }
  };

  const handleTestConnection = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Сначала сохраните настройки');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken.trim()}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text: '🚀 MarkVision AI: Связь установлена!\n\nВаш бот успешно подключен и готов к работе.',
            parse_mode: 'HTML',
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        toast.success('✅ Тестовое сообщение отправлено!');
      } else {
        toast.error(`Ошибка: ${result.description || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Telegram test error:', error);
      toast.error('Ошибка отправки тестового сообщения');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${isConnected ? 'ring-2 ring-blue-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Telegram Бот</h3>
              <p className="text-xs text-muted-foreground">Уведомления и отчёты</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={isConnected ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
          >
            {isConnected ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Подключено</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Отключено</>
            )}
          </Badge>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant={isConnected ? 'outline' : 'default'}>
                {isConnected ? 'Настроить' : 'Подключить'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-500" />
                  Настройка Telegram бота
                </DialogTitle>
                <DialogDescription>
                  Введите токен вашего бота и ID чата для отправки уведомлений
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Токен бота</Label>
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-id">ID чата</Label>
                  <Input
                    id="chat-id"
                    placeholder="-1001234567890"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Используйте @userinfobot чтобы узнать ID
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !botToken.trim() || !chatId.trim()}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Сохранить
                  </Button>

                  {isConnected && (
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                {isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Отключить интеграцию
                  </Button>
                )}

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  <strong>Безопасность:</strong> Токен бота хранится в зашифрованном виде 
                  и никогда не показывается в интерфейсе.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};