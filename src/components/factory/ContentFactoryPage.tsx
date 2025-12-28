import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Eye, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContentFactory } from '@/hooks/useContentFactory';
import { ContentPipeline } from './ContentPipeline';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { CreateContentDialog } from './CreateContentDialog';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Factory className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Content Factory</h2>
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Производственная линия контента</p>
          </div>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Создать контент
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pipeline" className="gap-2">
            <Factory className="w-4 h-4" />
            Пайплайн
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Eye className="w-4 h-4" />
            Мониторинг
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <ContentPipeline
            content={content}
            onUpdate={updateContent}
            onDelete={deleteContent}
            triggerVoice={triggerVoice}
            triggerAvatar={triggerAvatar}
            triggerAiVideo={triggerAiVideo}
            triggerEdit={triggerEdit}
            triggerPublish={triggerPublish}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <CompetitorMonitoring
            competitors={competitors}
            onAdd={addCompetitor}
            onRemove={removeCompetitor}
          />
        </TabsContent>
      </Tabs>

      <CreateContentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={createContent}
      />
    </div>
  );
};
