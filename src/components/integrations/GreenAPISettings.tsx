import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, CheckCircle, XCircle, Loader2, Settings, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GreenAPISettingsProps {
  projectId: string;
  onStatusChange?: (isActive: boolean) => void;
}

export const GreenAPISettings = ({ projectId, onStatusChange }: GreenAPISettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [idInstance, setIdInstance] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  // Load existing integration
  useEffect(() => {
    const loadIntegration = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'greenapi')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIntegrationId(data.id);
          const config = data.config as { id_instance?: string; api_token?: string } | null;
          setIdInstance(config?.id_instance || '');
          setApiToken(config?.api_token || '');
          setIsConnected(data.status === 'active');
          onStatusChange?.(data.status === 'active');
        }
      } catch (error) {
        console.error('Error loading GreenAPI integration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIntegration();
  }, [projectId, onStatusChange]);

  const handleSave = async () => {
    if (!idInstance.trim() || !apiToken.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    setSaving(true);
    try {
      const config = {
        id_instance: idInstance.trim(),
        api_token: apiToken.trim(),
      };

      if (integrationId) {
        // Update existing
        const { error } = await supabase
          .from('integrations')
          .update({
            config,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', integrationId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('integrations')
          .insert({
            project_id: projectId,
            type: 'greenapi',
            name: 'WhatsApp (GreenAPI)',
            config,
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;
        setIntegrationId(data.id);
      }

      setIsConnected(true);
      onStatusChange?.(true);
      toast.success('GreenAPI успешно подключен!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving GreenAPI integration:', error);
      toast.error('Ошибка сохранения интеграции');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integrationId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrationId(null);
      setIdInstance('');
      setApiToken('');
      setIsConnected(false);
      onStatusChange?.(false);
      toast.success('Интеграция отключена');
      setIsOpen(false);
    } catch (error) {
      console.error('Error disconnecting GreenAPI:', error);
      toast.error('Ошибка отключения интеграции');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${isConnected ? 'ring-2 ring-green-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500 text-white">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">WhatsApp (GreenAPI)</h3>
              <p className="text-xs text-muted-foreground">Автоответчик и рассылки</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <Badge 
            variant={isConnected ? 'default' : 'secondary'}
            className={isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
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
                {isConnected ? <><Settings className="w-4 h-4 mr-1" /> Настроить</> : 'Подключить'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  Настройка GreenAPI (WhatsApp)
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="idInstance">IdInstance</Label>
                  <Input
                    id="idInstance"
                    value={idInstance}
                    onChange={(e) => setIdInstance(e.target.value)}
                    placeholder="Например: 1101234567"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите в <a href="https://console.green-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">консоли GreenAPI</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiToken">ApiToken</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Ваш API токен"
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !idInstance || !apiToken}
                    className="flex-1"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Сохранить
                  </Button>
                  
                  {isConnected && (
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to send WhatsApp message via GreenAPI
export const sendWhatsAppMessage = async (
  projectId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get GreenAPI credentials
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('config')
      .eq('project_id', projectId)
      .eq('type', 'greenapi')
      .eq('status', 'active')
      .maybeSingle();

    if (intError) throw intError;
    if (!integration) {
      return { success: false, error: 'GreenAPI не подключен' };
    }

    const config = integration.config as { id_instance?: string; api_token?: string } | null;
    if (!config?.id_instance || !config?.api_token) {
      return { success: false, error: 'Некорректная конфигурация GreenAPI' };
    }

    // Format phone number (remove non-digits, ensure starts with country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('8')) {
      formattedPhone = '7' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('7') && formattedPhone.length === 10) {
      formattedPhone = '7' + formattedPhone;
    }

    // Send message via GreenAPI
    const response = await fetch(
      `https://api.green-api.com/waInstance${config.id_instance}/sendMessage/${config.api_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${formattedPhone}@c.us`,
          message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка отправки');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message || 'Ошибка отправки сообщения' };
  }
};
