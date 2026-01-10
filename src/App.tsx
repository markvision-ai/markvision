import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Страницы авторизации */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Главные разделы - все рендерят Index, но с разными путями */}
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/realtime" element={<Index />} />
          <Route path="/table" element={<Index />} /> {/* ВОТ ЭТОТ ПУТЬ МЫ ДОБАВИЛИ */}
          <Route path="/crm" element={<Index />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/finance" element={<Index />} />
          <Route path="/settings" element={<Index />} />

          {/* Редирект для старых ссылок, если они были */}
          <Route path="/table-data" element={<Navigate to="/table" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
