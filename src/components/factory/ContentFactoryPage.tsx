import { useState, useEffect } from 'react';
import { Factory, Calendar as CalendarIcon, Plus, LayoutGrid, Database, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContentFactory } from '@/hooks/useContentFactory';
import { useFactoryAnalytics } from '@/hooks/useFactoryAnalytics';
import { useProductionLine } from '@/hooks/useProductionLine';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/externalSupabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IdeaWorkshop } from './IdeaWorkshop';
import { AssemblyLines } from './AssemblyLines';
import { ShippingDock } from './ShippingDock';
import { ReceptionDialog } from './ReceptionDialog';
import { MonthlyReportDialog } from './MonthlyReportDialog';
import { CompetitorMonitor } from './CompetitorMonitor';
import { generateFactoryData } from '@/lib/generateFactoryData';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('production');
  
  const { 
    planData, 
    rawPlanData,
    loading: analyticsLoading
  } = useFactoryAnalytics(projectId);
  
  const {
    content,
    loading,
    createContent,
    updateContent,
  } = useContentFactory(projectId);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('content_factory_realtime_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_factory', filter: `project_id=eq.${projectId}` },
        (payload) => {
          console.log('Realtime update:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleGenerateData = async () => {
    if (!projectId) return;
    setIsGenerating(true);
    try {
      const result = await generateFactoryData(projectId);
      
      if (result.error) {
        console.error('Generation error:', result.error);
        if (result.error.includes('User not authenticated') || result.error.includes('Auth check failed')) {
           toast.error('Ошибка: Вы должны войти в систему для генерации данных');
        } else {
           toast.error(`Ошибка генерации: ${result.error}`);
        }
      } else {
        // No reload needed, Realtime will update the UI
        toast.success(`Данные сгенерированы: ${result.ordersCount} заказов, ${result.staffCount} сотрудников`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Критическая ошибка генерации данных');
    } finally {
      setIsGenerating(false);
    }
  };

  // Zone Logic
  const workshopItems = content.filter(i => ['ideation', 'scripting'].includes(i.status));
  const assemblyItems = content.filter(i => ['voice_ready', 'avatar_ready', 'editing_ready'].includes(i.status));
  const shippingItems = content.filter(i => ['ready_to_send', 'sent'].includes(i.status));
  
  // Initialize Production Line Engine
  const { logs, retryLine, forceComplete } = useProductionLine({ 
    items: assemblyItems, 
    updateContent 
  });

  const handleApprove = async (id: string) => {
     await updateContent(id, { 
       status: 'voice_ready',
       avatar_status: 'processing',
       sora_status: 'processing',
       carousel_status: 'processing',
       threads_status: 'processing',
       telegram_status: 'processing',
       article_status: 'processing'
     });
  };

  const handleManualPublish = async (id: string) => {
     await updateContent(id, { status: 'sent' });
  };

  const handleCreateContent = async (data: any) => {
    await createContent({
      ...data,
      project_id: projectId
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="h-screen w-full bg-background dark:bg-[#030303] text-foreground dark:text-white overflow-hidden flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="h-16 border-b border-border/40 dark:border-white/5 bg-background/80 dark:bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-primary animate-pulse" />
          <h1 className="font-bold tracking-tight text-lg">Контент Завод <span className="text-muted-foreground dark:text-white/40 font-normal text-sm">v3.1</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="h-9 border-orange-500/20 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
          >
            <Database className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? 'Генерация...' : 'Тестовые Данные'}
          </Button>
          
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новая Партия
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b border-border/40 dark:border-white/5 bg-muted/5">
            <TabsList className="h-12 bg-transparent gap-6 p-0">
                <TabsTrigger 
                    value="production" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Производство
                </TabsTrigger>
                <TabsTrigger 
                    value="competitors" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                >
                    <Activity className="w-4 h-4 mr-2" />
                    Конкурентная Разведка
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="production" className="flex-1 flex min-h-0 m-0">
          {/* Main 3-Column Layout */}
          <div className="flex-1 flex min-h-0">
            
            {/* Left: Idea Workshop */}
            <div className="w-[350px] border-r border-border/40 dark:border-white/5 bg-muted/10 dark:bg-[#050505] flex flex-col">
               <IdeaWorkshop 
                 items={workshopItems}
                 onApprove={handleApprove}
               />
            </div>

            {/* Center: Assembly Lines */}
            <div className="flex-1 bg-background dark:bg-[#030303] flex flex-col min-w-0">
               <AssemblyLines 
                 items={assemblyItems}
                 logs={logs}
                 onRetry={retryLine}
                 onForceComplete={forceComplete}
               />
            </div>

            {/* Right: Shipping Dock */}
            <div className="w-[350px] border-l border-border/40 dark:border-white/5 bg-muted/10 dark:bg-[#050505] flex flex-col">
               <ShippingDock 
                 items={shippingItems}
                 onManualPublish={handleManualPublish}
               />
            </div>
            
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="flex-1 min-h-0 m-0 p-6 bg-background dark:bg-[#030303]">
             <CompetitorMonitor projectId={projectId} />
        </TabsContent>
      </Tabs>

      <ReceptionDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateContent}
      />
      
      {/* <MonthlyReportDialog 
        projectId={projectId}
      /> */}
    </div>
  );
};

