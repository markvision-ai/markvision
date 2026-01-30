import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Eye, Plus, Sparkles, Instagram, Kanban, Workflow, BarChart3, Calendar as CalendarIcon, Loader2, BrainCircuit, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContentFactory } from '@/hooks/useContentFactory';
import { WorkshopConveyor } from './WorkshopConveyor';
import { CompetitorMonitoringEnhanced } from './CompetitorMonitoringEnhanced';
import { CreateContentDialogEnhanced } from './CreateContentDialogEnhanced';
import { ContentCenterTable } from '@/components/content/ContentCenterTable';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/externalSupabase';
import { useFactoryAnalytics, PeriodType } from '@/hooks/useFactoryAnalytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { MonthlyReportDialog } from './MonthlyReportDialog';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  
  const [activeTab, setActiveTab] = useState('workshops');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Analytics with period switcher
  const { 
    planData, 
    updatePlan, 
    periodType, 
    setPeriodType, 
    dateRange, 
    setDateRange,
    loading: analyticsLoading
  } = useFactoryAnalytics(projectId);
  
  const {
    content,
    competitors,
    loading,
    createContent,
    updateContent,
    deleteContent,
    addCompetitor,
    removeCompetitor,
    triggerVoice,
    triggerAvatar,
    triggerAiVideo,
    triggerEdit,
    triggerPublish,
  } = useContentFactory(projectId);

  // Subscribe to realtime updates for content status changes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('content_factory_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_factory',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Content updated:', payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleCreateFromIdea = async (title: string, sourceUrl?: string) => {
    return await createContent({
      title,
      content_type: 'avatar_video',
      source_url: sourceUrl,
    });
  };

  const handleCreateContent = async (data: { title: string; content_type: any; original_script?: string; source_url?: string }) => {
    return await createContent(data);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative selection:bg-violet-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header Section */}
        <header className="px-6 py-4 border-b border-white/5 bg-[#030303]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg border border-white/5 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]">
                <Factory className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Центр контента
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] tracking-widest uppercase">
                    Factory OS v2.0
                  </Badge>
                </h1>
                <p className="text-xs text-white/40 font-mono">PROJECT_ID: {projectId?.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <MonthlyReportDialog projectId={projectId} />
               
               <div className="h-6 w-[1px] bg-white/10 mx-1" />

               <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCalendarOpen(true)}
                className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">
                  {format(dateRange.from, 'd MMM', { locale: ru })} - {format(dateRange.to, 'd MMM', { locale: ru })}
                </span>
              </Button>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <div className="hidden"></div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] border border-violet-500/50"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Создать контент</span>
              </Button>
            </div>
          </div>

          {/* KPI Bar - Sticky Industrial Dashboard */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Plan/Fact Card - Sticky */}
             <div className="md:col-span-1">
                <Card className="bg-[#0A0A0A] border-white/10 shadow-lg relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">План / Факт</span>
                      </div>
                      
                      <div className="flex items-end justify-between gap-4">
                         <div>
                            <div className="text-2xl font-bold text-white font-mono leading-none">
                               {analyticsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : planData.fact.followers}
                            </div>
                            <div className="text-[10px] text-white/40 mt-1">Новые подписчики</div>
                         </div>
                         <div className="h-8 w-[1px] bg-white/10" />
                         <div className="text-right">
                             <div className="text-2xl font-bold text-white/60 font-mono leading-none">
                                {planData.plan.followers}
                             </div>
                             <div className="text-[10px] text-white/40 mt-1">Цель на месяц</div>
                         </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-1000"
                           style={{ width: `${Math.min((planData.fact.followers / (planData.plan.followers || 1)) * 100, 100)}%` }}
                         />
                      </div>
                   </CardContent>
                </Card>
             </div>

             {/* Quick Stats - Mini Cards */}
             <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <Card className="bg-[#0A0A0A] border-white/10 flex items-center p-3 gap-3">
                   <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                      <Workflow className="w-4 h-4" />
                   </div>
                   <div>
                      <div className="text-lg font-bold font-mono">{content.filter(c => ['ideation', 'scripting'].includes(c.status)).length}</div>
                      <div className="text-[10px] uppercase text-white/30">В работе</div>
                   </div>
                </Card>
                <Card className="bg-[#0A0A0A] border-white/10 flex items-center p-3 gap-3">
                   <div className="p-2 rounded bg-violet-500/10 text-violet-400">
                      <BrainCircuit className="w-4 h-4" />
                   </div>
                   <div>
                      <div className="text-lg font-bold font-mono">{content.filter(c => ['voice_ready', 'avatar_ready', 'editing_ready'].includes(c.status)).length}</div>
                      <div className="text-[10px] uppercase text-white/30">AI Обработка</div>
                   </div>
                </Card>
                <Card className="bg-[#0A0A0A] border-white/10 flex items-center p-3 gap-3">
                   <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                      <Rocket className="w-4 h-4" />
                   </div>
                   <div>
                      <div className="text-lg font-bold font-mono">{content.filter(c => ['ready_to_send', 'sent'].includes(c.status)).length}</div>
                      <div className="text-[10px] uppercase text-white/30">Готово</div>
                   </div>
                </Card>
             </div>
          </div>
        </header>

        {/* Main Workspace - Conveyor Belt */}
        <main className="flex-1 overflow-hidden relative p-6">
            <Tabs defaultValue="workshops" className="h-full flex flex-col" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-[#0A0A0A] border border-white/10">
                  <TabsTrigger value="workshops" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Factory className="w-4 h-4 mr-2" />
                    Цех
                  </TabsTrigger>
                  <TabsTrigger value="table" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Kanban className="w-4 h-4 mr-2" />
                    Таблица
                  </TabsTrigger>
                  <TabsTrigger value="monitoring" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Eye className="w-4 h-4 mr-2" />
                    Мониторинг
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="workshops" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                {loading ? (
                   <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                         <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                         <p className="text-white/40 font-mono text-sm">LOADING_FACTORY_OS...</p>
                      </div>
                   </div>
                ) : (
                  <WorkshopConveyor 
                    content={content} 
                    projectId={projectId}
                    onUpdate={updateContent}
                    onDelete={deleteContent}
                  />
                )}
              </TabsContent>

              <TabsContent value="table" className="flex-1 overflow-auto mt-0 border border-white/10 rounded-xl bg-[#0A0A0A]">
                 <ContentCenterTable projectId={projectId} />
              </TabsContent>

              <TabsContent value="monitoring" className="flex-1 overflow-auto mt-0">
                 <CompetitorMonitoringEnhanced 
                    competitors={competitors}
                    projectId={projectId}
                    onAdd={addCompetitor}
                    onRemove={removeCompetitor}
                    onCreateFromIdea={handleCreateFromIdea}
                 />
              </TabsContent>
            </Tabs>
        </main>
      </div>

      <CreateContentDialogEnhanced 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateContent}
      />
    </div>
  );
};
