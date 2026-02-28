import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AnalyticsPlatform = lazy(() => import('@/components/AnalyticsPlatform'));
const LandingPage = lazy(() => import('@/components/landing/LandingPage'));

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingProjects, setCheckingProjects] = useState(true);
  const [projectCheckError, setProjectCheckError] = useState<string | null>(null);

  // Check if user has projects with completed onboarding
  useEffect(() => {
    const checkUserProjects = async () => {
      // E2E Test Bypass
      if (import.meta.env.DEV && localStorage.getItem('E2E_TEST_MODE') === 'true') {
        setCheckingProjects(false);
        return;
      }

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
        // Only set error if it's a network error/fetch failure to allow retry
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          setProjectCheckError('Ошибка подключения к серверу. Проверьте интернет или отключите AdBlock.');
        }
      } finally {
        setCheckingProjects(false);
      }
    };

    if (!loading) {
      checkUserProjects();
    }
  }, [user, loading, navigate]);

  if (loading || checkingProjects) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projectCheckError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="text-destructive font-semibold">Ошибка загрузки</div>
        <p className="text-muted-foreground max-w-md">{projectCheckError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Если пользователь не авторизован — показываем лендинг
  if (!user) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <LandingPage />
      </Suspense>
    );
  }

  // Если авторизован и прошёл онбординг — показываем платформу
  // Если авторизован и прошёл онбординг — показываем платформу
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AnalyticsPlatform />
    </Suspense>
  );
};

export default Index;
