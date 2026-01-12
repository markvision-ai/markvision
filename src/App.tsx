import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Все эти пути ведут в Index, где переключается вкладка по URL */}
        <Route path="/dashboard" element={<Index />} />
        <Route path="/realtime" element={<Index />} />
        <Route path="/table" element={<Index />} />
        <Route path="/crm" element={<Index />} />
        <Route path="/diagnostics" element={<Index />} />
        <Route path="/analytics" element={<Index />} />
        <Route path="/e2e-analytics" element={<Index />} />
        <Route path="/finance" element={<Index />} />
        <Route path="/settings" element={<Index />} />
        <Route path="/quantom-ads" element={<Index />} />
        <Route path="/factory" element={<Index />} />
        <Route path="/reports" element={<Index />} />
        <Route path="/team" element={<Index />} />
        <Route path="/integrations" element={<Index />} />
        <Route path="/audit" element={<Index />} />
        <Route path="/staff" element={<Index />} />
        <Route path="/inbox" element={<Index />} />
        <Route path="/scoring" element={<Index />} />
        <Route path="/gamification" element={<Index />} />
        <Route path="/ab-testing" element={<Index />} />
        <Route path="/knowledge" element={<Index />} />
        <Route path="/health" element={<Index />} />
        <Route path="/onboarding" element={<Index />} />
        <Route path="/calendar" element={<Index />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
);

export default App;
