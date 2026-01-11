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

  // Глобальная подписка на Realtime — ОДНА на всё приложение
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
          
          // Проверяем project_id
          const projectId = newData?.project_id || oldData?.project_id;
          
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

    // Fallback: обновление каждые 30 секунд если WebSocket не работает
    const fallbackInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AnalyticsPlatform />;
};

export default Index;
