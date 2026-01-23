import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Eye, Plus, Sparkles, Instagram, Kanban, Workflow, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContentFactory } from '@/hooks/useContentFactory';
import { ContentKanban } from './ContentKanban';
import { WorkshopPipeline } from './WorkshopPipeline';
import { CompetitorMonitoringEnhanced } from './CompetitorMonitoringEnhanced';
import { CreateContentDialogEnhanced } from './CreateContentDialogEnhanced';
import { ContentCenterTable } from '@/components/content/ContentCenterTable';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/externalSupabase';
import { useInstagramPlanFact } from '@/hooks/useInstagramPlanFact';

interface ContentFactoryPageProps {
  projectId: string | null;
}

export const ContentFactoryPage = ({ projectId }: ContentFactoryPageProps) => {
  const [activeTab, setActiveTab] = useState('workshops');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Автоматический расчет факта из Instagram данных
  const { planData, updatePlan } = useInstagramPlanFact(projectId);
  
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

  const handlePlanChange = (index: number, field: 'plan' | 'fact', value: number) => {
    if (field === 'plan') {
      const metric = planData[index]?.metric;
      if (metric) {
        updatePlan(metric, value);
      }
    }
    // fact обновляется автоматически из Instagram данных
  };

  const getProgress = (plan: number, fact: number) => {
    if (plan === 0) return 0;
    return Math.min(100, Math.round((fact / plan) * 100));
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Выберите проект для работы с контентом</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Контент-Завод 2.0</h2>
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Production Suite
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Цеха производства • {content.length} в работе
            </p>
          </div>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
          <Plus className="w-4 h-4" />
          Создать контент
        </Button>
      </div>

      {/* План/Факт карточка */}
      <Card className="border-violet-200/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            План/Факт контент-производства
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-violet-200/50">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Метрика</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">План</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Факт</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">%</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground w-32">Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {planData.map((row, index) => {
                  const progress = getProgress(row.plan, row.fact);
                  return (
                    <tr key={row.metric} className="border-b border-violet-100/50 hover:bg-violet-50/50">
                      <td className="py-2 px-3 font-medium">{row.metric}</td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          value={row.plan}
                          onChange={(e) => handlePlanChange(index, 'plan', Number(e.target.value))}
                          className="w-24 h-8 text-center mx-auto"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          value={row.fact}
                          readOnly
                          className="w-24 h-8 text-center mx-auto bg-muted/50 cursor-not-allowed"
                          title="Автоматически рассчитывается из Instagram данных"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`font-semibold ${progress >= 100 ? 'text-green-600' : progress >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {progress}%
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="workshops" className="gap-2">
            <Workflow className="w-4 h-4" />
            Цеха
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Kanban className="w-4 h-4" />
            Канбан
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Eye className="w-4 h-4" />
            Мониторинг
          </TabsTrigger>
          <TabsTrigger value="instagram" className="gap-2">
            <Instagram className="w-4 h-4" />
            Instagram
          </TabsTrigger>
        </TabsList>

        {/* Workshops Tab - 6 Цехов */}
        <TabsContent value="workshops" className="space-y-4">
          <WorkshopPipeline
            content={content}
            projectId={projectId}
            onUpdate={updateContent}
            onDelete={deleteContent}
            triggerVoice={triggerVoice}
            triggerAvatar={triggerAvatar}
            triggerEdit={triggerEdit}
            triggerPublish={triggerPublish}
          />
        </TabsContent>

        {/* Pipeline Tab - Kanban Board */}
        <TabsContent value="pipeline" className="space-y-4">
          <ContentKanban
            content={content}
            projectId={projectId}
            onUpdate={updateContent}
            onDelete={deleteContent}
            triggerVoice={triggerVoice}
            triggerAvatar={triggerAvatar}
            triggerEdit={triggerEdit}
            triggerPublish={triggerPublish}
          />
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <CompetitorMonitoringEnhanced
            competitors={competitors}
            projectId={projectId}
            onAdd={addCompetitor}
            onRemove={removeCompetitor}
            onCreateFromIdea={handleCreateFromIdea}
          />
        </TabsContent>

        {/* Instagram Tab - Content Intelligence */}
        <TabsContent value="instagram" className="space-y-4">
          <ContentCenterTable projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Create Content Dialog */}
      <CreateContentDialogEnhanced
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={createContent}
      />
    </div>
  );
};
