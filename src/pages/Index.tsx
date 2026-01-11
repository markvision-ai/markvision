import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CRMPage } from "@/components/crm/CRMPage";
import { IntegrationsManagement } from "@/components/integrations/IntegrationsManagement";
import MainDashboard from "@/components/dashboard/MainDashboard";
import { RealtimeMonitor } from "@/components/dashboard/RealtimeMonitor";
import { DataTable } from "@/components/dashboard/DataTable";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  // 1. ЛОГИКА ЗАЩИТЫ ОТ ВЫЛЕТА (OAuth Guard)
  useEffect(() => {
    const hasOAuthParams = window.location.hash.includes('access_token') || 
                          window.location.search.includes('code=');

    if (hasOAuthParams) {
      console.log("⏳ MarkVision: Захват сессии... Ждем завершения входа.");
      return;
    }

    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // 2. СИНХРОНИЗАЦИЯ ВКЛАДОК С URL
  useEffect(() => {
    const path = location.pathname.split('/')[1];
    if (path && ["dashboard", "crm", "integrations", "table", "realtime"].includes(path)) {
      setActiveTab(path);
    }
  }, [location]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0E14]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <AppSidebar activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          navigate(`/${tab}`);
        }} />
        <main className="flex-1 flex flex-col min-w-0 h-screen relative overflow-y-auto overflow-x-hidden">
          <DashboardHeader activeTab={activeTab} />
          <div className="flex-1 p-4 md:p-6 pb-20">
            <Tabs value={activeTab} className="w-full h-full border-none bg-transparent">
              <TabsContent value="dashboard" className="m-0 border-none"><MainDashboard /></TabsContent>
              <TabsContent value="crm" className="m-0 border-none"><CRMPage /></TabsContent>
              <TabsContent value="integrations" className="m-0 border-none"><IntegrationsManagement /></TabsContent>
              <TabsContent value="table" className="m-0 border-none"><DataTable /></TabsContent>
              <TabsContent value="realtime" className="m-0 border-none"><RealtimeMonitor /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
