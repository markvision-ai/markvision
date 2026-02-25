import { lazy, Suspense, useEffect, useRef } from "react";
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Setup from "./pages/Setup";

// Lazy load non-critical pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
const Blog = lazy(() => import("./pages/Blog"));
const Partners = lazy(() => import("./pages/Partners"));
const Careers = lazy(() => import("./pages/Careers"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Agents = lazy(() => import("./pages/Agents"));
const AgentSetup = lazy(() => import("./pages/AgentSetup"));

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

const OAuthRedirector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const handleOAuthRedirect = (): boolean => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

      const hasAccessToken = hashParams.has('access_token') || searchParams.has('access_token');
      const hasCode = searchParams.has('code');
      const hasError = searchParams.has('error');
      const hasOAuthParams = hasAccessToken || hasCode || hasError;

      if (hasOAuthParams && window.location.pathname !== '/integrations') {
        if (import.meta.env.DEV) console.log('🚨 FORCING redirect to /integrations!');
        navigate('/integrations', { replace: true });
        return true;
      }
      return false;
    };

    handledRef.current = handleOAuthRedirect();
  }, [navigate, location.key]);

  return null;
};

const ProviderTokenCapture = () => {
  const { user, session } = useAuth();

  useEffect(() => {
    const run = async () => {
      if (!user || !session?.provider_token) return;

      // Prevent repeated upserts across rerenders / tabs
      const provider = (session.user as any)?.app_metadata?.provider as string | undefined;
      const tokenKey = `provider_token_saved:${user.id}:${provider || 'unknown'}:${session.provider_token.slice(0, 16)}`;
      if (sessionStorage.getItem(tokenKey)) return;

      // Prefer active project from localStorage; fallback to first owned project.
      const activeProjectId = localStorage.getItem('activeProjectId');
      let projectId = activeProjectId || null;

      if (!projectId) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        projectId = projects?.[0]?.id ?? null;
      }

      if (!projectId) return;

      // Only persist for Facebook for now (existing behavior)
      if (provider && provider !== 'facebook') return;

      const { error } = await supabase.from('integrations').upsert({
        project_id: projectId,
        type: 'facebook',
        name: 'Facebook Ads',
        config: { access_token: session.provider_token },
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id,type' });

      if (!error) {
        sessionStorage.setItem(tokenKey, '1');
      }
    };

    void run();
  }, [user, session]);

  return null;
};

import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConnectionStatus />

    <BrowserRouter>
      <OAuthRedirector />
      <ProviderTokenCapture />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/onboarding" element={<Setup />} />
        <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
        <Route path="/install" element={<Suspense fallback={<PageLoader />}><Install /></Suspense>} />

        {/* Content Pages */}
        <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
        <Route path="/partners" element={<Suspense fallback={<PageLoader />}><Partners /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageLoader />}><Careers /></Suspense>} />
        <Route path="/knowledge" element={<Suspense fallback={<PageLoader />}><Knowledge /></Suspense>} />

        {/* Legal Pages */}
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
        <Route path="/meta-analytics" element={<Index />} />
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
        <Route path="/competitors" element={<Index />} />

        <Route path="/ab-testing" element={<Index />} />
        <Route path="/ab-tests" element={<Index />} />
        <Route path="/presentation" element={<Suspense fallback={<PageLoader />}><Presentation /></Suspense>} />
        <Route path="/pitch" element={<Suspense fallback={<PageLoader />}><Presentation /></Suspense>} />
        <Route path="/health" element={<Suspense fallback={<PageLoader />}><HealthCheck /></Suspense>} />
        <Route path="/health-check" element={<Suspense fallback={<PageLoader />}><HealthCheck /></Suspense>} />
        <Route path="/calendar" element={<Index />} />
        <Route path="/automation" element={<Index />} />
        <Route path="/rop" element={<Index />} />
        <Route path="/agency" element={<Index />} />
        <Route path="/agency-accounts" element={<Index />} />
        <Route path="/agents" element={<Index />} />
        <Route path="/agents/setup/:agentType" element={<Suspense fallback={<PageLoader />}><AgentSetup /></Suspense>} />

        {/* Catch-all: неизвестные пути → главная */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-right" richColors closeButton />
    <Analytics />
  </QueryClientProvider>
);

export default App;
