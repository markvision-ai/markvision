import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Eye, Plus, Sparkles, Instagram, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContentFactory } from '@/hooks/useContentFactory';
import { ContentKanban } from './ContentKanban';
import { CompetitorMonitoringEnhanced } from './CompetitorMonitoringEnhanced';
import { CreateContentDialogEnhanced } from './CreateContentDialogEnhanced';
import { InstagramStats } from '@/components/integrations/InstagramStats';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface ContentFactoryPageProps {
  projectId: string | null;
}

export const ContentFactoryPage = ({ projectId }: ContentFactoryPageProps) => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
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
              Канбан-производство • {content.length} в работе
            </p>
          </div>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600">
          <Plus className="w-4 h-4" />
          Создать контент
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="pipeline" className="gap-2">
            <Kanban className="w-4 h-4" />
            Пайплайн
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

        {/* Instagram Tab */}
        <TabsContent value="instagram" className="space-y-4">
          <InstagramStats projectId={projectId} />
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
