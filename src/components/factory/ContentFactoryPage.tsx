import { useState, useEffect } from 'react';
import { Factory, Calendar as CalendarIcon, Plus, LayoutGrid, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContentFactory } from '@/hooks/useContentFactory';
import { useFactoryAnalytics } from '@/hooks/useFactoryAnalytics';
import { useProductionLine } from '@/hooks/useProductionLine';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/externalSupabase';
import { cn } from '@/lib/utils';
import { IdeaWorkshop } from './IdeaWorkshop';
import { AssemblyLines } from './AssemblyLines';
import { ShippingDock } from './ShippingDock';
import { ReceptionDialog } from './ReceptionDialog';
import { MonthlyReportDialog } from './MonthlyReportDialog';
import { generateFactoryData } from '@/lib/generateFactoryData';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
      await generateFactoryData(projectId);
      window.location.reload(); // Refresh to show new data
    } catch (e) {
      console.error(e);
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
       heygen_status: 'processing',
       sora_status: 'processing',
       design_status: 'processing',
       threads_status: 'processing',
       telegram_status: 'processing',
       seo_status: 'processing'
     });
  };

  const handleManualPublish = async (id: string) => {
     await updateContent(id, { status: 'sent' });
  };

  const handleCreateContent = async (data: any) => {
    return await createContent(data);
  };

  return (
    <div className="h-screen w-full bg-background dark:bg-[#030303] text-foreground dark:text-white overflow-hidden flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="h-16 border-b border-border/40 dark:border-white/5 bg-background/80 dark:bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Factory className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">MarkVision Завод ОС <span className="text-muted-foreground dark:text-white/40 font-normal text-sm">v3.1</span></h1>
          </div>
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

