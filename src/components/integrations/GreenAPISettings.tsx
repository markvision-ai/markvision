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
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
          const settings = data.settings as { id_instance?: string; api_token?: string } | null;
          setIdInstance(settings?.id_instance || '');
          setApiToken(settings?.api_token || '');
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
      const settings = {
        id_instance: idInstance.trim(),
        api_token: apiToken.trim(),
      };

      if (integrationId) {
        // Update existing
        const { error } = await supabase
          .from('integrations')
          .update({
            settings,
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
            settings,
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
      <Card className="bg-[#020617]/40 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-3xl relative overflow-hidden">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-[#020617]/40 backdrop-blur-3xl border border-white/5 shadow-interstellar rounded-[32px] relative overflow-hidden group transition-all duration-500 hover:border-white/20",
      isConnected && "border-emerald-500/20"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />

      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-500 group-hover:scale-105",
              isConnected ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-white/40"
            )}>
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">WhatsApp (GreenAPI)</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-60">Автоответчик и рассылки</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Badge
            className={cn(
              "text-[9px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full border transition-all",
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-white/5 text-muted-foreground border-white/5"
            )}
          >
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </Badge>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] px-6"
              >
                {isConnected ? <><Settings className="w-4 h-4 mr-2" /> Settings</> : 'Connect'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#020617]/90 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-[40px] p-0 overflow-hidden">
              <div className="p-10 border-b border-white/5 bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full -mr-24 -mt-24" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      <MessageCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    WhatsApp Setup
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="idInstance" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">IdInstance</Label>
                  <Input
                    id="idInstance"
                    value={idInstance}
                    onChange={(e) => setIdInstance(e.target.value)}
                    placeholder="e.g. 1101234567"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono text-white focus:border-emerald-500/50 transition-all text-sm px-5"
                  />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
                    Get from <a href="https://console.green-api.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">GreenAPI Console</a>
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="apiToken" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">ApiToken</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Your API Token"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono text-white focus:border-emerald-500/50 transition-all text-sm px-5"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !idInstance || !apiToken}
                    className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/20 transition-all font-black uppercase tracking-widest text-[10px] gap-3"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Configuration
                  </Button>

                  {isConnected && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDisconnect}
                      disabled={saving}
                      className="w-14 h-14 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
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
      .select('settings')
      .eq('project_id', projectId)
      .eq('type', 'greenapi')
      .eq('status', 'active')
      .maybeSingle();

    if (intError) throw intError;
    if (!integration) {
      return { success: false, error: 'GreenAPI не подключен' };
    }

    const settings = integration.settings as { id_instance?: string; api_token?: string } | null;
    if (!settings?.id_instance || !settings?.api_token) {
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
      `https://api.green-api.com/waInstance${settings.id_instance}/sendMessage/${settings.api_token}`,
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
