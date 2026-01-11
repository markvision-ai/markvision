import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';
import { 
  Facebook, 
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  Link2,
  Unlink,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const integrationsList: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Импорт расходов и конверсий из Meta Ads Manager',
    icon: <Facebook className="w-6 h-6" />,
    color: 'bg-blue-600',
    features: ['Авто-импорт расходов', 'Синхронизация Reels', 'Direct & Comments']
  },
  { id: 'tiktok', name: 'TikTok Ads', description: 'Аналитика TikTok Ads Manager', icon: <TikTokIcon />, color: 'bg-black', features: ['Видео-статистика', 'ROI'] },
  { id: 'google', name: 'Google Ads', description: 'Синхронизация с Google Ads & GA4', icon: <GoogleIcon />, color: 'bg-white border', features: ['Search Ads', 'YouTube'] }
];

export const IntegrationsManagement = ({ projectId }: { projectId?: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  
  const currentProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // 1. Проверка статусов при загрузке
  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('platform, status')
        .eq('project_id', currentProjectId);
      
      if (error) throw error;
      
      const statusMap = data.reduce((acc: any, curr) => {
        acc[curr.platform] = curr.status;
        return acc;
      }, {});
      setStatuses(statusMap);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    fetchStatuses();
    
    // 2. Слушатель возврата из OAuth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        console.log("💎 OAuth Success! Сохраняю токен...");
        
        const { error } = await supabase.from('integrations').upsert({
          project_id: currentProjectId,
          platform: session.provider_id || 'facebook',
          access_token: session.provider_token,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,platform' });

        if (!error) {
          toast.success("Интеграция успешно настроена!");
          fetchStatuses();
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [fetchStatuses, currentProjectId]);

  const handleFBConnect = async () => {
    setConnectingId('facebook');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/crm', // Редирект на CRM чтобы избежать 404/auth циклов
          scopes: 'ads_read,ads_management,instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_read_engagement,pages_show_list',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('project_id', currentProjectId)
        .eq('platform', platform);
      
      if (error) throw error;
      setStatuses(prev => ({ ...prev, [platform]: 'disconnected' }));
      toast.success(`${platform} отключен`);
    } catch (err) {
      toast.error("Не удалось отключить");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Центр интеграций</h2>
        <Button variant="ghost" size="sm" onClick={fetchStatuses}><RefreshCw className="w-4 h-4 mr-2" /> Обновить</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrationsList.map((item) => (
          <Card key={item.id} className="relative overflow-hidden border-2 transition-all hover:border-primary/50">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
                  {item.icon}
                </div>
                <Badge variant={statuses[item.id] === 'active' ? "default" : "secondary"}>
                  {statuses[item.id] === 'active' ? 'Активно' : 'Не подключено'}
                </Badge>
              </div>
              <CardTitle className="mt-4">{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {item.features.map(f => (
                    <span key={f} className="text-[10px] bg-muted px-2 py-1 rounded-md opacity-70">{f}</span>
                  ))}
                </div>
                
                {statuses[item.id] === 'active' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Settings className="w-4 h-4 mr-2" /> Настроить
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDisconnect(item.id)}>
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={item.id === 'facebook' ? handleFBConnect : () => toast.info("Скоро будет доступно")}
                    disabled={connectingId === item.id}
                  >
                    {connectingId === item.id ? <Loader2 className="animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                    Подключить
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
