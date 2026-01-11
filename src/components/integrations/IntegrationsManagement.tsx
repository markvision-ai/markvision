import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';
import { Facebook, CheckCircle, XCircle, Settings, Loader2, Link2, Unlink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

export const IntegrationsManagement = ({ projectId }: { projectId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  
  const currentProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('platform, status')
        .eq('project_id', currentProjectId);
      if (!error && data) {
        const statusMap = data.reduce((acc: any, curr) => {
          acc[curr.platform] = curr.status;
          return acc;
        }, {});
        setStatuses(statusMap);
      }
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    fetchStatuses();

    // ЗАХВАТ ТОКЕНА ПОСЛЕ РЕДИРЕКТА
    const handleAuthChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Если в сессии есть токен провайдера - значит мы только что вернулись из FB
      if (session?.provider_token || session?.access_token) {
        const token = session.provider_token;
        if (token) {
          console.log("💎 Сохраняем интеграцию...");
          await supabase.from('integrations').upsert({
            project_id: currentProjectId,
            platform: 'facebook',
            access_token: token,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'project_id,platform' });
          
          fetchStatuses();
          // Чистим URL от мусора после входа
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleAuthChange();
  }, [fetchStatuses, currentProjectId]);

  const handleFBConnect = async () => {
    setConnectingId('facebook');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        // ОСТАВЛЯЕМ ТЕКУЩИЙ URL для возврата, это надежнее
        redirectTo: window.location.href, 
        scopes: 'ads_read,ads_management,instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_read_engagement,pages_show_list',
      },
    });
    if (error) {
      toast.error(error.message);
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    await supabase.from('integrations').delete().eq('project_id', currentProjectId).eq('platform', platform);
    setStatuses(prev => ({ ...prev, [platform]: 'disconnected' }));
    toast.success('Отключено');
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Центр интеграций</h2>
        <Button variant="ghost" size="sm" onClick={fetchStatuses}><RefreshCw className="w-4 h-4 mr-2" /> Обновить</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Карточка Facebook */}
        <Card className="relative overflow-hidden border-2 transition-all hover:border-primary/50">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg"><Facebook /></div>
              <Badge variant={statuses['facebook'] === 'active' ? "default" : "secondary"}>
                {statuses['facebook'] === 'active' ? 'Активно' : 'Не подключено'}
              </Badge>
            </div>
            <CardTitle className="mt-4">Facebook Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {statuses['facebook'] === 'active' ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm"><Settings className="w-4 h-4 mr-2" /> Настроить</Button>
                <Button variant="destructive" size="icon" onClick={() => handleDisconnect('facebook')}><Unlink className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleFBConnect} disabled={connectingId === 'facebook'}>
                {connectingId === 'facebook' ? <Loader2 className="animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                Подключить Facebook
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
