import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, FALLBACK_PROJECT_ID } from '@/lib/externalSupabase';
import AnalyticsPlatform from '@/components/AnalyticsPlatform';
import LandingPage from '@/components/landing/LandingPage';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentProjectId = FALLBACK_PROJECT_ID;

  // ГЛОБАЛЬНЫЙ ЗАХВАТ ТОКЕНОВ ИЗ ОПЛАТЫ И ОАUTH
  useEffect(() => {
    const handleSessionCapture = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Если есть токен провайдера (Facebook/Google)
      if (session?.provider_token) {
        console.log("💎 MarkVision: Обнаружен токен Meta. Сохраняю...");
        
        const { error } = await supabase.from('integrations').upsert({
          project_id: currentProjectId,
          type: 'facebook',
          name: 'Facebook Ads',
          config: { access_token: session.provider_token },
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,type' });

        if (!error) {
          toast.success("Интеграция с Meta успешно активирована!");
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
        }
      }
    };

    handleSessionCapture();

    // Слушаем изменения авторизации
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        handleSessionCapture();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [queryClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Если пользователь не авторизован — показываем лендинг
  if (!user) {
    return <LandingPage />;
  }

  // Если авторизован — показываем платформу
  return <AnalyticsPlatform />;
};

export default Index;
