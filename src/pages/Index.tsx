import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AnalyticsPlatform from '@/components/AnalyticsPlatform';
import LandingPage from '@/components/landing/LandingPage';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkingProjects, setCheckingProjects] = useState(true);

  // Check if user has projects with completed onboarding
  useEffect(() => {
    const checkUserProjects = async () => {
      if (!user) {
        setCheckingProjects(false);
        return;
      }

      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, onboarding_status')
          .eq('owner_id', user.id)
          .limit(1);

        if (error) throw error;

        // If no projects or onboarding not completed, redirect to setup
        if (!projects || projects.length === 0) {
          navigate('/setup', { replace: true });
          return;
        }

        const hasCompletedOnboarding = projects.some(p => p.onboarding_status === 'completed');
        if (!hasCompletedOnboarding) {
          navigate('/setup', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking projects:', error);
      } finally {
        setCheckingProjects(false);
      }
    };

    if (!loading) {
      checkUserProjects();
    }
  }, [user, loading, navigate]);

  // ГЛОБАЛЬНЫЙ ЗАХВАТ ТОКЕНОВ ИЗ ОПЛАТЫ И OAUTH
  useEffect(() => {
    const handleSessionCapture = async () => {
      if (!user) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Если есть токен провайдера (Facebook/Google)
      if (session?.provider_token) {
        console.log("💎 MarkVision: Обнаружен токен Meta. Сохраняю...");
        
        // Get user's project
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (projects && projects[0]) {
          const { error } = await supabase.from('integrations').upsert({
            project_id: projects[0].id,
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
  }, [queryClient, user]);

  if (loading || checkingProjects) {
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

  // Если авторизован и прошёл онбординг — показываем платформу
  return <AnalyticsPlatform />;
};

export default Index;
