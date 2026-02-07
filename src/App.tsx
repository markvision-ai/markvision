import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { VercelHealthStatus } from "@/components/ui/VercelHealthStatus";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Setup from "./pages/Setup";

// Lazy load non-critical pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
// Archived pages (moved to _archived/)
// const Blog = lazy(() => import("./pages/Blog"));
// const Partners = lazy(() => import("./pages/Partners"));
// const Careers = lazy(() => import("./pages/Careers"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HealthCheck = lazy(() => import("./pages/HealthCheck"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// OAuth Handler Component
const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: OAuth параметры в URL
    const handleOAuthRedirect = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const hasAccessToken = hashParams.has('access_token') || searchParams.has('access_token');
      const hasCode = searchParams.has('code');
      const hasError = searchParams.has('error');
      const hasOAuthParams = hasAccessToken || hasCode || hasError;

      // Debug logs removed for production performance

      if (hasOAuthParams && window.location.pathname !== '/integrations') {
        if (import.meta.env.DEV) console.log('🚨 FORCING redirect to /integrations!');
        // Используем setTimeout для гарантии выполнения
        setTimeout(() => {
          navigate('/integrations', { replace: true });
        }, 0);
        return true;
      }
      return false;
    };

    handleOAuthRedirect();

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log('🔐 Auth event:', event, session ? '(session)' : '(no session)');
      }

      if (event === 'SIGNED_IN') {
        const currentUrl = window.location.href;
        const hasOAuthHash = currentUrl.includes('#access_token') || currentUrl.includes('code=');
        
        if (hasOAuthHash && window.location.pathname !== '/integrations') {
          if (import.meta.env.DEV) console.log('✅ SIGNED_IN with OAuth params, redirecting to /integrations');
          navigate('/integrations', { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ConnectionStatus />
      <VercelHealthStatus />
      <BrowserRouter>
        <OAuthHandler />
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/onboarding" element={<Setup />} />
        <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
        <Route path="/install" element={<Suspense fallback={<PageLoader />}><Install /></Suspense>} />
        
        {/* Archived pages (moved to _archived/)
        <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
        <Route path="/partners" element={<Suspense fallback={<PageLoader />}><Partners /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageLoader />}><Careers /></Suspense>} />
        */}
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
        <Route path="/compliance" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
        <Route path="/training" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
        
        {/* Все эти пути ведут в Index, где переключается вкладка по URL */}
        <Route path="/dashboard" element={<Index />} />
        <Route path="/realtime" element={<Index />} />
        <Route path="/table" element={<Index />} />
        <Route path="/crm" element={<Index />} />
        <Route path="/visits" element={<Index />} />
        <Route path="/analytics" element={<Index />} />
        <Route path="/e2e-analytics" element={<Index />} />
        <Route path="/finance" element={<Index />} />
        <Route path="/settings" element={<Index />} />
        <Route path="/quantom-ads" element={<Index />} />
        <Route path="/quantum-ads" element={<Index />} />
        <Route path="/factory" element={<Index />} />
        <Route path="/content-factory" element={<Index />} />
        <Route path="/publications" element={<Index />} />
        <Route path="/reports" element={<Index />} />
        <Route path="/team" element={<Index />} />
        <Route path="/integrations" element={<Index />} />
        <Route path="/audit" element={<Index />} />
        <Route path="/staff" element={<Index />} />
        <Route path="/inbox" element={<Index />} />
        <Route path="/scoring" element={<Index />} />

        <Route path="/ab-testing" element={<Index />} />
        <Route path="/ab-tests" element={<Index />} />
        <Route path="/knowledge" element={<Index />} />
        <Route path="/health" element={<Suspense fallback={<PageLoader />}><HealthCheck /></Suspense>} />
        <Route path="/health-check" element={<Suspense fallback={<PageLoader />}><HealthCheck /></Suspense>} />
        <Route path="/calendar" element={<Index />} />
        <Route path="/automation" element={<Index />} />
        <Route path="/rop" element={<Index />} />
        
        {/* Catch-all: неизвестные пути → главная */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
);

export default App;
