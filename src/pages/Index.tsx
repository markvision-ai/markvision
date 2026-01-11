import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AnalyticsPlatform from '@/components/AnalyticsPlatform';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/sounds';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('global-leads-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          if (payload.eventType === 'UPDATE' && (payload.new as any)?.status === 'Записан') {
            playSuccessSound();
            toast.success(`🩺 Клиент ${(payload.new as any).name || ''} записан на приём!`);
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ОБРАБОТКА РЕДИРЕКТА И ОШИБОК OAUTH
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get('error_description');
    
    if (errorDescription) {
      toast.error("Ошибка Meta: " + errorDescription);
      // Очищаем URL от ошибок и возвращаемся в интеграции
      navigate('/integrations', { replace: true });
      return;
    }

    const isOAuthReturn = window.location.hash.includes('access_token') || window.location.search.includes('code=');
    if (!loading && !user && !isOAuthReturn) {
      navigate('/auth');
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isWaitingOAuth = window.location.hash.includes('access_token') || window.location.search.includes('code=');

  if (!user && isWaitingOAuth) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center text-white p-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-6" />
        <h2 className="text-xl font-bold mb-2">Связываем аккаунты MarkVision и Meta...</h2>
        <p className="text-gray-400 max-w-sm">Это может занять несколько секунд. Пожалуйста, не закрывайте вкладку.</p>
      </div>
    );
  }

  if (!user) return null;

  return <AnalyticsPlatform />;
};

export default Index;
