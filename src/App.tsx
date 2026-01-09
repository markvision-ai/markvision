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
          {/* Авторизация - отдельная страница */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ГЛАВНАЯ ЛОГИКА: Все разделы ведут на Index, 
              но передают разный путь, чтобы Index знал, какую вкладку открыть */}
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/crm" element={<Index />} />
          <Route path="/diagnostics" element={<Index />} />
          <Route path="/content-factory" element={<Index />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/finance" element={<Index />} />
          <Route path="/settings" element={<Index />} />

          {/* Обработка несуществующих страниц */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
