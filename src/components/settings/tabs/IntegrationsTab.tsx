import { useState, useEffect, useCallback } from 'react';
import { 
  Facebook, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Loader2, 
  RefreshCw, 
  Settings,
  Plug2,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MetaSyncButton } from '@/components/integrations/MetaSyncButton';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const integrations: Integration[] = [
  { 
    id: 'facebook', 
    name: 'Facebook Ads', 
    description: 'Реклама и аналитика Meta',
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-blue-600'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    description: 'Direct, Комменты и Reels',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok Ads', 
    description: 'Аналитика трафика TikTok',
    icon: <TikTokIcon />,
    color: 'bg-black'
  },
  { 
    id: 'google', 
    name: 'Google Ads', 
    description: 'Контекстная реклама',
    icon: <GoogleIcon />,
    color: 'bg-white border'
  },
  { 
    id: 'greenapi', 
    name: 'WhatsApp (GreenAPI)', 
    description: 'Автоответчик и рассылки',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-green-500'
  }
];

interface IntegrationsTabProps {
  projectId: string;
}

export const IntegrationsTab = ({ projectId }: IntegrationsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('integrations')
        .select('type, status')
        .eq('project_id', projectId);
      
      if (data) {
        const map = data.reduce((acc: Record<string, string>, curr) => ({ 
          ...acc, 
          [curr.type]: curr.status 
        }), {});
        setStatuses(map);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.provider_token) {
          // Save the Facebook access token
          const { error } = await supabase.from('integrations').upsert({
            project_id: projectId,
            type: 'facebook',
            name: 'Facebook Ads',
            status: 'active',
            config: { 
              access_token: session.provider_token,
              user_id: session.user.id
            },
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'project_id,type' 
          });

          if (error) {
            console.error('Error saving integration:', error);
            toast.error('Ошибка сохранения интеграции');
          } else {
            toast.success('Facebook успешно подключен!');
            fetchStatuses();
          }

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    handleOAuthCallback();
  }, [projectId, fetchStatuses]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleConnect = async (id: string) => {
    if (id === 'facebook' || id === 'instagram') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/settings',
          scopes: 'email,public_profile,ads_read,ads_management,instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_read_engagement,pages_show_list',
        },
      });
      if (error) toast.error(error.message);
    } else {
      setSelectedIntegration(id);
    }
  };

  const handleDisconnect = async (id: string) => {
    await supabase.from('integrations').delete().eq('project_id', projectId).eq('type', id);
    setStatuses(prev => ({ ...prev, [id]: 'disconnected' }));
    toast.success('Интеграция отключена');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plug2 className="w-5 h-5 text-primary" />
              Центр интеграций
            </CardTitle>
            <CardDescription>
              Подключите сервисы для автоматизации маркетинга
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <MetaSyncButton projectId={projectId} variant="compact" />
            <Button variant="outline" size="sm" onClick={fetchStatuses} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const isConnected = statuses[integration.id] === 'active';
              
              return (
                <Card 
                  key={integration.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-md ${isConnected ? 'ring-2 ring-green-500/30' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${integration.color} text-white`}>
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
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
                      
                      <Button
                        size="sm"
                        variant={isConnected ? 'outline' : 'default'}
                        onClick={() => isConnected ? handleDisconnect(integration.id) : handleConnect(integration.id)}
                      >
                        {isConnected ? 'Отключить' : 'Подключить'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Здесь будут ваши дополнительные интеграции</p>
          <p className="text-xs mt-1">CRM-системы, телефония и другое</p>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Настройка интеграции
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Функционал настройки {selectedIntegration} скоро будет доступен.</p>
          </div>
          <Button onClick={() => setSelectedIntegration(null)}>Закрыть</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
