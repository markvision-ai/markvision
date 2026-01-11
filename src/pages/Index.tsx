import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AnalyticsPlatform from '@/components/AnalyticsPlatform';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/sounds';

const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Глобальная подписка на Realtime — ОДНА на всё приложение
  useEffect(() => {
    console.log('✅ MarkVision Core: Initializing global realtime subscription...');

    const channel = supabase
      .channel('global-leads-channel')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads' 
        },
        (payload) => {
          console.log('🔔 Realtime event:', payload.eventType, payload);
          
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Инвалидируем кеш React Query для мгновенного обновления UI
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          
          // Если статус изменился на "Записан" - уведомление + звук
          if (payload.eventType === 'UPDATE' && newData?.status === 'Записан' && oldData?.status !== 'Записан') {
            playSuccessSound();
            toast.success(`🩺 Клиент ${newData.name || ''} записан на приём!`, {
              duration: 5000,
            });
          }
          
          // Если новый лид создан
          if (payload.eventType === 'INSERT') {
            toast.info(`📥 Новый лид: ${newData?.name || 'Без имени'}`, {
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ MarkVision Core: Realtime Active');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime disconnected, will retry...');
        }
      });

    const fallbackInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [queryClient]);

  // 2. ИСПРАВЛЕННАЯ ЛОГИКА ЗАЩИТЫ (Auth Guard)
  useEffect(() => {
    // Проверяем, не возвращаемся ли мы сейчас из Facebook (OAuth)
    const isOAuthReturn = window.location.hash.includes('access_token') || 
                          window.location.search.includes('code=');

    // Если мы в процессе OAuth-входа, НЕ делаем редирект, даже если user еще null
    if (isOAuthReturn) {
      console.log('⏳ MarkVision: Захват OAuth сессии... Ожидаем подтверждения от Meta.');
      return; 
    }

    // Редирект на вход только если загрузка завершена, а юзера точно нет
    if (!loading && !user) {
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

  if (!user) {
    // Проверяем еще раз, не ждем ли мы OAuth, чтобы не мигать белым экраном
    const isWaitingOAuth = window.location.hash.includes('access_token') || 
                           window.location.search.includes('code=');
    if (isWaitingOAuth) {
      return (
        <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p>Связываем аккаунты MarkVision и Meta...</p>
        </div>
      );
    }
    return null;
  }

  // ВОЗВРАЩАЕМ ТВОЮ ПЛАТФОРМУ
  return <AnalyticsPlatform />;
};

export default Index;
