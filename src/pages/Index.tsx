import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AnalyticsPlatform from '@/components/AnalyticsPlatform';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentProjectId = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // ГЛОБАЛЬНЫЙ ЗАХВАТ ТОКЕНОВ ИЗ ОПЛАТЫ И ОАUTH
  useEffect(() => {
    const handleSessionCapture = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Если есть токен провайдера (Facebook/Google)
      if (session?.provider_token) {
        console.log("💎 MarkVision: Обнаружен токен Meta. Сохраняю...");
        
        const { error } = await supabase.from('integrations').upsert({
          project_id: currentProjectId,
          platform: 'facebook',
          access_token: session.provider_token,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,platform' });

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

  // Защита роутов
  useEffect(() => {
    const isOAuth = window.location.hash.includes('access_token') || window.location.search.includes('code=');
    if (!loading && !user && !isOAuth) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <AnalyticsPlatform />;
};

export default Index;
